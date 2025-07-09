// core/input.js - Enhanced Input System with Full Controller Support

import { gameState } from './gameState.js';
import { shoot } from '../entities.js';
import { GameState } from './constants.js';
import { cycleProjectileType } from '../enhanced-projectile-system.js';
import { startJump, stopJump } from '../enhanced-player.js';




// Input state
export const keys = {
    left: false,
    right: false,
    space: false,
    s: false
};

// Controller state
export const controllerState = {
    connected: false,
    controller: null,
    index: -1,
    deadzone: 0.2,
    vibrationSupported: false,
    lastButtonStates: {},
    axisStates: {
        leftStickX: 0,
        leftStickY: 0,
        rightStickX: 0,
        rightStickY: 0,
        leftTrigger: 0,
        rightTrigger: 0
    }
};

// Input settings
export const inputSettings = {
    inputMode: 'keyboard', // 'keyboard' or 'controller'
    controllerDeadzone: 0.2,
    triggerThreshold: 0.1
};

// Button mappings for different controller types
const CONTROLLER_MAPPINGS = {
    // Standard gamepad mapping (Xbox, PlayStation when using standard mapping)
    standard: {
        jump: [0],      // A/X button
        shoot: [1, 5],  // B/Circle button or Right Bumper
        left: [],       // Handled by stick
        right: [],      // Handled by stick
        pause: [9],     // Menu/Options button
        select: [0]     // A/X for menu selections
    },
    
    // Alternative mapping
    alternative: {
        jump: [0, 2],   // A/X or Y/Triangle
        shoot: [1, 5, 7], // B/Circle, RB, or RT
        left: [],
        right: [],
        pause: [9],
        select: [0]
    }
};

let currentMapping = 'standard';

// Initialize input listeners
export function initInput() {
    initKeyboard();
    initController();
    
    // Load input preferences
    loadInputSettings();
    
    // Check for controller on init
    checkControllers();
    
    console.log('🎮 Enhanced Input System initialized');
}

function initKeyboard() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function initController() {
    // Gamepad connection events
    window.addEventListener('gamepadconnected', handleControllerConnected);
    window.addEventListener('gamepaddisconnected', handleControllerDisconnected);
    
    // Start controller polling loop
    startControllerLoop();
}

function loadInputSettings() {
    const saved = localStorage.getItem('dungeonInputSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            Object.assign(inputSettings, settings);
            controllerState.deadzone = inputSettings.controllerDeadzone;
        } catch (error) {
            console.warn('Failed to load input settings:', error);
        }
    }
}

function saveInputSettings() {
    localStorage.setItem('dungeonInputSettings', JSON.stringify(inputSettings));
}

// Controller Management
function checkControllers() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            connectController(gamepads[i], i);
            break; // Use first available controller
        }
    }
}

function connectController(gamepad, index) {
    controllerState.connected = true;
    controllerState.controller = gamepad;
    controllerState.index = index;
    controllerState.vibrationSupported = gamepad.vibrationActuator != null;
    
    // Initialize button states
    controllerState.lastButtonStates = {};
    for (let i = 0; i < gamepad.buttons.length; i++) {
        controllerState.lastButtonStates[i] = false;
    }
    
    showControllerNotification(`Controller connected: ${gamepad.id}`, 'success');
    console.log(`🎮 Controller connected: ${gamepad.id}`);
    
    // Auto-switch to controller mode if not already set
    if (inputSettings.inputMode === 'keyboard') {
        setInputMode('controller');
    }
}

function disconnectController() {
    if (controllerState.connected) {
        const controllerName = controllerState.controller?.id || 'Controller';
        controllerState.connected = false;
        controllerState.controller = null;
        controllerState.index = -1;
        controllerState.vibrationSupported = false;
        
        showControllerNotification(`${controllerName} disconnected`, 'warning');
        console.log('🎮 Controller disconnected');
        
        // Switch back to keyboard if controller was active
        if (inputSettings.inputMode === 'controller') {
            setInputMode('keyboard');
        }
    }
}

function handleControllerConnected(event) {
    connectController(event.gamepad, event.gamepad.index);
}

function handleControllerDisconnected(event) {
    if (event.gamepad.index === controllerState.index) {
        disconnectController();
    }
}

// Controller Input Loop
function startControllerLoop() {
    function updateController() {
        if (controllerState.connected) {
            const gamepad = navigator.getGamepads()[controllerState.index];
            if (gamepad) {
                processControllerInput(gamepad);
            } else {
                disconnectController();
            }
        }
        requestAnimationFrame(updateController);
    }
    updateController();
}

function processControllerInput(gamepad) {
    // Update axis states
    updateAxisStates(gamepad);
    
    // Process movement from left stick
    processMovement();
    
    // Process button inputs
    processButtons(gamepad);
}

function updateAxisStates(gamepad) {
    const axes = gamepad.axes;
    
    // Left stick (movement)
    controllerState.axisStates.leftStickX = Math.abs(axes[0]) > controllerState.deadzone ? axes[0] : 0;
    controllerState.axisStates.leftStickY = Math.abs(axes[1]) > controllerState.deadzone ? axes[1] : 0;
    
    // Right stick (could be used for aiming in future)
    controllerState.axisStates.rightStickX = Math.abs(axes[2]) > controllerState.deadzone ? axes[2] : 0;
    controllerState.axisStates.rightStickY = Math.abs(axes[3]) > controllerState.deadzone ? axes[3] : 0;
    
    // Triggers
    if (axes.length > 4) {
        controllerState.axisStates.leftTrigger = axes[4] || 0;
        controllerState.axisStates.rightTrigger = axes[5] || 0;
    }
}

function processMovement() {
    if (inputSettings.inputMode !== 'controller') return;
    
    const stickX = controllerState.axisStates.leftStickX;
    
    // Update key states based on stick input
    keys.left = stickX < -controllerState.deadzone;
    keys.right = stickX > controllerState.deadzone;
}

function processButtons(gamepad) {
    if (inputSettings.inputMode !== 'controller') return;
    
    const mapping = CONTROLLER_MAPPINGS[currentMapping];
    const buttons = gamepad.buttons;
    
    // Track button press events (not hold)
    const currentButtonStates = {};
    for (let i = 0; i < buttons.length; i++) {
        currentButtonStates[i] = buttons[i].pressed;
    }
    
    // Jump button
    const jumpPressed = mapping.jump.some(buttonIndex => 
        buttons[buttonIndex] && buttons[buttonIndex].pressed
    );
    const jumpJustPressed = mapping.jump.some(buttonIndex => 
        buttons[buttonIndex] && buttons[buttonIndex].pressed && !controllerState.lastButtonStates[buttonIndex]
    );
    const jumpJustReleased = mapping.jump.some(buttonIndex => 
        !buttons[buttonIndex].pressed && controllerState.lastButtonStates[buttonIndex]
    );
    
    // Handle jump
    if (jumpJustPressed) {
        keys.space = true;
        handleControllerJumpPress();
    } else if (jumpJustReleased) {
        keys.space = false;
       if (gameState.gameRunning) {
    startJump(gameState);  // New function from enhanced-player.js
}
    }
    
    // Shoot button (including triggers)
    const shootPressed = mapping.shoot.some(buttonIndex => 
        buttons[buttonIndex] && buttons[buttonIndex].pressed
    ) || controllerState.axisStates.rightTrigger > inputSettings.triggerThreshold;
    
    const shootJustPressed = mapping.shoot.some(buttonIndex => 
        buttons[buttonIndex] && buttons[buttonIndex].pressed && !controllerState.lastButtonStates[buttonIndex]
    ) || (!controllerState.lastButtonStates.rightTrigger && controllerState.axisStates.rightTrigger > inputSettings.triggerThreshold);
    
    if (shootJustPressed) {
        keys.s = true;
        handleControllerShoot();
    } else if (!shootPressed) {
        keys.s = false;
    }
    
    // Pause button
    if (mapping.pause.some(buttonIndex => 
        buttons[buttonIndex] && buttons[buttonIndex].pressed && !controllerState.lastButtonStates[buttonIndex]
    )) {
        handleControllerPause();
    }
    
    // Select button (for menus)
    if (mapping.select.some(buttonIndex => 
        buttons[buttonIndex] && buttons[buttonIndex].pressed && !controllerState.lastButtonStates[buttonIndex]
    )) {
        handleControllerSelect();
    }
    
    // Update last button states
    controllerState.lastButtonStates = { ...currentButtonStates };
    controllerState.lastButtonStates.rightTrigger = controllerState.axisStates.rightTrigger > inputSettings.triggerThreshold;
}

// Controller Input Handlers
function handleControllerJumpPress() {
    if (gameState.currentState === GameState.START) {
        window.startGame();
        return;
    }
    if (gameState.currentState === GameState.GAME_OVER) {
        window.restartGame();
        return;
    }
    if (gameState.gameRunning) {
        // FIXED: Pass gameState to startJump
        startJump(gameState);
        vibrateController(100, 0.1); // Light vibration for jump
    }
}
function handleControllerShoot() {
    if (gameState.gameRunning) {
        shoot(gameState);
        vibrateController(50, 0.05); // Very light vibration for shoot
    }
}

function handleControllerPause() {
    if (gameState.currentState === GameState.PLAYING) {
        window.pauseGame();
    } else if (gameState.currentState === GameState.PAUSED) {
        window.resumeGame();
    }
}

function handleControllerSelect() {
    // Handle menu selections with controller
    if (gameState.currentState === GameState.START) {
        window.startGame();
    } else if (gameState.currentState === GameState.GAME_OVER) {
        window.restartGame();
    }
}

// Vibration Support
function vibrateController(duration = 100, intensity = 0.5) {
    if (!controllerState.connected || !controllerState.vibrationSupported) return;
    
    const gamepad = navigator.getGamepads()[controllerState.index];
    if (gamepad && gamepad.vibrationActuator) {
        gamepad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: duration,
            weakMagnitude: intensity * 0.5,
            strongMagnitude: intensity
        }).catch(() => {
            // Vibration failed, disable future attempts
            controllerState.vibrationSupported = false;
        });
    }
}

// Keyboard Input Handlers (unchanged)
function handleKeyDown(e) {
    if (inputSettings.inputMode === 'controller') return; // Ignore keyboard when controller is active


 if (e.code === 'KeyQ' && gameState.gameRunning) {
        e.preventDefault();
        cycleProjectileType(-1); // Previous weapon
        return;
    }

    if (e.code === 'KeyE' && gameState.gameRunning) {
        e.preventDefault();
        cycleProjectileType(1); // Next weapon
        return;
    }

    // Escape key for pause
    if (e.code === 'Escape') {
        e.preventDefault();
        if (gameState.currentState === GameState.PLAYING) {
            window.pauseGame();
        } else if (gameState.currentState === GameState.PAUSED) {
            window.resumeGame();
        }
        return;
    }
    
    // Jump controls (W or Up Arrow)
 if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        keys.space = true;
        
        if (gameState.currentState === GameState.START) {
            window.startGame();
            return;
        }
        if (gameState.currentState === GameState.GAME_OVER) {
            window.restartGame();
            return;
        }
        if (gameState.gameRunning) {
            // FIXED: Pass gameState to startJump
            startJump(gameState);
        }
    }
    
    // Shoot controls (S or Space)
    if (e.code === 'KeyS' || e.code === 'Space') {
        e.preventDefault();
        if (!keys.s) {
            keys.s = true;
            if (gameState.gameRunning) {
                shoot(gameState);
            }
        }
    }
    
    // Movement controls
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        keys.left = true;
    }
    
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        keys.right = true;
    }
}

function handleKeyUp(e) {
    if (inputSettings.inputMode === 'controller') return;
    
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        keys.space = false;
        if (gameState.gameRunning) {
            stopJump();
        }
    }
    
    if (e.code === 'KeyS' || e.code === 'Space') {
        e.preventDefault();
        keys.s = false;
    }
    
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        keys.left = false;
    }
    
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        keys.right = false;
    }
}

// Input Mode Management
export function setInputMode(mode) {
    if (mode === 'controller' && !controllerState.connected) {
        showControllerNotification('No controller connected', 'error');
        return false;
    }
    
    inputSettings.inputMode = mode;
    saveInputSettings();
    
    // Reset input states when switching
    keys.left = false;
    keys.right = false;
    keys.space = false;
    keys.s = false;
    
    console.log(`🎮 Input mode switched to: ${mode}`);
    return true;
}

export function setControllerDeadzone(value) {
    inputSettings.controllerDeadzone = Math.max(0, Math.min(1, value));
    controllerState.deadzone = inputSettings.controllerDeadzone;
    saveInputSettings();
}

export function setTriggerThreshold(value) {
    inputSettings.triggerThreshold = Math.max(0, Math.min(1, value));
    saveInputSettings();
}

// Controller Notification System
function showControllerNotification(message, type = 'info') {
    // Remove existing notification
    const existing = document.getElementById('controllerNotification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.id = 'controllerNotification';
    notification.className = `controller-notification controller-${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                     type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 
                     type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                     'rgba(59, 130, 246, 0.9)'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: 'Rajdhani', sans-serif;
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Add CSS animations if not already present
if (!document.querySelector('#controllerAnimations')) {
    const style = document.createElement('style');
    style.id = 'controllerAnimations';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Public API
export function getControllerInfo() {
    return {
        connected: controllerState.connected,
        name: controllerState.controller?.id || 'None',
        vibrationSupported: controllerState.vibrationSupported,
        inputMode: inputSettings.inputMode,
        deadzone: inputSettings.controllerDeadzone,
        triggerThreshold: inputSettings.triggerThreshold
    };
}

export function testControllerVibration() {
    vibrateController(500, 0.8);
}

// Make functions available globally
window.setInputMode = setInputMode;
window.setControllerDeadzone = setControllerDeadzone;
window.setTriggerThreshold = setTriggerThreshold;
window.getControllerInfo = getControllerInfo;
window.testControllerVibration = testControllerVibration;