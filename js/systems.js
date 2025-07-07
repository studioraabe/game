// systems.js - Enhanced Systems with Roguelike Scaling

import { ACHIEVEMENTS, DROP_CONFIG, DropType, DROP_INFO, HIGHSCORE_API, WEAPON_DROPS } from './core/constants.js';
import { gameState } from './core/gameState.js';
import { createScorePopup, drops } from './entities.js';
import { showAchievementPopup } from './ui-enhancements.js';

// Achievement System
export function checkAchievements() {
    // Adjusted for new HP system
    if (!ACHIEVEMENTS.firstBlood.unlocked && gameState.bossesKilled >= 1) {
        unlockAchievement('firstBlood');
    }
    
    // Untouchable: Complete level without taking damage
    if (!ACHIEVEMENTS.untouchable.unlocked && 
        gameState.levelProgress >= 100 && 
        gameState.damageThisLevel === 0 && 
        gameState.levelsCompleted >= 1) {
        unlockAchievement('untouchable');
    }
    
    // Sharpshooter: 100 hits in a row
    if (!ACHIEVEMENTS.sharpshooter.unlocked && gameState.consecutiveHits >= 100) {
        unlockAchievement('sharpshooter');
    }
    
    // Speed Demon: 10000 points in 30s
    if (!ACHIEVEMENTS.speedDemon.unlocked && 
        gameState.scoreIn30Seconds >= 10000 && 
        (Date.now() - gameState.lastScoreTime) <= 30000) {
        unlockAchievement('speedDemon');
    }
}

export function unlockAchievement(id) {
    ACHIEVEMENTS[id].unlocked = true;
    showAchievementPopup(ACHIEVEMENTS[id]);
    soundManager.powerUp();
    
    switch(id) {
        case 'firstBlood':
            // 25% better drop rates
            gameState.stats.dropBonus += 0.25;
            break;
        case 'untouchable':
            gameState.stats.damageBonus += 0.15; // +15% damage permanently
            break;
        case 'sharpshooter':
            gameState.stats.critChance += 0.10; // +10% crit chance
            break;
        case 'speedDemon':
            gameState.stats.moveSpeed += 0.20; // +20% move speed
            break;
    }
    
    localStorage.setItem(`achievement_${id}`, 'true');
}

export function loadAchievements() {
    Object.keys(ACHIEVEMENTS).forEach(id => {
        if (localStorage.getItem(`achievement_${id}`) === 'true') {
            ACHIEVEMENTS[id].unlocked = true;
            
            // Apply achievement bonuses
            switch(id) {
                case 'firstBlood':
                    gameState.stats.dropBonus += 0.25;
                    break;
                case 'untouchable':
                    gameState.stats.damageBonus += 0.15;
                    break;
                case 'sharpshooter':
                    gameState.stats.critChance += 0.10;
                    break;
                case 'speedDemon':
                    gameState.stats.moveSpeed += 0.20;
                    break;
            }
        }
    });
}

// Make functions available globally
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.loadAchievements = loadAchievements;
window.loadGlobalHighscores = loadGlobalHighscores;

// Drop System - Enhanced for Roguelike
export const activeDropBuffs = {};
export const activeWeaponDrops = {};
window.activeDropBuffs = activeDropBuffs;
window.activeWeaponDrops = activeWeaponDrops;

export function createDrop(x, y, type) {
    const dropInfo = DROP_INFO[type] || WEAPON_DROPS[type];
    if (!dropInfo) return;
    
    drops.push({
        x: x,
        y: y,
        type: type,
        width: 24,
        height: 24,
        velocityY: -3,
        rotation: 0,
        glowIntensity: 0.5,
        info: dropInfo,
        isWeapon: !!WEAPON_DROPS[type]
    });
    
    // Enhanced drop particles for weapons
    const particleCount = WEAPON_DROPS[type] ? 12 : 8;
    for (let i = 0; i < particleCount; i++) {
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
    const dropChanceBonus = gameState.stats.dropBonus;
    const comboBonus = Math.min(gameState.comboCount * 0.01, 0.2);
    
    let dropConfig;
    let weaponChance = 0;
    
    if (enemyType === 'alphaWolf') {
        dropConfig = DROP_CONFIG.boss;
        weaponChance = 0.30; // 30% weapon drop chance from bosses
        
        // Boss guaranteed drop at high combo
        if (gameState.comboCount >= 20) {
            const selectedDrop = selectDropFromItems(dropConfig.items);
            if (selectedDrop) {
                createDrop(x, y, selectedDrop.type);
            }
            
            // Separate weapon roll for bosses
            if (Math.random() < weaponChance) {
                const weaponDrop = selectWeaponDrop();
                if (weaponDrop) {
                    createDrop(x + 20, y, weaponDrop);
                }
            }
            return;
        }
    } else {
        dropConfig = DROP_CONFIG.common;
        weaponChance = 0.10; // 10% weapon drop chance from common enemies
    }
    
    const finalChance = dropConfig.chance + dropChanceBonus + comboBonus;
    
    // Regular drop roll
    if (Math.random() < finalChance) {
        const selectedDrop = selectDropFromItems(dropConfig.items);
        if (selectedDrop) {
            createDrop(x, y, selectedDrop.type);
        }
    }
    
    // Separate weapon drop roll
    if (Math.random() < weaponChance * (1 + dropChanceBonus)) {
        const weaponDrop = selectWeaponDrop();
        if (weaponDrop) {
            createDrop(x + 15, y, weaponDrop);
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

function selectWeaponDrop() {
    const weaponTypes = Object.keys(WEAPON_DROPS);
    const weights = weaponTypes.map(type => WEAPON_DROPS[type].rarity || 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let random = Math.random() * totalWeight;
    for (let i = 0; i < weaponTypes.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return weaponTypes[i];
        }
    }
    
    return weaponTypes[0];
}

export function collectDrop(drop) {
    soundManager.pickup();
    
    // Check buff limit für temporary buffs und weapons
    if ((drop.isWeapon || isTemporaryBuff(drop.type)) && !canPickupBuff()) {
        // Zeige "Inventory Full" Nachricht
        createScorePopup(drop.x, drop.y, 'BUFF LIMIT (5/5)!');
        soundManager.hit(); // Fehler-Sound
        return; // Buff nicht aufnehmen
    }
    
    // Handle weapon drops
    if (drop.isWeapon) {
        const weaponInfo = WEAPON_DROPS[drop.type];
        if (weaponInfo) {
            activeWeaponDrops[drop.type] = weaponInfo.duration;
            createScorePopup(drop.x, drop.y, weaponInfo.name + '!');
            
            // Clear conflicting weapon types
            Object.keys(activeWeaponDrops).forEach(weapon => {
                if (weapon !== drop.type && weaponInfo.conflicts && weaponInfo.conflicts.includes(weapon)) {
                    delete activeWeaponDrops[weapon];
                }
            });
            
            soundManager.powerUp();
            return;
        }
    }
    
    // Handle regular drops
    const dropConfig = [...DROP_CONFIG.boss.items, ...DROP_CONFIG.common.items].find(item => item.type === drop.type);
    
    switch(drop.type) {
        case DropType.EXTRA_LIFE:
            // Health ist immer erlaubt (kein Buff-Limit)
            const healAmount = Math.floor(gameState.maxHealth * 0.5);
            gameState.currentHealth = Math.min(gameState.currentHealth + healAmount, gameState.maxHealth);
            createScorePopup(drop.x, drop.y, `+${healAmount} HP`);
            break;
            
        case DropType.MEGA_BULLETS:
            // Bullets sind immer erlaubt (kein Buff-Limit)
            gameState.bullets += 50;
            createScorePopup(drop.x, drop.y, '+50 Bolts');
            break;
            
        case DropType.SHIELD:
            // Shield ist immer erlaubt (kein Buff-Limit)
            if (gameState.shieldCharges < 5) {
                gameState.shieldCharges++;
                gameState.hasShield = true;
                createScorePopup(drop.x, drop.y, `Shield +1 (${gameState.shieldCharges}x)`);
            } else {
                gameState.score += 500 * gameState.scoreMultiplier;
                createScorePopup(drop.x, drop.y, '+500 Shield Bonus!');
            }
            break;
            
        // TEMPORARY BUFFS - unterliegen dem 5-Buff Limit
        case DropType.SPEED_BOOST:
            activeDropBuffs.speedBoost = dropConfig.duration;
            gameState.stats.moveSpeed += 0.5;
            createScorePopup(drop.x, drop.y, 'Speed Boost!');
            break;
            
        case DropType.JUMP_BOOST:
            activeDropBuffs.jumpBoost = Math.min((activeDropBuffs.jumpBoost || 0) + dropConfig.duration, 3600);
            createScorePopup(drop.x, drop.y, 'Jump Boost!');
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
            gameState.stats.attackSpeed += 1.0;
            gameState.stats.damageBonus += 0.5;
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

function isTemporaryBuff(dropType) {
    const temporaryBuffs = [
        DropType.SPEED_BOOST,
        DropType.JUMP_BOOST,
        DropType.SCORE_MULTIPLIER,
        DropType.MAGNET_MODE,
        DropType.BERSERKER_MODE,
        DropType.GHOST_WALK,
        DropType.TIME_SLOW
    ];
    return temporaryBuffs.includes(dropType);
}


export function getActiveBuffCount() {
    return Object.keys(activeDropBuffs).length + Object.keys(activeWeaponDrops).length;
}

export function canPickupBuff() {
    return getActiveBuffCount() < 5;
}




export function updateDropBuffs() {
    const now = Date.now();
    
    // Initialisiere Timestamps falls nicht vorhanden
    if (!window.buffUpdateTimestamps) {
        window.buffUpdateTimestamps = {};
    }
    
    // Update regular drop buffs
    Object.keys(activeDropBuffs).forEach(buffKey => {
        if (!window.buffUpdateTimestamps[buffKey]) {
            window.buffUpdateTimestamps[buffKey] = now;
        }
        
        const deltaMs = now - window.buffUpdateTimestamps[buffKey];
        const deltaFrames = deltaMs / 16.67; // Konvertiere zu 60fps frames
        
        activeDropBuffs[buffKey] -= deltaFrames;
        window.buffUpdateTimestamps[buffKey] = now;
        
        if (activeDropBuffs[buffKey] <= 0) {
            delete activeDropBuffs[buffKey];
            delete window.buffUpdateTimestamps[buffKey];
            
            // Buff-Effekte entfernen
            switch(buffKey) {
                case 'speedBoost':
                    gameState.stats.moveSpeed -= 0.5;
                    break;
                case 'scoreMultiplier': 
                    gameState.scoreMultiplier = 1; 
                    break;
                case 'magnetMode': 
                    gameState.magnetRange = 0; 
                    break;
                case 'berserkerMode': 
                    gameState.isBerserker = false;
                    gameState.stats.attackSpeed -= 1.0;
                    gameState.stats.damageBonus -= 0.5;
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
    
    // Update weapon drops
    Object.keys(activeWeaponDrops).forEach(weaponKey => {
        const timestampKey = `weapon_${weaponKey}`;
        
        if (!window.buffUpdateTimestamps[timestampKey]) {
            window.buffUpdateTimestamps[timestampKey] = now;
        }
        
        const deltaMs = now - window.buffUpdateTimestamps[timestampKey];
        const deltaFrames = deltaMs / 16.67;
        
        activeWeaponDrops[weaponKey] -= deltaFrames;
        window.buffUpdateTimestamps[timestampKey] = now;
        
        if (activeWeaponDrops[weaponKey] <= 0) {
            delete activeWeaponDrops[weaponKey];
            delete window.buffUpdateTimestamps[timestampKey];
        }
    });
}


// Regeneration System
let lastHealthRegen = 0;
let lastBulletRegen = 0;

export function updateRegeneration() {
    const now = Date.now();
    
    // Health regeneration
    if (gameState.stats.healthRegen > 0) {
        const healthRegenInterval = 3000 / gameState.stats.healthRegen; // Base 3 seconds
        if (now - lastHealthRegen >= healthRegenInterval) {
            const regenAmount = Math.max(1, Math.floor(gameState.maxHealth * 0.01)); // 1% of max HP
            if (gameState.currentHealth < gameState.maxHealth) {
                gameState.currentHealth = Math.min(gameState.currentHealth + regenAmount, gameState.maxHealth);
                createScorePopup(gameState.camera.x + 200, 100, `+${regenAmount} HP`);
            }
            lastHealthRegen = now;
        }
    }
    
    // Bullet regeneration
    if (gameState.stats.bulletRegen > 0) {
        const bulletRegenInterval = 2000 / gameState.stats.bulletRegen; // Base 2 seconds
        if (now - lastBulletRegen >= bulletRegenInterval) {
            gameState.bullets += 1;
            lastBulletRegen = now;
        }
    }
}

// Combat System Enhancements
export function calculateDamage(baseDamage, isCritical = false) {
    let damage = baseDamage * (1 + gameState.stats.damageBonus);
    
    if (isCritical) {
        damage *= gameState.stats.critDamage;
    }
    
    return Math.floor(damage);
}

export function rollCritical() {
    return Math.random() < gameState.stats.critChance;
}

export function applyLifesteal(damage, targetHealth) {
    if (gameState.stats.lifeSteal > 0) {
        const healAmount = Math.floor(damage * gameState.stats.lifeSteal);
        if (healAmount > 0 && gameState.currentHealth < gameState.maxHealth) {
            gameState.currentHealth = Math.min(gameState.currentHealth + healAmount, gameState.maxHealth);
            createScorePopup(gameState.camera.x + 250, 120, `+${healAmount} HP`);
        }
    }
}

// Damage player function for new HP system
export function damagePlayer(damageAmount, damageSource = 'enemy') {
    // Apply damage reduction or other modifiers here if needed
    const finalDamage = Math.max(1, damageAmount);
    
    gameState.currentHealth -= finalDamage;
    gameState.damageThisLevel += finalDamage;
    
    // Create damage number
    if (typeof window.createDamageNumber === 'function') {
        window.createDamageNumber(
            gameState.player?.x + 20 || gameState.camera.x + 200,
            gameState.player?.y || 200,
            finalDamage,
            false,
            '#FF4444'
        );
    }
    
    console.log(`🎯 Player took ${finalDamage} damage from ${damageSource}. HP: ${gameState.currentHealth}/${gameState.maxHealth}`);
    
    // Check for death
    if (gameState.currentHealth <= 0) {
        gameState.currentHealth = 0;
        return true; // Player died
    }
    
    return false; // Player survived
}

// Enhanced Sound Manager with new features
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
    criticalHit() {
        this.play(1200, 0.1, 'sine');
        this.play(800, 0.15, 'triangle');
    }
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
    weaponPickup() {
        this.play(1000, 0.2, 'sine');
        this.play(1400, 0.2, 'triangle');
        this.play(1800, 0.2, 'sawtooth');
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

// Keep all existing highscore functionality...
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
            displayHighscores();
        } else {
            console.error('Failed to save:', response.status);
        }
    } catch (error) {
        console.log('Could not save highscore:', error);
        displayHighscores();
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
                const isNewEntry = entry.isNew === true;
                const highlightClass = isNewEntry ? 'highscore-new' : '';
                const badge = isNewEntry ? ' <span class="new-badge">NEW!</span>' : '';
                
                return `
                    <div class="highscore-entry ${highlightClass}">
                        <span>${index + 1}. ${entry.name}${badge}</span>
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
                displayHighscores();
            }, 100);
        });
    }
}

export function loadHighScore() {
    return parseInt(localStorage.getItem('dungeonHighScore') || '0');
}

export function saveHighScore(score) {
    localStorage.setItem('dungeonHighScore', score.toString());
}

// Make enhanced functions available globally
window.updateRegeneration = updateRegeneration;
window.calculateDamage = calculateDamage;
window.rollCritical = rollCritical;
window.applyLifesteal = applyLifesteal;
window.damagePlayer = damagePlayer;

// Initialize immediately when module loads
if (!window.loadAchievements) {
    window.loadAchievements = loadAchievements;
    window.loadGlobalHighscores = loadGlobalHighscores;
}

console.log(`
🎮 ROGUELIKE SYSTEMS LOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️  HP-BASED COMBAT SYSTEM
🎯  DAMAGE SCALING BY LEVEL
💎  STAT-BASED PROGRESSION
🔫  WEAPON DROP SYSTEM
💚  HEALTH/BULLET REGENERATION
⭐  CRITICAL HIT SYSTEM
🩸  LIFESTEAL MECHANICS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);