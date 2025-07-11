// js/weapon-system-integration.js - Integration module for weapon hotkey system
// This file connects the weapon system to the main game

import { initWeaponHotkeySystem, WEAPON_BUFFS } from './weapon-hotkey-system.js';

// ========================================
// INTEGRATION WITH MAIN GAME
// ========================================

// Integrate with the game's initialization process
export function integrateWeaponSystem() {
    console.log('🔫 Integrating Weapon Hotkey System');
    
    // Hook into the game's initialization
    hookIntoGameInit();
    
    // Replace projectile buffs with weapon buffs
    replaceProjectileBuffs();
    
    console.log('🔫 Weapon System Integration Complete');
}

// Hook into the game's initialization process
function hookIntoGameInit() {
    // Save original init function
    const originalInit = window.init;
    
    // Replace with our version that also initializes the weapon system
    window.init = function() {
        // Call the original init
        if (originalInit) {
            originalInit();
        }
        
        // Initialize our weapon system
        console.log('🔫 Initializing Weapon Hotkey System from game init');
        initWeaponHotkeySystem();
    };
    
    // If game is already initialized, initialize the weapon system directly
    if (window.gameState && document.readyState === 'complete') {
        initWeaponHotkeySystem();
    }
}

// Replace projectile buffs with weapon buffs
function replaceProjectileBuffs() {
    // Try to find the PROJECTILE_BUFFS from projectile-buff-integration.js
    if (window.PROJECTILE_BUFFS) {
        console.log('🔫 Found PROJECTILE_BUFFS, replacing with WEAPON_BUFFS');
        
        // Replace the PROJECTILE_BUFFS with our WEAPON_BUFFS
        window.PROJECTILE_BUFFS = WEAPON_BUFFS;
    }
    
    // Also update createEnhancedBuffSystem if it exists
    if (window.createEnhancedBuffSystem) {
        const originalCreateEnhancedBuffSystem = window.createEnhancedBuffSystem;
        
        window.createEnhancedBuffSystem = function() {
            // Call original function
            const result = originalCreateEnhancedBuffSystem();
            
            // Find and remove the projectile buffs from STAT_BUFFS
            if (window.STAT_BUFFS) {
                // Replace the projectile buffs with weapon buffs in STAT_BUFFS
                const projectileBuffIds = ['laserMastery', 'shotgunBlast', 'chainLightning', 'seekingBolt', 'energyEfficiency', 'rapidFire'];
                
                // Filter out the existing projectile buffs
                window.STAT_BUFFS = window.STAT_BUFFS.filter(buff => !projectileBuffIds.includes(buff.id));
                
                // Add our weapon buffs
                window.STAT_BUFFS = [...window.STAT_BUFFS, ...WEAPON_BUFFS];
                
                // Also update gameState's available buffs if it exists
                if (window.gameState && window.gameState.availableBuffs) {
                    window.gameState.availableBuffs = [...window.STAT_BUFFS];
                }
                
                console.log(`🔫 Enhanced buff system updated with ${WEAPON_BUFFS.length} weapon buffs`);
            }
            
            return result;
        };
    }
}

// ========================================
// OVERRIDE PROJECTILE CONTROLS
// ========================================

// Disable the original Q/E cycle functions since we're using direct weapon selection
function overrideProjectileCycling() {
    // Replace the cycleProjectileType function with a no-op
    if (window.cycleProjectileType) {
        const originalCycleProjectileType = window.cycleProjectileType;
        
        window.cycleProjectileType = function(direction) {
            // Do nothing - we're using direct hotkeys instead
            console.log('🔫 Weapon cycling disabled - using direct hotkeys instead');
            
            // Show a message to the user
            if (window.createScorePopup && window.player) {
                window.createScorePopup(
                    window.player.x + window.player.width/2,
                    window.player.y - 40,
                    'Use Q/W/E/R to select weapons'
                );
            }
            
            return false;
        };
    }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

export {
    initWeaponHotkeySystem,
    WEAPON_BUFFS
};

// ========================================
// AUTO-INITIALIZE
// ========================================

// Make functions available globally
window.integrateWeaponSystem = integrateWeaponSystem;

// Auto-initialize when this module is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure the game is initialized
    setTimeout(() => {
        integrateWeaponSystem();
        overrideProjectileCycling();
    }, 1000);
});

// Alternative initialization for when document is already loaded
if (document.readyState === 'complete') {
    setTimeout(() => {
        integrateWeaponSystem();
        overrideProjectileCycling();
    }, 1000);
}