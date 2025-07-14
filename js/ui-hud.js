// js/ui-hud.js - Enhanced Multi-Container HUD System with Top Stats Bar

import { gameState } from './core/gameState.js';
import { projectileSystem, PROJECTILE_CONFIGS, ProjectileType } from './enhanced-projectile-system.js';

// ========================================
// HUD CONTAINER MANAGEMENT
// ========================================

let hudInitialized = false;

export function initHUD() {
    if (hudInitialized) return;
    
    
    // Check if game container exists
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
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
}

function removeExistingHUD() {
    // Remove all old HUD elements
    const elementsToRemove = [
        'healthBar', 'bulletCount', 'weaponHUD', 'multiHUD', 'topStatsBar',
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
        return;
    }
    
    // Create top stats bar first
    createTopStatsBar();
    
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
        flex-direction: row-reverse;
        flex-wrap: wrap;
        justify-content: flex-end;
        align-items: center;
        align-content: flex-end;
        padding: 10px 14px;
        gap: 20px;
        width: 588px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
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
        gap: 20px;
        flex: 1;
    `;
    
    // Create weapons container
    const weaponsContainer = document.createElement('div');
    weaponsContainer.id = 'weaponsContainer';
    weaponsContainer.className = 'weapons-container';
    weaponsContainer.style.cssText = `
        display: flex;
        gap: 12px;
    `;
    
    // Create energy/bullet bar container
    const energyContainer = document.createElement('div');
    energyContainer.id = 'energyContainer';
    energyContainer.className = 'energy-container';
    energyContainer.style.cssText = `
        flex: 1;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);

        border-radius: 12px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 160px !important;
    `;
    
    // Create health bar container
    const healthContainer = document.createElement('div');
    healthContainer.id = 'healthContainer';
    healthContainer.className = 'health-container';
    healthContainer.style.cssText = `
        width: 160px;
        height: 32px;
        background: rgba(255, 255, 255, 0.1);
        
        border-radius: 12px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
		order: 1;
       
    `;
    
    // Assemble the containers
    weaponsEnergyContainer.appendChild(weaponsContainer);
    weaponsEnergyContainer.appendChild(energyContainer);
    
    multiHUD.appendChild(weaponsEnergyContainer);
    multiHUD.appendChild(healthContainer);
    
    gameContainer.appendChild(multiHUD);
}

// ========================================
// TOP STATS BAR CREATION
// ========================================

function createTopStatsBar() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    // Remove existing stats bar if it exists
    const existingStatsBar = document.getElementById('topStatsBar');
    if (existingStatsBar) existingStatsBar.remove();
    
    // Create top stats bar container
    const topStatsBar = document.createElement('div');
    topStatsBar.id = 'topStatsBar';
    topStatsBar.className = 'top-stats-bar';
    topStatsBar.style.cssText = `
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        height: 24px;
        background: rgba(255, 255, 255, 0.03);
        border-width: 0px 1px 1px 1px;
        border-style: solid;
        border-color: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10.309px);
        border-radius: 0px 0px 20px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0 10px;
        z-index: 10;
        visibility: visible !important;
        min-width: 520px;
		flex-direction:row;
    `;
    
    gameContainer.appendChild(topStatsBar);
}

// ========================================
// TOP STATS BAR SYSTEM
// ========================================

export function updateTopStatsBar() {
    const topStatsBar = document.getElementById('topStatsBar');
    if (!topStatsBar || !gameState) return;
    
    // Clear existing content
    topStatsBar.innerHTML = '';
	
	
	   const baseDamageLevel1 = 20; // From GAME_CONSTANTS.PLAYER_BASE_DAMAGE
    const currentBaseDamage = gameState.baseDamage || baseDamageLevel1;
    const damageBonus = gameState.playerStats?.damageBonus || 0;
    const totalDamage = currentBaseDamage * (1 + damageBonus / 100);
    const totalDamageIncrease = Math.round(((totalDamage / baseDamageLevel1) - 1) * 100);
    
    // Calculate values and determine colors
    const stats = [
      {
            label: 'DMG',
            value: `+${totalDamageIncrease}%`,
            color: getStatColor(totalDamageIncrease, 0)
        },
        {
            label: 'Crit',
            value: `x${(gameState.playerStats?.critDamage || 1.5).toFixed(1)}`,
            color: getStatColor(gameState.playerStats?.critDamage || 1.5, 1.5)
        },
        {
            label: 'Chance',
            value: `${gameState.playerStats?.critChance || 0}%`,
            color: getStatColor(gameState.playerStats?.critChance || 0, 0)
        },
        {
            label: 'Move Spd',
            value: `+${gameState.playerStats?.moveSpeed || 0}%`,
            color: getStatColor(gameState.playerStats?.moveSpeed || 0, 0)
        },
        {
            label: 'Health Regen',
            value: `${(gameState.playerStats?.healthRegen || 0).toFixed(1)}/s`,
            color: getStatColor(gameState.playerStats?.healthRegen || 0, 0.5)
        },
        {
            label: 'Energy Regen',
            value: `${(gameState.playerStats?.bulletRegen || 0).toFixed(1)}/s`,
            color: getStatColor(gameState.playerStats?.bulletRegen || 0, 0.5)
        },
        {
            label: 'Life Steal',
            value: `${gameState.playerStats?.lifeSteal || 0}%`,
            color: getStatColor(gameState.playerStats?.lifeSteal || 0, 0)
        }
    ];
    
    // Create stat items
    stats.forEach((stat, index) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';
        statItem.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 4px;
        `;
        
        // Create label
        const label = document.createElement('div');
        label.className = 'stat-label';
        label.textContent = stat.label;
        label.style.cssText = `
            font-family: 'Rajdhani';
            font-style: normal;
            font-weight: 600;
            font-size: 10px;
            line-height: 12px;
            color: #d0d0d0;
            text-align: center;
        `;
        
        // Create value
        const value = document.createElement('div');
        value.className = 'stat-value';
        value.textContent = stat.value;
        value.style.cssText = `
            font-family: 'Rajdhani';
            font-style: normal;
            font-weight: 600;
            font-size: 10px;
            line-height: 12px;
            color: ${stat.color};
            text-align: center;
        `;
        
        statItem.appendChild(label);
        statItem.appendChild(value);
        topStatsBar.appendChild(statItem);
        
        // Add separator (except for last item)
        if (index < stats.length - 1) {
            const separator = document.createElement('div');
            separator.style.cssText = `
                width: 0px;
                height: 12px;
                background: rgba(255, 255, 255, 0.1);
                margin: 0 2px;
            `;
            topStatsBar.appendChild(separator);
        }
    });
}

// Helper function to determine stat color based on value and baseline
function getStatColor(currentValue, baselineValue) {
    if (currentValue > baselineValue) {
        return '#6AE0A8'; // Increased
    } else if (currentValue < baselineValue) {
        return '#CF393B'; // Decreased
    } else {
        return '#d0d0d0'; // Neutral
    }
}

// ========================================
// WEAPONS SYSTEM
// ========================================

export function updateWeaponHUD(forceRefresh = false) {
    const weaponsContainer = document.getElementById('weaponsContainer');
    if (!weaponsContainer || !projectileSystem) return;
    
    // If force refresh is requested, clear everything
    if (forceRefresh) {
        weaponsContainer.innerHTML = '';
        if (weaponSlotStates) {
            weaponSlotStates.clear();
        }
    }
    
    // Only clear if we have no slots or if weapons changed
    const existingSlots = weaponsContainer.querySelectorAll('.weapon-slot');
    const needsRefresh = existingSlots.length !== projectileSystem.equippedTypes.length || forceRefresh;
    
    if (needsRefresh) {
        weaponsContainer.innerHTML = '';
    }
    
    // Get hotkeys from weapon hotkey system
    const WEAPON_HOTKEYS = {
        'KeyQ': ProjectileType.NORMAL,
        'KeyW': ProjectileType.LASER_BEAM,
        'KeyE': ProjectileType.ENERGY_SHOTGUN,
        'KeyR': ProjectileType.CHAIN_LIGHTNING
    };
    
    const hotkeys = Object.keys(WEAPON_HOTKEYS);
    
    // Get weapon background images
    const weaponBackgrounds = {
        [ProjectileType.NORMAL]: 'url("assets/weapon-bolt.png")',
        [ProjectileType.LASER_BEAM]: 'url("assets/weapon-laser.png")',
        [ProjectileType.ENERGY_SHOTGUN]: 'url("assets/weapon-shotgun.png")',
        [ProjectileType.CHAIN_LIGHTNING]: 'url("assets/weapon-lightning.png")',
        [ProjectileType.SEEKING_BOLT]: 'url("assets/weapon-seeking.png")'
    };
    
    // Create a weapon slot for each equipped weapon
    projectileSystem.equippedTypes.forEach((type, index) => {
        const hotkeyCode = hotkeys.find(key => WEAPON_HOTKEYS[key] === type) || '';
        const hotkeyChar = hotkeyCode.replace('Key', '');
        
        // CRITICAL: Get fresh config data every time
        const config = window.PROJECTILE_CONFIGS[type];
        if (!config) {
            console.warn(`⚠️ Missing config for weapon type: ${type}`);
            return;
        }
        
        // Log current config for debugging
        
        const isActive = index === projectileSystem.currentTypeIndex;
        
        // Check if slot already exists and is current
        let slot = weaponsContainer.querySelector(`[data-type="${type}"][data-index="${index}"]`);
        
        if (!slot || needsRefresh) {
            // Create new weapon slot
            slot = document.createElement('div');
            slot.className = `weapon-slot ${isActive ? 'active' : ''}`;
            slot.dataset.type = type;
            slot.dataset.index = index;
            slot.style.cssText = `
                width: 40px;
                height: 40px;
                background: rgba(0, 0, 0, 0.8);
                border: 2px solid #444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                transition: all 0.2s ease;
                cursor: pointer;
                background-image: ${weaponBackgrounds[type] || 'none'};
                background-size: 32px 32px;
                background-position: center;
                background-repeat: no-repeat;
                background-size: cover;
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
                background: rgba(255, 255, 255, 0.1);
                border: 0.5px solid rgba(49, 49, 49, 0.4);
                backdrop-filter: blur(10.309px);
                border-radius: 3px;
                color: white;
                font-size: 10px;
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                z-index: 20;
            `;
            
            // Cost badge (bottom) - ALWAYS use fresh config data
            const cost = document.createElement('div');
            cost.className = 'weapon-cost';
            cost.textContent = config.cost || 1; // Use fresh config.cost
            cost.style.cssText = `
                position: absolute;
                bottom: -2px;
                left: 50%;
                transform: translateX(-50%);
                color: white;
                font-size: 10px;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            
            // Cooldown overlay
            const cooldownOverlay = document.createElement('div');
            cooldownOverlay.className = 'weapon-cooldown-overlay';
            cooldownOverlay.style.cssText = `
                position: absolute;
                top: -2px;
                left: -2px;
                right: -2px;
                bottom: -2px;
                border-radius: 50%;
                border: 2px solid transparent;
                display: none;
                pointer-events: none;
            `;
            
            // Assemble the slot
            slot.appendChild(key);
            slot.appendChild(cost);
            slot.appendChild(cooldownOverlay);
            
            // Add click handler
            slot.addEventListener('click', () => {
                projectileSystem.currentTypeIndex = index;
                updateWeaponHUD(false); // Don't force refresh on user click
            });
            
            weaponsContainer.appendChild(slot);
            
        } else {
            // Update existing slot - particularly the cost display
            const costElement = slot.querySelector('.weapon-cost');
            if (costElement) {
                const newCost = config.cost || 1;
                if (costElement.textContent !== newCost.toString()) {
                    costElement.textContent = newCost;
                }
            }
        }
        
        // Update active state styling
        if (isActive) {
            slot.style.borderColor = '#3AC2FD';
            slot.style.boxShadow = '0 0 10px rgba(60, 194, 253, 0.5)';
        } else {
            slot.style.borderColor = '#444';
            slot.style.boxShadow = 'none';
        }
    });
}

function setupWeaponSlots() {
    const weaponsContainer = document.getElementById('weaponsContainer');
    if (!weaponsContainer) return;
    
    // Find all weapon slots
    const slots = weaponsContainer.querySelectorAll('.weapon-slot');
    
    // For each slot, ensure it has a static cooldown display already set up
    slots.forEach(slot => {
        // Skip if already set up
        if (slot.dataset.cooldownSetup === 'true') return;
        
        // Create a cooldown overlay that will always exist
        const cooldownOverlay = document.createElement('div');
        cooldownOverlay.className = 'static-cooldown-overlay';
        cooldownOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            z-index: 3;
			border: inline 2px solid rgb(203, 32, 32);
        `;
        
        // Create a static cooldown text element
        const cooldownText = document.createElement('div');
        cooldownText.className = 'static-cooldown-text';
        cooldownText.style.cssText = `
            font-size: 16px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 4px black, 0 0 4px black, 0 0 4px black;
        `;
        cooldownText.textContent = '0';
        
        // Add the text to the overlay
        cooldownOverlay.appendChild(cooldownText);
        
        // Add the overlay to the slot
        slot.appendChild(cooldownOverlay);
        
        // Mark as set up
        slot.dataset.cooldownSetup = 'true';
    });
}

// Fixed weapon cooldown function with separated visual updates
let weaponSlotStates = new Map();

function updateWeaponCooldowns() {
    const weaponsContainer = document.getElementById('weaponsContainer');
    if (!weaponsContainer || !projectileSystem) return;
    
    const slots = weaponsContainer.querySelectorAll('.weapon-slot');
    
    slots.forEach(slot => {
        const type = slot.dataset.type;
        const index = parseInt(slot.dataset.index);
        if (!type) return;
        
        // Update active state (selected weapon) - always check this
        const isActive = index === projectileSystem.currentTypeIndex;
        if (isActive) {
            slot.classList.add('active');
            slot.style.borderColor = '#3AC2FD';
            slot.style.boxShadow = '0 0 10px rgba(60, 194, 253, 0.5)';
        } else {
            slot.classList.remove('active');
            slot.style.borderColor = '#444';
            slot.style.boxShadow = 'none';
        }
        
        // Get cooldown information
        const cooldownProperty = getCooldownProperty(type);
        if (!cooldownProperty) return;
        
        const currentCooldown = projectileSystem[cooldownProperty] || 0;
        const isOnCooldown = currentCooldown > 0;
        const seconds = Math.ceil(currentCooldown / 60);
        
        // Get or create slot state
        const slotKey = `${type}_${index}`;
        let slotState = weaponSlotStates.get(slotKey) || { 
            hasElement: false, 
            lastSeconds: -1 
        };
        
        if (isOnCooldown) {
            // Apply cooldown visual effects - always update these
                      

            // Find existing cooldown number
            let cooldownNumber = slot.querySelector('.cooldown-number');
            
            // Create element only if it doesn't exist
         if (!cooldownNumber) {
                cooldownNumber = document.createElement('div');
                cooldownNumber.className = 'cooldown-number';
                cooldownNumber.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    pointer-events: none;
                    z-index: 10;
                    background-color: rgba(0, 0, 0, 0.6);
                    border-radius: 50%;
					border: 2px solid rgb(207, 57, 59, 0.9);
                `;
                slot.appendChild(cooldownNumber);
                slotState.hasElement = true;
            }
            
            // ALWAYS update the text content - this is what was missing!
            if (cooldownNumber.textContent !== seconds.toString()) {
                cooldownNumber.textContent = seconds;
                slotState.lastSeconds = seconds;
            }
            
        } else {
            // Remove cooldown effects - always update these
            slot.style.filter = 'none';
            slot.style.opacity = '1';
            
            // Only remove element if it exists to prevent unnecessary DOM changes
            if (slotState.hasElement) {
                const cooldownNumber = slot.querySelector('.cooldown-number');
                if (cooldownNumber) {
                    cooldownNumber.remove();
                    slotState.hasElement = false;
                    slotState.lastSeconds = -1;
                }
            }
        }
        
        // Update state tracking
        weaponSlotStates.set(slotKey, slotState);
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
            transition: width 0.3s ease;
		/* Rectangle 5 */
		background: #3AC2FD;
		box-shadow: 0px 0px 30px #3AC2FD;
		border-radius: 12px !important;
		

									
    `;
    
    // Create bullet text - centered
    const bulletText = document.createElement('div');
    bulletText.className = 'bullet-text';
    bulletText.textContent = gameState.isBerserker ? '∞' : `${gameState.bullets} / ${gameState.maxBullets}`;
    bulletText.style.cssText = `
        position: relative;
        z-index: 2;
        font-size: 15px;
        line-height: 19px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: bold;
        font-family: 'Rajdhani', monospace;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        text-align: center;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
   
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
box-shadow: 0px 0px 30px #00E076;
        border-radius: inherit;
        transition: width 0.3s ease, background 0.3s ease;
	z-index:2;
    `;
    
    // Create shield overlay - more prominent
const shieldOverlay = document.createElement('div');
shieldOverlay.className = 'shield-overlay';
shieldOverlay.style.cssText = `
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: transparent;
    border-radius: inherit;
    transition: all 0.3s ease;
    opacity: 0;
    z-index: 20;
    display: none;
`;

if (gameState.shieldCharges > 0) {
    shieldOverlay.style.display = 'block';
    shieldOverlay.style.opacity = '0.8';
    shieldOverlay.style.background = 'linear-gradient(135deg, #4169E1 0%, #1E90FF 100%)';
    shieldOverlay.style.animation = 'energyFlow 2s linear infinite';
    shieldOverlay.style.zIndex = '3'; // Ensure it's above the health fill
    
    // Also reduce the health fill visibility when shielded
    hpFill.style.opacity = '0.8'; // Dim the green health bar behind shields
} else {
    shieldOverlay.style.display = 'none';
    shieldOverlay.style.opacity = '0';
    shieldOverlay.style.background = 'transparent';
    shieldOverlay.style.animation = 'none';
    
    // Restore full health bar visibility when no shields
    hpFill.style.opacity = '1';
}
    // Create HP text - centered
    const hpText = document.createElement('div');
    hpText.className = 'hp-text';
    hpText.textContent = `${gameState.currentHP} / ${gameState.maxHP}`;
    hpText.style.cssText = `
     
        z-index: 21;
        font-size: 15px;
        line-height: 19px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: bold;
        font-family: 'Rajdhani', monospace;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        text-align: center;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      
    `;
    
    // Create shield counter - more prominent
    const shieldCounter = document.createElement('div');
    shieldCounter.className = 'shield-counter';
    shieldCounter.style.cssText = `
        position: absolute;
        left: 2px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        gap: 0px;
        z-index: 21;
        opacity: ${gameState.shieldCharges > 0 ? '1' : '0.0'};
        transition: opacity 0.3s ease;
        background: ${gameState.shieldCharges > 0 ? 'rgba(60, 194, 253, 0.0)' : 'rgba(0, 0, 0, 0.0)'};
        padding: 2px 6px;
        border-radius: 8px;
        border: 0px solid ${gameState.shieldCharges > 0 ? 'rgba(60, 194, 253, 1)' : 'rgba(255, 255, 255, 0.2)'};
    `;
    
    const shieldIcon = document.createElement('span');
    shieldIcon.textContent = '🛡️';
    shieldIcon.style.fontSize = '15px';
    
    const shieldCount = document.createElement('span');
    shieldCount.textContent = gameState.shieldCharges || 0;
    shieldCount.style.cssText = `
        color: white;
        font-size: 15px;
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
        return '#ff4757';
    } else if (hpPercent <= 50) {
        return '#ffa502)';
    } else {
        return '#00E076)';
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
        
        .weapon-slot {
            transition: filter 0.3s ease, opacity 0.3s ease;
        }
        
        .cooldown-number {
            transition: none !important;
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
        
        .shield-overlay {
            animation: ${gameState && gameState.shieldCharges > 0 ? 'shieldPulse 2s infinite' : 'none'};
        }
        
        @keyframes shieldPulse {
            0% { opacity: 0.4; }
            50% { opacity: 0.7; }
            100% { opacity: 0.4; }
        }
    `;
    document.head.appendChild(style);
}







export function forceRefreshWeaponHUD() {
    
    // Clear weapon slot states cache
    if (weaponSlotStates) {
        weaponSlotStates.clear();
    }
    
    // Get the weapons container
    const weaponsContainer = document.getElementById('weaponsContainer');
    if (!weaponsContainer) {
        return;
    }
    
    // Completely clear and rebuild weapon slots
    weaponsContainer.innerHTML = '';
    
    // Force rebuild with fresh data
    updateWeaponHUD();
    
    // Also update other HUD elements that might show weapon data
    updateBulletCounter();
    updateTopStatsBar();
    
}

// Force refresh entire HUD system
export function forceRefreshHUD() {
    
    // Clear all caches
    if (weaponSlotStates) {
        weaponSlotStates.clear();
    }
    
    // Stop and restart update intervals
    stopUpdateIntervals();
    
    // Clear and rebuild all containers
    const containers = ['weaponsContainer', 'energyContainer', 'healthContainer', 'topStatsBar'];
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            if (id === 'topStatsBar') {
                // Don't clear the top stats bar container, just its content
                container.innerHTML = '';
            } else if (id === 'weaponsContainer') {
                // Completely clear weapons
                container.innerHTML = '';
            }
            // For energy and health containers, they'll be refreshed by their update functions
        }
    });
    
    // Force complete HUD update
    updateHUD();
    
}





// ========================================
// UPDATE INTERVALS
// ========================================

let weaponUpdateInterval = null;

function startUpdateIntervals() {
    // Stop any existing interval
    if (weaponUpdateInterval) {
        cancelAnimationFrame(weaponUpdateInterval);
    }
    
    // Use requestAnimationFrame for smooth updates
    function updateLoop() {
        updateWeaponCooldowns();
        weaponUpdateInterval = requestAnimationFrame(updateLoop);
    }
    
    updateLoop();
}

function stopUpdateIntervals() {
    if (weaponUpdateInterval) {
        cancelAnimationFrame(weaponUpdateInterval);
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
    updateTopStatsBar();
    
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
window.updateTopStatsBar = updateTopStatsBar;
window.cleanupHUD = cleanupHUD;

window.forceRefreshWeaponHUD = forceRefreshWeaponHUD;
window.forceRefreshHUD = forceRefreshHUD;