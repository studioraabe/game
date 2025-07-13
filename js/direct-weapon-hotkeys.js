// js/direct-weapon-hotkeys.js - COMPLETE REPLACEMENT
// Replace the entire direct-weapon-hotkeys.js file with this enhanced version:

import { ProjectileType, projectileSystem } from './enhanced-projectile-system.js';
import { player } from './core/player.js';
import { gameState } from './core/gameState.js';
import { createScorePopup } from './entities.js';
import { soundManager } from './systems.js';

// Direct weapon selection mapping - keys to weapon types
const DIRECT_WEAPON_KEYS = {
    'KeyQ': ProjectileType.NORMAL,         // Q - Normal Lightning Bolt
    'KeyW': ProjectileType.LASER_BEAM,     // W - Laser Beam
    'KeyE': ProjectileType.ENERGY_SHOTGUN, // E - Energy Shotgun
    'KeyR': ProjectileType.CHAIN_LIGHTNING // R - Chain Lightning
};

// Track which keys are currently being held down
const heldWeaponKeys = new Set();

// Track shooting intervals for each weapon
const weaponShootIntervals = new Map();

// Initialize the direct weapon hotkey system
export function initDirectWeaponHotkeys() {
    // Add key listeners for weapon selection AND shooting
    document.addEventListener('keydown', handleWeaponKeyDown);
    document.addEventListener('keyup', handleWeaponKeyUp);
    
    // Handle window blur to stop all shooting
    window.addEventListener('blur', stopAllWeaponShooting);
    
    // Override input handling to make Q/W/E/R exclusive to weapons
    overrideInputHandling();
    
    // Hide the old projectile UI if it exists
    hideProjectileUI();
    
}

// Handle weapon key press (start shooting)
function handleWeaponKeyDown(event) {
    // Only process if game is running
    if (!gameState || !gameState.gameRunning) return;
    
    // Check if this is a weapon key
    const weaponType = DIRECT_WEAPON_KEYS[event.code];
    if (!weaponType) return;
    
    // Prevent key repeat
    if (heldWeaponKeys.has(event.code)) return;
    
    // Mark key as held
    heldWeaponKeys.add(event.code);
    
    // Find weapon index
    const weaponIndex = projectileSystem.equippedTypes.indexOf(weaponType);
    if (weaponIndex < 0) {
        return;
    }
    
    // Switch to this weapon
    const oldIndex = projectileSystem.currentTypeIndex;
    projectileSystem.currentTypeIndex = weaponIndex;
    
    // Show weapon switch notification
    if (oldIndex !== weaponIndex) {
        const config = window.PROJECTILE_CONFIGS[weaponType];
        
        if (window.createScorePopup && window.player) {
            window.createScorePopup(
                window.player.x + window.player.width/2,
                window.player.y - 40,
                `${config.name} [${event.key.toUpperCase()}]`
            );
        }
        
        if (window.updateWeaponHUD) {
            window.updateWeaponHUD();
        }
        
    }
    
    // Start shooting immediately
    shootWeapon();
    
    // For rapid-fire weapons, set up continuous shooting
    if (weaponType !== ProjectileType.LASER_BEAM) { // Laser is continuous by nature
        startContinuousShooting(event.code, weaponType);
    }
    
    event.preventDefault();
    event.stopPropagation();
}

// Handle weapon key release (stop shooting)
function handleWeaponKeyUp(event) {
    const weaponType = DIRECT_WEAPON_KEYS[event.code];
    if (!weaponType) return;
    
    // Mark key as not held
    heldWeaponKeys.delete(event.code);
    
    // Stop continuous shooting for this weapon
    stopContinuousShooting(event.code);
    
    event.preventDefault();
    event.stopPropagation();
}

// Shoot with the currently selected weapon
function shootWeapon() {
    if (!gameState || !gameState.gameRunning) return false;
    
    // Use enhanced shoot function if available
    if (window.enhancedShoot) {
        return window.enhancedShoot(gameState);
    } else if (window.shoot) {
        return window.shoot(gameState);
    }
    
    return false;
}

// Start continuous shooting for a weapon
function startContinuousShooting(keyCode, weaponType) {
    // Don't start if already shooting this weapon
    if (weaponShootIntervals.has(keyCode)) return;
    
    // Get weapon config for firing rate
    const config = window.PROJECTILE_CONFIGS[weaponType];
    if (!config) return;
    
    // Calculate shooting interval based on weapon cooldown
    const baseInterval = Math.max(config.cooldown || 60, 10); // Minimum 10ms
    const shootInterval = baseInterval * 16.67; // Convert to milliseconds (60fps = 16.67ms per frame)
    
    // Start shooting interval
    const intervalId = setInterval(() => {
        // Only shoot if key is still held and game is running
        if (heldWeaponKeys.has(keyCode) && gameState?.gameRunning) {
            // Make sure we're still using the right weapon
            const currentWeapon = projectileSystem.equippedTypes[projectileSystem.currentTypeIndex];
            if (currentWeapon === weaponType) {
                shootWeapon();
            }
        } else {
            // Stop shooting if conditions not met
            stopContinuousShooting(keyCode);
        }
    }, shootInterval);
    
    weaponShootIntervals.set(keyCode, intervalId);
}

// Stop continuous shooting for a weapon
function stopContinuousShooting(keyCode) {
    const intervalId = weaponShootIntervals.get(keyCode);
    if (intervalId) {
        clearInterval(intervalId);
        weaponShootIntervals.delete(keyCode);
    }
}

// Stop all weapon shooting (for window blur, game pause, etc.)
function stopAllWeaponShooting() {
    heldWeaponKeys.clear();
    
    for (const [keyCode, intervalId] of weaponShootIntervals) {
        clearInterval(intervalId);
    }
    weaponShootIntervals.clear();
    
}

// Override the input handling to make Q/W/E/R exclusive to weapons
function overrideInputHandling() {
    // Override the keydown handler in core/input.js if it exists
    if (window.handleKeyDown) {
        const originalHandleKeyDown = window.handleKeyDown;
        
        window.handleKeyDown = function(e) {
            // Skip Q/W/E/R keys entirely - these are now for weapons only
            if (e.code === 'KeyQ' || e.code === 'KeyW' || e.code === 'KeyE' || e.code === 'KeyR') {
                return;
            }
            
            // Process all other keys normally
            originalHandleKeyDown(e);
        };
    }
}

// Function to hide the old projectile UI
function hideProjectileUI() {
    // Disable old UI creation functions
    if (window.createProjectileUI) {
        window.createProjectileUI = function() {};
    }
    
    if (window.updateCooldownDisplay) {
        window.updateCooldownDisplay = function() {};
    }
    
    // Hide existing UI elements
    const elementsToHide = ['projectileUI', 'projectileCooldownDisplay'];
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Clear intervals
    if (window.projectileUIUpdateInterval) {
        clearInterval(window.projectileUIUpdateInterval);
        window.projectileUIUpdateInterval = null;
    }
    
    if (window.cooldownDisplayInterval) {
        clearInterval(window.cooldownDisplayInterval);
        window.cooldownDisplayInterval = null;
    }
}

// Auto-initialize when this module is loaded
export function autoInit() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initDirectWeaponHotkeys, 1000);
        });
    } else {
        setTimeout(initDirectWeaponHotkeys, 1000);
    }
}

// Make functions available globally
window.initDirectWeaponHotkeys = initDirectWeaponHotkeys;
window.stopAllWeaponShooting = stopAllWeaponShooting;

// Auto-initialize
autoInit();

