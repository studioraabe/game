// core/gameState.js - Game State Management - FPS KORRIGIERT

import { GameState, GAME_CONSTANTS, DUNGEON_THEME } from './constants.js';
import { resetCamera } from './camera.js';
import { resetPlayer } from './player.js';
import { resetBulletBoxesFound } from '../entities.js';
import { clearArrays, obstacleTimer, bulletBoxesFound } from '../entities.js';
import { loadHighScore, checkAchievements, activeDropBuffs, loadAchievements, loadGlobalHighscores, updateDropBuffs } from '../systems.js';

// Game state object
export const gameState = {
    // Core state
    currentState: GameState.START,
    gameRunning: false,
    gameLoop: null,
    needsRedraw: true,
    shieldCharges: 0,  // Anzahl der Shield-Ladungen (0-5)
    
        isCorrupted: false,
    corruptionTimer: 0,
    
    // FPS Control - KORRIGIERT
    lastFrameTime: 0,
    targetFrameTime: 1000 / 60, // 60 FPS = 16.67ms per frame
    deltaTime: 1, // Normalisierter Deltatime-Faktor (1 = 60fps)
    
    // Game statistics
    score: 0,
    lives: 4,
    maxLives: 5,
    gameSpeed: 1, // Zurück auf ursprünglichen Wert
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
    activeBuffs: {
        chainLightning: 0,
        undeadResilience: 0,
        shadowLeap: 0
    },
    availableBuffs: [...DUNGEON_THEME.buffs],
    
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
    
    gameState.activeBuffs = {
        chainLightning: 0,
        undeadResilience: 0,
        shadowLeap: 0
    };
    gameState.availableBuffs = [...DUNGEON_THEME.buffs];
    
    Object.keys(activeDropBuffs).forEach(key => delete activeDropBuffs[key]);
    
    resetCamera();
    resetPlayer();
    clearArrays();
    window.obstacleTimer = 0;
    window.bulletBoxesFound = 0;
    
    gameState.needsRedraw = true;
}



export function update() {
    if (!gameState.gameRunning || gameState.currentState !== GameState.PLAYING) return;
    
    // Update corruption timer
    if (gameState.corruptionTimer > 0) {
        gameState.corruptionTimer -= gameState.deltaTime;
        if (gameState.corruptionTimer <= 0) {
            gameState.isCorrupted = false;
            gameState.corruptionTimer = 0;
        }
    }
    
    // Update all game systems
    window.updatePlayer();
    window.spawnObstacle();
    window.updateObstacles();
    window.updateBullets();
    window.updateExplosions();
    window.updateEnvironmentElements();
    window.updateDrops();
    window.updateEffects();
    window.updateBatProjectiles(); // KORRIGIERT: Hinzugefügt
    updateDropBuffs();
    
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
            gameState.level++;
            gameState.levelProgress = 1;
            window.bulletBoxesFound = 0;
            gameState.damageThisLevel = 0;
            gameState.gameSpeed *= 1.1; // 10 % schneller
            if (gameState.gameSpeed > 6) gameState.gameSpeed = 6; // Obergrenze // Zurück auf                                                               ursprünglichen Wert
            gameState.bullets += 10 * gameState.level
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