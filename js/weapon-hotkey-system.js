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
    
    // Create weapon HUD
    createWeaponHUD();
    
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
    
    // Force update the weapon HUD
    setTimeout(updateWeaponHUD, 100);
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
            
            // Update the weapon HUD
            updateWeaponHUD();
            
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
// WEAPON HUD FUNCTIONS
// ========================================

// Create the weapon HUD
function createWeaponHUD() {
    // Check if it already exists
    if (document.getElementById('weaponHUD')) {
        return;
    }
    
    // Create the weapon HUD container
    const weaponHUD = document.createElement('div');
    weaponHUD.id = 'weaponHUD';
    weaponHUD.className = 'weapon-hud';
    weaponHUD.style.cssText = `
        position: absolute;
        top: 70px;
        left: 16px;
        display: flex;
        gap: 10px;
        z-index: 100;
    `;
    
    // Add it to the game container
    document.getElementById('gameContainer').appendChild(weaponHUD);
    
    // Add CSS for the weapon HUD
    if (!document.getElementById('weaponHUDStyles')) {
        const style = document.createElement('style');
        style.id = 'weaponHUDStyles';
        style.textContent = `
            .weapon-slot {
                width: 40px;
                height: 40px;
                background-color: rgba(0, 0, 0, 0.6);
                border: 2px solid #444;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            
            .weapon-slot.active {
                border-color: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
                transform: scale(1.1);
            }
            
            .weapon-icon {
                font-size: 20px;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
            }
            
            .weapon-key {
                position: absolute;
                top: -8px;
                right: -8px;
                background-color: #444;
                color: white;
                font-size: 10px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 1px solid #555;
            }
            
            .weapon-cooldown {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 3px;
                background-color: #00ff88;
                transform-origin: left;
                transform: scaleX(0);
                transition: transform 0.1s linear;
            }
            
            @keyframes cooldownPulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
            
            .weapon-slot.cooldown .weapon-cooldown {
                background-color: #ff4757;
                animation: cooldownPulse 0.5s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initial update
    updateWeaponHUD();
    
    // Start the update loop for cooldowns
    setInterval(updateWeaponCooldowns, 50);
}

// Update the weapon HUD
function updateWeaponHUD() {
    const weaponHUD = document.getElementById('weaponHUD');
    if (!weaponHUD) {
        return;
    }
    
    // Clear the current HUD
    weaponHUD.innerHTML = '';
    
    // Get the list of hotkeys
    const hotkeys = Object.keys(WEAPON_HOTKEYS);
    
    // Create a slot for each equipped weapon
    projectileSystem.equippedTypes.forEach((type, index) => {
        // Get the hotkey for this weapon
        const hotkeyCode = hotkeys.find(key => WEAPON_HOTKEYS[key] === type) || '';
        const hotkeyChar = hotkeyCode.replace('Key', '');
        
        // Get the weapon config
        const config = PROJECTILE_CONFIGS[type];
        if (!config) return;
        
        // Create weapon slot
        const slot = document.createElement('div');
        slot.className = `weapon-slot ${index === projectileSystem.currentTypeIndex ? 'active' : ''}`;
        slot.dataset.type = type;
        slot.dataset.index = index;
        
        // Weapon icon
        const iconMap = {
            [ProjectileType.NORMAL]: '⚡',
            [ProjectileType.LASER_BEAM]: '🔵',
            [ProjectileType.ENERGY_SHOTGUN]: '💥',
            [ProjectileType.CHAIN_LIGHTNING]: '⚡',
            [ProjectileType.SEEKING_BOLT]: '🎯'
        };
        
        const icon = document.createElement('div');
        icon.className = 'weapon-icon';
        icon.textContent = iconMap[type] || '⚡';
        
        // Hotkey badge
        const key = document.createElement('div');
        key.className = 'weapon-key';
        key.textContent = hotkeyChar || index + 1;
        
        // Cooldown indicator
        const cooldown = document.createElement('div');
        cooldown.className = 'weapon-cooldown';
        
        // Assemble the slot
        slot.appendChild(icon);
        slot.appendChild(key);
        slot.appendChild(cooldown);
        
        // Add click handler to switch weapons
        slot.addEventListener('click', () => {
            projectileSystem.currentTypeIndex = index;
            updateWeaponHUD();
        });
        
        weaponHUD.appendChild(slot);
    });
}

// Update weapon cooldowns
function updateWeaponCooldowns() {
    const weaponHUD = document.getElementById('weaponHUD');
    if (!weaponHUD) {
        return;
    }
    
    // Get all weapon slots
    const slots = weaponHUD.querySelectorAll('.weapon-slot');
    
    // Update each slot's cooldown indicator
    slots.forEach(slot => {
        const type = slot.dataset.type;
        if (!type) return;
        
        // Get the cooldown property for this weapon type
        const cooldownProperty = getCooldownProperty(type);
        if (!cooldownProperty) return;
        
        // Get the current cooldown value
        const currentCooldown = projectileSystem[cooldownProperty] || 0;
        
        // Get the max cooldown for this weapon
        const maxCooldown = PROJECTILE_CONFIGS[type]?.cooldown || 1;
        
        // Calculate the cooldown percentage
        const cooldownPercent = currentCooldown / maxCooldown;
        
        // Update the cooldown indicator
        const cooldownIndicator = slot.querySelector('.weapon-cooldown');
        if (cooldownIndicator) {
            if (currentCooldown > 0) {
                slot.classList.add('cooldown');
                cooldownIndicator.style.transform = `scaleX(${cooldownPercent})`;
            } else {
                slot.classList.remove('cooldown');
                cooldownIndicator.style.transform = 'scaleX(0)';
            }
        }
    });
}

// Helper function to get the cooldown property for a weapon type
function getCooldownProperty(projectileType) {
    // Map weapon types to their cooldown properties
    const cooldownMap = {
        [ProjectileType.NORMAL]: 'normalCooldown',
        [ProjectileType.LASER_BEAM]: 'laserCooldown',
        [ProjectileType.ENERGY_SHOTGUN]: 'shotgunCooldown',
        [ProjectileType.CHAIN_LIGHTNING]: 'lightningCooldown',
        [ProjectileType.SEEKING_BOLT]: 'seekingCooldown'
    };
    
    return cooldownMap[projectileType] || null;
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

export {
    unlockAllWeapons,
    updateWeaponHUD,
    handleWeaponHotkeys
};

// ========================================
// GLOBAL EXPORTS
// ========================================

// Make these functions available globally
window.initWeaponHotkeySystem = initWeaponHotkeySystem;
window.unlockAllWeapons = unlockAllWeapons;
window.updateWeaponHUD = updateWeaponHUD;
window.WEAPON_BUFFS = WEAPON_BUFFS;

// Auto-initialize when loaded
setTimeout(() => {
    if (window.gameState) {
        initWeaponHotkeySystem();
    }
}, 500);