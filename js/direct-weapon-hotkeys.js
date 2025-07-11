// direct-weapon-hotkeys.js - Direct Weapon Hotkey Implementation
// This module makes Q, W, E, R keys fire specific weapons directly

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

// Initialize the direct weapon hotkey system
export function initDirectWeaponHotkeys() {
    // Add key listener for direct weapon shooting
    document.addEventListener('keydown', handleDirectWeaponKeydown);
    
    // Override input handling to make Q/W/E/R exclusive to weapons
    overrideInputHandling();
    
    // Hide the old projectile UI if it exists
    hideProjectileUI();
}

// Handle direct weapon selection and shooting keys
function handleDirectWeaponKeydown(event) {
    // Only process if game is running
    if (!gameState || !gameState.gameRunning) return;
    
    // Check if this is a weapon key
    const weaponType = DIRECT_WEAPON_KEYS[event.code];
    if (!weaponType) return;
    
    // Check if weapon is unlocked and equipped
    if (!projectileSystem.unlockedTypes.includes(weaponType)) {
        // Weapon not unlocked yet - show message
        if (player) {
            createScorePopup(
                player.x + player.width/2,
                player.y - 40,
                'Weapon not unlocked!'
            );
        }
        return;
    }
    
    // Find the index of this weapon in equipped weapons
    const weaponIndex = projectileSystem.equippedTypes.indexOf(weaponType);
    
    // If weapon is equipped, switch to it and shoot
    if (weaponIndex >= 0) {
        // Switch to this weapon
        projectileSystem.currentTypeIndex = weaponIndex;
        
        // Get weapon config for name
        const config = window.PROJECTILE_CONFIGS[weaponType];
        

        
        // Update weapon HUD if it exists
        if (window.updateWeaponHUD) {
            window.updateWeaponHUD();
        }
        
        // Immediately shoot with this weapon
        if (window.enhancedShoot) {
            window.enhancedShoot(gameState);
        } else if (window.shoot) {
            window.shoot(gameState);
        }
    } else {
        // Weapon is unlocked but not equipped
        createScorePopup(
            player.x + player.width/2,
            player.y - 40,
            'Weapon not equipped!'
        );
    }
    
    // Always prevent default for Q/W/E/R keys
    event.preventDefault();
    event.stopPropagation();
}

// Override the input handling to make Q/W/E/R exclusive to weapons
function overrideInputHandling() {
    // Override the keydown handler in core/input.js
    if (document.removeEventListener && window.handleKeyDown) {
        // First remove the original handler to avoid duplicates
        document.removeEventListener('keydown', window.handleKeyDown);
        
        // Create a new handler that filters out Q/W/E/R
        const originalHandleKeyDown = window.handleKeyDown;
        window.handleKeyDown = function(e) {
            // Skip Q/W/E/R keys entirely - these are now for weapons only
            if (e.code === 'KeyQ' || e.code === 'KeyW' || e.code === 'KeyE' || e.code === 'KeyR') {
                return;
            }
            
            // Process all other keys normally
            originalHandleKeyDown(e);
        };
        
        // Re-add the modified handler
        document.addEventListener('keydown', window.handleKeyDown);
    }
}

// Function to hide the old projectile UI
function hideProjectileUI() {
    // First, override the createProjectileUI function to do nothing
    if (window.createProjectileUI) {
        window.createProjectileUI = function() {
            // Do nothing - this prevents it from being created again
        };
    }
    
    // Now, remove the existing projectileUI if it exists
    const projectileUI = document.getElementById('projectileUI');
    if (projectileUI) {
        projectileUI.style.display = 'none'; // Hide it first
        
        // Wait a bit to ensure everything is initialized, then remove it
        setTimeout(() => {
            if (projectileUI.parentNode) {
                projectileUI.parentNode.removeChild(projectileUI);
            }
        }, 1000);
    }
    
    // Also disable the update interval for the projectile UI
    if (window.projectileUIUpdateInterval) {
        clearInterval(window.projectileUIUpdateInterval);
        window.projectileUIUpdateInterval = null;
    }
    
    // Prevent cooldown display creation and remove existing one
    if (window.createCooldownDisplay) {
        window.createCooldownDisplay = function() {
            // Do nothing - prevent creation
        };
    }
    
    // Remove existing cooldown display
    const cooldownDisplay = document.getElementById('projectileCooldownDisplay');
    if (cooldownDisplay) {
        cooldownDisplay.style.display = 'none';
        
        setTimeout(() => {
            if (cooldownDisplay.parentNode) {
                cooldownDisplay.parentNode.removeChild(cooldownDisplay);
            }
        }, 1000);
    }
    
    // Clear cooldown display update interval
    if (window.cooldownDisplayInterval) {
        clearInterval(window.cooldownDisplayInterval);
        window.cooldownDisplayInterval = null;
    }
    
    // Also override the cooldown display related functions
    if (window.updateCooldownDisplay) {
        window.updateCooldownDisplay = function() {
            // Do nothing
        };
    }
    
    if (window.reinitializeCooldownDisplay) {
        window.reinitializeCooldownDisplay = function() {
            // Do nothing
        };
    }
}

// Auto-initialize when this module is loaded
export function autoInit() {
    // Wait for game state to be ready
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

// Auto-initialize
autoInit();