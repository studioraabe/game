// ui.js - Enhanced UI with Controller Support and Tabbed Options Menu

import { GameState, DUNGEON_THEME } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, resumeTransition } from './core/gameState.js';
import { soundManager, checkAchievements, saveHighScore, checkForTop10Score, displayHighscores } from './systems.js';
import { activeDropBuffs } from './systems.js';
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

// HUD Updates
export function updateUI() {
    document.getElementById('score').textContent = gameState.score.toLocaleString();
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('bullets').textContent = gameState.isBerserker ? '∞' : gameState.bullets;
    document.getElementById('highscoreValue').textContent = gameState.highScore;
    
    updateHealthBar();
    
    if (gameState.currentState === GameState.LEVEL_COMPLETE) {
        updateBuffButtons();
    }
}

export function updateHealthBar() {
    const healthContainer = document.getElementById('healthContainer');
    if (!healthContainer) return;
    
    healthContainer.innerHTML = '';
    
    if (gameState.lives <= 1 && gameState.shieldCharges === 0) {
        healthContainer.classList.add('critical-health');
    } else {
        healthContainer.classList.remove('critical-health');
    }
    
    if (gameState.shieldCharges > 0) {
        healthContainer.classList.add('shield-active');
    } else {
        healthContainer.classList.remove('shield-active');
    }
    
    for (let i = 0; i < gameState.maxLives; i++) {
        const segment = document.createElement('div');
        segment.className = 'health-segment';
        
        if (i >= gameState.lives) {
            segment.classList.add('empty');
        } else if (gameState.lives <= 1 && gameState.shieldCharges === 0) {
            segment.classList.add('damage');
        } else if (gameState.shieldCharges > 0 && i < gameState.shieldCharges) {
            segment.classList.add('shielded');
        }
        
        healthContainer.appendChild(segment);
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

export function updateActiveBuffsDisplay() {
    // Handled by updateEnhancedBuffDisplay
}

export function updateComboDisplay() {
    // Handled by updateEnhancedComboDisplay
}

export function updatePauseScreen() {
    document.getElementById('pauseScore').textContent = gameState.score;
    document.getElementById('pauseLevel').textContent = gameState.level;
    document.getElementById('pauseLives').textContent = gameState.lives;
}

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
        
        button.appendChild(title);
        button.appendChild(desc);
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

export function chooseBuff(buffType) {
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
    }
    
    gameState.availableBuffs = gameState.availableBuffs.filter(buff => buff.id !== buffType);
    
    gameState.level++;
    gameState.levelProgress = 1;
    window.bulletBoxesFound = 0;
    gameState.damageThisLevel = 0;
    gameState.gameSpeed += 0.6;
    gameState.bullets += 12;
    
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
        ['livesLabel', DUNGEON_THEME.labels.lives],
        ['highscoreLabel', DUNGEON_THEME.labels.highScore],
        ['scoreStatLabel', DUNGEON_THEME.labels.score],
        ['enemiesStatLabel', DUNGEON_THEME.labels.enemies],
        ['gameOverTitle', DUNGEON_THEME.labels.gameOver],
        ['finalScoreLabel', DUNGEON_THEME.labels.finalScore],
        ['pauseScoreLabel', DUNGEON_THEME.labels.score],
        ['pauseLevelLabel', DUNGEON_THEME.labels.level],
        ['pauseLivesLabel', DUNGEON_THEME.labels.lives],
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

// ===== ENHANCED OPTIONS OVERLAY SYSTEM =====

function toggleVolumeOverlay() {
    const overlay = document.getElementById('volumeOverlay');
    const muteButton = document.getElementById('muteButton');
    
    volumeOverlayVisible = !volumeOverlayVisible;
    
    if (volumeOverlayVisible) {
        overlay.classList.add('show');
        muteButton.classList.add('active');
        
        // Update options content
        updateOptionsContent();
        
        if (gameState.currentState === GameState.PLAYING && gameState.gameRunning) {
            gameWasPausedByVolumeOverlay = true;
            gameState.gameRunning = false;
            soundManager.pauseBackgroundMusic();
            console.log("🔊 Options overlay opened - game paused");
        }
        
    } else {
        overlay.classList.remove('show');
        muteButton.classList.remove('active');
        
        if (gameWasPausedByVolumeOverlay && gameState.currentState === GameState.PLAYING) {
            startSmoothResume();
            gameWasPausedByVolumeOverlay = false;
            console.log("🔊 Options overlay closed - starting smooth resume");
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
            <!-- Music Volume -->
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
            
            <!-- Sound Effects Volume -->
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
            
            <!-- Master Controls -->
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
            <!-- Controller Status -->
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
                        <div class="controller-features">
                            Vibration: ${controllerInfo.vibrationSupported ? '✅' : '❌'}
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <!-- Input Mode Selection -->
            <div class="input-mode-selection">
                <div class="input-mode-label">Input Method</div>
                <div class="input-mode-buttons">
                    <button class="input-mode-btn ${controllerInfo.inputMode === 'keyboard' ? 'active' : ''}" 
                            onclick="switchInputMode('keyboard', event)">
                        ⌨️ Keyboard
                    </button>
                    <button class="input-mode-btn ${controllerInfo.inputMode === 'controller' ? 'active' : ''}" 
                            onclick="switchInputMode('controller', event)"
                            ${!controllerInfo.connected ? 'disabled' : ''}>
                        🎮 Controller
                    </button>
                </div>
            </div>
            
            <!-- Controller Settings (only when controller is active) -->
            ${controllerInfo.connected ? `
                <div class="controller-settings">
                    <!-- Deadzone Setting -->
                    <div class="setting-control">
                        <div class="setting-label">
                            <span>Stick Deadzone</span>
                            <span class="setting-value">${Math.round(controllerInfo.deadzone * 100)}%</span>
                        </div>
                        <div class="setting-slider-container">
                            <input type="range" class="setting-slider" 
                                   min="0" max="50" value="${controllerInfo.deadzone * 100}" 
                                   oninput="updateControllerDeadzone(this.value, event)">
                        </div>
                    </div>
                    
                    <!-- Trigger Threshold -->
                    <div class="setting-control">
                        <div class="setting-label">
                            <span>Trigger Sensitivity</span>
                            <span class="setting-value">${Math.round(controllerInfo.triggerThreshold * 100)}%</span>
                        </div>
                        <div class="setting-slider-container">
                            <input type="range" class="setting-slider" 
                                   min="5" max="50" value="${controllerInfo.triggerThreshold * 100}" 
                                   oninput="updateTriggerThreshold(this.value, event)">
                        </div>
                    </div>
                    
                    <!-- Vibration Test -->
                    ${controllerInfo.vibrationSupported ? `
                        <div class="setting-control">
                            <button class="test-btn" onclick="event.stopPropagation(); testControllerVibration()">
                                🎮 Test Vibration
                            </button>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
            
            <!-- Controls Help -->
            <div class="controls-help">
                <h4>${controllerInfo.inputMode === 'controller' ? 'Controller' : 'Keyboard'} Controls</h4>
                ${controllerInfo.inputMode === 'controller' ? `
                    <div class="control-mapping">
                        <div class="control-item">
                            <span>🎮 Left Stick</span>
                            <span>Move left/right</span>
                        </div>
                        <div class="control-item">
                            <span>🅰️ A Button (Xbox) / ❌ X (PlayStation)</span>
                            <span>Jump (hold for higher)</span>
                        </div>
                        <div class="control-item">
                            <span>🅱️ B Button / 🔴 Circle + Right Trigger</span>
                            <span>Shoot</span>
                        </div>
                        <div class="control-item">
                            <span>☰ Menu Button</span>
                            <span>Pause</span>
                        </div>
                    </div>
                ` : `
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
                    </div>
                `}
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

// ===== OPTIONS MANAGEMENT FUNCTIONS =====

function switchOptionsTab(tab, event) {
    // Prevent event bubbling to avoid closing the menu
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    currentOptionsTab = tab;
    updateOptionsContent();
}

function switchInputMode(mode, event) {
    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    if (window.setInputMode && window.setInputMode(mode)) {
        updateOptionsContent();
    }
}

function updateControllerDeadzone(value, event) {
    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
    }
    
    if (window.setControllerDeadzone) {
        window.setControllerDeadzone(value / 100);
        updateOptionsContent();
    }
}

function updateTriggerThreshold(value, event) {
    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
    }
    
    if (window.setTriggerThreshold) {
        window.setTriggerThreshold(value / 100);
        updateOptionsContent();
    }
}

// ===== VOLUME CONTROL FUNCTIONS =====

function updateVolume(type, value, event) {
    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
    }
    
    volumes[type] = parseInt(value);
    
    document.getElementById(`${type}Value`).textContent = `${value}%`;
    document.getElementById(`${type}Fill`).style.width = `${value}%`;
    
    const control = document.getElementById(`${type}Control`);
    if (value == 0) {
        control.classList.add('muted');
    } else {
        control.classList.remove('muted');
        control.classList.add('active');
        setTimeout(() => control.classList.remove('active'), 500);
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
    // Prevent event bubbling
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    
    const btn = document.getElementById('masterMuteBtn');
    const musicControl = document.getElementById('musicControl');
    const sfxControl = document.getElementById('sfxControl');
    const musicSlider = document.getElementById('musicSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    
    masterMuted = !masterMuted;
    
    if (masterMuted) {
        savedVolumes = { ...volumes };
        updateVolume('music', 0);
        updateVolume('sfx', 0);
        musicSlider.value = 0;
        sfxSlider.value = 0;
        
        btn.textContent = 'Unmute All';
        btn.classList.add('unmute');
        musicControl.classList.add('muted');
        sfxControl.classList.add('muted');
    } else {
        updateVolume('music', savedVolumes.music);
        updateVolume('sfx', savedVolumes.sfx);
        musicSlider.value = savedVolumes.music;
        sfxSlider.value = savedVolumes.sfx;
        
        btn.textContent = 'Mute All';
        btn.classList.remove('unmute');
        musicControl.classList.remove('muted');
        sfxControl.classList.remove('muted');
    }
}

function updateMasterMuteState() {
    const allMuted = volumes.music === 0 && volumes.sfx === 0;
    const btn = document.getElementById('masterMuteBtn');
    
    if (allMuted && !masterMuted) {
        masterMuted = true;
        btn.textContent = 'Unmute All';
        btn.classList.add('unmute');
    } else if (!allMuted && masterMuted) {
        masterMuted = false;
        btn.textContent = 'Mute All';
        btn.classList.remove('unmute');
    }
}

function updateMuteIcon() {
    const icon = document.getElementById('muteIcon');
    const totalVolume = volumes.music + volumes.sfx;
    
    if (totalVolume === 0) {
        icon.textContent = '🔇';
    } else if (totalVolume < 100) {
        icon.textContent = '🔉';
    } else {
        icon.textContent = '🔊';
    }
}

export function toggleMute() {
    soundManager.toggleMute();
    
    if (!soundManager.isMuted && gameState.currentState === GameState.PLAYING) {
        soundManager.resumeBackgroundMusic();
    }
}

// ===== EVENT LISTENERS =====

document.addEventListener('click', (e) => {
    const overlay = document.getElementById('volumeOverlay');
    const muteButton = document.getElementById('muteButton');
    
    if (volumeOverlayVisible && 
        overlay && muteButton &&
        !overlay.contains(e.target) && 
        !muteButton.contains(e.target)) {
        toggleVolumeOverlay();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && volumeOverlayVisible) {
        toggleVolumeOverlay();
    }
});

// ===== GLOBAL FUNCTIONS =====

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

// Volume and Options Functions
window.toggleVolumeOverlay = toggleVolumeOverlay;
window.updateVolume = updateVolume;
window.toggleMasterMute = toggleMasterMute;
window.toggleMute = toggleMute;
window.switchOptionsTab = switchOptionsTab;
window.switchInputMode = switchInputMode;
window.updateControllerDeadzone = updateControllerDeadzone;
window.updateTriggerThreshold = updateTriggerThreshold;

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