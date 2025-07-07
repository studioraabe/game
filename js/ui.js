// ui.js - Enhanced UI with Roguelike Features

import { GameState, DUNGEON_THEME } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, resumeTransition } from './core/gameState.js';
import { soundManager, checkAchievements, saveHighScore, checkForTop10Score, displayHighscores } from './systems.js';
import { activeDropBuffs, activeWeaponDrops } from './systems.js';
import { getControllerInfo } from './core/input.js';
import { 
    updateEnhancedComboDisplay, 
    updateEnhancedBuffDisplay,
    initEnhancedContainers
} from './ui-enhancements.js';

// Volume Control Variables
let volumeOverlayVisible = false;
let masterMuted = false;
let volumes = {
    music: 70,
    sfx: 85
};
let savedVolumes = { ...volumes };

// Options Menu State
let currentOptionsTab = 'sound'; // 'sound' or 'controls'

// Enhanced Countdown System
let countdownActive = false;
let countdownType = 'resume'; // 'resume', 'start', 'restart'

// Sound Overlay Pause System
let gameWasPausedByVolumeOverlay = false;

// Screen Management
export function hideAllScreens() {
    const screens = ['startScreen', 'levelComplete', 'gameOver', 'pauseScreen', 'newHighScore', 'infoOverlay'];
    screens.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
}

export function showScreen(screenId) {
    hideAllScreens();
    const element = document.getElementById(screenId);
    if (element) element.style.display = 'block';
}

// Enhanced Countdown Function
function showUniversalCountdown(type = 'resume', callback = null) {
    if (countdownActive) return;
    
    countdownActive = true;
    countdownType = type;
    
    let countdownOverlay = document.getElementById('universalCountdown');
    if (!countdownOverlay) {
        countdownOverlay = document.createElement('div');
        countdownOverlay.id = 'universalCountdown';
        countdownOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: #00ff88;
            font-size: 72px;
            font-family: 'Rajdhani', sans-serif;
            font-weight: bold;
            padding: 40px 60px;
            border-radius: 20px;
            border: 3px solid #00ff88;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.5);
            z-index: 2000;
            text-align: center;
            pointer-events: none;
            backdrop-filter: blur(10px);
            animation: countdownPulse 0.5s ease-in-out;
        `;
        document.getElementById('gameContainer').appendChild(countdownOverlay);
    }
    
    if (!document.querySelector('#countdownStyles')) {
        const style = document.createElement('style');
        style.id = 'countdownStyles';
        style.textContent = `
            @keyframes countdownPulse {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
            
            @keyframes countdownNumber {
                0% { transform: scale(1.3); opacity: 0; }
                50% { transform: scale(1.1); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            @keyframes countdownGo {
                0% { transform: scale(1); color: #00ff88; }
                50% { transform: scale(1.2); color: #00ff88; }
                100% { transform: scale(1.1); color: #00ff88; }
            }
        `;
        document.head.appendChild(style);
    }
    
    let countdown = 3;
    countdownOverlay.style.display = 'block';
    
    const messages = {
        'start': 'READY?',
        'restart': 'RESTARTING...',
        'resume': 'RESUMING...'
    };
    
    countdownOverlay.innerHTML = `
        <div style="font-size: 32px; margin-bottom: 10px; color: #ffffff;">
            ${messages[type]}
        </div>
        <div style="animation: countdownNumber 0.6s ease-out;">${countdown}</div>
    `;
    
    soundManager.pickup();
    
    const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
            countdownOverlay.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 10px; color: #ffffff;">
                    ${messages[type]}
                </div>
                <div style="animation: countdownNumber 0.6s ease-out;">${countdown}</div>
            `;
            soundManager.pickup();
        } else {
            countdownOverlay.innerHTML = `
                <div style="font-size: 48px; animation: countdownGo 0.8s ease-out;">
                    GO!
                </div>
            `;
            soundManager.powerUp();
            
            setTimeout(() => {
                countdownOverlay.style.display = 'none';
                countdownActive = false;
                
                if (callback && typeof callback === 'function') {
                    callback();
                }
                
                if (resumeTransition.active) {
                    resumeTransition.active = false;
                    const canvas = document.getElementById('gameCanvas');
                    if (canvas) canvas.style.opacity = 1;
                }
            }, 800);
            
            clearInterval(countdownInterval);
        }
    }, 800);
}

// Enhanced HUD Updates for Roguelike
export function updateUI() {
    document.getElementById('score').textContent = gameState.score.toLocaleString();
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('bullets').textContent = gameState.isBerserker ? '∞' : gameState.bullets;
    document.getElementById('highscoreValue').textContent = gameState.highScore;
    
    updateHealthBar();
    updateStatsDisplay();
    
    if (gameState.currentState === GameState.LEVEL_COMPLETE) {
        updateBuffButtons();
    }
}

// Enhanced Health Bar for HP System
export function updateHealthBar() {
    const healthContainer = document.getElementById('healthContainer');
    if (!healthContainer) return;
    
    const healthPercent = (gameState.currentHealth / gameState.maxHealth) * 100;
    const isLowHealth = healthPercent < 25;
    const isCriticalHealth = healthPercent < 10;
    
    // Apply visual states
    healthContainer.className = 'health-bar-container';
    if (isCriticalHealth) {
        healthContainer.classList.add('critical-health');
    } else if (isLowHealth) {
        healthContainer.classList.add('low-health');
    }
    
    if (gameState.shieldCharges > 0) {
        healthContainer.classList.add('shield-active');
    }
    
    // Create Dead Cells style health bar
    healthContainer.innerHTML = `
        <div class="health-bar-wrapper">
            <div class="health-bar-background"></div>
            <div class="health-bar-fill" style="width: ${healthPercent}%"></div>
            <div class="health-bar-text">
                ${gameState.currentHealth} / ${gameState.maxHealth}
                ${gameState.shieldCharges > 0 ? ` +${gameState.shieldCharges}🛡️` : ''}
            </div>
        </div>
    `;
}

// New Stats Display
export function updateStatsDisplay() {
    let statsElement = document.getElementById('statsDisplay');
    if (!statsElement) {
        statsElement = document.createElement('div');
        statsElement.id = 'statsDisplay';
        statsElement.className = 'stats-display';
        document.getElementById('gameContainer').appendChild(statsElement);
    }
    
    const stats = gameState.stats;
    const visibleStats = [];
    
    if (stats.damageBonus > 0) {
        visibleStats.push(`⚔️ +${Math.round(stats.damageBonus * 100)}% DMG`);
    }
    if (stats.critChance > 0) {
        visibleStats.push(`💥 ${Math.round(stats.critChance * 100)}% CRIT`);
    }
    if (stats.attackSpeed > 1) {
        visibleStats.push(`⚡ ${stats.attackSpeed.toFixed(1)}x SPEED`);
    }
    if (stats.lifeSteal > 0) {
        visibleStats.push(`🩸 ${Math.round(stats.lifeSteal * 100)}% STEAL`);
    }
    if (stats.moveSpeed > 1) {
        visibleStats.push(`🏃 +${Math.round((stats.moveSpeed - 1) * 100)}% MOVE`);
    }
    if (stats.healthRegen > 0) {
        visibleStats.push(`💚 ${stats.healthRegen.toFixed(1)} HP/s`);
    }
    if (stats.bulletRegen > 0) {
        visibleStats.push(`🔫 ${stats.bulletRegen.toFixed(1)} B/s`);
    }
    
    if (visibleStats.length > 0) {
        statsElement.innerHTML = visibleStats.slice(0, 4).join('<br>');
        statsElement.style.display = 'block';
    } else {
        statsElement.style.display = 'none';
    }
}

export function updateEnhancedDisplays() {
    const buffContainer = document.getElementById('enhancedBuffs');
    const comboDisplay = document.getElementById('comboDisplay');
    
    if (!buffContainer || !comboDisplay) {
        console.warn('Enhanced display containers missing, reinitializing...');
        initEnhancedContainers();
    }
    
    updateEnhancedBuffDisplay();
    updateEnhancedComboDisplay();
}

export function updatePauseScreen() {
    document.getElementById('pauseScore').textContent = gameState.score;
    document.getElementById('pauseLevel').textContent = gameState.level;
    
    // Update for new HP system
    const pauseLivesElement = document.getElementById('pauseLives');
    if (pauseLivesElement) {
        pauseLivesElement.textContent = `${gameState.currentHealth}/${gameState.maxHealth} HP`;
    }
}

// Enhanced Buff Selection for Roguelike
export function updateBuffButtons() {
    const buffButtonsContainer = document.getElementById('buffButtons');
    if (!buffButtonsContainer) return;
    
    buffButtonsContainer.innerHTML = '';
    
    gameState.availableBuffs.forEach(buff => {
        const button = document.createElement('div');
        button.className = 'buff-card';
        button.onclick = () => chooseBuff(buff.id);
        
        const title = document.createElement('div');
        title.className = 'buff-title';
        title.textContent = buff.title;
        
        const desc = document.createElement('div');
        desc.className = 'buff-desc';
        desc.textContent = buff.desc;
        
        // Add stat changes display
        const stats = document.createElement('div');
        stats.className = 'buff-stats';
        stats.textContent = buff.statChanges || '';
        
        button.appendChild(title);
        button.appendChild(desc);
        if (buff.statChanges) {
            button.appendChild(stats);
        }
        buffButtonsContainer.appendChild(button);
    });
}

export function updateHighScore() {
    if (gameState.score > gameState.highScore) {
        gameState.highScore = gameState.score;
        saveHighScore(gameState.highScore);
        document.getElementById('newHighScore').style.display = 'block';
    }
    document.getElementById('highscoreValue').textContent = gameState.highScore;
}

// Menu Handling
export function startGame() {
    soundManager.init();
    if (soundManager.audioContext) {
        soundManager.audioContext.resume();
    }
    
    hideAllScreens();
    
    showUniversalCountdown('start', () => {
        gameState.currentState = GameState.PLAYING;
        gameState.gameRunning = true;
        resetGame();
        
        soundManager.startBackgroundMusic();
        initEnhancedContainers();
        updateUI();
        startGameLoop();
        
        setTimeout(() => {
            updateEnhancedDisplays();
        }, 100);
    });
}

export function restartGame() {
    gameState.gameRunning = false;
    hideAllScreens();
    
    showUniversalCountdown('restart', () => {
        gameState.currentState = GameState.PLAYING;
        gameState.gameRunning = true;
        resetGame();
        
        soundManager.startBackgroundMusic();
        initEnhancedContainers();
        updateUI();
        
        setTimeout(() => {
            updateEnhancedDisplays();
        }, 100);
    });
}

export function pauseGame() {
    if (gameState.currentState === GameState.PLAYING) {
        gameState.currentState = GameState.PAUSED;
        gameState.gameRunning = false;
        
        soundManager.pauseBackgroundMusic();
        
        updatePauseScreen();
        showScreen('pauseScreen');
    }
}

export function resumeGame() {
    if (gameState.currentState === GameState.PAUSED) {
        hideAllScreens();
        
        showUniversalCountdown('resume', () => {
            gameState.currentState = GameState.PLAYING;
            gameState.gameRunning = true;
            
            soundManager.resumeBackgroundMusic();
        });
    }
}

export function gameOver() {
    gameState.currentState = GameState.GAME_OVER;
    gameState.gameRunning = false;
    
    soundManager.stopBackgroundMusic();
    
    updateHighScore();
    soundManager.death();
    
    displayHighscores();
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('levelsCompleted').textContent = gameState.levelsCompleted;
    
    checkForTop10Score(gameState.score);
    
    showScreen('gameOver');
}

// Enhanced Buff Selection with Stats
export function chooseBuff(buffType) {
    const stats = gameState.stats;
    
    switch(buffType) {
        case 'undeadResilience':
            gameState.activeBuffs.undeadResilience = 1;
            break;
        case 'shadowLeap':
            gameState.activeBuffs.shadowLeap = 1;
            break;
        case 'chainLightning':
            gameState.activeBuffs.chainLightning = 1;
            break;
        
        // New stat-based buffs
        case 'vampiricStrikes':
            stats.lifeSteal += 0.02; // 2% lifesteal
            gameState.activeBuffs.vampiricStrikes = 1;
            break;
        case 'bulletStorm':
            stats.bulletRegen += 0.5; // 1 bullet every 2 seconds
            gameState.activeBuffs.bulletStorm = 1;
            break;
        case 'berserkerRage':
            stats.damageBonus += 0.25; // +25% damage
            stats.attackSpeed += 0.15; // +15% attack speed
            gameState.activeBuffs.berserkerRage = 1;
            break;
        case 'survivalInstinct':
            stats.healthRegen += 0.33; // 1 HP every 3 seconds
            gameState.activeBuffs.survivalInstinct = 1;
            break;
        case 'criticalFocus':
            stats.critChance += 0.20; // +20% crit chance
            stats.critDamage += 1.0; // 2x crit damage (was 1x base)
            gameState.activeBuffs.criticalFocus = 1;
            break;
        case 'swiftDeath':
            stats.moveSpeed += 0.20; // +20% move speed
            stats.projectileSpeed += 0.20; // +20% projectile speed
            gameState.activeBuffs.swiftDeath = 1;
            break;
    }
    
    gameState.availableBuffs = gameState.availableBuffs.filter(buff => buff.id !== buffType);
    
    // Level progression
    gameState.level++;
    gameState.levelProgress = 1;
    window.bulletBoxesFound = 0;
    gameState.damageThisLevel = 0;
    gameState.gameSpeed += 0.6;
    gameState.bullets += 12;
    
    // Increase player stats with level
    gameState.maxHealth += 25; // +25 HP per level
    gameState.currentHealth = gameState.maxHealth; // Full heal on level up
    gameState.baseDamage += 5; // +5 base damage per level
    
    gameState.postBuffInvulnerability = 120;
    
    hideAllScreens();
    showUniversalCountdown('resume', () => {
        gameState.currentState = GameState.PLAYING;
        gameState.gameRunning = true;
        updateUI();
    });
}

// Theme Application
export function applyTheme() {
    const container = document.getElementById('gameContainer');
    container.className = 'dungeon-theme';
    
    const updates = [
        ['gameTitle', DUNGEON_THEME.title],
        ['startButton', DUNGEON_THEME.startButton],
        ['scoreLabel', DUNGEON_THEME.labels.score],
        ['levelLabel', DUNGEON_THEME.labels.level],
        ['bulletsLabel', DUNGEON_THEME.labels.bullets],
        ['livesLabel', 'Health'], // Changed from Lives to Health
        ['highscoreLabel', DUNGEON_THEME.labels.highScore],
        ['scoreStatLabel', DUNGEON_THEME.labels.score],
        ['enemiesStatLabel', DUNGEON_THEME.labels.enemies],
        ['gameOverTitle', DUNGEON_THEME.labels.gameOver],
        ['finalScoreLabel', DUNGEON_THEME.labels.finalScore],
        ['pauseScoreLabel', DUNGEON_THEME.labels.score],
        ['pauseLevelLabel', DUNGEON_THEME.labels.level],
        ['pauseLivesLabel', 'Health'], // Changed from Lives to Health
        ['buffChoiceTitle', '🔮 Choose Your Dark Power:']
    ];

    updates.forEach(([id, text]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    });

    gameState.activeBuffs = {};
    gameState.availableBuffs = [...DUNGEON_THEME.buffs];
    updateUI();
}

// Volume Control Functions (keeping existing functionality)
function toggleVolumeOverlay() {
    const overlay = document.getElementById('volumeOverlay');
    const settingsButton = document.getElementById('settingsButton');
    
    volumeOverlayVisible = !volumeOverlayVisible;
    
    if (volumeOverlayVisible) {
        overlay.classList.add('show');
        settingsButton.classList.add('active');
        
        updateOptionsContent();
        
        setTimeout(() => {
            refreshVolumeDisplay();
        }, 50);
        
        if (gameState.currentState === GameState.PLAYING && gameState.gameRunning) {
            gameWasPausedByVolumeOverlay = true;
            gameState.gameRunning = false;
            soundManager.pauseBackgroundMusic();
        }
        
    } else {
        overlay.classList.remove('show');
        settingsButton.classList.remove('active');
        
        if (gameWasPausedByVolumeOverlay && gameState.currentState === GameState.PLAYING) {
            startSmoothResume();
            gameWasPausedByVolumeOverlay = false;
        }
    }
}

function updateOptionsContent() {
    const overlay = document.getElementById('volumeOverlay');
    if (!overlay) return;
    
    const controllerInfo = getControllerInfo();
    
    overlay.innerHTML = `
        <div class="options-header">
            <h3>Game Options</h3>
            <div class="options-tabs">
                <button class="options-tab ${currentOptionsTab === 'sound' ? 'active' : ''}" 
                        onclick="switchOptionsTab('sound', event)">Sound</button>
                <button class="options-tab ${currentOptionsTab === 'controls' ? 'active' : ''}" 
                        onclick="switchOptionsTab('controls', event)">Controls</button>
            </div>
        </div>
        
        <div class="options-content">
            ${currentOptionsTab === 'sound' ? renderSoundOptions() : renderControlsOptions(controllerInfo)}
        </div>
    `;
}

function renderSoundOptions() {
    return `
        <div class="options-section">
            <div class="volume-control" id="musicControl">
                <div class="volume-label">
                    <div class="volume-label-text">
                        <span class="volume-label-icon">🎵</span>
                        <span>Music</span>
                    </div>
                    <span class="volume-value" id="musicValue">${volumes.music}%</span>
                </div>
                <div class="volume-slider-container">
                    <div class="volume-slider-fill" id="musicFill" style="width: ${volumes.music}%"></div>
                    <input type="range" class="volume-slider" id="musicSlider" 
                           min="0" max="100" value="${volumes.music}" 
                           oninput="updateVolume('music', this.value, event)">
                </div>
            </div>
            
            <div class="volume-control" id="sfxControl">
                <div class="volume-label">
                    <div class="volume-label-text">
                        <span class="volume-label-icon">🔫</span>
                        <span>Sound Effects</span>
                    </div>
                    <span class="volume-value" id="sfxValue">${volumes.sfx}%</span>
                </div>
                <div class="volume-slider-container">
                    <div class="volume-slider-fill" id="sfxFill" style="width: ${volumes.sfx}%"></div>
                    <input type="range" class="volume-slider" id="sfxSlider" 
                           min="0" max="100" value="${volumes.sfx}" 
                           oninput="updateVolume('sfx', this.value, event)">
                </div>
            </div>
            
            <div class="master-controls">
                <button class="master-mute-btn ${masterMuted ? 'unmute' : ''}" 
                        id="masterMuteBtn" onclick="toggleMasterMute(event)">
                    ${masterMuted ? 'Unmute All' : 'Mute All'}
                </button>
            </div>
        </div>
    `;
}

function renderControlsOptions(controllerInfo) {
    return `
        <div class="options-section">
            <div class="controller-status">
                <div class="status-item">
                    <span class="status-label">🎮 Controller</span>
                    <span class="status-value ${controllerInfo.connected ? 'connected' : 'disconnected'}">
                        ${controllerInfo.connected ? 'Connected' : 'Not Connected'}
                    </span>
                </div>
                ${controllerInfo.connected ? `
                    <div class="controller-info">
                        <div class="controller-name">${controllerInfo.name}</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="controls-help">
                <h4>Controls</h4>
                <div class="control-mapping">
                    <div class="control-item">
                        <span>↑ / W</span>
                        <span>Jump (hold for higher)</span>
                    </div>
                    <div class="control-item">
                        <span>← → / A D</span>
                        <span>Move left/right</span>
                    </div>
                    <div class="control-item">
                        <span>SPACE / S</span>
                        <span>Shoot</span>
                    </div>
                    <div class="control-item">
                        <span>ESC</span>
                        <span>Pause</span>
                    </div>
                    <div class="control-item">
                        <span>TAB</span>
                        <span>Show detailed stats</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function startSmoothResume() {
    showUniversalCountdown('resume', () => {
        gameState.gameRunning = true;
        soundManager.resumeBackgroundMusic();
    });
}

function switchOptionsTab(tab, event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    currentOptionsTab = tab;
    updateOptionsContent();
}

function updateVolume(type, value, event) {
    if (event) {
        event.stopPropagation();
    }
    
    volumes[type] = parseInt(value);
    
    const valueElement = document.getElementById(`${type}Value`);
    const fillElement = document.getElementById(`${type}Fill`);
    const controlElement = document.getElementById(`${type}Control`);
    
    if (valueElement) valueElement.textContent = `${value}%`;
    if (fillElement) fillElement.style.width = `${value}%`;
    
    if (controlElement) {
        if (value == 0) {
            controlElement.classList.add('muted');
            controlElement.classList.remove('active');
        } else {
            controlElement.classList.remove('muted');
            controlElement.classList.add('active');
            setTimeout(() => controlElement.classList.remove('active'), 500);
        }
    }
    
    updateMasterMuteState();
    updateMuteIcon();
    
    if (type === 'music') {
        soundManager.setMusicVolume(value / 100);
    } else if (type === 'sfx') {
        soundManager.setSfxVolume(value / 100);
    }
}

function toggleMasterMute(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const btn = document.getElementById('masterMuteBtn');
    const musicControl = document.getElementById('musicControl');
    const sfxControl = document.getElementById('sfxControl');
    const musicSlider = document.getElementById('musicSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    const musicFill = document.getElementById('musicFill');
    const sfxFill = document.getElementById('sfxFill');
    const musicValue = document.getElementById('musicValue');
    const sfxValue = document.getElementById('sfxValue');
    
    masterMuted = !masterMuted;
    
    if (masterMuted) {
        savedVolumes = { ...volumes };
        
        volumes.music = 0;
        volumes.sfx = 0;
        
        if (musicSlider) musicSlider.value = 0;
        if (sfxSlider) sfxSlider.value = 0;
        
        if (musicFill) musicFill.style.width = '0%';
        if (sfxFill) sfxFill.style.width = '0%';
        
        if (musicValue) musicValue.textContent = '0%';
        if (sfxValue) sfxValue.textContent = '0%';
        
        if (musicControl) musicControl.classList.add('muted');
        if (sfxControl) sfxControl.classList.add('muted');
        
        if (btn) {
            btn.textContent = 'Unmute All';
            btn.classList.add('unmute');
        }
        
        soundManager.setMusicVolume(0);
        soundManager.setSfxVolume(0);
        
    } else {
        volumes.music = savedVolumes.music;
        volumes.sfx = savedVolumes.sfx;
        
        if (musicSlider) musicSlider.value = savedVolumes.music;
        if (sfxSlider) sfxSlider.value = savedVolumes.sfx;
        
        if (musicFill) musicFill.style.width = `${savedVolumes.music}%`;
        if (sfxFill) sfxFill.style.width = `${savedVolumes.sfx}%`;
        
        if (musicValue) musicValue.textContent = `${savedVolumes.music}%`;
        if (sfxValue) sfxValue.textContent = `${savedVolumes.sfx}%`;
        
        if (musicControl) musicControl.classList.remove('muted');
        if (sfxControl) sfxControl.classList.remove('muted');
        
        if (btn) {
            btn.textContent = 'Mute All';
            btn.classList.remove('unmute');
        }
        
        soundManager.setMusicVolume(savedVolumes.music / 100);
        soundManager.setSfxVolume(savedVolumes.sfx / 100);
    }
    
    updateMuteIcon();
}

function updateMasterMuteState() {
    const allMuted = volumes.music === 0 && volumes.sfx === 0;
    const btn = document.getElementById('masterMuteBtn');
    
    if (allMuted && !masterMuted) {
        masterMuted = true;
        if (btn) {
            btn.textContent = 'Unmute All';
            btn.classList.add('unmute');
        }
    } else if (!allMuted && masterMuted) {
        masterMuted = false;
        if (btn) {
            btn.textContent = 'Mute All';
            btn.classList.remove('unmute');
        }
    }
}

function updateMuteIcon() {
    const icon = document.getElementById('settingsIcon');
    const totalVolume = volumes.music + volumes.sfx;
    
    if (icon) {
        if (totalVolume === 0) {
            icon.textContent = '🔇';
        } else if (totalVolume < 100) {
            icon.textContent = '🔉';
        } else {
            icon.textContent = '⚙️';
        }
    }
}

function refreshVolumeDisplay() {
    const musicSlider = document.getElementById('musicSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    const musicFill = document.getElementById('musicFill');
    const sfxFill = document.getElementById('sfxFill');
    const musicValue = document.getElementById('musicValue');
    const sfxValue = document.getElementById('sfxValue');
    const btn = document.getElementById('masterMuteBtn');
    
    if (musicSlider) musicSlider.value = volumes.music;
    if (sfxSlider) sfxSlider.value = volumes.sfx;
    if (musicFill) musicFill.style.width = `${volumes.music}%`;
    if (sfxFill) sfxFill.style.width = `${volumes.sfx}%`;
    if (musicValue) musicValue.textContent = `${volumes.music}%`;
    if (sfxValue) sfxValue.textContent = `${volumes.sfx}%`;
    
    if (btn) {
        btn.textContent = masterMuted ? 'Unmute All' : 'Mute All';
        if (masterMuted) {
            btn.classList.add('unmute');
        } else {
            btn.classList.remove('unmute');
        }
    }
    
    const musicControl = document.getElementById('musicControl');
    const sfxControl = document.getElementById('sfxControl');
    
    if (musicControl) {
        if (volumes.music === 0) {
            musicControl.classList.add('muted');
        } else {
            musicControl.classList.remove('muted');
        }
    }
    
    if (sfxControl) {
        if (volumes.sfx === 0) {
            sfxControl.classList.add('muted');
        } else {
            sfxControl.classList.remove('muted');
        }
    }
}

// Event Listeners
document.addEventListener('click', (e) => {
    const overlay = document.getElementById('volumeOverlay');
    const settingsButton = document.getElementById('settingsButton');
    
    if (volumeOverlayVisible && 
        overlay && settingsButton &&
        !overlay.contains(e.target) && 
        !settingsButton.contains(e.target)) {
        toggleVolumeOverlay();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && volumeOverlayVisible) {
        toggleVolumeOverlay();
    }
});

// Global Functions
window.startGame = startGame;
window.pauseGame = pauseGame;
window.resumeGame = resumeGame;
window.restartGame = restartGame;
window.chooseBuff = chooseBuff;
window.gameOver = gameOver;
window.showScreen = showScreen;
window.hideAllScreens = hideAllScreens;
window.updateUI = updateUI;
window.updateEnhancedDisplays = updateEnhancedDisplays;
window.updateStatsDisplay = updateStatsDisplay;

window.toggleVolumeOverlay = toggleVolumeOverlay;
window.updateVolume = updateVolume;
window.toggleMasterMute = toggleMasterMute;
window.switchOptionsTab = switchOptionsTab;
window.refreshVolumeDisplay = refreshVolumeDisplay;

window.toggleInfoOverlay = function() {
    const infoOverlay = document.getElementById('infoOverlay');
    if (!infoOverlay) return;
    
    if (infoOverlay.style.display === 'block') {
        infoOverlay.style.display = 'none';
        if (gameState.currentState === GameState.PAUSED && gameState.gameRunning === false) {
            resumeGame();
        }
    } else {
        if (gameState.currentState === GameState.PLAYING && gameState.gameRunning === true) {
            gameState.currentState = GameState.PAUSED;
            gameState.gameRunning = false;
        }
        infoOverlay.style.display = 'block';
    }
};