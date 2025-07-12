// js/unified-hud.js - Minimalist UI Overhaul for Weapon Hotkey System

import { gameState } from './core/gameState.js';
import { player } from './core/player.js';
import { PROJECTILE_CONFIGS, ProjectileType, projectileSystem } from './enhanced-projectile-system.js';
import { WEAPON_HOTKEYS } from './weapon-hotkey-system.js';
import { getScreenX } from './core/camera.js';
import { activeDropBuffs } from './systems.js';

// Main HUD container references
let hudElements = {
    comboTimer: null,
    statDisplay: null,
    progressDisplay: null,
    buffsDisplay: null,
    weaponsCockpit: null,
    energyBar: null,
    healthBar: null
};

// Initialize the unified HUD system
export function initUnifiedHUD() {
    // Remove existing HUD elements
    cleanupExistingHUD();
    
    // Create container
    createHUDContainers();
    
    // Start update loop
    startHUDUpdateLoop();
    
    console.log('✅ Unified HUD initialized');
}

// Clean up any existing HUD elements
function cleanupExistingHUD() {
    // Hide older HUD elements but don't remove them to maintain compatibility
    const elementsToHide = [
        'healthBar', 'bulletCount', 'scorePanel', 'enhancedBuffs', 
        'comboDisplay', 'weaponHUD', 'projectileUI'
    ];
    
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

// Create all HUD containers
function createHUDContainers() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    // Add HUD container styles
    addHUDStyles();
    
    // Create individual HUD elements
    hudElements.comboTimer = createComboTimer(gameContainer);
    hudElements.statDisplay = createStatDisplay(gameContainer);
    hudElements.progressDisplay = createProgressDisplay(gameContainer);
    hudElements.buffsDisplay = createBuffsDisplay(gameContainer);
    hudElements.weaponsCockpit = createWeaponsCockpit(gameContainer);
    hudElements.energyBar = createEnergyBar(gameContainer);
    hudElements.healthBar = createHealthBar(gameContainer);
}

// Add HUD styles
function addHUDStyles() {
    if (document.getElementById('unified-hud-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'unified-hud-styles';
    style.textContent = `
        /* Common HUD styling */
        .unified-hud-element {
            position: absolute;
            background: var(--glass-hud);
            backdrop-filter: blur(10px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius);
            padding: 8px 12px;
            z-index: 100;
            pointer-events: none;
        }
        
        /* Combo Timer - Top Left */
        .combo-timer {
            top: 20px;
            left: 20px;
            min-width: 80px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .combo-counter {
            font-size: 28px;
            font-weight: 700;
            font-family: 'Rajdhani', monospace;
            color: #00ff88;
            text-shadow: 0 0 8px currentColor;
        }
        
        .combo-timer-bar {
            width: 60px;
            height: 3px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin: 4px auto 0;
        }
        
        .combo-timer-fill {
            height: 100%;
            background: #00ff88;
            transition: width 0.1s linear;
        }
        
        .combo-bonus {
            font-size: 10px;
            color: #00ff88;
            margin-top: 2px;
        }
        
        /* Stat Display - Top Center */
        .stat-display {
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 20px;
            align-items: center;
        }
        
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .stat-label {
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: -4px;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-accent);
            font-family: 'Rajdhani', monospace;
        }
        
        /* Progress Display - Top Right */
        .progress-display {
            top: 20px;
            right: 20px;
            min-width: 120px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        
        .progress-bar {
            width: 100%;
            height: 4px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 2px;
            overflow: hidden;
            margin-top: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: #00ff88;
            transition: width 0.2s ease-out;
        }
        
        /* Buffs Display - Bottom Left */
        .buffs-display {
            bottom: 20px;
            left: 20px;
            max-width: 160px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .buff-item {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 8px;
            padding: 6px 10px;
        }
        
        .buff-icon {
            font-size: 18px;
        }
        
        .buff-info {
            flex: 1;
        }
        
        .buff-name {
            font-size: 10px;
            color: #fff;
            margin-bottom: 2px;
        }
        
        .buff-timer {
            font-size: 12px;
            color: var(--text-accent);
            font-family: 'Rajdhani', monospace;
        }
        
        .buff-progress {
            width: 100%;
            height: 2px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 1px;
            overflow: hidden;
            margin-top: 2px;
        }
        
        .buff-progress-fill {
            height: 100%;
            background: var(--text-accent);
            transition: width 0.1s linear;
        }
        
        /* Weapons Cockpit - Bottom Center */
        .weapons-cockpit {
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 12px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 12px;
            padding: 8px 12px;
        }
        
        .weapon-slot {
            position: relative;
            width: 50px;
            height: 50px;
            background: rgba(0, 0, 0, 0.4);
            border: 2px solid #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        .weapon-slot.active {
            border-color: var(--text-accent);
            box-shadow: 0 0 10px var(--text-accent);
            transform: scale(1.1);
        }
        
        .weapon-slot.cooldown .weapon-cooldown {
            background: #ff4757;
        }
        
        .weapon-icon {
            font-size: 22px;
            z-index: 2;
        }
        
        .weapon-key {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #333;
            color: #fff;
            font-size: 10px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 1px solid #444;
            z-index: 3;
        }
        
        .weapon-cost {
            position: absolute;
            bottom: -5px;
            right: -5px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffcc00;
            font-size: 10px;
            min-width: 16px;
            height: 16px;
            border-radius: 8px;
            padding: 0 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border: 1px solid #555;
            z-index: 3;
        }
        
        .weapon-cooldown {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: conic-gradient(
                transparent 0deg,
                #00ff88 var(--angle),
                transparent var(--angle),
                transparent 360deg
            );
            z-index: 1;
            opacity: 0.7;
        }
        
        /* Energy Bar - Bottom Right */
        .energy-bar-container {
            bottom: 20px;
            right: 20px;
            min-width: 80px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }
        
        .energy-label {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .energy-value {
            font-size: 18px;
            color: #ffcc00;
            font-family: 'Rajdhani', monospace;
            font-weight: 600;
        }
        
        .energy-bar {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .energy-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffcc00, #ffa600);
            transition: width 0.2s ease;
        }
        
        /* Health Bar - Bottom Right, Above Energy */
        .health-bar-container {
            bottom: 80px;
            right: 20px;
            min-width: 80px;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
        }
        
        .health-label {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .health-value {
            font-size: 18px;
            color: #00ff88;
            font-family: 'Rajdhani', monospace;
            font-weight: 600;
        }
        
        .health-bar {
            width: 100%;
            height: 6px;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 3px;
            overflow: hidden;
        }
        
        .health-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00cc6a);
            transition: width 0.2s ease;
        }
        
        .health-fill.warning {
            background: linear-gradient(90deg, #ffa726, #ff9800);
        }
        
        .health-fill.critical {
            background: linear-gradient(90deg, #ff1744, #d50000);
            animation: criticalPulse 0.8s ease-in-out infinite;
        }
        
        .shield-indicator {
            display: inline-flex;
            align-items: center;
            background: rgba(65, 105, 225, 0.2);
            border-radius: 8px;
            padding: 0 4px;
            margin-left: 4px;
            font-size: 10px;
        }
        
        .shield-icon {
            font-size: 10px;
            margin-right: 2px;
        }
        
        /* Animations */
        @keyframes criticalPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        /* Hide when inactive */
        .hidden {
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .weapons-cockpit {
                transform: translateX(-50%) scale(0.8);
                bottom: 10px;
            }
            
            .stat-display {
                transform: translateX(-50%) scale(0.9);
            }
            
            .combo-timer, .progress-display,
            .energy-bar-container, .health-bar-container {
                transform: scale(0.9);
                transform-origin: bottom right;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Create Combo Timer (Top Left)
function createComboTimer(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element combo-timer hidden';
    element.innerHTML = `
        <div class="combo-counter">0x</div>
        <div class="combo-timer-bar">
            <div class="combo-timer-fill" style="width: 0%"></div>
        </div>
        <div class="combo-bonus">+0% Drops | +0% Points</div>
    `;
    container.appendChild(element);
    return element;
}

// Create Stat Display (Top Center)
function createStatDisplay(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element stat-display';
    element.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">LEVEL</div>
            <div class="stat-value" id="hud-level">1</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">SCORE</div>
            <div class="stat-value" id="hud-score">0</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">KILLS</div>
            <div class="stat-value" id="hud-kills">0</div>
        </div>
    `;
    container.appendChild(element);
    return element;
}

// Create Progress Display (Top Right)
function createProgressDisplay(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element progress-display';
    element.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: flex-end; width: 100%;">
            <div class="stat-label">PROGRESS</div>
            <div class="stat-value" id="hud-progress-value" style="margin-left: 8px;">0%</div>
        </div>
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
    `;
    container.appendChild(element);
    return element;
}

// Create Buffs Display (Bottom Left)
function createBuffsDisplay(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element buffs-display';
    element.innerHTML = `<!-- Buffs will be dynamically added -->`;
    container.appendChild(element);
    return element;
}

// Create Weapons Cockpit (Bottom Center)
function createWeaponsCockpit(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element weapons-cockpit';
    
    // Get weapon hotkeys
    const hotkeys = Object.keys(WEAPON_HOTKEYS);
    let weaponSlotsHTML = '';
    
    // Create weapon slots
    hotkeys.forEach(hotkeyCode => {
        const weaponType = WEAPON_HOTKEYS[hotkeyCode];
        const config = PROJECTILE_CONFIGS[weaponType];
        if (!config) return;
        
        const keyChar = hotkeyCode.replace('Key', '');
        const weaponIcon = getWeaponIcon(weaponType);
        
        weaponSlotsHTML += `
            <div class="weapon-slot" data-type="${weaponType}">
                <div class="weapon-icon">${weaponIcon}</div>
                <div class="weapon-key">${keyChar}</div>
                <div class="weapon-cost">${config.cost}</div>
                <div class="weapon-cooldown" style="--angle: 0deg"></div>
            </div>
        `;
    });
    
    element.innerHTML = weaponSlotsHTML;
    container.appendChild(element);
    return element;
}

// Create Energy Bar (Bottom Right)
function createEnergyBar(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element energy-bar-container';
    element.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: flex-end; width: 100%;">
            <div class="energy-label">ENERGY</div>
            <div class="energy-value" id="hud-energy-value">0/0</div>
        </div>
        <div class="energy-bar">
            <div class="energy-fill" style="width: 0%"></div>
        </div>
    `;
    container.appendChild(element);
    return element;
}

// Create Health Bar (Bottom Right, Above Energy)
function createHealthBar(container) {
    const element = document.createElement('div');
    element.className = 'unified-hud-element health-bar-container';
    element.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: flex-end; width: 100%;">
            <div class="health-label">HEALTH</div>
            <div class="health-value" id="hud-health-value">0/0</div>
            <div class="shield-indicator" id="hud-shield-indicator" style="display: none;">
                <span class="shield-icon">🛡️</span>
                <span id="hud-shield-count">0</span>
            </div>
        </div>
        <div class="health-bar">
            <div class="health-fill" style="width: 0%"></div>
        </div>
    `;
    container.appendChild(element);
    return element;
}

// Start HUD update loop
function startHUDUpdateLoop() {
    // Clear existing interval if any
    if (window.hudUpdateInterval) {
        clearInterval(window.hudUpdateInterval);
    }
    
    // Start new update loop
    window.hudUpdateInterval = setInterval(updateHUD, 100);
}

// Main HUD update function
function updateHUD() {
    if (!gameState) return;
    
    updateComboTimer();
    updateStatDisplay();
    updateProgressDisplay();
    updateBuffsDisplay();
    updateWeaponsCockpit();
    updateEnergyBar();
    updateHealthBar();
}

// Update Combo Timer
function updateComboTimer() {
    const element = hudElements.comboTimer;
    if (!element) return;
    
    const comboCount = gameState.comboCount || 0;
    const comboTimer = gameState.comboTimer || 0;
    const shouldShow = comboCount >= 2 && comboTimer > 0;
    
    if (shouldShow) {
        element.classList.remove('hidden');
        
        // Update combo counter
        const counter = element.querySelector('.combo-counter');
        if (counter) {
            counter.textContent = `${comboCount}x`;
            
            // Color based on combo level
            if (comboCount >= 100) counter.style.color = '#FF00FF'; 
            else if (comboCount >= 50) counter.style.color = '#DC143C';
            else if (comboCount >= 30) counter.style.color = '#FF4500';
            else if (comboCount >= 20) counter.style.color = '#FFD700';
            else counter.style.color = '#00ff88';
        }
        
        // Update timer bar
        const timerFill = element.querySelector('.combo-timer-fill');
        if (timerFill) {
            const percent = (comboTimer / 300) * 100;
            timerFill.style.width = `${percent}%`;
            timerFill.style.background = counter.style.color;
        }
        
        // Update bonus text
        const bonusText = element.querySelector('.combo-bonus');
        if (bonusText) {
            const dropBonus = Math.min(comboCount * 1, 100);
            const pointsBonus = Math.min(comboCount * 1, 100);
            bonusText.textContent = `+${dropBonus}% Drops | +${pointsBonus}% Points`;
            bonusText.style.color = counter.style.color;
        }
    } else {
        element.classList.add('hidden');
    }
}

// Update Stat Display
function updateStatDisplay() {
    const element = hudElements.statDisplay;
    if (!element) return;
    
    const levelElement = element.querySelector('#hud-level');
    const scoreElement = element.querySelector('#hud-score');
    const killsElement = element.querySelector('#hud-kills');
    
    if (levelElement) levelElement.textContent = gameState.level || 1;
    if (scoreElement) scoreElement.textContent = (gameState.score || 0).toLocaleString();
    if (killsElement) killsElement.textContent = gameState.enemiesDefeated || 0;
}

// Update Progress Display
function updateProgressDisplay() {
    const element = hudElements.progressDisplay;
    if (!element) return;
    
    const progressValue = element.querySelector('#hud-progress-value');
    const progressFill = element.querySelector('.progress-fill');
    
    const percent = Math.min(100, Math.floor((gameState.levelProgress / 100) * 100));
    
    if (progressValue) progressValue.textContent = `${percent}%`;
    if (progressFill) progressFill.style.width = `${percent}%`;
}

// Update Buffs Display
function updateBuffsDisplay() {
    const element = hudElements.buffsDisplay;
    if (!element) return;
    
    // Get active buffs
    const buffs = activeDropBuffs ? Object.keys(activeDropBuffs).filter(key => activeDropBuffs[key] > 0) : [];
    
    // Show/hide based on whether buffs are active
    element.classList.toggle('hidden', buffs.length === 0);
    
    // Generate buff items HTML
    let buffsHTML = '';
    
    buffs.slice(0, 3).forEach(buffKey => { // Limit to 3 buffs for space
        const remaining = activeDropBuffs[buffKey];
        const buffInfo = getBuffInfo(buffKey);
        const percent = remaining / buffInfo.duration * 100;
        
        buffsHTML += `
            <div class="buff-item">
                <div class="buff-icon">${buffInfo.icon}</div>
                <div class="buff-info">
                    <div class="buff-name">${buffInfo.name}</div>
                    <div class="buff-timer">${Math.ceil(remaining / 60)}s</div>
                    <div class="buff-progress">
                        <div class="buff-progress-fill" style="width: ${percent}%"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    // Add "more" indicator if needed
    if (buffs.length > 3) {
        buffsHTML += `
            <div class="buff-item" style="justify-content: center">
                <div class="buff-info" style="text-align: center">
                    <div class="buff-name">+${buffs.length - 3} more active</div>
                </div>
            </div>
        `;
    }
    
    element.innerHTML = buffsHTML;
}

// Update Weapons Cockpit
function updateWeaponsCockpit() {
    const element = hudElements.weaponsCockpit;
    if (!element) return;
    
    // Get current weapon
    const currentType = getCurrentProjectileType();
    
    // Update each weapon slot
    const slots = element.querySelectorAll('.weapon-slot');
    slots.forEach(slot => {
        const type = slot.dataset.type;
        const config = PROJECTILE_CONFIGS[type];
        if (!config) return;
        
        // Check if slot is for current weapon
        const isActive = type === currentType;
        slot.classList.toggle('active', isActive);
        
        // Check cooldown
        const cooldownProperty = getCooldownProperty(type);
        const currentCooldown = projectileSystem[cooldownProperty] || 0;
        const maxCooldown = config.cooldown || 1;
        
        // Update cooldown display
        const cooldownElement = slot.querySelector('.weapon-cooldown');
        if (cooldownElement) {
            if (currentCooldown > 0) {
                const angle = 360 * (1 - currentCooldown / maxCooldown);
                cooldownElement.style.setProperty('--angle', `${angle}deg`);
                slot.classList.add('cooldown');
            } else {
                cooldownElement.style.setProperty('--angle', '360deg');
                slot.classList.remove('cooldown');
            }
        }
    });
}

// Update Energy Bar
function updateEnergyBar() {
    const element = hudElements.energyBar;
    if (!element) return;
    
    const valueElement = element.querySelector('#hud-energy-value');
    const fillElement = element.querySelector('.energy-fill');
    
    const current = gameState.bullets || 0;
    const max = gameState.maxBullets || 200;
    const percent = (current / max) * 100;
    
    if (valueElement) {
        valueElement.textContent = gameState.isBerserker ? '∞/∞' : `${current}/${max}`;
    }
    
    if (fillElement) {
        fillElement.style.width = `${percent}%`;
    }
}

// Update Health Bar
function updateHealthBar() {
    const element = hudElements.healthBar;
    if (!element) return;
    
    const valueElement = element.querySelector('#hud-health-value');
    const fillElement = element.querySelector('.health-fill');
    const shieldIndicator = element.querySelector('#hud-shield-indicator');
    const shieldCount = element.querySelector('#hud-shield-count');
    
    const current = gameState.currentHP || 0;
    const max = gameState.maxHP || 5;
    const percent = (current / max) * 100;
    
    if (valueElement) {
        valueElement.textContent = `${current}/${max}`;
    }
    
    if (fillElement) {
        fillElement.style.width = `${percent}%`;
        
        // Set health status class
        fillElement.classList.remove('healthy', 'warning', 'critical');
        if (percent <= 20) {
            fillElement.classList.add('critical');
        } else if (percent <= 50) {
            fillElement.classList.add('warning');
        } else {
            fillElement.classList.add('healthy');
        }
    }
    
    // Update shield display
    if (shieldIndicator && shieldCount) {
        const hasShield = gameState.shieldCharges > 0;
        shieldIndicator.style.display = hasShield ? 'inline-flex' : 'none';
        shieldCount.textContent = gameState.shieldCharges || 0;
    }
}

// Helper: Get weapon icon for a weapon type
function getWeaponIcon(type) {
    const iconMap = {
        [ProjectileType.NORMAL]: '⚡',
        [ProjectileType.LASER_BEAM]: '🔵',
        [ProjectileType.ENERGY_SHOTGUN]: '💥',
        [ProjectileType.CHAIN_LIGHTNING]: '⚡',
        [ProjectileType.SEEKING_BOLT]: '🎯'
    };
    
    return iconMap[type] || '⚡';
}

// Helper: Get buff info by key
function getBuffInfo(key) {
    const info = {
        speedBoost: { icon: '🚀', name: 'Speed Boost', duration: 600 },
        jumpBoost: { icon: '🦘', name: 'Jump Boost', duration: 1800 },
        scoreMultiplier: { icon: '✨', name: 'Score 2x', duration: 1200 },
        magnetMode: { icon: '🧲', name: 'Magnet', duration: 900 },
        berserkerMode: { icon: '🔥', name: 'Berserker', duration: 600 },
        ghostWalk: { icon: '👻', name: 'Ghost Walk', duration: 300 },
        timeSlow: { icon: '⏱️', name: 'Time Slow', duration: 300 },
        healingBoost: { icon: '💚', name: 'Heal Boost', duration: 1800 },
        regeneration: { icon: '💖', name: 'Regen', duration: 600 }
    };
    
    return info[key] || { icon: '⭐', name: key, duration: 600 };
}

// Helper: Get cooldown property for a weapon type
function getCooldownProperty(type) {
    const cooldownMap = {
        [ProjectileType.NORMAL]: 'normalCooldown',
        [ProjectileType.LASER_BEAM]: 'laserCooldown',
        [ProjectileType.ENERGY_SHOTGUN]: 'shotgunCooldown',
        [ProjectileType.CHAIN_LIGHTNING]: 'lightningCooldown',
        [ProjectileType.SEEKING_BOLT]: 'seekingCooldown'
    };
    
    return cooldownMap[type] || 'normalCooldown';
}

// Helper: Get current weapon type
function getCurrentProjectileType() {
    return projectileSystem.equippedTypes[projectileSystem.currentTypeIndex] || ProjectileType.NORMAL;
}

// Make system available globally
window.initUnifiedHUD = initUnifiedHUD;

// Auto initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initUnifiedHUD, 1000);
    });
} else {
    setTimeout(initUnifiedHUD, 1000);
}

// Export system functions
export default {
    initUnifiedHUD,
    updateHUD
};