// systems.js - Alle Game Systems mit File-based Banned Words System

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
            break;
        case 'untouchable':
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
            if (gameState.shieldCharges < 5) {
                gameState.shieldCharges++;
                gameState.hasShield = true;
                createScorePopup(drop.x, drop.y, `Shield +1 (${gameState.shieldCharges}x)`);
            } else {
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

// ========================================
// ENHANCED HIGHSCORE VALIDATOR WITH FILE-BASED BANNED WORDS
// ========================================

class HighscoreValidator {
    constructor() {
        this.maxScore = 1000000;
        this.minScore = 100;
        this.maxNameLength = 20;
        this.bannedWords = ['admin', 'test']; // Fallback words
        this.bannedWordsLoaded = false;
        this.suspiciousScores = new Set();
        
        // Load banned words from file
        this.loadBannedWords();
    }

    // Load banned words from text file
    async loadBannedWords() {
        try {
            console.log('📚 Loading banned words list...');
            
            // Try multiple file locations
            const possiblePaths = [
                '../assets/banned-words.txt'
            ];

            let wordsLoaded = false;

            for (const path of possiblePaths) {
                try {
                    const response = await fetch(path);
                    if (response.ok) {
                        const text = await response.text();
                        this.parseBannedWords(text);
                        console.log(`✅ Banned words loaded from: ${path}`);
                        console.log(`📊 Total banned words: ${this.bannedWords.length}`);
                        wordsLoaded = true;
                        break;
                    }
                } catch (error) {
                    // Continue to next path
                    continue;
                }
            }

            if (!wordsLoaded) {
                console.warn('⚠️ Could not load banned words file. Using default list.');
                this.loadDefaultBannedWords();
            }

            this.bannedWordsLoaded = true;

        } catch (error) {
            console.error('❌ Error loading banned words:', error);
            this.loadDefaultBannedWords();
            this.bannedWordsLoaded = true;
        }
    }

    // Parse banned words from text content
    parseBannedWords(text) {
        const words = text
            .split('\n')                    // Split by lines
            .map(line => line.trim())       // Remove whitespace
            .filter(line => line.length > 0) // Remove empty lines
            .filter(line => !line.startsWith('#')) // Remove comments
            .filter(line => !line.startsWith('//')) // Remove comments
            .map(word => word.toLowerCase()) // Convert to lowercase
            .filter(word => word.length > 1) // Remove single characters
            .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates

        this.bannedWords = words;
    }

    // Fallback default banned words
    loadDefaultBannedWords() {
        this.bannedWords = [
            'admin', 'administrator', 'root', 'system',
            'test', 'testing', 'debug', 'dev',
            'hack', 'hacker', 'cheat', 'cheater',
            'bot', 'script', 'auto', 'fake',
            'fuck', 'shit', 'damn', 'ass',
            'nazi', 'hitler', 'kill', 'die',
            'nigger', 'nigga', 'faggot', 'retard',
            'bitch', 'whore', 'slut', 'cunt',
            'penis', 'vagina', 'sex', 'porn'
        ];
        console.log('📝 Using default banned words list');
    }

    // Enhanced name validation with async support
    async validateName(name) {
        // Wait for banned words to load if they haven't yet
        if (!this.bannedWordsLoaded) {
            await this.waitForBannedWords();
        }

        if (!name || typeof name !== 'string') return false;
        if (name.length === 0 || name.length > this.maxNameLength) return false;
        if (name.trim() !== name) return false;

        const lowerName = name.toLowerCase();

        // Check against loaded banned words
        for (const banned of this.bannedWords) {
            if (lowerName.includes(banned)) {
                console.warn(`🚫 Name blocked: contains "${banned}"`);
                return false;
            }
        }

        // Additional pattern checks
        if (/^[0-9]+$/.test(name)) return false; // All numbers
        if (/(.)\1{4,}/.test(name)) return false; // Too many repeated chars
        if (/^(admin|mod|owner)/i.test(name)) return false; // Authority claims

        return true;
    }

    // Wait for banned words to finish loading
    waitForBannedWords(timeout = 5000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkLoaded = () => {
                if (this.bannedWordsLoaded || (Date.now() - startTime > timeout)) {
                    resolve();
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            checkLoaded();
        });
    }

    // Debug function to show current banned words
    getBannedWords() {
        return {
            loaded: this.bannedWordsLoaded,
            count: this.bannedWords.length,
            words: this.bannedWords
        };
    }

    // Add word to banned list (runtime)
    addBannedWord(word) {
        const cleanWord = word.toLowerCase().trim();
        if (cleanWord && !this.bannedWords.includes(cleanWord)) {
            this.bannedWords.push(cleanWord);
            console.log(`🚫 Added banned word: "${cleanWord}"`);
            return true;
        }
        return false;
    }

    // Remove word from banned list (runtime)
    removeBannedWord(word) {
        const cleanWord = word.toLowerCase().trim();
        const index = this.bannedWords.indexOf(cleanWord);
        if (index > -1) {
            this.bannedWords.splice(index, 1);
            console.log(`✅ Removed banned word: "${cleanWord}"`);
            return true;
        }
        return false;
    }

    // Generate a simple hash for score verification
    generateScoreHash(playerName, score, timestamp) {
        const data = `${playerName}${score}${timestamp}retro_runner_secret_2024`;
        let hash = 0;
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }

    // Validate score legitimacy
    validateScore(score, gameTimeMs, level) {
        const checks = {
            valid: true,
            reasons: []
        };

        if (score > this.maxScore) {
            checks.valid = false;
            checks.reasons.push('Score too high');
        }

        if (score < 0) {
            checks.valid = false;
            checks.reasons.push('Negative score');
        }

        const minTimeForScore = Math.max(30000, score / 100);
        if (gameTimeMs < minTimeForScore && score > 10000) {
            checks.valid = false;
            checks.reasons.push('Score too high for game time');
        }

        const expectedMaxScore = level * 5000;
        if (score > expectedMaxScore * 3) {
            checks.valid = false;
            checks.reasons.push('Score inconsistent with level');
        }

        if (score > 50000 && score % 10000 === 0) {
            checks.reasons.push('Suspiciously round number');
            this.suspiciousScores.add(score);
        }

        return checks;
    }

    canSubmitScore() {
        const lastSubmission = localStorage.getItem('lastHighscoreSubmission');
        const now = Date.now();
        
        if (lastSubmission) {
            const timeDiff = now - parseInt(lastSubmission);
            if (timeDiff < 60000) {
                return false;
            }
        }
        
        localStorage.setItem('lastHighscoreSubmission', now.toString());
        return true;
    }
}

// Create validator instance
const validator = new HighscoreValidator();

// Enhanced save function with async name validation
export async function saveGlobalHighscoreSecure(playerName, score, gameData = {}) {
    console.log('🔒 Validating highscore submission...');

    if (!validator.canSubmitScore()) {
        console.warn('⚠️ Rate limited: Please wait before submitting another score');
        return false;
    }

    // Async name validation
    const nameValid = await validator.validateName(playerName);
    if (!nameValid) {
        console.warn('⚠️ Invalid player name');
        alert('Invalid name. Please choose a different name.');
        return false;
    }

    const gameTime = gameData.gameTime || Date.now() - (gameData.startTime || Date.now() - 60000);
    const level = gameData.level || 1;
    const validation = validator.validateScore(score, gameTime, level);

    if (!validation.valid) {
        console.warn('⚠️ Score validation failed:', validation.reasons);
        console.warn('Score appears to be manipulated. Submission blocked.');
        return false;
    }

    const timestamp = Date.now();
    const hash = validator.generateScoreHash(playerName, score, timestamp);

    const newEntry = {
        name: playerName.substring(0, 20),
        score: score,
        date: new Date(timestamp).toISOString(),
        hash: hash,
        level: level,
        gameTime: Math.floor(gameTime / 1000),
        isNew: true,
        version: '1.0'
    };

    if (validation.reasons.length > 0) {
        newEntry.suspicious = validation.reasons;
        console.warn('⚠️ Score marked as suspicious:', validation.reasons);
    }

    globalHighscores.push(newEntry);
    globalHighscores.sort((a, b) => b.score - a.score);
    globalHighscores = globalHighscores.slice(0, 10);

    try {
        const response = await fetch(HIGHSCORE_API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'RetroRunner/1.0'
            },
            body: JSON.stringify({ 
                scores: globalHighscores,
                lastUpdate: timestamp,
                version: '1.0'
            })
        });

        if (response.ok) {
            console.log('✅ Secure highscore saved!');
            displayHighscoresSecure();
            return true;
        } else {
            console.error('❌ Failed to save:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        displayHighscoresSecure();
        return false;
    }
}

// Enhanced display with security indicators
export function displayHighscoresSecure() {
    const allLists = document.querySelectorAll('#highscoreList');
    
    allLists.forEach(list => {
        if (globalHighscores.length === 0) {
            list.innerHTML = '<p>No highscores yet - be the first!</p>';
        } else {
            const top10 = globalHighscores.slice(0, 10);
            list.innerHTML = top10.map((entry, index) => {
                const isNewEntry = entry.isNew === true;
                const isSuspicious = entry.suspicious && entry.suspicious.length > 0;
                const isVerified = entry.hash && entry.gameTime;
                
                let highlightClass = '';
                let badges = '';
                
                if (isNewEntry) {
                    highlightClass += 'highscore-new ';
                    badges += ' <span class="new-badge">NEW!</span>';
                }
                
                if (isSuspicious) {
                    highlightClass += 'highscore-suspicious ';
                    badges += ' <span class="suspicious-badge" title="Suspicious score">⚠️</span>';
                }
                
                if (isVerified) {
                    badges += ' <span class="verified-badge" title="Verified legitimate">✓</span>';
                }
                
                return `
                    <div class="highscore-entry ${highlightClass}">
                        <span>${index + 1}. ${entry.name}${badges}</span>
                        <span>${entry.score.toLocaleString()}</span>
                    </div>
                `;
            }).join('');
        }
    });
    
    // Clean up flags after display
    setTimeout(() => {
        globalHighscores.forEach(entry => {
            if (entry.isNew) delete entry.isNew;
        });
    }, 5000);
}

// Enhanced check function with game data
export function checkForTop10ScoreSecure(score, gameData = {}) {
    if (score < validator.minScore) return;
    
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
            `🏆 TOP 10 SCORE! Position #${position} with ${score.toLocaleString()} points!\n\nEnter your name:`
        )?.trim() || 'Anonymous';
        
        // Enhanced save with game data
        saveGlobalHighscoreSecure(playerName, score, gameData).then(success => {
            if (success) {
                setTimeout(() => displayHighscoresSecure(), 100);
            } else {
                alert('Score validation failed. Please play normally to submit scores.');
            }
        });
    }
}

// Track game session for validation
export class GameSessionTracker {
    constructor() {
        this.startTime = Date.now();
        this.events = [];
        this.maxEvents = 100;
    }

    recordEvent(type, data = {}) {
        this.events.push({
            type,
            timestamp: Date.now() - this.startTime,
            data
        });
        
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }
    }

    getGameData(score, level) {
        return {
            startTime: this.startTime,
            gameTime: Date.now() - this.startTime,
            level: level,
            score: score,
            eventCount: this.events.length,
            version: '1.0'
        };
    }

    isSessionValid() {
        const gameTime = Date.now() - this.startTime;
        return gameTime > 30000 && this.events.length > 10;
    }
}

// Initialize session tracker
export const sessionTracker = new GameSessionTracker();

// Sound Manager
export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.backgroundMusic = null;
        this.musicVolume = 0.3;
        this.sfxVolume = 0.1;
    }

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        this.initBackgroundMusic();
    }

    initBackgroundMusic() {
        if (this.backgroundMusic) return;
        
        this.backgroundMusic = new Audio('assets/music.ogg');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.preload = 'auto';
        
        this.backgroundMusic.addEventListener('error', (e) => {
            console.warn('Background music loading failed:', e);
        });
    }

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
                const startMusicOnClick = () => {
                    this.backgroundMusic.play().catch(() => {});
                };
                document.addEventListener('click', startMusicOnClick, { once: true });
                document.addEventListener('keydown', startMusicOnClick, { once: true });
            });
        }
    }

    pauseBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
    }

    resumeBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.paused && !this.isMuted) {
            const playPromise = this.backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

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

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteIcon = document.getElementById('muteIcon');
        const muteButton = document.getElementById('muteButton');
        
        if (this.isMuted) {
            if (muteIcon) muteIcon.textContent = '🔇';
            if (muteButton) muteButton.classList.add('muted');
            this.pauseBackgroundMusic();
        } else {
            if (muteIcon) muteIcon.textContent = '🔊';
            if (muteButton) muteButton.classList.remove('muted');
            this.resumeBackgroundMusic();
        }
    }

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

export const soundManager = new SoundManager();

// Highscore System (Original functions for compatibility)
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
            displayHighscoresSecure();
        } else if (response.status === 400) {
            console.log('Basket does not exist yet (400)');
            globalHighscores = [];
            displayHighscoresSecure();
        }
    } catch (error) {
        console.error('Error loading highscores:', error);
        globalHighscores = [];
        displayHighscoresSecure();
    }
}

export async function saveGlobalHighscore(playerName, score) {
    const newEntry = {
        name: playerName.substring(0, 20),
        score: score,
        date: new Date().toISOString(),
        isNew: true
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
            displayHighscoresSecure();
        } else {
            console.error('Failed to save:', response.status);
        }
    } catch (error) {
        console.log('Could not save highscore:', error);
        displayHighscoresSecure();
    }
}

export function displayHighscores() {
    displayHighscoresSecure();
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
        
        saveGlobalHighscore(playerName, score).then(() => {
            setTimeout(() => {
                displayHighscoresSecure();
            }, 100);
        });
    }
}

// Reset functions
export function resetLocalHighscore() {
    localStorage.removeItem('dungeonHighScore');
    gameState.highScore = 0;
    console.log("🔄 Local highscore reset!");
    
    const highscoreElements = document.querySelectorAll('#highscoreValue');
    highscoreElements.forEach(el => el.textContent = '0');
    
    return true;
}

export async function resetGlobalHighscores(confirm = false) {
    if (!confirm) {
        console.warn("⚠️ Use resetGlobalHighscores(true) to confirm deletion of ALL global highscores!");
        return false;
    }
    
    try {
        const response = await fetch(HIGHSCORE_API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scores: [] })
        });
        
        if (response.ok) {
            globalHighscores = [];
            displayHighscoresSecure();
            console.log("🔄 Global highscores reset successfully!");
            return true;
        } else {
            console.error("❌ Failed to reset global highscores:", response.status);
            return false;
        }
    } catch (error) {
        console.error("❌ Error resetting global highscores:", error);
        return false;
    }
}

export async function resetAllHighscores(confirm = false) {
    if (!confirm) {
        console.warn("⚠️ Use resetAllHighscores(true) to confirm deletion of ALL highscores!");
        return false;
    }
    
    resetLocalHighscore();
    const globalReset = await resetGlobalHighscores(true);
    
    if (globalReset) {
        console.log("🔄 ALL highscores reset successfully!");
        return true;
    } else {
        console.log("🔄 Local highscore reset, but global reset failed.");
        return false;
    }
}

export async function addTestHighscores() {
    const testScores = [
        { name: "TestPlayer1", score: 50000, date: new Date().toISOString() },
        { name: "TestPlayer2", score: 45000, date: new Date().toISOString() },
        { name: "TestPlayer3", score: 40000, date: new Date().toISOString() },
        { name: "TestPlayer4", score: 35000, date: new Date().toISOString() },
        { name: "TestPlayer5", score: 30000, date: new Date().toISOString() }
    ];
    
    globalHighscores = testScores;
    
    try {
        const response = await fetch(HIGHSCORE_API.URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ scores: testScores })
        });
        
        if (response.ok) {
            displayHighscoresSecure();
            console.log("🧪 Test highscores added!");
            return true;
        }
    } catch (error) {
        console.error("❌ Failed to add test highscores:", error);
    }
    
    return false;
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

// Make enhanced functions available globally
window.saveGlobalHighscoreSecure = saveGlobalHighscoreSecure;
window.displayHighscoresSecure = displayHighscoresSecure;
window.checkForTop10ScoreSecure = checkForTop10ScoreSecure;
window.sessionTracker = sessionTracker;
window.validator = validator;
window.resetLocalHighscore = resetLocalHighscore;
window.resetGlobalHighscores = resetGlobalHighscores;
window.resetAllHighscores = resetAllHighscores;
window.addTestHighscores = addTestHighscores;

// Debug functions for banned words
window.getBannedWords = () => validator.getBannedWords();
window.addBannedWord = (word) => validator.addBannedWord(word);
window.removeBannedWord = (word) => validator.removeBannedWord(word);

// Initialize immediately when module loads
if (!window.loadAchievements) {
    window.loadAchievements = loadAchievements;
    window.loadGlobalHighscores = loadGlobalHighscores;
}

console.log(`
🚫 BANNED WORDS SYSTEM LOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 DEBUG COMMANDS:
getBannedWords()           - Show current banned words
addBannedWord("word")      - Add word to banned list
removeBannedWord("word")   - Remove word from banned list

📁 FILE LOCATIONS TRIED:
- assets/banned-words.txt
- data/banned-words.txt  
- config/banned-words.txt
- banned-words.txt

🔒 SECURITY FEATURES:
- File-based banned words loading
- Async name validation
- Score legitimacy checks
- Rate limiting protection
- Session tracking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);