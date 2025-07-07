// main.js - Enhanced with Roguelike Integration

import { CANVAS, GameState } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, update, loadGame, initRenderLoop } from './core/gameState.js';
import { camera, resetCamera } from './core/camera.js';
import { player, updatePlayer } from './core/player.js';
import { keys, initInput } from './core/input.js';
import { 
    initEnhancements, 
    initEnhancedContainers,
    updateEnhancedComboDisplay,
    updateEnhancedBuffDisplay,
    updateWeaponsDisplay
} from './ui-enhancements.js';
import { spriteManager } from './rendering/sprite-system.js';

import { 
    soundManager, 
    loadGlobalHighscores, 
    updateDropBuffs,
    updateRegeneration,
    checkAchievements,
    calculateDamage,
    rollCritical,
    applyLifesteal
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
    gameOver,
    updateStatsDisplay
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
window.updateBatProjectiles = () => updateBatProjectiles(gameState);
window.checkCollisions = () => checkCollisions(gameState);
window.shoot = () => shoot(gameState);
window.render = () => render(ctx);

// UI functions
window.updateUI = () => uiUpdateUI();

// Enhanced displays
let enhancedDisplaysInitialized = false;
let lastBuffUpdateTime = 0;
let lastRegenUpdateTime = 0;

window.updateEnhancedDisplays = () => {
    const now = Date.now();
    if (now - lastBuffUpdateTime < 500) return;
    lastBuffUpdateTime = now;
    
    if (!enhancedDisplaysInitialized) {
        if (!document.getElementById('enhancedBuffs') || !document.getElementById('comboDisplay') || !document.getElementById('weaponsDisplay')) {
            initEnhancedContainers();
        }
        enhancedDisplaysInitialized = true;
    }
    
    updateEnhancedComboDisplay();
    updateEnhancedBuffDisplay();
    updateWeaponsDisplay();
    updateStatsDisplay();
};

// Roguelike system updates
window.updateRoguelikeSystems = () => {
    const now = Date.now();
    
    // Update regeneration less frequently
    if (now - lastRegenUpdateTime >= 500) {
        updateRegeneration();
        lastRegenUpdateTime = now;
    }
    
    // GEÄNDERT: Update drop buffs EVERY frame für präzise Timer
    updateDropBuffs();
    
    // Check achievements only every 30 frames
    if (gameState.gameRunning && gameState.frameCount % 30 === 0) {
        checkAchievements();
    }
};
window.update = () => {
    update();
    window.updateRoguelikeSystems();
};

// Damage system
window.triggerDamageEffects = triggerDamageEffects;
window.updateDamageEffects = updateDamageEffects;
window.resetDamageEffects = resetDamageEffects;

// Roguelike combat functions
window.calculateDamage = calculateDamage;
window.rollCritical = rollCritical;
window.applyLifesteal = applyLifesteal;

// Enhanced initialization with roguelike features
async function init() {
    console.log('🎮 Dungeon Runner V2.0 - Roguelike Edition');
    console.log('⚔️ HP-Based Combat • 📈 Stat Progression • 🔫 Weapon Drops');
    
    // Initialize core systems
    initInput();
    applyTheme();
    loadGame();
    initEnvironmentElements();
    initDamageEffects();
    
    // Initialize sound system
    soundManager.init();
    
    // Initialize enhanced UI
    initEnhancements();
    
    // Load sprite system
    console.log('🎨 Loading sprite system...');
    try {
        await spriteManager.loadSprites();
        console.log('✅ Sprite system loaded successfully!');
    } catch (error) {
        console.warn('⚠️ Sprite system failed to load, using pixel art fallback:', error.message);
    }
    
    // Container setup with enhanced features
    setTimeout(() => {
        initEnhancedContainers();
        enhancedDisplaysInitialized = true;
        window.updateEnhancedDisplays();
    }, 100);
    
    // Set initial state
    gameState.currentState = GameState.START;
    showScreen('startScreen');
    
    // Apply achievement bonuses on load
    if (window.ACHIEVEMENTS?.untouchable?.unlocked) {
        gameState.stats.damageBonus += 0.15;
    }
    if (window.ACHIEVEMENTS?.sharpshooter?.unlocked) {
        gameState.stats.critChance += 0.10;
    }
    if (window.ACHIEVEMENTS?.speedDemon?.unlocked) {
        gameState.stats.moveSpeed += 0.20;
    }
    if (window.ACHIEVEMENTS?.firstBlood?.unlocked) {
        gameState.stats.dropBonus += 0.25;
    }
    
    // Start the render loop
    initRenderLoop();
    
    // Enhanced displays update with roguelike systems
    setInterval(() => {
        window.updateEnhancedDisplays();
    }, 500);
    
    // Roguelike systems update (more frequent)
    setInterval(() => {
        if (gameState.gameRunning) {
            window.updateRoguelikeSystems();
        }
    }, 100);
    
    // Display startup information
    console.log('🎮 Enhanced Input System: Ready');
    console.log('🔊 Audio System: Ready');
    console.log('🎨 Enhanced UI: Ready');
    console.log('🖼️ Sprite System: Active');
    console.log('⚔️ HP Combat System: Active');
    console.log('📊 Stat Progression: Active');
    console.log('🔫 Weapon Drop System: Active');
    console.log('💚 Regeneration System: Active');
    console.log('💥 Critical Hit System: Active');
    console.log('🩸 Lifesteal System: Active');
    console.log('✨ Roguelike initialization complete!');
    
    // Show initial stats if any achievements unlocked
    const unlockedAchievements = Object.values(window.ACHIEVEMENTS || {}).filter(a => a.unlocked);
    if (unlockedAchievements.length > 0) {
        console.log(`🏆 ${unlockedAchievements.length} achievements unlocked with bonuses applied!`);
    }
    
    // Log current player stats
    console.log(`📊 Starting Stats:`);
    console.log(`   Health: ${gameState.maxHealth}/${gameState.maxHealth} HP`);
    console.log(`   Damage: ${gameState.baseDamage} (+${Math.round(gameState.stats.damageBonus * 100)}%)`);
    console.log(`   Crit: ${Math.round(gameState.stats.critChance * 100)}% chance, ${gameState.stats.critDamage}x damage`);
    console.log(`   Speed: ${gameState.stats.moveSpeed}x movement`);
    if (gameState.stats.lifeSteal > 0) {
        console.log(`   Lifesteal: ${Math.round(gameState.stats.lifeSteal * 100)}%`);
    }
    if (gameState.stats.healthRegen > 0) {
        console.log(`   Health Regen: ${gameState.stats.healthRegen.toFixed(1)}/3s`);
    }
    if (gameState.stats.bulletRegen > 0) {
        console.log(`   Bullet Regen: ${gameState.stats.bulletRegen.toFixed(1)}/2s`);
    }
}

// Enhanced window events with roguelike cleanup
window.addEventListener('beforeunload', function() {
    stopGameLoop();
    
    // Save any roguelike progress here if needed
    try {
        localStorage.setItem('dungeonStats', JSON.stringify({
            achievements: Object.fromEntries(
                Object.entries(window.ACHIEVEMENTS || {}).map(([key, value]) => [key, value.unlocked])
            ),
            totalScore: gameState.score,
            highestLevel: gameState.level,
            totalPlayTime: Date.now() - (gameState.sessionStartTime || Date.now())
        }));
    } catch (error) {
        console.warn('Could not save session stats:', error);
    }
});

// Enhanced error handling for roguelike systems
window.addEventListener('error', function(event) {
    console.error('Game Error:', event.error);
    
    // Try to recover gracefully
    if (gameState.gameRunning) {
        try {
            // Reset problematic systems
            if (event.error.message.includes('regeneration')) {
                console.log('🔧 Attempting to recover regeneration system...');
                lastRegenUpdateTime = 0;
            }
            
            if (event.error.message.includes('weapon') || event.error.message.includes('buff')) {
                console.log('🔧 Attempting to recover buff/weapon systems...');
                lastBuffUpdateTime = 0;
                enhancedDisplaysInitialized = false;
            }
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
        }
    }
});

// Enhanced debugging tools for roguelike
window.debugRoguelike = {
    // Stat manipulation
    addHealth: (amount) => {
        gameState.currentHealth = Math.min(gameState.currentHealth + amount, gameState.maxHealth);
        console.log(`+${amount} HP. Current: ${gameState.currentHealth}/${gameState.maxHealth}`);
    },
    
    addDamage: (amount) => {
        gameState.stats.damageBonus += amount;
        console.log(`+${Math.round(amount * 100)}% damage. Total: ${Math.round(gameState.stats.damageBonus * 100)}%`);
    },
    
    addCrit: (amount) => {
        gameState.stats.critChance += amount;
        console.log(`+${Math.round(amount * 100)}% crit. Total: ${Math.round(gameState.stats.critChance * 100)}%`);
    },
    
    addLifesteal: (amount) => {
        gameState.stats.lifeSteal += amount;
        console.log(`+${Math.round(amount * 100)}% lifesteal. Total: ${Math.round(gameState.stats.lifeSteal * 100)}%`);
    },
    
    addRegen: (health = 0, bullets = 0) => {
        gameState.stats.healthRegen += health;
        gameState.stats.bulletRegen += bullets;
        console.log(`Regen: ${gameState.stats.healthRegen.toFixed(1)} HP/3s, ${gameState.stats.bulletRegen.toFixed(1)} bullets/2s`);
    },
    
    // Level manipulation
    setLevel: (level) => {
        gameState.level = Math.max(1, level);
        gameState.maxHealth = 100 + (gameState.level - 1) * 25;
        gameState.currentHealth = gameState.maxHealth;
        gameState.baseDamage = 20 + (gameState.level - 1) * 5;
        console.log(`Set to level ${level}. HP: ${gameState.maxHealth}, Damage: ${gameState.baseDamage}`);
    },
    
    // Weapon testing
    giveWeapon: (weaponName, duration = 1800) => {
        if (window.activeWeaponDrops) {
            window.activeWeaponDrops[weaponName] = duration;
            console.log(`Gave weapon: ${weaponName} for ${duration/60}s`);
        }
    },
    
    // Combat testing
    testCombat: () => {
        const damage = calculateDamage(gameState.baseDamage, rollCritical());
        console.log(`Test attack: ${damage} damage ${rollCritical() ? '(CRITICAL!)' : ''}`);
        return damage;
    },
    
    // Stat overview
    showStats: () => {
        const stats = gameState.stats;
        console.log(`
📊 CURRENT STATS:
Health: ${gameState.currentHealth}/${gameState.maxHealth} HP
Base Damage: ${gameState.baseDamage}
Damage Bonus: +${Math.round(stats.damageBonus * 100)}%
Critical: ${Math.round(stats.critChance * 100)}% chance, ${stats.critDamage}x damage
Attack Speed: ${(1 + stats.attackSpeed).toFixed(1)}x
Move Speed: ${stats.moveSpeed.toFixed(1)}x
Lifesteal: ${Math.round(stats.lifeSteal * 100)}%
Health Regen: ${stats.healthRegen.toFixed(1)}/3s
Bullet Regen: ${stats.bulletRegen.toFixed(1)}/2s
Drop Bonus: +${Math.round(stats.dropBonus * 100)}%
        `);
    }
};

// Start the game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Add session tracking
gameState.sessionStartTime = Date.now();