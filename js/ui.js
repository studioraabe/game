// ui.js - All UI Functions with Enhanced Countdown System

import { GameState, DUNGEON_THEME } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop, resumeTransition } from './core/gameState.js';
import { soundManager, checkAchievements, saveHighScore, checkForTop10Score, displayHighscores } from './systems.js';
import { activeDropBuffs } from './systems.js';
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

// Enhanced Countdown Function - now handles all game transitions
function showUniversalCountdown(type = 'resume', callback = null) {
    if (countdownActive) return; // Prevent multiple countdowns
    
    countdownActive = true;
    countdownType = type;
    
    // Create or get countdown overlay
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
    
    // Add countdown pulse animation to document if not exists
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
    
    // Set initial message based on type
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
    
    // Play countdown sound
    soundManager.pickup(); // Initial sound
    
    const countdownInterval = setInterval(() => {
        countdown--;
        
        if (countdown > 0) {
            countdownOverlay.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 10px; color: #ffffff;">
                    ${messages[type]}
                </div>
                <div style="animation: countdownNumber 0.6s ease-out;">${countdown}</div>
            `;
            soundManager.pickup(); // Countdown tick sound
        } else {
            // Final "GO!" message
            countdownOverlay.innerHTML = `
                <div style="font-size: 48px; animation: countdownGo 0.8s ease-out;">
                    GO!
                </div>
            `;
            soundManager.powerUp(); // Final GO sound
            
            setTimeout(() => {
                countdownOverlay.style.display = 'none';
                countdownActive = false;
                
                // Execute the callback after countdown
                if (callback && typeof callback === 'function') {
                    callback();
                }
                
                // Clear resume transition if it was active
                if (resumeTransition.active) {
                    resumeTransition.active = false;
                    const canvas = document.getElementById('gameCanvas');
                    if (canvas) canvas.style.opacity = 1;
                }
            }, 800); // Show GO! for 0.8 seconds
            
            clearInterval(countdownInterval);
        }
    }, 800); // Each number shows for 0.8 seconds
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

// NEW: Update Health Bar with segments only (no text)
export function updateHealthBar() {
    const healthContainer = document.getElementById('healthContainer');
    if (!healthContainer) return;
    
    // Clear existing segments
    healthContainer.innerHTML = '';
    
    // Add shield class to container if ANY shields are active
    if (gameState.shieldCharges > 0) {
        healthContainer.classList.add('shield-active');
    } else {
        healthContainer.classList.remove('shield-active');
    }
    
    // Create segments based on maxLives ONLY (no additional shield segments)
    for (let i = 0; i < gameState.maxLives; i++) {
        const segment = document.createElement('div');
        segment.className = 'health-segment';
        
        // Determine segment type
        if (i >= gameState.lives) {
            // Empty segment
            segment.classList.add('empty');
        } else if (gameState.lives <= 1 && gameState.shieldCharges === 0) {
            // Critical health, no shields
            segment.classList.add('damage');
        } else if (gameState.shieldCharges > 0 && i < gameState.shieldCharges) {
            // Shield-protected segment (from left to right, no numbers)
            segment.classList.add('shielded');
        }
        // Regular life segments get no additional class
        
        healthContainer.appendChild(segment);
    }
}

// Separate function for enhanced displays that need continuous updates
export function updateEnhancedDisplays() {
    // Make sure containers exist before updating
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
    // This function is now handled by updateEnhancedBuffDisplay
    // Keeping empty function for compatibility
}

export function updateComboDisplay() {
    // This function is now handled by updateEnhancedComboDisplay
    // Keeping empty function for compatibility
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

// Menu Handling with Enhanced Countdown
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
    // Apply the chosen buff
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
    
    // Remove chosen buff from available buffs
    gameState.availableBuffs = gameState.availableBuffs.filter(buff => buff.id !== buffType);
    
    // Level up
    gameState.level++;
    gameState.levelProgress = 1;
    window.bulletBoxesFound = 0;
    gameState.damageThisLevel = 0;
    gameState.gameSpeed += 0.6;
    gameState.bullets += 12;
    
    // Grant temporary invulnerability
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
    
    // Update all labels
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

// ===== SOUND OVERLAY PAUSE & RESUME SYSTEM =====

function toggleVolumeOverlay() {
    const overlay = document.getElementById('volumeOverlay');
    const muteButton = document.getElementById('muteButton');
    
    volumeOverlayVisible = !volumeOverlayVisible;
    
    if (volumeOverlayVisible) {
        // OVERLAY ÖFFNEN - Spiel pausieren
        overlay.classList.add('show');
        muteButton.classList.add('active');
        
        // Spiel pausieren wenn es läuft
        if (gameState.currentState === GameState.PLAYING && gameState.gameRunning) {
            gameWasPausedByVolumeOverlay = true;
            gameState.gameRunning = false;
            soundManager.pauseBackgroundMusic();
            console.log("🔊 Volume overlay opened - game paused");
        }
        
    } else {
        // OVERLAY SCHLIEßEN - Smooth Resume starten
        overlay.classList.remove('show');
        muteButton.classList.remove('active');
        
        // Smooth Resume starten wenn von uns pausiert
        if (gameWasPausedByVolumeOverlay && gameState.currentState === GameState.PLAYING) {
            startSmoothResume();
            gameWasPausedByVolumeOverlay = false;
            console.log("🔊 Volume overlay closed - starting smooth resume");
        }
    }
}

function startSmoothResume() {
    showUniversalCountdown('resume', () => {
        gameState.gameRunning = true;
        soundManager.resumeBackgroundMusic();
    });
}

// ===== VOLUME CONTROL FUNCTIONS =====

function updateVolume(type, value) {
    volumes[type] = parseInt(value);
    
    // Update display
    document.getElementById(`${type}Value`).textContent = `${value}%`;
    document.getElementById(`${type}Fill`).style.width = `${value}%`;
    
    // Update muted state
    const control = document.getElementById(`${type}Control`);
    if (value == 0) {
        control.classList.add('muted');
    } else {
        control.classList.remove('muted');
        control.classList.add('active');
        setTimeout(() => control.classList.remove('active'), 500);
    }
    
    // Update master mute state
    updateMasterMuteState();
    updateMuteIcon();
    
    // Integrate with your sound manager
    if (type === 'music') {
        soundManager.setMusicVolume(value / 100);
    } else if (type === 'sfx') {
        soundManager.setSfxVolume(value / 100);
    }
}

function toggleMasterMute() {
    const btn = document.getElementById('masterMuteBtn');
    const musicControl = document.getElementById('musicControl');
    const sfxControl = document.getElementById('sfxControl');
    const musicSlider = document.getElementById('musicSlider');
    const sfxSlider = document.getElementById('sfxSlider');
    
    masterMuted = !masterMuted;
    
    if (masterMuted) {
        // Save current volumes and mute
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
        // Restore saved volumes
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

// Extended toggle mute function
export function toggleMute() {
    soundManager.toggleMute();
    
    // Wenn unmuted und Spiel läuft, Musik fortsetzen
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

// ===== GLOBAL UI FUNCTIONS (for window access) =====

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

// Volume and Sound Functions
window.toggleVolumeOverlay = toggleVolumeOverlay;
window.updateVolume = updateVolume;
window.toggleMasterMute = toggleMasterMute;
window.toggleMute = toggleMute;

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