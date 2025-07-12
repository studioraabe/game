// js/enhanced-damage-system.js - ALL-IN-ONE ENHANCED DAMAGE FEEDBACK SYSTEM
// Drop this single file into your js/ folder and import it in main.js

import { gameState } from './core/gameState.js';
import { player } from './core/player.js';
import { GAME_CONSTANTS } from './core/constants.js';
import { soundManager } from './systems.js';

// ========================================
// ENHANCED GLOW MANAGER (Collision-Free)
// ========================================

class GlowManager {
    constructor() {
        this.activeGlows = {
            combo: { active: false, intensity: 0, color: '', persistent: true },
            damage: { active: false, intensity: 0, color: '', timer: 0, persistent: false },
            critical: { active: false, intensity: 0, color: '', timer: 0, persistent: false },
            shield: { active: false, intensity: 0, color: '', timer: 0, persistent: false },
            corruption: { active: false, intensity: 0, color: '', timer: 0, persistent: false }
        };
        
        this.gameContainer = null;
        this.canvas = null;
    }

    init() {
        this.gameContainer = document.getElementById('gameContainer');
        this.canvas = document.getElementById('gameCanvas');
    }

    // PUBLIC API - Called by combo system
    setComboGlow(intensity, color) {
        this.activeGlows.combo = {
            active: intensity > 0,
            intensity: intensity,
            color: color,
            persistent: true
        };
        this.updateContainerGlow();
    }

    // PUBLIC API - Called by damage system  
    setDamageGlow(type, intensity, color, duration = 0) {
        if (!this.activeGlows[type]) {
            console.warn(`Unknown glow type: ${type}`);
            return;
        }

        this.activeGlows[type] = {
            active: intensity > 0,
            intensity: intensity,
            color: color,
            timer: duration,
            persistent: false,
            originalTimer: duration,
            originalIntensity: intensity
        };
        this.updateContainerGlow();
    }

    // Update all glow timers
    update(deltaTime = 1) {
        let needsUpdate = false;

        // Update non-persistent glows
        Object.keys(this.activeGlows).forEach(key => {
            const glow = this.activeGlows[key];
            if (glow.active && !glow.persistent && glow.timer > 0) {
                glow.timer -= deltaTime;
                
                if (glow.timer <= 0) {
                    glow.active = false;
                    glow.intensity = 0;
                    needsUpdate = true;
                } else {
                    // Fade out over time with flicker
                    const progress = glow.timer / (glow.originalTimer || glow.timer);
                    const flicker = Math.sin(Date.now() * 0.03) * 0.2 + 0.8;
                    glow.intensity = glow.originalIntensity * progress * flicker;
                    needsUpdate = true;
                }
            }
        });

        if (needsUpdate) {
            this.updateContainerGlow();
        }
    }

    // CORE FUNCTION: Combines all active glows
    updateContainerGlow() {
        if (!this.gameContainer) return;

        const activeGlows = Object.values(this.activeGlows).filter(g => g.active);
        
        if (activeGlows.length === 0) {
            this.gameContainer.style.boxShadow = '';
            return;
        }

        // Priority system: damage effects override combo temporarily
        let primaryGlow = null;
        
        // 1. Critical damage has highest priority
        if (this.activeGlows.critical.active) {
            primaryGlow = this.activeGlows.critical;
        }
        // 2. Corruption has high priority (bat blood curse)
        else if (this.activeGlows.corruption.active) {
            primaryGlow = this.activeGlows.corruption;
        }
        // 3. Regular damage third priority  
        else if (this.activeGlows.damage.active) {
            primaryGlow = this.activeGlows.damage;
        }
        // 4. Shield effects fourth priority
        else if (this.activeGlows.shield.active) {
            primaryGlow = this.activeGlows.shield;
        }
        // 5. Combo glow lowest priority (background)
        else if (this.activeGlows.combo.active) {
            primaryGlow = this.activeGlows.combo;
        }

        if (!primaryGlow) return;

        // Build combined box-shadow
        const shadows = [];
        
        // Add primary glow (most prominent)
        const primarySize = 15 + (primaryGlow.intensity * 25);
        const primaryAlpha = Math.min(primaryGlow.intensity, 0.9);
        const primaryColor = this.getColorRGB(primaryGlow.color);
        
        shadows.push(`0 0 ${primarySize}px rgba(${primaryColor}, ${primaryAlpha})`);
        shadows.push(`0 0 ${primarySize * 1.5}px rgba(${primaryColor}, ${primaryAlpha * 0.6})`);
        shadows.push(`0 0 ${primarySize * 2}px rgba(${primaryColor}, ${primaryAlpha * 0.3})`);
        shadows.push(`inset 0 0 ${primarySize * 0.5}px rgba(${primaryColor}, ${primaryAlpha * 0.2})`);

        // Add combo glow as background layer if it's not the primary
        if (this.activeGlows.combo.active && primaryGlow !== this.activeGlows.combo) {
            const comboSize = 10 + (this.activeGlows.combo.intensity * 15);
            const comboAlpha = Math.min(this.activeGlows.combo.intensity * 0.4, 0.4);
            const comboColor = this.getColorRGB(this.activeGlows.combo.color);
            
            // Add combo as subtle background glow
            shadows.push(`0 0 ${comboSize * 2}px rgba(${comboColor}, ${comboAlpha})`);
        }

        this.gameContainer.style.boxShadow = shadows.join(', ');
    }

    // Helper: Convert color formats to RGB values
    getColorRGB(color) {
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                return this.hexToRGB(color);
            } else if (color.includes(',')) {
                return color;
            } else {
                return this.getNamedColorRGB(color);
            }
        }
        return '255, 23, 68'; // Fallback to --error
    }

    hexToRGB(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `${r}, ${g}, ${b}`;
    }

    getNamedColorRGB(colorName) {
        const colorMap = {
            'damage': '255, 23, 68',      // --error
            'critical': '255, 23, 68',    // --error  
            'shield': '65, 105, 225',     // Shield blue
            'corruption': '139, 0, 139',  // Purple/lilac for bat blood curse
            '#ff1744': '255, 23, 68',     // --error
            '#4169E1': '65, 105, 225',    // Shield blue
            '#00ff88': '0, 255, 136',     // --primary
            '#FF4500': '255, 69, 0',      // Orange
            '#FFD700': '255, 215, 0',     // Gold
            '#DC143C': '220, 20, 60',     // Crimson
        };
        
        return colorMap[colorName] || '255, 23, 68';
    }

    // Clear all effects
    reset() {
        Object.keys(this.activeGlows).forEach(key => {
            this.activeGlows[key].active = false;
            this.activeGlows[key].intensity = 0;
            this.activeGlows[key].timer = 0;
        });
        this.updateContainerGlow();
    }
}

// Create global instance
const glowManager = new GlowManager();

// ========================================
// SCREEN SHAKE SYSTEM
// ========================================

let screenShake = {
    active: false,
    intensity: 0,
    duration: 0,
    timer: 0,
    offsetX: 0,
    offsetY: 0
};

function triggerScreenShake(intensity, duration) {
    screenShake.active = true;
    screenShake.intensity = intensity;
    screenShake.duration = duration;
    screenShake.timer = duration;
    
    console.log(`📳 Screen shake: intensity ${intensity}px, duration ${duration} frames`);
}

function updateScreenShake() {
    if (!screenShake.active) return;
    
    screenShake.timer -= gameState.deltaTime || 1;
    
    if (screenShake.timer <= 0) {
        // End shake
        screenShake.active = false;
        screenShake.offsetX = 0;
        screenShake.offsetY = 0;
        applyScreenShake(0, 0);
    } else {
        // Calculate current shake intensity (decreases over time)
        const progress = screenShake.timer / screenShake.duration;
        const currentIntensity = screenShake.intensity * progress;
        
        // Generate random shake offset
        screenShake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
        screenShake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
        
        applyScreenShake(screenShake.offsetX, screenShake.offsetY);
    }
}

function applyScreenShake(offsetX, offsetY) {
    const gameContainer = document.getElementById('gameContainer');
    const canvas = document.getElementById('gameCanvas');
    
    if (gameContainer) {
        gameContainer.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
    
    // Also shake canvas for extra effect when shake is strong
    if (canvas && Math.abs(offsetX) > 5) {
        canvas.style.transform = `translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)`;
    } else if (canvas) {
        canvas.style.transform = '';
    }
}

// ========================================
// CRITICAL HEALTH OVERLAY SYSTEM - FIXED
// ========================================

let criticalHealthOverlay = {
    active: false,
    intensity: 0,
    pulseTimer: 0,
    persistentCheck: false, // New property to track if we're continuously checking health
    outerGlowActive: false  // Track if outer glow is active
};

// Function to determine if health is in critical state
function isHealthCritical(gameState) {
    if (!gameState) return false;
    
    // Consider health critical when below 20% and no shields
    const hpPercent = (gameState.currentHP / gameState.maxHP) * 100;
    return hpPercent <= 20 && gameState.shieldCharges <= 0;
}

// Activate critical health overlay with pulsing effect
function activateCriticalHealthOverlay() {
    if (criticalHealthOverlay.active) return;
    
    criticalHealthOverlay.active = true;
    criticalHealthOverlay.intensity = 0.35;
    criticalHealthOverlay.pulseTimer = 0;
    criticalHealthOverlay.outerGlowActive = true;
    
    console.log('🔴 Critical health overlay activated');
    applyCriticalHealthOverlay();
    
    // Apply persistent outer container glow
    if (!glowManager.gameContainer) {
        glowManager.init();
    }
    glowManager.setDamageGlow('critical', 0.9, 'critical', 6000); // Very long duration
    
    // If we're not already persistently checking health, start now
    if (!criticalHealthOverlay.persistentCheck) {
        criticalHealthOverlay.persistentCheck = true;
        startPersistentHealthCheck();
    }
}

// Deactivate critical health overlay with fade-out
function deactivateCriticalHealthOverlay() {
    if (!criticalHealthOverlay.active) return;
    
    criticalHealthOverlay.active = false;
    criticalHealthOverlay.intensity = 0;
    criticalHealthOverlay.outerGlowActive = false;
    
    console.log('✅ Critical health overlay deactivated');
    removeCriticalHealthOverlay();
    
    // Remove the outer container glow
    if (glowManager.gameContainer) {
        glowManager.setDamageGlow('critical', 0, 'critical', 0);
    }
}

// Update critical health overlay pulse effect
function updateCriticalHealthOverlay() {
    if (!criticalHealthOverlay.active) return;
    
    // Pulsing effect
    criticalHealthOverlay.pulseTimer += (window.gameState?.deltaTime || 1) * 0.1;
    const pulse = Math.sin(criticalHealthOverlay.pulseTimer) * 0.15 + 0.85;
    const currentIntensity = criticalHealthOverlay.intensity * pulse;
    
    applyCriticalHealthOverlay(currentIntensity);
    
    // Keep the outer glow refreshed as long as we're in critical state
    if (criticalHealthOverlay.outerGlowActive) {
        if (!glowManager.gameContainer) {
            glowManager.init();
        }
        
        // Check if critical glow needs to be refreshed (if timer is getting low)
        const criticalGlow = glowManager.activeGlows.critical;
        if (!criticalGlow.active || criticalGlow.timer < 1000) {
            // Update the outer glow with pulsing intensity that matches the inner overlay
            const glowIntensity = 0.8 + (pulse * 0.2); // Range from 0.8 to 1.0 based on pulse
            glowManager.setDamageGlow('critical', glowIntensity, 'critical', 6000);
        }
    }
}

// Apply critical health overlay visual effect
function applyCriticalHealthOverlay(intensity = 0.35) {
    let overlay = document.getElementById('criticalHealthOverlay');
    
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'criticalHealthOverlay';
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 5;
            border-radius: inherit;
            transition: opacity 0.5s ease;
        `;
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(overlay);
        }
    }
    
    // Create red vignette/fisheye effect
    const redIntensity = Math.min(intensity, 0.6);
    
    overlay.style.background = `
        radial-gradient(ellipse at center, 
            rgba(255, 23, 68, 0) 0%, 
            rgba(255, 23, 68, 0) 15%, 
            rgba(255, 23, 68, ${redIntensity * 0.1}) 35%,
            rgba(255, 23, 68, ${redIntensity * 0.2}) 55%,
            rgba(255, 23, 68, ${redIntensity * 0.35}) 75%,
            rgba(255, 23, 68, ${redIntensity * 0.5}) 90%,
            rgba(255, 23, 68, ${redIntensity}) 100%
        )
    `;
    
    overlay.style.opacity = intensity > 0 ? '1' : '0';
}

// Remove critical health overlay
function removeCriticalHealthOverlay() {
    const overlay = document.getElementById('criticalHealthOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay.parentNode && !criticalHealthOverlay.active) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }
}

// Continuously check health status for persistent critical effects
function startPersistentHealthCheck() {
    // Only run if game is initialized
    if (!window.gameState) {
        setTimeout(startPersistentHealthCheck, 500);
        return;
    }
    
    // Check if health is critical and update overlay accordingly
    const checkHealthStatus = () => {
        if (!window.gameState || !criticalHealthOverlay.persistentCheck) return;
        
        const isCritical = isHealthCritical(window.gameState);
        
        if (isCritical && !criticalHealthOverlay.active) {
            activateCriticalHealthOverlay();
        } else if (!isCritical && criticalHealthOverlay.active) {
            deactivateCriticalHealthOverlay();
        }
        
        // Continue checking while game is running
        if (window.gameState.gameRunning || criticalHealthOverlay.active) {
            requestAnimationFrame(checkHealthStatus);
        } else {
            // Stop persistent checking when game is not running
            criticalHealthOverlay.persistentCheck = false;
            criticalHealthOverlay.outerGlowActive = false;
            
            // Make sure glow is cleared when game stops
            if (glowManager.gameContainer) {
                glowManager.setDamageGlow('critical', 0, 'critical', 0);
            }
        }
    };
    
    // Start the continuous health check
    requestAnimationFrame(checkHealthStatus);
}

// ========================================
// ENHANCED AUDIO FEEDBACK
// ========================================

function enhanceAudioFeedback(damageType, hpRemaining, hasShields) {
    switch(damageType) {
        case 'shield':
            if (!hasShields) {
                // Shield just broke - metallic break sound
                soundManager.play(400, 0.3, 'triangle');
                setTimeout(() => soundManager.play(200, 0.4, 'triangle'), 100);
                setTimeout(() => soundManager.play(150, 0.3, 'sawtooth'), 200);
            } else {
                // Shield absorbed hit - lighter metallic sound
                soundManager.play(600, 0.2, 'triangle');
                setTimeout(() => soundManager.play(400, 0.2, 'triangle'), 80);
            }
            break;
            
        case 'health':
            // Base hit sound is already called by soundManager.hit()
            if (hpRemaining <= 20) { // Low HP threshold
                // Additional critical health sound - deep, ominous
                setTimeout(() => soundManager.play(80, 0.8, 'sawtooth'), 100);
                setTimeout(() => soundManager.play(60, 0.6, 'sawtooth'), 300);
            }
            break;
            
        case 'corruption':
            // Corruption/blood curse sound - eerie
            soundManager.play(120, 0.4, 'triangle');
            setTimeout(() => soundManager.play(100, 0.5, 'triangle'), 150);
            break;
    }
}

// ========================================
// MAIN DAMAGE FEEDBACK FUNCTION
// ========================================

export function triggerDamageEffects(gameStateParam, damageType = 'health') {
    const hpRemaining = gameStateParam.currentHP;
    const maxHP = gameStateParam.maxHP;
    const hpPercent = hpRemaining / maxHP;
    const hasShields = gameStateParam.shieldCharges > 0;
    
    console.log(`💥 Damage feedback triggered: ${damageType}, HP: ${hpRemaining}/${maxHP} (${Math.round(hpPercent * 100)}%), Shields: ${gameStateParam.shieldCharges}`);
    
    // 1. SCREEN SHAKE - varies by damage severity and HP percentage
    let shakeIntensity = 8;
    let shakeDuration = 20; // frames at 60fps = ~0.33 seconds
    
    switch(damageType) {
        case 'shield':
            if (gameStateParam.shieldCharges === 0) {
                // Shield just broke
                shakeIntensity = 6;
                shakeDuration = 15;
            } else {
                // Shield absorbed damage
                shakeIntensity = 4;
                shakeDuration = 10;
            }
            break;
        case 'health':
            if (hpPercent <= 0.15) { // 15% HP or less - critical
                shakeIntensity = 15;
                shakeDuration = 30;
            } else if (hpPercent <= 0.35) { // 35% HP or less - warning
                shakeIntensity = 12;
                shakeDuration = 25;
            } else {
                // Normal health damage
                shakeIntensity = 8;
                shakeDuration = 20;
            }
            break;
        case 'corruption':
            // Corruption/blood curse damage with lilac/purple effects
            shakeIntensity = 6;
            shakeDuration = 18;
            break;
    }
    
    triggerScreenShake(shakeIntensity, shakeDuration);
    
    // 2. CONTAINER GLOW USING GLOW MANAGER
    let glowColor = 'damage';
    let glowIntensity = 0.8;
    let glowDuration = 45; // frames
    
    switch(damageType) {
        case 'shield':
            if (gameStateParam.shieldCharges === 0) {
                // Shield broke - blue to red transition
                glowManager.setDamageGlow('shield', 0.6, 'shield', 20);
                setTimeout(() => glowManager.setDamageGlow('damage', 0.8, 'damage', 35), 300);
                return; // Early return to avoid double glow
            } else {
                // Shield hit - blue glow only
                glowColor = 'shield';
                glowIntensity = 0.5;
                glowDuration = 30;
            }
            break;
        case 'health':
            if (hpPercent <= 0.15) {
                glowColor = 'critical';
                glowIntensity = 1.2;
                glowDuration = 60;
            } else if (hpPercent <= 0.35) {
                glowColor = 'damage';
                glowIntensity = 1.0;
                glowDuration = 50;
            } else {
                glowColor = 'damage';
                glowIntensity = 0.8;
                glowDuration = 45;
            }
            break;
        case 'corruption':
            glowColor = 'corruption';
            glowIntensity = 0.7;
            glowDuration = 180;
            break;
    }
    
    if (!glowManager.gameContainer) {
        glowManager.init();
    }
    glowManager.setDamageGlow(glowColor, glowIntensity, glowColor, glowDuration);
    
    // 3. CRITICAL HEALTH OVERLAY - use improved system with persistent checking
    if (isHealthCritical(gameStateParam)) {
        activateCriticalHealthOverlay();
    } else if (hpPercent > 0.20 || hasShields) {
        deactivateCriticalHealthOverlay();
    }
    
    // 4. ENHANCED AUDIO FEEDBACK
    enhanceAudioFeedback(damageType, hpRemaining, hasShields);
}

// ========================================
// COMBO SYSTEM INTEGRATION
// ========================================

export function setComboGlow(intensity, color) {
    if (!glowManager.gameContainer) {
        glowManager.init();
    }
    
    // Normalize intensity for glow manager (combo values are much higher)
    const normalizedIntensity = Math.min(intensity / 20, 1.0);
    glowManager.setComboGlow(normalizedIntensity, color);
}

export function clearComboGlow() {
    if (glowManager.gameContainer) {
        glowManager.setComboGlow(0, '');
    }
}

// ========================================
// MAIN UPDATE FUNCTION
// ========================================

export function updateDamageEffects() {
    updateScreenShake();
    glowManager.update(gameState.deltaTime || 1);
    updateCriticalHealthOverlay();
    
    // Add continuous health status check
    if (window.gameState && window.gameState.gameRunning && !criticalHealthOverlay.persistentCheck) {
        criticalHealthOverlay.persistentCheck = true;
        startPersistentHealthCheck();
    }
    
    // Make sure critical outer glow stays synced with inner overlay
    if (window.gameState && criticalHealthOverlay.persistentCheck) {
        const isCritical = isHealthCritical(window.gameState);
        
        // Ensure outer glow matches critical health status
        if (isCritical && !criticalHealthOverlay.outerGlowActive) {
            activateCriticalHealthOverlay();
        } else if (!isCritical && criticalHealthOverlay.outerGlowActive) {
            deactivateCriticalHealthOverlay();
        }
    }
}

// ========================================
// INITIALIZATION & CLEANUP
// ========================================

export function initDamageEffects() {
    glowManager.init();
    
    // Start persistent health check
    criticalHealthOverlay.persistentCheck = true;
    startPersistentHealthCheck();
    
    console.log('🎮 Enhanced Damage Feedback System: READY');
}

export function resetDamageEffects() {
    // Reset screen shake
    screenShake.active = false;
    screenShake.offsetX = 0;
    screenShake.offsetY = 0;
    applyScreenShake(0, 0);
    
    // Reset glow manager
    glowManager.reset();
    
    // Reset critical overlay
    deactivateCriticalHealthOverlay();
    
    // Reset persistent checking
    criticalHealthOverlay.persistentCheck = false;
    criticalHealthOverlay.outerGlowActive = false;
    
    console.log('🔄 All damage effects reset');
}

// ========================================
// DEBUG FUNCTIONS
// ========================================

export function testScreenShake(intensity = 8) {
    triggerScreenShake(intensity, 20);
}

export function testContainerGlow(color = 'damage', intensity = 0.8) {
    if (!glowManager.gameContainer) {
        glowManager.init();
    }
    glowManager.setDamageGlow(color, intensity, color, 45);
}

export function testCriticalOverlay() {
    if (criticalHealthOverlay.active) {
        deactivateCriticalHealthOverlay();
    } else {
        activateCriticalHealthOverlay();
    }
}

// ========================================
// GLOBAL EXPORTS FOR DEBUGGING
// ========================================

export const damageEffectsDebug = {
    testScreenShake,
    testContainerGlow,
    testCriticalOverlay,
    resetDamageEffects,
    glowManager
};