// js/ui-hud.js - Centralized HUD System for Health, Bullets, and Weapons

import { gameState } from './core/gameState.js';
import { projectileSystem, PROJECTILE_CONFIGS, ProjectileType } from './enhanced-projectile-system.js';

// ========================================
// HUD CONTAINER MANAGEMENT
// ========================================

let hudInitialized = false;

export function initHUD() {
    if (hudInitialized) return;
    
    console.log('🎮 Initializing HUD System');
    
    // Check if game container exists
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
        console.error('❌ Game container not found! Retrying in 100ms...');
        setTimeout(initHUD, 100);
        return;
    }
    
    // Remove any existing HUD elements
    removeExistingHUD();
    
    // Create new HUD elements
    createHealthBar();
    createBulletCounter();
    createWeaponHUD();
    
    // Initial update to show current values
    updateHUD();
    
    hudInitialized = true;
    console.log('✅ HUD System initialized');
    
    // Debug: Log created elements
    console.log('📊 HUD Elements created:');
    console.log('- Health Bar:', document.getElementById('healthBar'));
    console.log('- Bullet Counter:', document.getElementById('bulletCount'));
    console.log('- Weapon HUD:', document.getElementById('weaponHUD'));
}

function removeExistingHUD() {
    // Remove old health bar
    const oldHealthBar = document.getElementById('healthBar');
    if (oldHealthBar) oldHealthBar.remove();
    
    // Remove old bullet counter
    const oldBulletCount = document.getElementById('bulletCount');
    if (oldBulletCount) oldBulletCount.remove();
    
    // Remove old weapon HUD
    const oldWeaponHUD = document.getElementById('weaponHUD');
    if (oldWeaponHUD) oldWeaponHUD.remove();
    
    // Remove any duplicate health containers
    const healthContainers = document.querySelectorAll('.health-container');
    healthContainers.forEach(container => container.remove());
}

// ========================================
// HEALTH BAR SYSTEM
// ========================================

function createHealthBar() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
        console.error('❌ Cannot create health bar - game container not found');
        return;
    }
    
    const healthBar = document.createElement('div');
    healthBar.id = 'healthBar';
    healthBar.className = 'ui-panel';
    healthBar.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        width: 180px;
        height: 48px;
        z-index: 10;
        display: flex;
        align-items: center;
        visibility: visible !important;
    `;
    
    const healthContainer = document.createElement('div');
    healthContainer.id = 'healthContainer';
    healthContainer.className = 'health-container';
    healthContainer.style.cssText = `
        width: 100%;
        height: 32px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid rgba(0, 211, 112, 0.25);
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
    `;
    
    healthBar.appendChild(healthContainer);
    gameContainer.appendChild(healthBar);
    
    console.log('✅ Health bar created');
}

export function updateHealthBar() {
    const healthContainer = document.getElementById('healthContainer');
    if (!healthContainer || !gameState) return;
    
    // Clear existing content
    healthContainer.innerHTML = '';
    
    // Calculate HP percentage
    const hpPercent = Math.max(0, (gameState.currentHP / gameState.maxHP) * 100);
    
    // Create main HP bar container
    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    
    // Create HP fill
    const hpFill = document.createElement('div');
    hpFill.className = 'hp-fill';
    hpFill.style.width = `${hpPercent}%`;
    
    // Set HP bar color based on health level
    if (hpPercent <= 20) {
        hpFill.classList.add('critical');
        healthContainer.classList.add('critical-health');
    } else if (hpPercent <= 50) {
        hpFill.classList.add('warning');
        healthContainer.classList.remove('critical-health');
    } else {
        hpFill.classList.add('healthy');
        healthContainer.classList.remove('critical-health');
    }
    
    // Create shield overlay
    const shieldOverlay = document.createElement('div');
    shieldOverlay.className = 'shield-overlay';
    
    // Create HP text
    const hpText = document.createElement('div');
    hpText.className = 'hp-text';
    hpText.textContent = `${gameState.currentHP} / ${gameState.maxHP}`;
    
    // Create shield counter
    const shieldCounter = document.createElement('div');
    shieldCounter.className = 'shield-counter';
    
    const shieldIcon = document.createElement('span');
    shieldIcon.className = 'shield-icon';
    shieldIcon.textContent = '🛡️';
    
    const shieldCount = document.createElement('span');
    shieldCount.className = 'shield-count';
    shieldCount.textContent = gameState.shieldCharges || 0;
    
    shieldCounter.appendChild(shieldIcon);
    shieldCounter.appendChild(shieldCount);
    
    // Handle shield state
    if (gameState.shieldCharges > 0) {
        healthContainer.classList.add('shield-active');
    } else {
        healthContainer.classList.remove('shield-active');
    }
    
    // Handle regeneration indicator
    const healthRegen = gameState.playerStats?.healthRegen || 0;
    if (healthRegen > 0.5) {
        healthContainer.classList.add('regenerating');
        healthContainer.title = `Regenerating ${healthRegen.toFixed(2)} HP/second`;
    } else {
        healthContainer.classList.remove('regenerating');
        healthContainer.title = '';
    }
    
    // Assemble the health bar
    hpBar.appendChild(hpFill);
    hpBar.appendChild(shieldOverlay);
    hpBar.appendChild(hpText);
    hpBar.appendChild(shieldCounter);
    
    healthContainer.appendChild(hpBar);
}

// ========================================
// BULLET COUNTER SYSTEM
// ========================================

function createBulletCounter() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
        console.error('❌ Cannot create bullet counter - game container not found');
        return;
    }
    
    const bulletCount = document.createElement('div');
    bulletCount.id = 'bulletCount';
    bulletCount.className = 'ui-panel';
    bulletCount.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 16px;
        height: 48px;
        visibility: visible !important;
        background: linear-gradient(to top, rgba(0, 80, 43, 0.0), rgba(0, 80, 43, 0.1));
        backdrop-filter: blur(10px);
        border-radius: 12px;
    `;
    
    bulletCount.innerHTML = `
        <span class="bulletcountValue" id="bullets" style="color: #00ff88; font-weight: 800; font-family: 'Rajdhani', monospace; font-size: 40px;">0</span>
        <span class="ui-label pulse" id="bulletsLabel" style="font-size: 24px; margin-top: -10px; color:#00d4ff">🗲</span>
    `;
    
    gameContainer.appendChild(bulletCount);
    
    console.log('✅ Bullet counter created');
}

export function updateBulletCounter() {
    const bulletElement = document.getElementById('bullets');
    if (!bulletElement || !gameState) return;
    
    // Show current/max bullets or infinity for berserker
    const bulletDisplay = gameState.isBerserker ? '∞' : `${gameState.bullets}/${gameState.maxBullets}`;
    bulletElement.textContent = bulletDisplay;
    
    // Handle regeneration indicator
    const bulletRegen = gameState.playerStats?.bulletRegen || 0;
    if (bulletRegen > 0.5) {
        bulletElement.classList.add('recharging');
        bulletElement.title = `Regenerating ${bulletRegen.toFixed(2)} bullets/second`;
    } else {
        bulletElement.classList.remove('recharging');
        bulletElement.title = '';
    }
}

// ========================================
// WEAPON HUD SYSTEM
// ========================================

let weaponUpdateInterval = null;

function createWeaponHUD() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer || !window.projectileSystem) return;
    
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
    
    gameContainer.appendChild(weaponHUD);
    
    // Add CSS if not already added
    if (!document.getElementById('weaponHUDStyles')) {
        const style = document.createElement('style');
        style.id = 'weaponHUDStyles';
        style.textContent = getWeaponHUDStyles();
        document.head.appendChild(style);
    }
    
    // Initial update
    updateWeaponHUD();
    
    // Start cooldown update loop
    if (weaponUpdateInterval) {
        clearInterval(weaponUpdateInterval);
    }
    weaponUpdateInterval = setInterval(updateWeaponCooldowns, 50);
}

export function updateWeaponHUD() {
    const weaponHUD = document.getElementById('weaponHUD');
    if (!weaponHUD || !projectileSystem) return;
    
    // Clear current HUD
    weaponHUD.innerHTML = '';
    
    // Get hotkeys from weapon hotkey system
    const WEAPON_HOTKEYS = {
        'KeyQ': ProjectileType.NORMAL,
        'KeyW': ProjectileType.LASER_BEAM,
        'KeyE': ProjectileType.ENERGY_SHOTGUN,
        'KeyR': ProjectileType.CHAIN_LIGHTNING
    };
    
    const hotkeys = Object.keys(WEAPON_HOTKEYS);
    
    // Create a slot for each equipped weapon
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
        
        // Add click handler
        slot.addEventListener('click', () => {
            projectileSystem.currentTypeIndex = index;
            updateWeaponHUD();
        });
        
        weaponHUD.appendChild(slot);
    });
}

function updateWeaponCooldowns() {
    const weaponHUD = document.getElementById('weaponHUD');
    if (!weaponHUD || !projectileSystem) return;
    
    const slots = weaponHUD.querySelectorAll('.weapon-slot');
    
    slots.forEach(slot => {
        const type = slot.dataset.type;
        if (!type) return;
        
        const cooldownProperty = getCooldownProperty(type);
        if (!cooldownProperty) return;
        
        const currentCooldown = projectileSystem[cooldownProperty] || 0;
        const maxCooldown = PROJECTILE_CONFIGS[type]?.cooldown || 1;
        const cooldownPercent = currentCooldown / maxCooldown;
        
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

function getWeaponHUDStyles() {
    return `
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
        
        .weapon-slot.cooldown .weapon-cooldown {
            background-color: #ff4757;
            animation: cooldownPulse 0.5s infinite;
        }
        
        @keyframes cooldownPulse {
            0% { opacity: 0.7; }
            50% { opacity: 1; }
            100% { opacity: 0.7; }
        }
    `;
}

// ========================================
// MAIN UPDATE FUNCTION
// ========================================

export function updateHUD() {
    updateHealthBar();
    updateBulletCounter();
    // Weapon HUD updates itself via interval
}

// ========================================
// CLEANUP FUNCTION
// ========================================

export function cleanupHUD() {
    if (weaponUpdateInterval) {
        clearInterval(weaponUpdateInterval);
        weaponUpdateInterval = null;
    }
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