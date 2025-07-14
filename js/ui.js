// ui.js - Enhanced UI with Controller Support and Tabbed Options Menu

import { GameState, DUNGEON_THEME } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, resumeTransition, updatePlayerStatsForLevel } from './core/gameState.js';
import { soundManager, checkAchievements, saveHighScore, checkForTop10Score, displayHighscores } from './systems.js';
import { activeDropBuffs } from './systems.js';
import { getControllerInfo } from './core/input.js';
import { 
    updateEnhancedComboDisplay, 
    updateEnhancedBuffDisplay,
    initEnhancedContainers
} from './ui-enhancements.js';
import { STAT_BUFFS, replenishBuffSelection } from './roguelike-stats.js';






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
    // Update score and level displays
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const highscoreElement = document.getElementById('highscoreValue');
    
    if (scoreElement) {
        scoreElement.textContent = gameState.score.toLocaleString();
    }
    
    if (levelElement) {
        levelElement.textContent = gameState.level;
    }
    
    if (highscoreElement) {
        highscoreElement.textContent = gameState.highScore;
    }
    
    // Update HUD elements (health, bullets, weapons) through the centralized HUD system
    if (window.updateHUD) {
        window.updateHUD();
    }
    
    // Update buff selection screen if needed
    if (gameState.currentState === GameState.LEVEL_COMPLETE) {
        updateBuffButtons();
    }
}


// Enhanced Health Bar Update Function with Shield Overlay
// Add this to your ui.js file, replacing the existing updateHealthBar function

export function updateHealthBar() {
    const healthContainer = document.getElementById('healthContainer');
    if (!healthContainer) return;
    
    // Clear existing content
    healthContainer.innerHTML = '';
    
    // Calculate HP percentage
    const hpPercent = Math.max(0, (gameState.currentHP / gameState.maxHP) * 100);
    
    // Create main HP bar container
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    
    // Create HP fill
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-fill';
    hpFill.style.width = `${hpPercent}%`;
    
    // Set HP bar color based on health level
    if (hpPercent <= 20) {
        hpFill.classList.add('critical');
        healthContainer.classList.add('critical-health');
    } else if (hpPercent <= 50) {
        hpFill.classList.add('warning');
        healthContainer.classList.remove('critical-health');
    } else {
        hpFill.classList.add('healthy');
        healthContainer.classList.remove('critical-health');
    }
    
    // Create shield overlay (blue overlay when shields are active)
    const shieldOverlay = document.createElement('div');
    shieldOverlay.className = 'shield-overlay';
    
    // Create HP text (center of bar)
    const hpText = document.createElement('div');
    hpText.className = 'hp-text';
    hpText.textContent = `${gameState.currentHP} / ${gameState.maxHP}`;
    
    // Create shield counter (right corner)
    const shieldCounter = document.createElement('div');
    shieldCounter.className = 'shield-counter';
    
    const shieldIcon = document.createElement('span');
    shieldIcon.className = 'shield-icon';
    shieldIcon.textContent = '🛡️';
    
    const shieldCount = document.createElement('span');
    shieldCount.className = 'shield-count';
    shieldCount.textContent = gameState.shieldCharges;
    
    shieldCounter.appendChild(shieldIcon);
    shieldCounter.appendChild(shieldCount);
    
    // Handle shield state
    if (gameState.shieldCharges > 0) {
        healthContainer.classList.add('shield-active');
    } else {
        healthContainer.classList.remove('shield-active');
    }
    
    // Assemble the health bar
    hpBar.appendChild(hpFill);
    hpBar.appendChild(shieldOverlay);
    hpBar.appendChild(hpText);
    hpBar.appendChild(shieldCounter);
    
    healthContainer.appendChild(hpBar);
    

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
    // CHANGE: Show HP instead of lives
    document.getElementById('pauseLives').textContent = `${gameState.currentHP}/${gameState.maxHP} HP`;
}





// In ui.js, update the updateBuffButtons function:

export function updateBuffButtons() {
    const buffButtonsContainer = document.getElementById('buffButtons');
    if (!buffButtonsContainer) {
        console.error("❌ buffButtons container not found!");
        return;
    }
    
    buffButtonsContainer.innerHTML = '';
    
    // Check if we have buffs available
    if (!gameState.availableBuffs || gameState.availableBuffs.length === 0) {
        console.error("❌ No available buffs to display!");
        buffButtonsContainer.innerHTML = '<p style="color: #ff1744; text-align: center; padding: 20px;">No buffs available!</p>';
        return;
    }
    
    // Shuffle available buffs and take only 3
    const shuffled = [...gameState.availableBuffs].sort(() => Math.random() - 0.5);
    const buffsToShow = shuffled.slice(0, 3);
    
    console.log(`🔮 Showing ${buffsToShow.length} random buffs from ${gameState.availableBuffs.length} available`);
    
    // Add styling if not already added
    if (!document.getElementById('enhanced-buff-styles')) {
        const style = document.createElement('style');
        style.id = 'enhanced-buff-styles';
        style.textContent = `
            .buff-card {
                position: relative;
                overflow: hidden;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .buff-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            }
            
            .buff-icon {
                position: absolute;
                top: 10px;
                right: 10px;
                font-size: 24px;
                opacity: 0.7;
            }
            
            .buff-info {
                position: absolute;
                bottom: 10px;
                right: 10px;
                font-size: 12px;
                background: rgba(0, 0, 0, 0.6);
                padding: 3px 8px;
                border-radius: 10px;
                color: #fff;
            }
            
            .buff-title {
                font-size: 18px;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }
            
            .buff-desc {
                font-size: 14px;
                line-height: 1.4;
            }
        `;
        document.head.appendChild(style);
    }
    
    buffsToShow.forEach(buff => {
        console.log(`🔮 Creating buff card for: ${buff.id} - ${buff.title}`);
        
        const button = document.createElement('div');
        button.className = 'buff-card';
        button.onclick = () => {
            console.log(`🔮 Buff clicked: ${buff.id}`);
            chooseBuff(buff.id);
        };
        
        const title = document.createElement('div');
        title.className = 'buff-title';
        title.textContent = buff.title;
        
        const desc = document.createElement('div');
        desc.className = 'buff-desc';
        desc.textContent = buff.desc;
        
        // Add buff icon/category visual
        const category = getBufCategory(buff.id);
        const icon = document.createElement('div');
        icon.className = 'buff-icon';
        icon.textContent = getCategoryIcon(category);
        
        const info = document.createElement('div');
        info.className = 'buff-info';
        info.textContent = category;
        
        button.appendChild(title);
        button.appendChild(desc);
        button.appendChild(icon);
        button.appendChild(info);
        buffButtonsContainer.appendChild(button);
    });
    
    console.log(`✅ Created ${buffButtonsContainer.children.length} buff cards`);
}


function getBufCategory(buffId) {
    if (['berserkerRage', 'criticalFocus'].includes(buffId)) {
        return 'Damage';
    }
    if (['bulletStorm', 'vampiricStrikes', 'survivalInstinct', 'undeadResilience'].includes(buffId)) {
        return 'Survival';
    }
    if (['shadowLeap', 'swiftDeath'].includes(buffId)) {
        return 'Mobility';
    }
    return 'Special';
}

function getCategoryIcon(category) {
    switch (category) {
        case 'Damage': return '💥';
        case 'Survival': return '💖';
        case 'Mobility': return '🌀';
        default: return '✨';
    }
}


export function chooseBuff(buffId) {
    console.log(`🎮 Choosing buff: ${buffId}`);
    
    // Find the buff in STAT_BUFFS
    const buff = gameState.availableBuffs.find(b => b.id === buffId);
    if (!buff) {
        console.error(`❌ Buff not found: ${buffId}`);
        return;
    }
    
    // Apply the buff effect using the new system
    if (buff.effect && typeof buff.effect === 'function') {
        buff.effect();
        console.log(`✅ Applied buff effect for: ${buffId}`);
    } else {
        // Fallback for legacy buffs
        switch(buffId) {
            case 'undeadResilience':
                gameState.activeBuffs.undeadResilience = 1;
                break;
            case 'shadowLeap':
                gameState.activeBuffs.shadowLeap = 1;
                break;
        }
    }
    
    // Remove the selected buff from available buffs
    gameState.availableBuffs = gameState.availableBuffs.filter(b => b.id !== buffId);
    
    // Replenish buff selection if needed
    if (gameState.availableBuffs.length < 3) {
        if (window.replenishBuffSelection) {
            window.replenishBuffSelection();
        }
    }
    
    // Standard level up procedure
    gameState.level++;
    gameState.levelProgress = 1;
    window.bulletBoxesFound = 0;
    gameState.damageThisLevel = 0;
    gameState.gameSpeed += 0.6;
    
    // IMPORTANT: Update player stats for new level
    if (window.updatePlayerStatsForLevel) {
        window.updatePlayerStatsForLevel(gameState.level);
    }
    
    gameState.postBuffInvulnerability = 120;
    
    // Hide all screens and resume with countdown
    hideAllScreens();
    showUniversalCountdown('resume', () => {
        gameState.currentState = GameState.PLAYING;
        gameState.gameRunning = true;
        updateUI();
    });
	
	window.hideAllScreens();
window.showUniversalCountdown('resume', () => {
    gameState.currentState = GameState.PLAYING;
    gameState.gameRunning = true;
    updateUI();
    
    // Reinitialize enhanced containers after buff selection
    setTimeout(() => {
        initEnhancedContainers();
        updateEnhancedBuffDisplay();
    }, 100);
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
        if (window.initHUD) {
    window.initHUD();
}
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
    console.log('🔄 Restarting game with complete data reset...');
    
    // Stop the game
    gameState.gameRunning = false;
    hideAllScreens();
    
    // Stop all audio
    if (soundManager) {
        soundManager.stopBackgroundMusic();
    }
    
    showUniversalCountdown('restart', () => {
        // CRITICAL: Perform complete reset before starting
        resetGame();
        
        // Set game state
        gameState.currentState = GameState.PLAYING;
        gameState.gameRunning = true;
        
        // Start fresh audio
        soundManager.startBackgroundMusic();
        
        // Initialize UI systems
        if (window.initHUD) {
            window.initHUD();
        }
        
        initEnhancedContainers();
        updateUI();
        
        // Force refresh of all displays after a short delay
        setTimeout(() => {
            updateEnhancedDisplays();
            
            // CRITICAL: Force refresh weapon HUD to show reset configs
            if (window.forceRefreshWeaponHUD) {
                window.forceRefreshWeaponHUD();
            } else if (window.updateWeaponHUD) {
                // Fallback: clear weapons container and update
                const weaponsContainer = document.getElementById('weaponsContainer');
                if (weaponsContainer) {
                    weaponsContainer.innerHTML = '';
                }
                window.updateWeaponHUD();
            }
            
            // Force update stat display
            if (window.updateStatDisplay) {
                window.updateStatDisplay();
            }
            
            // Force refresh entire HUD system
            if (window.forceRefreshHUD) {
                window.forceRefreshHUD();
            }
            
            console.log('🎮 Game restart complete - all systems refreshed');
            
            // Debug: Log current weapon configs
            if (window.debugWeaponConfigs) {
                window.debugWeaponConfigs();
            }
        }, 200);
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



// Theme Application
export function applyTheme() {
    const container = document.getElementById('gameContainer');
    container.className = 'dungeon-theme';
    
    // Update all UI labels with theme text
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

    // Initialize buffs from STAT_BUFFS (from roguelike-stats.js)
    gameState.activeBuffs = {};
    gameState.availableBuffs = [...STAT_BUFFS];  // Use STAT_BUFFS array directly
    updateUI();
}

// ===== ENHANCED OPTIONS OVERLAY SYSTEM =====

function toggleVolumeOverlay() {
    const overlay = document.getElementById('volumeOverlay');
    const settingsButton = document.getElementById('settingsButton');
    
    volumeOverlayVisible = !volumeOverlayVisible;
    
    if (volumeOverlayVisible) {
        overlay.classList.add('show');
        settingsButton.classList.add('active');
        
        // Update options content
        updateOptionsContent();
        
        // IMPORTANT: Refresh volume display after content is updated
        setTimeout(() => {
            refreshVolumeDisplay();
        }, 50);
        
        if (gameState.currentState === GameState.PLAYING && gameState.gameRunning) {
            gameWasPausedByVolumeOverlay = true;
            gameState.gameRunning = false;
            soundManager.pauseBackgroundMusic();
            console.log("🔊 Options overlay opened - game paused");
        }
        
    } else {
        overlay.classList.remove('show');
        settingsButton.classList.remove('active');
        
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
    
    // Update display elements
    const valueElement = document.getElementById(`${type}Value`);
    const fillElement = document.getElementById(`${type}Fill`);
    const controlElement = document.getElementById(`${type}Control`);
    
    if (valueElement) valueElement.textContent = `${value}%`;
    if (fillElement) fillElement.style.width = `${value}%`;
    
    // Update control visual state
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
    
    // Update master mute state and apply audio changes
    updateMasterMuteState();
    updateMuteIcon();
    
    // Apply volume changes to sound manager
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
    const musicFill = document.getElementById('musicFill');
    const sfxFill = document.getElementById('sfxFill');
    const musicValue = document.getElementById('musicValue');
    const sfxValue = document.getElementById('sfxValue');
    
    masterMuted = !masterMuted;
    
    if (masterMuted) {
        // Save current volumes before muting
        savedVolumes = { ...volumes };
        
        // Mute everything
        volumes.music = 0;
        volumes.sfx = 0;
        
        // Update sliders
        if (musicSlider) musicSlider.value = 0;
        if (sfxSlider) sfxSlider.value = 0;
        
        // Update fill bars
        if (musicFill) musicFill.style.width = '0%';
        if (sfxFill) sfxFill.style.width = '0%';
        
        // Update value displays
        if (musicValue) musicValue.textContent = '0%';
        if (sfxValue) sfxValue.textContent = '0%';
        
        // Update visual states
        if (musicControl) musicControl.classList.add('muted');
        if (sfxControl) sfxControl.classList.add('muted');
        
        // Update button
        if (btn) {
            btn.textContent = 'Unmute All';
            btn.classList.add('unmute');
        }
        
        // Apply audio changes
        soundManager.setMusicVolume(0);
        soundManager.setSfxVolume(0);
        
    } else {
        // Restore saved volumes
        volumes.music = savedVolumes.music;
        volumes.sfx = savedVolumes.sfx;
        
        // Update sliders
        if (musicSlider) musicSlider.value = savedVolumes.music;
        if (sfxSlider) sfxSlider.value = savedVolumes.sfx;
        
        // Update fill bars
        if (musicFill) musicFill.style.width = `${savedVolumes.music}%`;
        if (sfxFill) sfxFill.style.width = `${savedVolumes.sfx}%`;
        
        // Update value displays
        if (musicValue) musicValue.textContent = `${savedVolumes.music}%`;
        if (sfxValue) sfxValue.textContent = `${savedVolumes.sfx}%`;
        
        // Update visual states
        if (musicControl) musicControl.classList.remove('muted');
        if (sfxControl) sfxControl.classList.remove('muted');
        
        // Update button
        if (btn) {
            btn.textContent = 'Mute All';
            btn.classList.remove('unmute');
        }
        
        // Apply audio changes
        soundManager.setMusicVolume(savedVolumes.music / 100);
        soundManager.setSfxVolume(savedVolumes.sfx / 100);
    }
    
    updateMuteIcon();
}

function updateMasterMuteState() {
    const allMuted = volumes.music === 0 && volumes.sfx === 0;
    const btn = document.getElementById('masterMuteBtn');
    
    if (allMuted && !masterMuted) {
        // User manually muted both sliders
        masterMuted = true;
        if (btn) {
            btn.textContent = 'Unmute All';
            btn.classList.add('unmute');
        }
    } else if (!allMuted && masterMuted) {
        // User manually unmuted at least one slider
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
            icon.textContent = '⚙️'; // Keep settings icon for consistency
        }
    }
}

// Initialize volumes properly when the page loads
function initializeVolumeControls() {
    // Set default volumes if not already set
    if (!volumes.music) volumes.music = 70;
    if (!volumes.sfx) volumes.sfx = 85;
    
    // Update all UI elements to match current volumes
    updateVolume('music', volumes.music);
    updateVolume('sfx', volumes.sfx);
    
    // Ensure master mute state is correct
    updateMasterMuteState();
}

// Call this when the options overlay is opened
function refreshVolumeDisplay() {
    const musicSlider = document.getElementById('musicSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    const musicFill = document.getElementById('musicFill');
    const sfxFill = document.getElementById('sfxFill');
    const musicValue = document.getElementById('musicValue');
    const sfxValue = document.getElementById('sfxValue');
    const btn = document.getElementById('masterMuteBtn');
    
    // Update all elements to current state
    if (musicSlider) musicSlider.value = volumes.music;
    if (sfxSlider) sfxSlider.value = volumes.sfx;
    if (musicFill) musicFill.style.width = `${volumes.music}%`;
    if (sfxFill) sfxFill.style.width = `${volumes.sfx}%`;
    if (musicValue) musicValue.textContent = `${volumes.music}%`;
    if (sfxValue) sfxValue.textContent = `${volumes.sfx}%`;
    
    // Update button state
    if (btn) {
        btn.textContent = masterMuted ? 'Unmute All' : 'Mute All';
        if (masterMuted) {
            btn.classList.add('unmute');
        } else {
            btn.classList.remove('unmute');
        }
    }
    
    // Update control states
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


export function forceRefreshAllSystems() {
    console.log('🔄 Force refreshing all game systems...');
    
    // Reset weapon configs first
    if (window.resetProjectileConfigs) {
        window.resetProjectileConfigs();
        console.log('🔫 Weapon configs reset');
    }
    
    // Clear all HUD caches
    if (window.weaponSlotStates) {
        window.weaponSlotStates.clear();
    }
    
    // Force refresh HUD
    if (window.forceRefreshHUD) {
        window.forceRefreshHUD();
    }
    
    // Force refresh enhanced displays
    if (window.initEnhancedContainers) {
        window.initEnhancedContainers();
    }
    
    updateEnhancedDisplays();
    updateUI();
    
    console.log('✅ All systems force refreshed');
}

// Make the utility function available globally
window.forceRefreshAllSystems = forceRefreshAllSystems;

// Also add a debug command to check if weapon costs are properly reset
window.checkWeaponCostsReset = function() {
    console.log('🔍 Checking weapon cost reset status:');
    
    if (window.PROJECTILE_CONFIGS) {
        const expectedCosts = {
            'normal': 1,
            'laserBeam': 10,
            'energyShotgun': 4,
            'chainLightning': 15
        };
        
        let allCorrect = true;
        
        Object.keys(expectedCosts).forEach(type => {
            const config = window.PROJECTILE_CONFIGS[type];
            const expectedCost = expectedCosts[type];
            const actualCost = config ? config.cost : 'MISSING';
            
            const isCorrect = actualCost === expectedCost;
            if (!isCorrect) allCorrect = false;
            
            console.log(`  ${type}: Expected ${expectedCost}, Actual ${actualCost} ${isCorrect ? '✅' : '❌'}`);
        });
        
        console.log(`Overall status: ${allCorrect ? '✅ All costs correct' : '❌ Some costs incorrect'}`);
        
        // Also check UI display
        const weaponsContainer = document.getElementById('weaponsContainer');
        if (weaponsContainer) {
            const costElements = weaponsContainer.querySelectorAll('.weapon-cost');
            console.log(`UI shows ${costElements.length} weapon cost elements:`);
            costElements.forEach((element, index) => {
                console.log(`  Slot ${index}: ${element.textContent}`);
            });
        }
        
    } else {
        console.log('❌ PROJECTILE_CONFIGS not found');
    }
};















// ===== EVENT LISTENERS =====

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
window.showUniversalCountdown = showUniversalCountdown;



window.toggleVolumeOverlay = toggleVolumeOverlay;
window.updateVolume = updateVolume;                    // Keep this one
window.toggleMasterMute = toggleMasterMute;            // Keep this one
window.switchOptionsTab = switchOptionsTab;
window.switchInputMode = switchInputMode;
window.updateControllerDeadzone = updateControllerDeadzone;
window.updateTriggerThreshold = updateTriggerThreshold;
window.refreshVolumeDisplay = refreshVolumeDisplay;
window.initializeVolumeControls = initializeVolumeControls;

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