// main.js - Updated with Controller Support

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
window.updateBatProjectiles = () => updateBatProjectiles(gameState);
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
function init() {
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
    
    // Container setup
    setTimeout(() => {
        initEnhancedContainers();
        enhancedDisplaysInitialized = true;
        window.updateEnhancedDisplays();
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
    console.log('✨ Game initialization complete!');
}

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