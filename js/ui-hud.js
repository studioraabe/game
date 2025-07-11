// js/ui-hud.js - Enhanced Multi-Container HUD System

import { gameState } from './core/gameState.js';
import { projectileSystem, PROJECTILE_CONFIGS, ProjectileType } from './enhanced-projectile-system.js';

// ========================================
// HUD CONTAINER MANAGEMENT
// ========================================

let hudInitialized = false;

export function initHUD() {
    if (hudInitialized) return;
    
    console.log('🎮 Initializing Enhanced Multi-HUD System');
    
    // Check if game container exists
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
        console.error('❌ Game container not found! Retrying in 100ms...');
        setTimeout(initHUD, 100);
        return;
    }
    
    // Remove any existing HUD elements
    removeExistingHUD();
    
    // Create the multi-HUD container and all components
    createMultiHUD();
    
    // Add styles
    addHUDStyles();
    
    // Initial update to show current values
    updateHUD();
    
    hudInitialized = true;
    console.log('✅ Enhanced Multi-HUD System initialized');
}

function removeExistingHUD() {
    // Remove all old HUD elements
    const elementsToRemove = [
        'healthBar', 'bulletCount', 'weaponHUD', 'multiHUD',
        'healthContainer', 'bulletContainer', 'weaponContainer'
    ];
    
    elementsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.remove();
    });
    
    // Remove any duplicate health containers
    const healthContainers = document.querySelectorAll('.health-container, .bullet-container, .weapon-container');
    healthContainers.forEach(container => container.remove());
}

// ========================================
// MULTI-HUD CONTAINER CREATION
// ========================================

function createMultiHUD() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
        console.error('❌ Cannot create multi-HUD - game container not found');
        return;
    }
    
    // Create main multi-HUD container
    const multiHUD = document.createElement('div');
    multiHUD.id = 'multiHUD';
    multiHUD.className = 'multi-hud';
    multiHUD.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
		transform: translateX(-50%);
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        align-content: flex-end;
        padding: 10px;
        gap: 10px 12px;
        width: 374px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10.309px);
        border-radius: 20px;
        z-index: 10;
        visibility: visible !important;
    `;
    
    // Create weapons and energy container
    const weaponsEnergyContainer = document.createElement('div');
    weaponsEnergyContainer.id = 'weaponsEnergyContainer';
    weaponsEnergyContainer.className = 'weapons-energy-container';
    weaponsEnergyContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;
    `;
    
    // Create weapons container
    const weaponsContainer = document.createElement('div');
    weaponsContainer.id = 'weaponsContainer';
    weaponsContainer.className = 'weapons-container';
    weaponsContainer.style.cssText = `
        display: flex;
        gap: 8px;
    `;
    
    // Create energy/bullet bar container
    const energyContainer = document.createElement('div');
    energyContainer.id = 'energyContainer';
    energyContainer.className = 'energy-container';
    energyContainer.style.cssText = `
        flex: 1;
        height: 32px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(60, 194, 253, 0.3);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        min-width: 120px;
    `;
    
    // Create health bar container
    const healthContainer = document.createElement('div');
    healthContainer.id = 'healthContainer';
    healthContainer.className = 'health-container';
    healthContainer.style.cssText = `
        width: 100%;
        height: 32px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(0, 211, 112, 0.3);
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        margin-top: 8px;
    `;
    
    // Assemble the containers
    weaponsEnergyContainer.appendChild(weaponsContainer);
    weaponsEnergyContainer.appendChild(energyContainer);
    
    multiHUD.appendChild(weaponsEnergyContainer);
    multiHUD.appendChild(healthContainer);
    
    gameContainer.appendChild(multiHUD);
    
    console.log('✅ Multi-HUD container created');
}

// ========================================
// WEAPONS SYSTEM
// ========================================

export function updateWeaponHUD() {
    const weaponsContainer = document.getElementById('weaponsContainer');
    if (!weaponsContainer || !projectileSystem) return;
    
    // Clear current weapons
    weaponsContainer.innerHTML = '';
    
    // Get hotkeys from weapon hotkey system
    const WEAPON_HOTKEYS = {
        'KeyQ': ProjectileType.NORMAL,
        'KeyW': ProjectileType.LASER_BEAM,
        'KeyE': ProjectileType.ENERGY_SHOTGUN,
        'KeyR': ProjectileType.CHAIN_LIGHTNING
    };
    
    const hotkeys = Object.keys(WEAPON_HOTKEYS);
    
    // Create a weapon slot for each equipped weapon
    projectileSystem.equippedTypes.forEach((type, index) => {
        const hotkeyCode = hotkeys.find(key => WEAPON_HOTKEYS[key] === type) || '';
        const hotkeyChar = hotkeyCode.replace('Key', '');
        
        const config = PROJECTILE_CONFIGS[type];
        if (!config) return;
        
        // Create weapon slot
        const slot = document.createElement('div');
        slot.className = `weapon-slot ${index === projectileSystem.currentTypeIndex ? 'active' : ''}`;
        slot.dataset.type = type;
        slot.dataset.index = index;
        slot.style.cssText = `
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid ${index === projectileSystem.currentTypeIndex ? '#3AC2FD' : '#444'};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.2s ease;
            cursor: pointer;
            background-size: 24px 24px;
            background-position: center;
            background-repeat: no-repeat;
        `;
        
        // Weapon icon (fallback if no background image)
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
        icon.style.cssText = `
            font-size: 16px;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
			display:none;
        `;
        
        // Hotkey badge (top)
        const key = document.createElement('div');
        key.className = 'weapon-key';
        key.textContent = hotkeyChar || index + 1;
        key.style.cssText = `
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #3AC2FD;
            color: white;
            font-size: 10px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 1px solid #2A8BC7;
        `;
        
        // Cost badge (bottom)
        const cost = document.createElement('div');
        cost.className = 'weapon-cost';
        cost.textContent = config.cost || 1;
        cost.style.cssText = `
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #0066CC;
            color: white;
            font-size: 9px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 1px solid #004499;
        `;
        
        // Cooldown overlay
        const cooldownOverlay = document.createElement('div');
        cooldownOverlay.className = 'weapon-cooldown-overlay';
        cooldownOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 50%;
            border: 2px solid #ff4757;
            display: none;
            align-items: center;
            justify-content: center;
            background: rgba(255, 71, 87, 0.2);
            color: white;
            font-size: 12px;
            font-weight: bold;
        `;
        
        // Assemble the slot
        slot.appendChild(icon);
        slot.appendChild(key);
        slot.appendChild(cost);
        slot.appendChild(cooldownOverlay);
        
        // Add click handler
        slot.addEventListener('click', () => {
            projectileSystem.currentTypeIndex = index;
            updateWeaponHUD();
        });
        
        weaponsContainer.appendChild(slot);
    });
}

function updateWeaponCooldowns() {
    const weaponsContainer = document.getElementById('weaponsContainer');
    if (!weaponsContainer || !projectileSystem) return;
    
    const slots = weaponsContainer.querySelectorAll('.weapon-slot');
    
    slots.forEach(slot => {
        const type = slot.dataset.type;
        if (!type) return;
        
        const cooldownProperty = getCooldownProperty(type);
        if (!cooldownProperty) return;
        
        const currentCooldown = projectileSystem[cooldownProperty] || 0;
        const maxCooldown = PROJECTILE_CONFIGS[type]?.cooldown || 1;
        
        const cooldownOverlay = slot.querySelector('.weapon-cooldown-overlay');
        if (cooldownOverlay) {
            if (currentCooldown > 0) {
                const remainingSeconds = Math.ceil(currentCooldown / 60); // Convert frames to seconds
                cooldownOverlay.textContent = remainingSeconds;
                cooldownOverlay.style.display = 'flex';
                
                // Animated border
                const progress = currentCooldown / maxCooldown;
                cooldownOverlay.style.background = `conic-gradient(#ff4757 ${progress * 360}deg, transparent 0deg)`;
            } else {
                cooldownOverlay.style.display = 'none';
            }
        }
    });
}

function getCooldownProperty(projectileType) {
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
// ENERGY/BULLET BAR SYSTEM
// ========================================

export function updateBulletCounter() {
    const energyContainer = document.getElementById('energyContainer');
    if (!energyContainer || !gameState) return;
    
    // Clear existing content
    energyContainer.innerHTML = '';
    
    // Calculate bullet percentage
    const bulletPercent = Math.max(0, (gameState.bullets / gameState.maxBullets) * 100);
    
    // Create bullet fill bar
    const bulletFill = document.createElement('div');
    bulletFill.className = 'bullet-fill';
    bulletFill.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${bulletPercent}%;
        background: linear-gradient(to right, #0066CC, #3AC2FD);
        border-radius: inherit;
        transition: width 0.3s ease;
    `;
    
    // Create bullet text
    const bulletText = document.createElement('div');
    bulletText.className = 'bullet-text';
    bulletText.textContent = gameState.isBerserker ? '∞' : `${gameState.bullets}/${gameState.maxBullets}`;
    bulletText.style.cssText = `
        position: relative;
        z-index: 2;
        color: white;
        font-size: 14px;
        font-weight: bold;
        font-family: 'Rajdhani', monospace;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        padding: 0 12px;
    `;
    
    // Handle regeneration indicator
    const bulletRegen = gameState.playerStats?.bulletRegen || 0;
    if (bulletRegen > 0.5) {
        energyContainer.classList.add('recharging');
        energyContainer.title = `Regenerating ${bulletRegen.toFixed(2)} bullets/second`;
        
        // Add recharge animation
        bulletFill.style.animation = 'bulletRecharge 2s infinite';
    } else {
        energyContainer.classList.remove('recharging');
        energyContainer.title = '';
        bulletFill.style.animation = 'none';
    }
    
    energyContainer.appendChild(bulletFill);
    energyContainer.appendChild(bulletText);
}

// ========================================
// HEALTH BAR SYSTEM
// ========================================

export function updateHealthBar() {
    const healthContainer = document.getElementById('healthContainer');
    if (!healthContainer || !gameState) return;
    
    // Clear existing content
    healthContainer.innerHTML = '';
    
    // Calculate HP percentage
    const hpPercent = Math.max(0, (gameState.currentHP / gameState.maxHP) * 100);
    
    // Create HP fill
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-fill';
    hpFill.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: ${hpPercent}%;
        background: ${getHealthColor(hpPercent)};
        border-radius: inherit;
        transition: width 0.3s ease, background 0.3s ease;
    `;
    
    // Create shield overlay
    const shieldOverlay = document.createElement('div');
    shieldOverlay.className = 'shield-overlay';
    shieldOverlay.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 100%;
        background: ${gameState.shieldCharges > 0 ? 'rgba(60, 194, 253, 0.3)' : 'transparent'};
        border-radius: inherit;
        transition: background 0.3s ease;
    `;
    
    // Create HP text
    const hpText = document.createElement('div');
    hpText.className = 'hp-text';
    hpText.textContent = `${gameState.currentHP} / ${gameState.maxHP}`;
    hpText.style.cssText = `
        position: relative;
        z-index: 3;
        color: white;
        font-size: 14px;
        font-weight: bold;
        font-family: 'Rajdhani', monospace;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
        padding: 0 12px;
    `;
    
    // Create shield counter
    const shieldCounter = document.createElement('div');
    shieldCounter.className = 'shield-counter';
    shieldCounter.style.cssText = `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 4px;
        z-index: 4;
        ${gameState.shieldCharges > 0 ? 'opacity: 1' : 'opacity: 0.5'};
        transition: opacity 0.3s ease;
    `;
    
    const shieldIcon = document.createElement('span');
    shieldIcon.textContent = '🛡️';
    shieldIcon.style.fontSize = '12px';
    
    const shieldCount = document.createElement('span');
    shieldCount.textContent = gameState.shieldCharges || 0;
    shieldCount.style.cssText = `
        color: white;
        font-size: 12px;
        font-weight: bold;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    `;
    
    shieldCounter.appendChild(shieldIcon);
    shieldCounter.appendChild(shieldCount);
    
    // Handle critical health state
    if (hpPercent <= 20) {
        healthContainer.classList.add('critical-health');
        hpFill.style.animation = 'criticalPulse 1s infinite';
    } else {
        healthContainer.classList.remove('critical-health');
        hpFill.style.animation = 'none';
    }
    
    // Handle regeneration indicator
    const healthRegen = gameState.playerStats?.healthRegen || 0;
    if (healthRegen > 0.5) {
        healthContainer.classList.add('regenerating');
        healthContainer.title = `Regenerating ${healthRegen.toFixed(2)} HP/second`;
        hpFill.style.boxShadow = '0 0 10px rgba(0, 255, 136, 0.5)';
    } else {
        healthContainer.classList.remove('regenerating');
        healthContainer.title = '';
        hpFill.style.boxShadow = 'none';
    }
    
    // Assemble the health bar
    healthContainer.appendChild(hpFill);
    healthContainer.appendChild(shieldOverlay);
    healthContainer.appendChild(hpText);
    healthContainer.appendChild(shieldCounter);
}

function getHealthColor(hpPercent) {
    if (hpPercent <= 20) {
        return 'linear-gradient(to right, #ff4757, #ff6b7a)';
    } else if (hpPercent <= 50) {
        return 'linear-gradient(to right, #ffa502, #ff6348)';
    } else {
        return 'linear-gradient(to right, #00d170, #00ff88)';
    }
}

// ========================================
// STYLES
// ========================================

function addHUDStyles() {
    if (document.getElementById('multiHUDStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'multiHUDStyles';
    style.textContent = `
        @keyframes criticalPulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        @keyframes bulletRecharge {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
            100% { filter: brightness(1); }
        }
        
        .weapon-slot:hover {
            transform: scale(1.05);
            border-color: #3AC2FD !important;
        }
        
        .weapon-slot.active {
            box-shadow: 0 0 10px rgba(60, 194, 253, 0.5);
        }
        
        .critical-health {
            border-color: #ff4757 !important;
        }
        
        .regenerating {
            border-color: #00ff88 !important;
        }
        
        .recharging {
            border-color: #3AC2FD !important;
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// UPDATE INTERVALS
// ========================================

let weaponUpdateInterval = null;

function startUpdateIntervals() {
    // Start cooldown update loop
    if (weaponUpdateInterval) {
        clearInterval(weaponUpdateInterval);
    }
    weaponUpdateInterval = setInterval(updateWeaponCooldowns, 50);
}

function stopUpdateIntervals() {
    if (weaponUpdateInterval) {
        clearInterval(weaponUpdateInterval);
        weaponUpdateInterval = null;
    }
}

// ========================================
// MAIN UPDATE FUNCTION
// ========================================

export function updateHUD() {
    updateHealthBar();
    updateBulletCounter();
    updateWeaponHUD();
    
    // Start update intervals if not already running
    if (!weaponUpdateInterval) {
        startUpdateIntervals();
    }
}

// ========================================
// CLEANUP FUNCTION
// ========================================

export function cleanupHUD() {
    stopUpdateIntervals();
    hudInitialized = false;
}

// ========================================
// GLOBAL EXPORTS
// ========================================

window.initHUD = initHUD;
window.updateHUD = updateHUD;
window.updateHealthBar = updateHealthBar;
window.updateBulletCounter = updateBulletCounter;
window.updateWeaponHUD = updateWeaponHUD;
window.cleanupHUD = cleanupHUD;