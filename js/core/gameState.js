// core/gameState.js - Game State Management - FPS KORRIGIERT

import { GameState, GAME_CONSTANTS, DUNGEON_THEME, calculatePlayerMaxHP, calculatePlayerDamage, calculateEnemyHP } from './constants.js';

import { resetCamera } from './camera.js';
import { resetPlayer } from './player.js';
import { resetBulletBoxesFound } from '../entities.js';
import { clearArrays, obstacleTimer, bulletBoxesFound } from '../entities.js';
import { loadHighScore, checkAchievements, activeDropBuffs, loadAchievements, loadGlobalHighscores, updateDropBuffs } from '../systems.js';
import { updateDamageEffects, resetDamageEffects, triggerDamageEffects } from '../enhanced-damage-system.js';


// Resume Transition für Sound Overlay
export let resumeTransition = {
    active: false,
    progress: 0,
    duration: 120 // 2 Sekunden bei 60 FPS
};

// Game state object
export const gameState = {
    // Core state
    currentState: GameState.START,
    gameRunning: false,
    gameLoop: null,
    needsRedraw: true,
    shieldCharges: 0,
	playerStats: {
    damageBonus: 0,       // Percentage bonus to base damage
    attackSpeed: 0,       // Percentage increase to attack rate
    moveSpeed: 0,         // Percentage increase to movement speed
    projectileSpeed: 0,   // Percentage increase to bullet speed
    healthRegen: 0,       // HP regen per second
    bulletRegen: 0,       // Bullet regen per second
    lifeSteal: 0,         // Percentage of damage dealt returned as healing
    critChance: 0,        // Percentage chance to land a critical hit
    critDamage: 1.5,      // Multiplier for critical hit damage (starts at 50% bonus)
    selectedBuffs: []     // Track selected buffs
	},
    
    isCorrupted: false,
    corruptionTimer: 0,
    
    // FPS Control
    lastFrameTime: 0,
    targetFrameTime: 1000 / 60,
    deltaTime: 1,
    
    // Game statistics - HP SYSTEM
    score: 0,
    currentHP: 100,
    maxHP: 100,
    baseDamage: 20,
    gameSpeed: 1,
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
    
    // Active buffs
    activeBuffs: {},
    availableBuffs: [],
    
    // Power-up states
    hasShield: false,
    scoreMultiplier: 1,
    speedMultiplier: 1,
    magnetRange: 0,
    isGhostWalking: false,
    timeSlowFactor: 1,
    enemySlowFactor: 1,
    isBerserker: false,
    hasPiercingBullets: false,
    
    // References
    camera: null,
    canvas: null,
    ctx: null
};
export function resetGame() {
    gameState.shieldCharges = 0;
    gameState.hasShield = false;
    resetBulletBoxesFound();
    gameState.score = 0;
    
    // NEW: Initialize HP system
    gameState.maxHP = calculatePlayerMaxHP(1);
    gameState.currentHP = gameState.maxHP;
    gameState.baseDamage = calculatePlayerDamage(1);
    
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
    
	    gameState.playerStats = {
        damageBonus: 0,
        attackSpeed: 0,
        moveSpeed: 0,
        projectileSpeed: 0,
        healthRegen: 0,
        bulletRegen: 0,
        lifeSteal: 0,
        critChance: 0,
        critDamage: 1.5,
        selectedBuffs: []
    };
	
    gameState.comboCount = 0;
    gameState.comboTimer = 0;
    gameState.lastScoreTime = Date.now();
    gameState.scoreIn30Seconds = 0;
    gameState.consecutiveHits = 0;
    
    gameState.hasShield = false;
    gameState.scoreMultiplier = 1;
    gameState.speedMultiplier = window.ACHIEVEMENTS?.speedDemon?.unlocked ? 1.1 : 1;
    gameState.magnetRange = 0;
    gameState.isGhostWalking = false;
    gameState.timeSlowFactor = 1;
    gameState.enemySlowFactor = 1;
    gameState.isBerserker = false;
    
	gameState.activeBuffs = {};  // Empty object, will be populated by buff effects
    gameState.availableBuffs = [];  // Empty array, will be populated by roguelike-integration
    
    Object.keys(activeDropBuffs).forEach(key => delete activeDropBuffs[key]);
    
    resetCamera();
    resetPlayer();
    clearArrays();
    window.obstacleTimer = 0;
    window.bulletBoxesFound = 0;
    
    resetDamageEffects();
    gameState.needsRedraw = true;
}


export function takeDamage(damage) {
    const actualDamage = Math.min(damage, gameState.currentHP);
    gameState.currentHP -= actualDamage;
    
    // Update damage tracking
    gameState.damageThisLevel += actualDamage;
    
    // Update damage effects
    triggerDamageEffects(gameState, 'health');
    
    return gameState.currentHP <= 0; // Returns true if player died
}

export function healPlayer(amount) {
    const actualHeal = Math.min(amount, gameState.maxHP - gameState.currentHP);
    gameState.currentHP += actualHeal;
    return actualHeal;
}

export function updatePlayerStatsForLevel(level) {
    const oldMaxHP = gameState.maxHP;
    gameState.maxHP = calculatePlayerMaxHP(level);
    gameState.baseDamage = calculatePlayerDamage(level);
    
    // Heal proportionally when leveling up
    const hpIncrease = gameState.maxHP - oldMaxHP;
    gameState.currentHP = Math.min(gameState.currentHP + hpIncrease, gameState.maxHP);
}

export function update() {
    if (!gameState.gameRunning || gameState.currentState !== GameState.PLAYING) return;
    
    // FPS normalization
    const now = performance.now();
    if (!gameState.lastFrameTime) gameState.lastFrameTime = now;
    
    const frameTime = now - gameState.lastFrameTime;
    gameState.lastFrameTime = now;
    
    // Clamp delta time to avoid extreme jumps
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
	
	
	 // Handle health regeneration
    if (gameState.playerStats.healthRegen > 0) {
        gameState.healthRegenTimer = (gameState.healthRegenTimer || 0) + gameState.deltaTime;
        const regenInterval = 60; // 1 second at 60 FPS
        
        if (gameState.healthRegenTimer >= regenInterval) {
            gameState.healthRegenTimer -= regenInterval;
            
            // Calculate healing amount
            const healAmount = Math.max(1, Math.floor(gameState.playerStats.healthRegen));
            
            // Apply healing if not at max health
            if (gameState.currentHP < gameState.maxHP) {
                const oldHP = gameState.currentHP;
                gameState.currentHP = Math.min(gameState.maxHP, gameState.currentHP + healAmount);
                
                // Show healing popup if health actually increased
                if (gameState.currentHP > oldHP) {
                    createScorePopup(
                        player.x + player.width/2, 
                        player.y - 30, 
                        `+${gameState.currentHP - oldHP} HP`
                    );
                }
            }
        }
    }
    
    // Handle bullet regeneration
    if (gameState.playerStats.bulletRegen > 0) {
        gameState.bulletRegenTimer = (gameState.bulletRegenTimer || 0) + gameState.deltaTime;
        const regenInterval = 60; // 1 second at 60 FPS
        
        if (gameState.bulletRegenTimer >= regenInterval) {
            gameState.bulletRegenTimer -= regenInterval;
            
            // Calculate bullet regen amount
            const bulletAmount = Math.max(1, Math.floor(gameState.playerStats.bulletRegen));
            
            // Add bullets
            gameState.bullets += bulletAmount;
            
            // Show bullet regen popup every 5 bullets
            if (Math.random() < 0.2) {
                createScorePopup(
                    player.x + player.width/2, 
                    player.y - 30, 
                    `+${bulletAmount} Bolt`
                );
            }
        }
    }
    
    // FIXED: Check bat projectiles for player death BEFORE other collision checks
    const batKilledPlayer = window.updateBatProjectiles();
    if (batKilledPlayer) {
        console.log("🦇 Player killed by bat projectile!");
        window.gameOver();
        return;
    }
    
    updateDropBuffs();
    updateDamageEffects();
    
    // FIXED: Only check regular collisions if player wasn't killed by bat
    const gameOver = window.checkCollisions();
    if (gameOver) {
        console.log("💀 Player killed by regular collision!");
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
            gameState.level++;
            gameState.levelProgress = 1;
            window.bulletBoxesFound = 0;
            gameState.damageThisLevel = 0;
            gameState.gameSpeed *= 1.1; // 10 % schneller
            if (gameState.gameSpeed > 6) gameState.gameSpeed = 6; // Obergrenze
            gameState.bullets += 10 * gameState.level;
        }
    }
}

// KORRIGIERTER 60 FPS GAME LOOP
function gameLoop() {
    if (gameState.gameRunning) {
        update();
    } else {
        // Menü-Rendering
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

// Starte den Loop sofort beim Laden (für Menüs)
export function initRenderLoop() {
    if (!gameState.gameLoop) {
        gameState.gameLoop = setInterval(gameLoop, 1000 / 60);
    }
}

export function loadGame() {
    gameState.highScore = loadHighScore();
    loadAchievements();
    loadGlobalHighscores();
}

// Export all gameState properties individually for easier access
export const { 
    score, lives, level, comboCount, scoreMultiplier, consecutiveHits, 
    scoreIn30Seconds, bossesKilled, damageThisLevel 
} = gameState;