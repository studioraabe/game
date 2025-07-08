// main.js - Updated with Controller Support and Sprite System Integration

import { CANVAS, GameState } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, update, loadGame, initRenderLoop } from './core/gameState.js';
import { camera, resetCamera } from './core/camera.js';
import { player, updatePlayer } from './core/player.js';
import { keys, initInput } from './core/input.js'; // Now includes controller support
import { 
    initEnhancements, 
    initEnhancedContainers,
    updateEnhancedComboDisplay,
    updateEnhancedBuffDisplay
} from './ui-enhancements.js';
import { spriteManager } from './rendering/sprite-system.js';
import { initRoguelikeIntegration, createStatDisplay, startStatsUpdateLoop } from './roguelike-integration.js';


import { 
    soundManager, 
    loadGlobalHighscores, 
    updateDropBuffs,
    checkAchievements
} from './systems.js';

import {
    obstacles,
    bulletsFired,
    explosions,
    environmentElements,
    bloodParticles,
    lightningEffects,
    scorePopups,
    doubleJumpParticles,
    dropParticles,
    drops,
    batProjectiles,
    spawnObstacle,
    updateAllEntities,
    updateObstacles,
    updateBullets,
    updateExplosions,
    updateEnvironmentElements,
    updateDrops,
    updateEffects,
    updateBatProjectiles,
    checkCollisions,
    shoot,
    bulletBoxesFound,
    obstacleTimer,
    initEnvironmentElements,
} from './entities.js';

import {
    updateUI as uiUpdateUI,
    applyTheme,
    showScreen,
    hideAllScreens,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    gameOver
} from './ui.js';

import { render } from './rendering/renderer.js';

import { 
    triggerDamageEffects, 
    updateDamageEffects, 
    resetDamageEffects,
    initDamageEffects,
    setComboGlow,
    clearComboGlow,
    damageEffectsDebug
} from './enhanced-damage-system.js';

// Initialize canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas dimensions in constants
CANVAS.width = canvas.width;
CANVAS.height = canvas.height;

// Connect everything to gameState
gameState.canvas = canvas;
gameState.ctx = ctx;
gameState.camera = camera;

// Make functions available globally for other modules
window.gameState = gameState;
window.player = player;
window.camera = camera;
window.keys = keys;
window.soundManager = soundManager;

// Make sprite manager globally accessible
window.spriteManager = spriteManager;

// Entity arrays
window.obstacles = obstacles;
window.bulletsFired = bulletsFired;
window.explosions = explosions;
window.environmentElements = environmentElements;
window.bloodParticles = bloodParticles;
window.lightningEffects = lightningEffects;
window.scorePopups = scorePopups;
window.doubleJumpParticles = doubleJumpParticles;
window.dropParticles = dropParticles;
window.drops = drops;
window.batProjectiles = batProjectiles;

// Entity state
window.bulletBoxesFound = bulletBoxesFound;
window.obstacleTimer = obstacleTimer;

// Core functions
window.updatePlayer = () => updatePlayer(keys, gameState);
window.spawnObstacle = () => spawnObstacle(gameState.level, gameState.gameSpeed, gameState.timeSlowFactor);
window.updateObstacles = () => {
    if (obstacles.length > 0) {
        updateObstacles(gameState.gameSpeed, gameState.enemySlowFactor, gameState.level, gameState.magnetRange, gameState);
    }
};
window.updateBullets = () => {
    if (bulletsFired.length > 0) {
        updateBullets(gameState);
    }
};
window.updateExplosions = updateExplosions;
window.updateEnvironmentElements = () => updateEnvironmentElements(gameState.gameSpeed, gameState.timeSlowFactor);
window.updateDrops = () => updateDrops(gameState.gameSpeed, gameState.magnetRange, gameState);
window.updateEffects = () => updateEffects(gameState.timeSlowFactor, gameState);
window.updateBatProjectiles = () => {return updateBatProjectiles(gameState);};
window.checkCollisions = () => checkCollisions(gameState);
window.shoot = () => shoot(gameState);
window.render = () => render(ctx);

// UI functions
window.updateUI = () => uiUpdateUI();

// Enhanced displays
let enhancedDisplaysInitialized = false;
let lastBuffUpdateTime = 0;

window.updateEnhancedDisplays = () => {
    const now = Date.now();
    if (now - lastBuffUpdateTime < 500) return;
    lastBuffUpdateTime = now;
    
    if (!enhancedDisplaysInitialized) {
        if (!document.getElementById('enhancedBuffs') || !document.getElementById('comboDisplay')) {
            initEnhancedContainers();
        }
        enhancedDisplaysInitialized = true;
    }
    
    updateEnhancedComboDisplay();
    updateEnhancedBuffDisplay();
};

window.update = () => {
    update();
};

// Damage system
window.triggerDamageEffects = triggerDamageEffects;
window.updateDamageEffects = updateDamageEffects;
window.resetDamageEffects = resetDamageEffects;

// Initialize game
async function init() {
    console.log('🎮 Dungeon Runner V1.0 - Enhanced Edition with Controller Support');
    
    // Initialize systems
    initInput(); // Now includes controller support
    applyTheme();
    loadGame();
    initEnvironmentElements();
    initDamageEffects();
    
    // Initialize sound system
    soundManager.init();
    
    // Initialize enhanced UI
    initEnhancements();
    
    // IMPORTANT: Add Roguelike System Integration
    initRoguelikeIntegration();
    
    // Load sprite system
    console.log('🎨 Loading sprite system...');
    try {
        await spriteManager.loadSprites();
        console.log('✅ Sprite system loaded successfully!');
    } catch (error) {
        console.warn('⚠️ Sprite system failed to load, using pixel art fallback:', error.message);
        // Game continues with pixel art rendering - no disruption
    }
    
    // Container setup
    setTimeout(() => {
        initEnhancedContainers();
        enhancedDisplaysInitialized = true;
        window.updateEnhancedDisplays();
        
        // Create stats display
        createStatDisplay();
        startStatsUpdateLoop();
    }, 100);
    
    // Set initial state
    gameState.currentState = GameState.START;
    showScreen('startScreen');
    
    // Check for achievement unlocks
    if (window.ACHIEVEMENTS?.untouchable?.unlocked) {
        gameState.hasShield = true;
    }
    
    // Start the render loop
    initRenderLoop();
    
    // Enhanced displays update
    setInterval(() => {
        window.updateEnhancedDisplays();
    }, 500);
    
    console.log('🎮 Enhanced Input System: Ready for keyboard and controller input');
    console.log('🔊 Audio System: Ready');
    console.log('🎨 Enhanced UI: Ready');
    console.log('🖼️ Sprite System: Active');
    console.log('✨ Game initialization complete!');
}

		
function createSimpleStatsDisplay() {
    // Check if it already exists
    if (document.getElementById('simple-stats-display')) return;
    
    const container = document.createElement('div');
    container.id = 'simple-stats-display';
    container.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: #fff;
        padding: 10px;
        border-radius: 5px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 12px;
        z-index: 100;
        max-width: 150px;
        display: none;
    `;
    
    // Add a toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Stats';
    toggleButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #00ff88;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-family: 'Rajdhani', sans-serif;
        z-index: 101;
    `;
    toggleButton.onclick = () => {
        const display = document.getElementById('simple-stats-display');
        if (display) {
            display.style.display = display.style.display === 'none' ? 'block' : 'none';
        }
    };
    
    document.getElementById('gameContainer').appendChild(container);
    document.getElementById('gameContainer').appendChild(toggleButton);
    
    // Start update interval
    setInterval(updateSimpleStatsDisplay, 1000);
}


function updateSimpleStatsDisplay() {
    const container = document.getElementById('simple-stats-display');
    if (!container) return;
    
    // Get stats or default to empty object
    const stats = gameState.playerStats || {};
    
    container.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 5px;">Stats</h3>
        <div>Damage: +${stats.damageBonus || 0}%</div>
        <div>Attack Speed: +${stats.attackSpeed || 0}%</div>
        <div>Move Speed: +${stats.moveSpeed || 0}%</div>
        <div>Bullet Speed: +${stats.projectileSpeed || 0}%</div>
        <div>HP Regen: ${stats.healthRegen ? stats.healthRegen.toFixed(2) : 0}/s</div>
        <div>Bullet Regen: ${stats.bulletRegen ? stats.bulletRegen.toFixed(2) : 0}/s</div>
        <div>Life Steal: ${stats.lifeSteal || 0}%</div>
        <div>Crit Chance: ${stats.critChance || 0}%</div>
        <div>Crit Damage: x${stats.critDamage ? stats.critDamage.toFixed(1) : 1.5}</div>
    `;
}

// Create the stats display after page load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(createSimpleStatsDisplay, 1000);
});

// Add to global for direct access
window.createSimpleStatsDisplay = createSimpleStatsDisplay;
window.updateSimpleStatsDisplay = updateSimpleStatsDisplay;
		
		

// Window events
window.addEventListener('beforeunload', function() {
    stopGameLoop();
});

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}