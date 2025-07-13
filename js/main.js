// main.js - Updated with Controller Support and Sprite System Integration

import { CANVAS, GameState } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, update, loadGame, initRenderLoop } from './core/gameState.js';
import { camera, resetCamera } from './core/camera.js';
import { player } from './core/player.js';
import { enhancedUpdatePlayer, startJump, stopJump } from './enhanced-player.js';
import { keys, initInput } from './core/input.js'; // Now includes controller support
import { 
    initEnhancements, 
    initEnhancedContainers,
    updateEnhancedComboDisplay,
    updateEnhancedBuffDisplay
} from './ui-enhancements.js';
import { spriteManager } from './rendering/sprite-system.js';
import { initRoguelikeIntegration, createStatDisplay, startStatsUpdateLoop } from './roguelike-integration.js';
import './projectile-buff-integration.js';


import { integrateWeaponSystem } from './weapon-system-integration.js';
import { initWeaponHotkeySystem } from './weapon-hotkey-system.js';


import { 
    initBackgroundSystem, 
    updateBackground, 
    renderBackground,
    setBackgroundScrollSpeed,     // ✅ ADD - new function
    setBackgroundPreset,          // ✅ ADD - new function (optional)
    debugBackground
} from './background-system.js';

import './direct-weapon-hotkeys.js';

import './levelup.js';







import { initHUD, updateHUD } from './ui-hud.js';

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

import { 
    enhancedShoot, 
    updateEnhancedProjectiles, 
    renderEnhancedProjectiles,
    cycleProjectileType,
    getCurrentProjectileType,
    unlockProjectileType,
    projectileSystem,
    ProjectileType,
    PROJECTILE_CONFIGS
} from './enhanced-projectile-system.js';

import { 
    integrateProjectileSystem,
    createProjectileUI,
    PROJECTILE_BUFFS
} from './projectile-buff-integration.js';




// Disable the old cooldown display systems
if (window.cooldownDisplayInterval) {
    clearInterval(window.cooldownDisplayInterval);
    window.cooldownDisplayInterval = null;
}

if (window.projectileUIUpdateInterval) {
    clearInterval(window.projectileUIUpdateInterval);
    window.projectileUIUpdateInterval = null;
}

// Hide the old projectile UI elements
const oldProjectileUI = document.getElementById('projectileUI');
if (oldProjectileUI) {
    oldProjectileUI.style.display = 'none';
}

const oldCooldownDisplay = document.getElementById('projectileCooldownDisplay');
if (oldCooldownDisplay) {
    oldCooldownDisplay.style.display = 'none';
}


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
window.updatePlayer = () => enhancedUpdatePlayer(keys, gameState);
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
			initHUD();

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
    
    // Initialize systems
    initInput(); 
    applyTheme();
	initHUD();
    loadGame();
    initEnvironmentElements();
    initDamageEffects();
    
    // Initialize sound system
    soundManager.init();
    
    // Initialize enhanced UI
    initEnhancements();
    
    // IMPORTANT: Add Roguelike System Integration
    initRoguelikeIntegration();
	
	
    initBackgroundSystem('assets/ground.png', 'assets/background.png');
    
    // NEW: Initialize weapon hotkey system
    initWeaponHotkeySystem();
    
    // Load sprite system
    try {
        await spriteManager.loadSprites();
    } catch (error) {
        console.warn('⚠️ Sprite system failed to load, using pixel art fallback:', error.message);
    }
    
    
    // NEW: Initialize background system
    console.log('🌄 Initializing background system...');
    initBackgroundSystem('assets/ground.png', 'assets/background.png');
	// FIXED: Adjust speeds for same-width images
	
    // Load sprite system
    console.log('🎨 Loading sprite system...');
    try {
        await spriteManager.loadSprites();
        console.log('✅ Sprite system loaded successfully!');
    } catch (error) {
        console.warn('⚠️ Sprite system failed to load, using pixel art fallback:', error.message);
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
    console.log('🌄 Background System: Active');
    console.log('✨ Game initialization complete!');
}

// Update the global functions to include background system
window.update = () => {
    update();
    updateBackground(); // Now this will work
};

// Make background system functions available globally
window.setBackgroundScrollSpeed = setBackgroundScrollSpeed;     
window.setBackgroundPreset = setBackgroundPreset;  	

		

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
		
		
		integrateWeaponSystem();