// ui.js - All UI Functions (Screen Management, HUD Updates, Menu Handling)

import { GameState, DUNGEON_THEME } from './core/constants.js';
import { gameState, resetGame, startGameLoop, stopGameLoop } from './core/gameState.js';
import { soundManager, checkAchievements, saveHighScore, checkForTop10Score, displayHighscores } from './systems.js';
import { activeDropBuffs } from './systems.js';
import { 
    updateEnhancedComboDisplay, 
    updateEnhancedBuffDisplay,
    initEnhancedContainers  // Add this import
} from './ui-enhancements.js';


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

// Remove old updateHeartsDisplay function as it's replaced by updateHealthBar

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

// Menu Handling
export function startGame() {
    soundManager.init();
    if (soundManager.audioContext) {
        soundManager.audioContext.resume();
    }
    soundManager.startBackgroundMusic(); // Diese Zeile hinzufügen
    
    gameState.currentState = GameState.PLAYING;
    gameState.gameRunning = true;
    resetGame();
    hideAllScreens();
    
    // Initialize enhanced containers immediately
    initEnhancedContainers();
    
    updateUI();
    startGameLoop();
    
    // Force an immediate update of enhanced displays
    setTimeout(() => {
        updateEnhancedDisplays();
    }, 100);
}

export function restartGame() {
    gameState.currentState = GameState.PLAYING;
    gameState.gameRunning = true;
    resetGame();
    hideAllScreens();
    
    soundManager.startBackgroundMusic(); // Musik neu starten
    
    // Reinitialize enhanced containers
    initEnhancedContainers();
    
    updateUI();
    
    // Force update of enhanced displays
    setTimeout(() => {
        updateEnhancedDisplays();
    }, 100);
}

// Füge diese Änderungen zu deiner ui.js hinzu:

export function pauseGame() {
    if (gameState.currentState === GameState.PLAYING) {
        gameState.currentState = GameState.PAUSED;
        gameState.gameRunning = false;
        
        // Musik pausieren statt stoppen
        soundManager.pauseBackgroundMusic();
        
        updatePauseScreen();
        showScreen('pauseScreen');
    }
}

export function resumeGame() {
    if (gameState.currentState === GameState.PAUSED) {
        gameState.currentState = GameState.PLAYING;
        gameState.gameRunning = true;
        
        // Musik fortsetzen
        soundManager.resumeBackgroundMusic();
        
        hideAllScreens();
    }
}

export function gameOver() {
    gameState.currentState = GameState.GAME_OVER;
    gameState.gameRunning = false;
    
    // Musik komplett stoppen bei Game Over (mit Reset auf Anfang)
    soundManager.stopBackgroundMusic();
    
    updateHighScore();
    soundManager.death();
    
    displayHighscores();
    
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('levelsCompleted').textContent = gameState.levelsCompleted;
    
    checkForTop10Score(gameState.score);
    
    showScreen('gameOver');
}

// Erweiterte Mute-Funktion für bessere Pause-Kontrolle
export function toggleMute() {
    soundManager.toggleMute();
    
    // Wenn unmuted und Spiel läuft, Musik fortsetzen
    if (!soundManager.isMuted && gameState.currentState === GameState.PLAYING) {
        soundManager.resumeBackgroundMusic();
    }
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
    
    // Resume game
    gameState.currentState = GameState.PLAYING;
    gameState.gameRunning = true;
    hideAllScreens();
    updateUI();
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



// Volume Control Variables
let volumeOverlayVisible = false;
let masterMuted = false;
let volumes = {
    music: 70,
    sfx: 85
};
let savedVolumes = { ...volumes };

// Volume Control Functions
function toggleVolumeOverlay() {
    const overlay = document.getElementById('volumeOverlay');
    const muteButton = document.getElementById('muteButton');
    
    volumeOverlayVisible = !volumeOverlayVisible;
    
    if (volumeOverlayVisible) {
        overlay.classList.add('show');
        muteButton.classList.add('active');
    } else {
        overlay.classList.remove('show');
        muteButton.classList.remove('active');
    }
}

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

// Event Listeners
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

// Global Functions
window.toggleVolumeOverlay = toggleVolumeOverlay;
window.updateVolume = updateVolume;
window.toggleMasterMute = toggleMasterMute;













// Global UI Functions (for window access)
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

// Toggle functions
window.toggleMute = () => soundManager.toggleMute();

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