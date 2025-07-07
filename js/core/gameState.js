// core/gameState.js - Enhanced Game State for Roguelike System

import { GameState, GAME_CONSTANTS, DUNGEON_THEME, COMBAT_FORMULAS } from './constants.js';
import { resetCamera } from './camera.js';
import { resetPlayer } from './player.js';
import { resetBulletBoxesFound } from '../entities.js';
import { clearArrays, obstacleTimer, bulletBoxesFound } from '../entities.js';
import { loadHighScore, checkAchievements, activeDropBuffs, loadAchievements, loadGlobalHighscores, updateDropBuffs } from '../systems.js';
import { updateDamageEffects, resetDamageEffects } from '../enhanced-damage-system.js';

// Resume Transition for Sound Overlay
export let resumeTransition = {
    active: false,
    progress: 0,
    duration: 120 // 2 seconds at 60 FPS
};

// Enhanced game state object with roguelike features
export const gameState = {
    // Core state
    currentState: GameState.START,
    gameRunning: false,
    gameLoop: null,
    needsRedraw: true,
    shieldCharges: 0,  // Number of shield charges (0-5)
    
    isCorrupted: false,
    corruptionTimer: 0,
    
    // FPS Control
    lastFrameTime: 0,
    targetFrameTime: 1000 / 60, // 60 FPS = 16.67ms per frame
    deltaTime: 1, // Normalized deltatime factor (1 = 60fps)
    
    // Enhanced HP-based system
    currentHealth: 100,        // Current player HP
    maxHealth: 100,           // Maximum player HP
    baseDamage: 20,           // Base damage per shot
    
    // Game statistics
    score: 0,
    lives: 4,                 // Kept for compatibility, but HP system is primary
    maxLives: 5,
    gameSpeed: 2,
    bullets: 10,
    level: 1,
    levelProgress: 0,
    highScore: 0,
    
    // Timers and counters
    postBuffInvulnerability: 0,
    postDamageInvulnerability: 0,
    playerIdleTime: 0,
    comboCount: 0,
    comboTimer: 0,
    lastScoreTime: Date.now(),
    scoreIn30Seconds: 0,
    consecutiveHits: 0,
    bossesKilled: 0,
    damageThisLevel: 0,
    enemiesDefeated: 0,
    obstaclesAvoided: 0,
    bulletsHit: 0,
    levelsCompleted: 0,
    
    // Enhanced stats system for roguelike progression
    stats: {
        // Damage and combat
        damageBonus: 0.0,        // Percentage damage bonus (0.25 = +25%)
        critChance: 0.05,        // Critical hit chance (0.20 = 20%)
        critDamage: 2.0,         // Critical damage multiplier (2.0 = 2x damage)
        attackSpeed: 0.0,        // Attack speed bonus (0.5 = +50% faster)
        
        // Movement and utility
        moveSpeed: 1.0,          // Movement speed multiplier
        projectileSpeed: 1.0,    // Bullet speed multiplier
        
        // Regeneration
        healthRegen: 0.0,        // HP regenerated per 3 seconds
        bulletRegen: 0.0,        // Bullets regenerated per 2 seconds
        
        // Special effects
        lifeSteal: 0.0,          // Lifesteal percentage (0.02 = 2%)
        dropBonus: 0.0,          // Drop rate bonus (0.25 = +25%)
        
        // Resistances and defenses (for future expansion)
        damageReduction: 0.0,    // Damage reduction percentage
        elementalResistance: 0.0 // Elemental damage resistance
    },
    
    // Active buffs (permanent until level up choice)
    activeBuffs: {
        chainLightning: 0,
        undeadResilience: 0,
        shadowLeap: 0,
        vampiricStrikes: 0,
        bulletStorm: 0,
        berserkerRage: 0,
        survivalInstinct: 0,
        criticalFocus: 0,
        swiftDeath: 0
    },
    availableBuffs: [...DUNGEON_THEME.buffs],
    
    // Legacy power-up states (still used for temporary effects)
    hasShield: false,
    scoreMultiplier: 1,
    speedMultiplier: 1,
    magnetRange: 0,
    isGhostWalking: false,
    timeSlowFactor: 1,
    enemySlowFactor: 1,
    isBerserker: false,
    hasPiercingBullets: false,
    
    // Combat timing
    lastShotTime: 0,
    lastRegenTime: 0,
    
    // Session tracking
    sessionStartTime: Date.now(),
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalHealing: 0,
    weaponsFound: 0,
    
    // References
    camera: null,
    canvas: null,
    ctx: null
};

// Enhanced reset function for roguelike system
export function resetGame() {
    // Reset HP system
    gameState.maxHealth = COMBAT_FORMULAS.getPlayerHealth(1);
    gameState.currentHealth = gameState.maxHealth;
    gameState.baseDamage = COMBAT_FORMULAS.getPlayerDamage(1);
    
    // Reset shield system
    gameState.shieldCharges = 0;
    gameState.hasShield = false;
    
    // Reset basic game state
    resetBulletBoxesFound();
    gameState.score = 0;
    gameState.lives = 4;
    gameState.maxLives = 4;
    gameState.bullets = 10;
    gameState.level = 1;
    gameState.levelProgress = 0;
    gameState.gameSpeed = 2;
    gameState.enemiesDefeated = 0;
    gameState.obstaclesAvoided = 0;
    gameState.bulletsHit = 0;
    gameState.levelsCompleted = 0;
    gameState.postBuffInvulnerability = 0;
    gameState.postDamageInvulnerability = 0;
    gameState.damageThisLevel = 0;
    gameState.hasPiercingBullets = false;
    gameState.playerIdleTime = 0;
    gameState.isCorrupted = false;
    gameState.corruptionTimer = 0;
    
    // Reset combo system
    gameState.comboCount = 0;
    gameState.comboTimer = 0;
    gameState.lastScoreTime = Date.now();
    gameState.scoreIn30Seconds = 0;
    gameState.consecutiveHits = 0;
    
    // Reset stats to base values (keep achievement bonuses)
    const achievementBonuses = {
        damageBonus: gameState.stats.damageBonus,
        critChance: gameState.stats.critChance - GAME_CONSTANTS.BASE_CRIT_CHANCE,
        moveSpeed: gameState.stats.moveSpeed - GAME_CONSTANTS.BASE_MOVE_SPEED,
        dropBonus: gameState.stats.dropBonus
    };
    
    gameState.stats = {
        damageBonus: Math.max(0, achievementBonuses.damageBonus),
        critChance: GAME_CONSTANTS.BASE_CRIT_CHANCE + Math.max(0, achievementBonuses.critChance),
        critDamage: GAME_CONSTANTS.BASE_CRIT_DAMAGE,
        attackSpeed: GAME_CONSTANTS.BASE_ATTACK_SPEED - 1, // Store as bonus, so 0 = 1x speed
        moveSpeed: GAME_CONSTANTS.BASE_MOVE_SPEED + Math.max(0, achievementBonuses.moveSpeed),
        projectileSpeed: GAME_CONSTANTS.BASE_PROJECTILE_SPEED,
        healthRegen: GAME_CONSTANTS.BASE_HEALTH_REGEN,
        bulletRegen: GAME_CONSTANTS.BASE_BULLET_REGEN,
        lifeSteal: GAME_CONSTANTS.BASE_LIFESTEAL,
        dropBonus: Math.max(0, achievementBonuses.dropBonus),
        damageReduction: 0.0,
        elementalResistance: 0.0
    };
    
    // Reset legacy power-ups
    gameState.hasShield = false;
    gameState.scoreMultiplier = 1;
    gameState.speedMultiplier = window.ACHIEVEMENTS?.speedDemon?.unlocked ? 1.1 : 1;
    gameState.magnetRange = 0;
    gameState.isGhostWalking = false;
    gameState.timeSlowFactor = 1;
    gameState.enemySlowFactor = 1;
    gameState.isBerserker = false;
    
    // Reset active buffs
    gameState.activeBuffs = {
        chainLightning: 0,
        undeadResilience: 0,
        shadowLeap: 0,
        vampiricStrikes: 0,
        bulletStorm: 0,
        berserkerRage: 0,
        survivalInstinct: 0,
        criticalFocus: 0,
        swiftDeath: 0
    };
    gameState.availableBuffs = [...DUNGEON_THEME.buffs];
    
    // Clear temporary drop effects
    Object.keys(activeDropBuffs).forEach(key => delete activeDropBuffs[key]);
    
    // Reset session tracking
    gameState.sessionStartTime = Date.now();
    gameState.totalDamageDealt = 0;
    gameState.totalDamageTaken = 0;
    gameState.totalHealing = 0;
    gameState.weaponsFound = 0;
    gameState.lastShotTime = 0;
    gameState.lastRegenTime = 0;
    
    // Reset core systems
    resetCamera();
    resetPlayer();
    clearArrays();
    window.obstacleTimer = 0;
    window.bulletBoxesFound = 0;
    
    resetDamageEffects();
    gameState.needsRedraw = true;
    
    console.log(`🎮 Game Reset - Starting Stats:`);
    console.log(`   Health: ${gameState.currentHealth}/${gameState.maxHealth} HP`);
    console.log(`   Damage: ${gameState.baseDamage} (+${Math.round(gameState.stats.damageBonus * 100)}%)`);
    console.log(`   Critical: ${Math.round(gameState.stats.critChance * 100)}% chance`);
    if (gameState.stats.moveSpeed > 1) {
        console.log(`   Speed: ${gameState.stats.moveSpeed.toFixed(1)}x movement`);
    }
}

export function update() {
    if (!gameState.gameRunning || gameState.currentState !== GameState.PLAYING) return;
    
    // Enhanced FPS normalization
    const now = performance.now();
    if (!gameState.lastFrameTime) gameState.lastFrameTime = now;
    
    const frameTime = now - gameState.lastFrameTime;
    gameState.lastFrameTime = now;
    
    // Clamp delta time to prevent extreme jumps
    const clampedFrameTime = Math.min(frameTime, 33.33); // Max 30 FPS minimum
    gameState.deltaTime = clampedFrameTime / 16.67; // Normalized to 60 FPS
    
    // Consistent animation time for sprites
    gameState.animationTime = now * 0.001;
    
    // Update all game systems
    window.updatePlayer();
    window.spawnObstacle();
    window.updateObstacles();
    window.updateBullets();
    window.updateExplosions();
    window.updateEnvironmentElements();
    window.updateDrops();
    window.updateEffects();
    window.updateBatProjectiles();
    updateDropBuffs();
    updateDamageEffects();
    
    // Check for collisions and potential game over
    const gameOver = window.checkCollisions();
    if (gameOver) {
        window.gameOver();
        return;
    }
    
    checkLevelComplete();
    
    // Render if needed
    if (window.render) {
        window.render();
    }
    window.updateUI();
    gameState.needsRedraw = true;
}

export function checkLevelComplete() {
    if (gameState.levelProgress >= GAME_CONSTANTS.MAX_LEVEL_PROGRESS) {
        gameState.levelsCompleted++;
        checkAchievements();
        
        const isBuffLevel = gameState.level % 2 === 0;
        const hasAvailableBuffs = gameState.availableBuffs.length > 0;
        
        if (isBuffLevel && hasAvailableBuffs) {
            gameState.currentState = GameState.LEVEL_COMPLETE;
            gameState.gameRunning = false;
            
            const levelScoreEl = document.getElementById('levelScore');
            const enemiesDefeatedEl = document.getElementById('enemiesDefeated');
            
            if (levelScoreEl) levelScoreEl.textContent = gameState.score;
            if (enemiesDefeatedEl) enemiesDefeatedEl.textContent = gameState.enemiesDefeated;
            
            window.showScreen('levelComplete');
        } else {
            // Level up without buff choice
            levelUp();
        }
    }
}

// Enhanced level up function for roguelike progression
export function levelUp() {
    gameState.level++;
    gameState.levelProgress = 1;
    window.bulletBoxesFound = 0;
    gameState.damageThisLevel = 0;
    gameState.gameSpeed *= 1.1; // 10% faster
    if (gameState.gameSpeed > 6) gameState.gameSpeed = 6; // Cap
    gameState.bullets += 10 + (gameState.level * 2); // More bullets each level
    
    // Enhanced HP/damage scaling
    const newMaxHealth = COMBAT_FORMULAS.getPlayerHealth(gameState.level);
    const healthIncrease = newMaxHealth - gameState.maxHealth;
    gameState.maxHealth = newMaxHealth;
    gameState.currentHealth = Math.min(gameState.currentHealth + healthIncrease, gameState.maxHealth); // Heal on level up
    
    gameState.baseDamage = COMBAT_FORMULAS.getPlayerDamage(gameState.level);
    
    console.log(`📈 Level ${gameState.level}! Health: ${gameState.currentHealth}/${gameState.maxHealth}, Damage: ${gameState.baseDamage}`);
}

// Fixed 60 FPS game loop
function gameLoop() {
    if (gameState.gameRunning) {
        update();
    } else {
        // Menu rendering
        if (window.render) {
            window.render();
        }
    }
}

export function startGameLoop() {
    if (!gameState.gameLoop) {
        gameState.gameLoop = setInterval(gameLoop, 1000 / 60);
    }
}

export function stopGameLoop() {
    if (gameState.gameLoop) {
        clearInterval(gameState.gameLoop);
        gameState.gameLoop = null;
    }
}

// Start the loop immediately when loading (for menus)
export function initRenderLoop() {
    if (!gameState.gameLoop) {
        gameState.gameLoop = setInterval(gameLoop, 1000 / 60);
    }
}

export function loadGame() {
    gameState.highScore = loadHighScore();
    loadAchievements();
    loadGlobalHighscores();
    
    // Apply achievement bonuses
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
}

// Helper functions for roguelike stats
export function getEffectiveDamage() {
    return Math.floor(gameState.baseDamage * (1 + gameState.stats.damageBonus));
}

export function getEffectiveAttackSpeed() {
    return 1 + gameState.stats.attackSpeed;
}

export function getEffectiveMoveSpeed() {
    return gameState.stats.moveSpeed * gameState.speedMultiplier;
}

export function getHealthPercent() {
    return gameState.currentHealth / gameState.maxHealth;
}

// Export all gameState properties individually for easier access
export const { 
    score, lives, level, comboCount, scoreMultiplier, consecutiveHits, 
    scoreIn30Seconds, bossesKilled, damageThisLevel, currentHealth, maxHealth, baseDamage, stats
} = gameState;