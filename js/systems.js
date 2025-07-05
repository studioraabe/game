// systems.js - Alle Game Systems (Achievements, Drops, Sound, Highscores, Cache) - FPS KORRIGIERT

import { ACHIEVEMENTS, DROP_CONFIG, DropType, DROP_INFO, HIGHSCORE_API } from './core/constants.js';
import { gameState } from './core/gameState.js';
import { createScorePopup, drops } from './entities.js';
import { showAchievementPopup } from './ui-enhancements.js';


// Achievement System
export function checkAchievements() {
    if (!ACHIEVEMENTS.firstBlood.unlocked && gameState.bossesKilled >= 1) {
        unlockAchievement('firstBlood');
    }
    
    if (!ACHIEVEMENTS.untouchable.unlocked && gameState.levelProgress >= 100 && gameState.damageThisLevel === 0) {
        unlockAchievement('untouchable');
    }
    
    if (!ACHIEVEMENTS.sharpshooter.unlocked && gameState.consecutiveHits >= 50) {
        unlockAchievement('sharpshooter');
    }
    
    if (!ACHIEVEMENTS.speedDemon.unlocked && gameState.scoreIn30Seconds >= 1000) {
        unlockAchievement('speedDemon');
    }
}

export function unlockAchievement(id) {
    ACHIEVEMENTS[id].unlocked = true;
    showAchievementPopup(ACHIEVEMENTS[id]);
    soundManager.powerUp();
    
    switch(id) {
        case 'firstBlood':
            // Higher drop rates - handled in rollForDrop
            break;
       case 'untouchable':
    // Start with 1 shield charge instead of just hasShield = true
    gameState.shieldCharges = 1;
    gameState.hasShield = true;
    break;
        case 'sharpshooter':
            window.gameState.hasPiercingBullets = true;
            break;
        case 'speedDemon':
            window.gameState.speedMultiplier *= 1.1;
            break;
    }
    
    localStorage.setItem(`achievement_${id}`, 'true');
}

export function loadAchievements() {
    Object.keys(ACHIEVEMENTS).forEach(id => {
        if (localStorage.getItem(`achievement_${id}`) === 'true') {
            ACHIEVEMENTS[id].unlocked = true;
            
            if (id === 'sharpshooter') window.gameState.hasPiercingBullets = true;
            if (id === 'speedDemon') window.gameState.speedMultiplier = 1.1;
        }
    });
}

// Make functions available globally
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.loadAchievements = loadAchievements;
window.loadGlobalHighscores = loadGlobalHighscores;

// Drop System
export const activeDropBuffs = {};

// Make it globally available
window.activeDropBuffs = activeDropBuffs;

export function createDrop(x, y, type) {
    const dropInfo = DROP_INFO[type];
    drops.push({
        x: x,
        y: y,
        type: type,
        width: 24,
        height: 24,
        velocityY: -3,
        rotation: 0,
        glowIntensity: 0.5,
        info: dropInfo
    });
    
    // Create drop particles
    for (let i = 0; i < 8; i++) {
        window.dropParticles.push({
            x: x + 12,
            y: y + 12,
            velocityX: (Math.random() - 0.5) * 4,
            velocityY: (Math.random() - 0.5) * 4,
            life: 30,
            maxLife: 30,
            color: dropInfo.color
        });
    }
}

export function rollForDrop(enemyType, x, y) {
    const dropChanceBonus = ACHIEVEMENTS.firstBlood.unlocked ? 0.1 : 0;
    const comboBonus = Math.min(gameState.comboCount * 0.01, 0.2);
    
    let dropConfig;
    if (enemyType === 'alphaWolf') {
        dropConfig = DROP_CONFIG.boss;
        
        // Guaranteed drop at high combo
        if (gameState.comboCount >= 20) {
            const items = dropConfig.items;
            const selectedDrop = selectDropFromItems(items);
            if (selectedDrop) {
                createDrop(x, y, selectedDrop.type);
            }
            return;
        }
    } else {
        dropConfig = DROP_CONFIG.common;
    }
    
    const finalChance = dropConfig.chance + dropChanceBonus + comboBonus;
    
    if (Math.random() < finalChance) {
        const selectedDrop = selectDropFromItems(dropConfig.items);
        if (selectedDrop) {
            createDrop(x, y, selectedDrop.type);
        }
    }
}

function selectDropFromItems(items) {
    const random = Math.random();
    let cumulativeChance = 0;
    
    for (const item of items) {
        cumulativeChance += item.chance;
        if (random < cumulativeChance) {
            return item;
        }
    }
    
    return items[items.length - 1];
}

export function collectDrop(drop) {
    soundManager.pickup();
    const dropConfig = [...DROP_CONFIG.boss.items, ...DROP_CONFIG.common.items].find(item => item.type === drop.type);
    
    switch(drop.type) {
        case DropType.EXTRA_LIFE:
            if (gameState.lives < 5) {
                gameState.lives++;
                if (gameState.lives > gameState.maxLives) gameState.maxLives = gameState.lives;
                createScorePopup(drop.x, drop.y, '+1 Life');
            } else {
                gameState.score += 1000 * gameState.scoreMultiplier;
                createScorePopup(drop.x, drop.y, '+1000 Bonus!');
            }
            break;
            
        case DropType.MEGA_BULLETS:
            gameState.bullets += 50;
            createScorePopup(drop.x, drop.y, '+50 Bolts');
            break;
            
        case DropType.SPEED_BOOST:
            activeDropBuffs.speedBoost = dropConfig.duration;
            createScorePopup(drop.x, drop.y, 'Speed Boost!');
            break;
            
        case DropType.JUMP_BOOST:
            activeDropBuffs.jumpBoost = Math.min((activeDropBuffs.jumpBoost || 0) + dropConfig.duration, 3600);
            createScorePopup(drop.x, drop.y, 'Jump Boost!');
            break;
            
      case DropType.SHIELD:
    // Stack shields bis zu 5
    if (gameState.shieldCharges < 5) {
        gameState.shieldCharges++;
        gameState.hasShield = true;
        createScorePopup(drop.x, drop.y, `Shield +1 (${gameState.shieldCharges}x)`);
    } else {
        // Max shields erreicht - Bonus Score stattdessen
        gameState.score += 500 * gameState.scoreMultiplier;
        createScorePopup(drop.x, drop.y, '+500 Shield Bonus!');
    }
    break;
            
        case DropType.SCORE_MULTIPLIER:
            activeDropBuffs.scoreMultiplier = Math.min(
                (activeDropBuffs.scoreMultiplier || 0) + dropConfig.duration,
                3600
            );
            gameState.scoreMultiplier = 2;
            createScorePopup(drop.x, drop.y, '2x Score!');
            break;
            
        case DropType.MAGNET_MODE:
            activeDropBuffs.magnetMode = dropConfig.duration;
            gameState.magnetRange = 200;
            createScorePopup(drop.x, drop.y, 'Magnet!');
            break;
            
        case DropType.BERSERKER_MODE:
            activeDropBuffs.berserkerMode = Math.min((activeDropBuffs.berserkerMode || 0) + dropConfig.duration, 1800);
            gameState.isBerserker = true;
            createScorePopup(drop.x, drop.y, 'Berserker!');
            break;
            
        case DropType.GHOST_WALK:
            activeDropBuffs.ghostWalk = Math.min((activeDropBuffs.ghostWalk || 0) + dropConfig.duration, 1200);
            gameState.isGhostWalking = true;
            createScorePopup(drop.x, drop.y, 'Ghost Walk!');
            break;
            
        case DropType.TIME_SLOW:
            activeDropBuffs.timeSlow = dropConfig.duration;
            gameState.enemySlowFactor = 0.4;
            createScorePopup(drop.x, drop.y, 'Enemy Slow!');
            break;
    }
    
    soundManager.powerUp();
}

export function updateDropBuffs() {
    // FPS-normalisiert: Verwende deltaTime für konsistente Buff-Zeiten
    Object.keys(activeDropBuffs).forEach(buff => {
        activeDropBuffs[buff] -= gameState.deltaTime;
        if (activeDropBuffs[buff] <= 0) {
            delete activeDropBuffs[buff];
            
            switch(buff) {
                case 'scoreMultiplier': 
                    gameState.scoreMultiplier = 1; 
                    break;
                case 'magnetMode': 
                    gameState.magnetRange = 0; 
                    break;
                case 'berserkerMode': 
                    gameState.isBerserker = false; 
                    break;
                case 'ghostWalk': 
                    gameState.isGhostWalking = false; 
                    break;
                case 'timeSlow': 
                    gameState.enemySlowFactor = 1; 
                    break;
            }
        }
    });
}

// Finale SoundManager Klasse - ohne Debug-Logs
// Finale SoundManager Klasse - ohne Debug-Logs
export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.backgroundMusic = null;
        this.musicVolume = 0.3; // 30% Lautstärke für Hintergrundmusik
        this.sfxVolume = 0.1;   // 10% für Sound Effects
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.initBackgroundMusic();
    }

    // Hintergrundmusik initialisieren
    initBackgroundMusic() {
        if (this.backgroundMusic) return;
        
        this.backgroundMusic = new Audio('assets/music.ogg');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.preload = 'auto';
        
        // Minimales Error handling
        this.backgroundMusic.addEventListener('error', (e) => {
            console.warn('Background music loading failed:', e);
        });
    }

    // Hintergrundmusik starten
    startBackgroundMusic() {
        if (!this.backgroundMusic) {
            this.initBackgroundMusic();
            setTimeout(() => this.startBackgroundMusic(), 500);
            return;
        }
        
        if (this.isMuted) return;
        
        this.backgroundMusic.currentTime = 0;
        const playPromise = this.backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // Autoplay-Policy: Musik beim nächsten User-Click starten
                const startMusicOnClick = () => {
                    this.backgroundMusic.play().catch(() => {});
                };
                document.addEventListener('click', startMusicOnClick, { once: true });
                document.addEventListener('keydown', startMusicOnClick, { once: true });
            });
        }
    }

    // Hintergrundmusik pausieren
    pauseBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
    }

    // Hintergrundmusik fortsetzen
    resumeBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.paused && !this.isMuted) {
            const playPromise = this.backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {}); // Ignore autoplay errors
            }
        }
    }

    // Hintergrundmusik komplett stoppen (für Game Over)
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    // Sound Effects
    play(frequency, duration, type = 'sine') {
        if (!this.audioContext || this.isMuted) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    // Game Sound Effects
    jump() { this.play(200, 0.2, 'square'); }
    shoot() { 
        this.play(800, 0.05, 'sawtooth');
        setTimeout(() => this.play(400, 0.05, 'sawtooth'), 50);
    }
    hit() { this.play(150, 0.2, 'triangle'); }
    death() { 
        this.stopBackgroundMusic();
        this.play(100, 0.5, 'sawtooth');
        setTimeout(() => this.play(80, 0.6, 'sawtooth'), 200);
    }
    pickup() { 
        this.play(800, 0.1, 'sine'); 
        this.play(1200, 0.1, 'sine'); 
    }
    powerUp() { 
        this.play(400, 0.3, 'sine'); 
        this.play(600, 0.3, 'sine'); 
        this.play(800, 0.3, 'sine'); 
    }

    // Mute Toggle - mit Pause/Resume statt Stop
    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteIcon = document.getElementById('muteIcon');
        const muteButton = document.getElementById('muteButton');
        
        if (this.isMuted) {
            if (muteIcon) muteIcon.textContent = '🔇';
            if (muteButton) muteButton.classList.add('muted');
            this.pauseBackgroundMusic(); // Pause statt Stop
        } else {
            if (muteIcon) muteIcon.textContent = '🔊';
            if (muteButton) muteButton.classList.remove('muted');
            this.resumeBackgroundMusic(); // Resume statt Start
        }
    }

    // Volume Controls
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }
}
// Integration in dein bestehendes System:
// 1. In main.js oder wo auch immer du startGame() aufrufst:
/*
export function startGame() {
    soundManager.init();
    if (soundManager.audioContext) {
        soundManager.audioContext.resume();
    }
    soundManager.startBackgroundMusic(); // Diese Zeile hinzufügen
    
    // ... rest deines Codes
}
*/

// 2. Bei Game Over:
/*
export function gameOver() {
    soundManager.stopBackgroundMusic(); // Optional: Musik stoppen
    // ... rest deines Codes
}
*/
export const soundManager = new SoundManager();

// Highscore System
export let globalHighscores = [];

export async function loadGlobalHighscores() {
    console.log('Loading highscores from Pantry...');
    try {
        const response = await fetch(HIGHSCORE_API.URL);
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Data received:', data);
            globalHighscores = data.scores || [];
            console.log('Highscores array:', globalHighscores);
            displayHighscores();
        } else if (response.status === 400) {
            console.log('Basket does not exist yet (400)');
            globalHighscores = [];
            displayHighscores();
        }
    } catch (error) {
        console.error('Error loading highscores:', error);
        globalHighscores = [];
        displayHighscores();
    }
}

export async function saveGlobalHighscore(playerName, score) {
    const newEntry = {
        name: playerName.substring(0, 20),
        score: score,
        date: new Date().toISOString()
    };
    
    globalHighscores.push(newEntry);
    globalHighscores.sort((a, b) => b.score - a.score);
    globalHighscores = globalHighscores.slice(0, 10);
    
    try {
        const response = await fetch(HIGHSCORE_API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scores: globalHighscores })
        });
        
        if (response.ok) {
            console.log('Highscore saved!');
        } else {
            console.error('Failed to save:', response.status);
        }
    } catch (error) {
        console.log('Could not save highscore:', error);
    }
}

export function displayHighscores() {
    const allLists = document.querySelectorAll('#highscoreList');
    
    allLists.forEach(list => {
        if (globalHighscores.length === 0) {
            list.innerHTML = '<p>No highscores yet - be the first!</p>';
        } else {
            const top10 = globalHighscores.slice(0, 10);
            list.innerHTML = top10.map((entry, index) => {
                return `
                    <div class="highscore-entry">
                        <span>${index + 1}. ${entry.name}</span>
                        <span>${entry.score.toLocaleString()}</span>
                    </div>
                `;
            }).join('');
        }
    });
}

export function checkForTop10Score(score) {
    if (score < 1000) return;
    
    const isTop10 = globalHighscores.length < 10 || 
                    score > (globalHighscores[9]?.score || 0);
    
    if (isTop10) {
        let position = 1;
        for (let i = 0; i < Math.min(globalHighscores.length, 10); i++) {
            if (score <= globalHighscores[i].score) {
                position = i + 2;
            } else {
                break;
            }
        }
        
        const playerName = prompt(
            '🏆 TOP 10 SCORE! Position #' + position + ' with ' + score.toLocaleString() + ' points!\n\nEnter your name:'
        ) || 'Anonymous';
        
        saveGlobalHighscore(playerName, score);
    }
}

export function loadHighScore() {
    return parseInt(localStorage.getItem('dungeonHighScore') || '0');
}

export function saveHighScore(score) {
    localStorage.setItem('dungeonHighScore', score.toString());
}

// Game Cache
export class GameCache {
    constructor() {
        this.themeCache = null;
    }

    getTheme() {
        if (!this.themeCache) {
            this.themeCache = window.DUNGEON_THEME;
        }
        return this.themeCache;
    }

    invalidate() {
        this.themeCache = null;
    }
}

export const gameCache = new GameCache();

// Initialize immediately when module loads
if (!window.loadAchievements) {
    window.loadAchievements = loadAchievements;
    window.loadGlobalHighscores = loadGlobalHighscores;
}