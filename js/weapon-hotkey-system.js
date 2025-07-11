// js/weapon-hotkey-system.js - Direct Weapon Hotkey System
// This module makes all weapons available from the start and assigns hotkeys

import { 
    ProjectileType, 
    projectileSystem, 
    unlockProjectileType, 
    equipProjectileType,
    cycleProjectileType,
    getCurrentProjectileType,
    PROJECTILE_CONFIGS
} from './enhanced-projectile-system.js';

import { gameState } from './core/gameState.js';
import { player } from './core/player.js';
import { createScorePopup } from './entities.js';

// ========================================
// WEAPON HOTKEY CONFIGURATION
// ========================================

// Define weapon hotkeys mapping
export const WEAPON_HOTKEYS = {
    'KeyQ': ProjectileType.NORMAL,         // Q - Normal Lightning Bolt
    'KeyW': ProjectileType.LASER_BEAM,     // W - Laser Beam
    'KeyE': ProjectileType.ENERGY_SHOTGUN, // E - Energy Shotgun
    'KeyR': ProjectileType.CHAIN_LIGHTNING // R - Chain Lightning
};

// Define specialized weapon buff configurations
export const WEAPON_BUFFS = [
    {
        id: 'boltMastery',
        title: '⚡ Bolt Mastery',
        desc: '-25% cooldown and +20% damage for Lightning Bolt',
        effect: () => {
            // Optimize normal bolts
            if (PROJECTILE_CONFIGS[ProjectileType.NORMAL]) {
                const config = PROJECTILE_CONFIGS[ProjectileType.NORMAL];
                config.cooldown = Math.floor(config.cooldown * 0.75);
                config.damage = config.damage * 1.2;
                
                // Add to playerStats selected buffs
                if (gameState && gameState.playerStats) {
                    gameState.playerStats.selectedBuffs.push('boltMastery');
                }
                
                console.log('⚡ Bolt Mastery applied: Lightning Bolt enhanced!');
            }
        }
    },
    {
        id: 'laserFocus',
        title: '🔵 Laser Focus',
        desc: '-30% cooldown and +30% damage for Laser Beam',
        effect: () => {
            // Optimize laser beam
            if (PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM]) {
                const config = PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM];
                config.cooldown = Math.floor(config.cooldown * 0.7);
                config.damage = config.damage * 1.3;
                
                // Add to playerStats selected buffs
                if (gameState && gameState.playerStats) {
                    gameState.playerStats.selectedBuffs.push('laserFocus');
                }
                
                console.log('🔵 Laser Focus applied: Laser Beam enhanced!');
            }
        }
    },
    {
        id: 'shotgunSpread',
        title: '💥 Shotgun Spread',
        desc: '+2 pellets and +15% damage for Energy Shotgun',
        effect: () => {
            // Optimize shotgun
            if (PROJECTILE_CONFIGS[ProjectileType.ENERGY_SHOTGUN]) {
                const config = PROJECTILE_CONFIGS[ProjectileType.ENERGY_SHOTGUN];
                config.pellets = (config.pellets || 5) + 2; // Add 2 more pellets
                config.damage = config.damage * 1.15;
                
                // Add to playerStats selected buffs
                if (gameState && gameState.playerStats) {
                    gameState.playerStats.selectedBuffs.push('shotgunSpread');
                }
                
                console.log('💥 Shotgun Spread applied: Energy Shotgun enhanced!');
            }
        }
    },
    {
        id: 'chainReaction',
        title: '⚡ Chain Reaction',
        desc: '+2 chain jumps and +15% damage for Chain Lightning',
        effect: () => {
            // Optimize chain lightning
            if (PROJECTILE_CONFIGS[ProjectileType.CHAIN_LIGHTNING]) {
                const config = PROJECTILE_CONFIGS[ProjectileType.CHAIN_LIGHTNING];
                config.maxChains = (config.maxChains || 3) + 2; // Add 2 more chain jumps
                config.damage = config.damage * 1.15;
                
                // Add to playerStats selected buffs
                if (gameState && gameState.playerStats) {
                    gameState.playerStats.selectedBuffs.push('chainReaction');
                }
                
                console.log('⚡ Chain Reaction applied: Chain Lightning enhanced!');
            }
        }
    },
    {
        id: 'weaponOptimizer',
        title: '🔧 Weapon Optimizer',
        desc: '-15% cooldown for all weapons but +10% energy cost',
        effect: () => {
            // Apply to all weapons
            Object.values(ProjectileType).forEach(type => {
                if (PROJECTILE_CONFIGS[type]) {
                    const config = PROJECTILE_CONFIGS[type];
                    config.cooldown = Math.floor(config.cooldown * 0.85);
                    config.cost = Math.ceil(config.cost * 1.1);
                }
            });
            
            // Add to playerStats selected buffs
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('weaponOptimizer');
            }
            
            console.log('🔧 Weapon Optimizer applied: All weapons enhanced!');
        }
    },
    {
        id: 'energySaver',
        title: '💡 Energy Saver',
        desc: '-25% energy cost for all weapons but +10% cooldown',
        effect: () => {
            // Apply to all weapons
            Object.values(ProjectileType).forEach(type => {
                if (PROJECTILE_CONFIGS[type]) {
                    const config = PROJECTILE_CONFIGS[type];
                    config.cost = Math.max(1, Math.floor(config.cost * 0.75));
                    config.cooldown = Math.ceil(config.cooldown * 1.1);
                }
            });
            
            // Add to playerStats selected buffs
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('energySaver');
            }
            
            console.log('💡 Energy Saver applied: All weapons use less energy!');
        }
    },
    {
        id: 'overcharge',
        title: '⚠️ Overcharge',
        desc: '+40% damage for all weapons but +25% energy cost',
        effect: () => {
            // Apply to all weapons
            Object.values(ProjectileType).forEach(type => {
                if (PROJECTILE_CONFIGS[type]) {
                    const config = PROJECTILE_CONFIGS[type];
                    config.damage = config.damage * 1.4;
                    config.cost = Math.ceil(config.cost * 1.25);
                }
            });
            
            // Add to playerStats selected buffs
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('overcharge');
            }
            
            console.log('⚠️ Overcharge applied: All weapons deal more damage but cost more!');
        }
    },
    {
        id: 'rapidFire',
        title: '🔥 Rapid Fire',
        desc: '-40% cooldown for all weapons but -15% damage',
        effect: () => {
            // Apply to all weapons
            Object.values(ProjectileType).forEach(type => {
                if (PROJECTILE_CONFIGS[type]) {
                    const config = PROJECTILE_CONFIGS[type];
                    config.cooldown = Math.floor(config.cooldown * 0.6);
                    config.damage = config.damage * 0.85;
                }
            });
            
            // Add to playerStats selected buffs
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('rapidFire');
            }
            
            console.log('🔥 Rapid Fire applied: All weapons fire faster but deal less damage!');
        }
    }
];

// ========================================
// INITIALIZATION FUNCTION
// ========================================

// Initialize the weapon hotkey system
export function initWeaponHotkeySystem() {
    console.log('🔫 Initializing Weapon Hotkey System');
    
    // Unlock and equip all weapon types immediately
    unlockAllWeapons();
    
    // Add key listener for weapon hotkeys
    addWeaponHotkeyListeners();
    
    // Replace the original projectile buffs with weapon enhancement buffs
    replaceProjectileBuffsWithWeaponBuffs();
    
    // Weapon HUD is now created by ui-hud.js
    
    console.log('🔫 Weapon Hotkey System Initialized');
}

// ========================================
// WEAPON SYSTEM FUNCTIONS
// ========================================

// Unlock and equip all weapon types immediately
function unlockAllWeapons() {
    // Already unlocked? Skip
    if (projectileSystem.unlockedTypes.length >= 4) {
        console.log('🔫 All weapons already unlocked');
        return;
    }
    
    // Unlock and equip all weapon types
    Object.values(ProjectileType).forEach(type => {
        // Skip if already unlocked
        if (projectileSystem.unlockedTypes.includes(type)) {
            return;
        }
        
        // Unlock the weapon
        unlockProjectileType(type);
        
        // If we have space, equip it too
        if (projectileSystem.equippedTypes.length < 4) {
            equipProjectileType(type);
        }
        
        console.log(`🔫 Unlocked and equipped: ${PROJECTILE_CONFIGS[type].name}`);
    });
    
    // Force update the weapon HUD (now provided by ui-hud.js)
    if (window.updateWeaponHUD) {
        setTimeout(window.updateWeaponHUD, 100);
    }
}

// Add key listeners for weapon hotkeys
function addWeaponHotkeyListeners() {
    // Remove any existing listeners to avoid duplicates
    document.removeEventListener('keydown', handleWeaponHotkeys);
    
    // Add our hotkey listener
    document.addEventListener('keydown', handleWeaponHotkeys);
    
    console.log('🔫 Weapon hotkey listeners added');
}

// Handle weapon hotkey presses
function handleWeaponHotkeys(event) {
    // Ignore if game is not running
    if (!gameState || !gameState.gameRunning) {
        return;
    }
    
    // Check if this is a weapon hotkey
    const weaponType = WEAPON_HOTKEYS[event.code];
    if (!weaponType) {
        return;
    }
    
    // Switch to this weapon if unlocked and equipped
    if (projectileSystem.unlockedTypes.includes(weaponType) && 
        projectileSystem.equippedTypes.includes(weaponType)) {
        
        // Find the index of this weapon in equipped weapons
        const weaponIndex = projectileSystem.equippedTypes.indexOf(weaponType);
        
        // Switch to this weapon if not already selected
        if (projectileSystem.currentTypeIndex !== weaponIndex) {
            projectileSystem.currentTypeIndex = weaponIndex;
            
            // Show weapon switch notification
            const config = PROJECTILE_CONFIGS[weaponType];
            createScorePopup(
                player.x + player.width/2,
                player.y - 40,
                `${config.name} [${event.key}]`
            );
            
            // Update the weapon HUD (now provided by ui-hud.js)
            if (window.updateWeaponHUD) {
                window.updateWeaponHUD();
            }
            
            console.log(`🔫 Switched to: ${config.name} (${event.key})`);
        }
    }
}

// Replace projectile unlock buffs with weapon enhancement buffs
function replaceProjectileBuffsWithWeaponBuffs() {
    // Reference to STAT_BUFFS (from roguelike-stats.js or window)
    const STAT_BUFFS = window.STAT_BUFFS;
    
    // If STAT_BUFFS exists, replace the projectile buffs
    if (STAT_BUFFS) {
        // Find and remove the projectile unlock buffs
        const projectileBuffIds = [
            'laserMastery', 'shotgunBlast', 'chainLightning', 'seekingBolt',
            'energyEfficiency', 'rapidFire'
        ];
        
        // Filter out the projectile unlock buffs
        const filteredBuffs = STAT_BUFFS.filter(buff => 
            !projectileBuffIds.includes(buff.id)
        );
        
        // Add the new weapon enhancement buffs
        const updatedBuffs = [...filteredBuffs, ...WEAPON_BUFFS];
        
        // Replace the original STAT_BUFFS with the updated one
        window.STAT_BUFFS = updatedBuffs;
        
        // Also update gameState's available buffs if it exists
        if (gameState && gameState.availableBuffs) {
            gameState.availableBuffs = updatedBuffs;
        }
        
        console.log(`🔫 Replaced projectile unlock buffs with ${WEAPON_BUFFS.length} weapon enhancement buffs`);
    } else {
        console.warn('⚠️ STAT_BUFFS not found, could not replace projectile buffs');
    }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

export {
    unlockAllWeapons,
    handleWeaponHotkeys
};

// ========================================
// GLOBAL EXPORTS
// ========================================

// Make these functions available globally
window.initWeaponHotkeySystem = initWeaponHotkeySystem;
window.unlockAllWeapons = unlockAllWeapons;
// window.updateWeaponHUD is now provided by ui-hud.js
window.WEAPON_BUFFS = WEAPON_BUFFS;

// Auto-initialize when loaded
setTimeout(() => {
    if (window.gameState) {
        initWeaponHotkeySystem();
    }
}, 500);