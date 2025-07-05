// core/input.js - Input Handling

import { gameState } from './gameState.js';
import { startJump, stopJump } from './player.js';
import { shoot } from '../entities.js';
import { GameState } from './constants.js';

// Input state
export const keys = {
    left: false,
    right: false,
    space: false,
    s: false
};

// Initialize input listeners
export function initInput() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

function handleKeyDown(e) {
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
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        keys.space = true;
        
        // Handle different game states
        if (gameState.currentState === GameState.START) {
            window.startGame();
            return;
        }
        if (gameState.currentState === GameState.GAME_OVER) {
            window.restartGame();
            return;
        }
        if (gameState.gameRunning) {
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
    // Jump release
    if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        e.preventDefault();
        keys.space = false;
        if (gameState.gameRunning) {
            stopJump();
        }
    }
    
    // Shoot release
    if (e.code === 'KeyS' || e.code === 'Space') {
        e.preventDefault();
        keys.s = false;
    }
    
    // Movement release
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        e.preventDefault();
        keys.left = false;
    }
    
    if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        e.preventDefault();
        keys.right = false;
    }
}