// js/enhanced-moba-hud.js - MOBA-Style HUD System

import { gameState } from './core/gameState.js';
import { player } from './core/player.js';
import { activeDropBuffs } from './systems.js';
import { projectileSystem, PROJECTILE_CONFIGS, ProjectileType } from './enhanced-projectile-system.js';

// HUD State Management
let hudInitialized = false;
let previousBuffs = new Set();

// ========================================
// HUD INITIALIZATION
// ========================================

export function initMobaHUD() {
    if (hudInitialized) return;
    
    createHUDContainers();
    initializeHUDStyles();
    startHUDUpdateLoop();
    
    hudInitialized = true;
    console.log('🎮 MOBA-Style HUD Initialized');
}

// ========================================
// HUD CONTAINER CREATION
// ========================================

function createHUDContainers() {
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;

    // Remove existing HUD elements
    removeExistingHUD();

    // Create HUD containers
    createComboContainer();
    createBuffContainer();
    createPlayerCockpit();
    createStatsContainer();
    createScoreContainer();
}

function removeExistingHUD() {
    const elementsToRemove = [
        'healthBar', 'bulletCount', 'scorePanel', 'enhancedBuffs', 
        'comboDisplay', 'weaponHUD', 'projectileUI', 'projectileCooldownDisplay'
    ];
    
    // Remove elements by ID
    elementsToRemove.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.remove();
            console.log(`🗑️ Removed old HUD element: ${id}`);
        }
    });
    
    // Remove elements by class name (enhanced buffs containers)
    const classesToRemove = [
        'enhanced-buffs-container', 'combo-display-enhanced'
    ];
    
    classesToRemove.forEach(className => {
        const elements = document.querySelectorAll(`.${className}`);
        elements.forEach(element => {
            element.remove();
            console.log(`🗑️ Removed old HUD element by class: ${className}`);
        });
    });
    
    // Force cleanup any remaining enhanced UI elements
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
        const oldElements = gameContainer.querySelectorAll('[id*="enhanced"], [class*="enhanced"], [id*="combo"], [class*="combo"]');
        oldElements.forEach(element => {
            if (!element.id.includes('moba')) { // Don't remove our MOBA elements
                element.remove();
                console.log(`🗑️ Force removed: ${element.id || element.className}`);
            }
        });
    }
}

// Left Top Corner: Combo Counter
function createComboContainer() {
    const comboContainer = document.createElement('div');
    comboContainer.id = 'mobaComboContainer';
    comboContainer.className = 'moba-hud-container';
    comboContainer.style.cssText = `
        position: absolute;
        top: 20px;
        left: 20px;
        padding: 16px 20px;
        min-width: 80px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    comboContainer.innerHTML = `
        <div class="combo-label">Combo</div>
        <div class="combo-value" id="comboValue">0</div>
    `;
    
    document.getElementById('gameContainer').appendChild(comboContainer);
}

// Left Bottom Corner: Temporary Buff Container
function createBuffContainer() {
    const buffContainer = document.createElement('div');
    buffContainer.id = 'mobaBuffContainer';
    buffContainer.className = 'moba-hud-container';
    buffContainer.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 20px;
        padding: 12px;
        max-width: 200px;
        display: none;
    `;
    
    document.getElementById('gameContainer').appendChild(buffContainer);
}

// Bottom Center: Player Cockpit
function createPlayerCockpit() {
    const cockpit = document.createElement('div');
    cockpit.id = 'mobaPlayerCockpit';
    cockpit.className = 'moba-hud-container';
    cockpit.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        min-width: 400px;
    `;
    
    cockpit.innerHTML = `
        <div class="weapon-hotkeys-row">
            <div class="weapon-slot" data-key="Q" data-type="normal">
                <div class="weapon-icon">⚡</div>
                <div class="weapon-key">Q</div>
                <div class="weapon-cost">1</div>
                <div class="weapon-cooldown-ring"></div>
            </div>
            <div class="weapon-slot" data-key="W" data-type="laserBeam">
                <div class="weapon-icon">🔵</div>
                <div class="weapon-key">W</div>
                <div class="weapon-cost">10</div>
                <div class="weapon-cooldown-ring"></div>
            </div>
            <div class="weapon-slot" data-key="E" data-type="energyShotgun">
                <div class="weapon-icon">💥</div>
                <div class="weapon-key">E</div>
                <div class="weapon-cost">5</div>
                <div class="weapon-cooldown-ring"></div>
            </div>
            <div class="weapon-slot" data-key="R" data-type="chainLightning">
                <div class="weapon-icon">⚡</div>
                <div class="weapon-key">R</div>
                <div class="weapon-cost">4</div>
                <div class="weapon-cooldown-ring"></div>
            </div>
        </div>
        <div class="player-resources-row">
            <div class="health-bar-container">
                <div class="resource-label">Health</div>
                <div class="health-bar">
                    <div class="health-fill" id="healthFill"></div>
                    <div class="shield-overlay" id="shieldOverlay"></div>
                    <div class="health-text" id="healthText">100/100</div>
                </div>
            </div>
            <div class="bullet-bar-container">
                <div class="resource-label">Energy</div>
                <div class="bullet-bar">
                    <div class="bullet-fill" id="bulletFill"></div>
                    <div class="bullet-text" id="bulletText">100/100</div>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(cockpit);
}

// Right Top Corner: Level and Score
function createScoreContainer() {
    const scoreContainer = document.createElement('div');
    scoreContainer.id = 'mobaScoreContainer';
    scoreContainer.className = 'moba-hud-container';
    scoreContainer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
        padding: 16px 20px;
        text-align: right;
        min-width: 120px;
    `;
    
    scoreContainer.innerHTML = `
        <div class="score-item">
            <div class="score-label">Level</div>
            <div class="score-value" id="levelValue">1</div>
        </div>
        <div class="score-item" style="margin-top: 8px;">
            <div class="score-label">Score</div>
            <div class="score-value" id="scoreValue">0</div>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(scoreContainer);
}

// Top Center: Stats Dashboard
function createStatsContainer() {
    const statsContainer = document.createElement('div');
    statsContainer.id = 'mobaStatsContainer';
    statsContainer.className = 'moba-hud-container';
    statsContainer.style.cssText = `
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        display: flex;
        gap: 20px;
        align-items: center;
    `;
    
    statsContainer.innerHTML = `
        <div class="stat-item">
            <div class="stat-icon">💥</div>
            <div class="stat-value" id="damageValue">0%</div>
        </div>
        <div class="stat-item">
            <div class="stat-icon">🎯</div>
            <div class="stat-value" id="critValue">0%</div>
        </div>
        <div class="stat-item">
            <div class="stat-icon">⚡</div>
            <div class="stat-value" id="speedValue">0%</div>
        </div>
        <div class="stat-item">
            <div class="stat-icon">🩸</div>
            <div class="stat-value" id="lifeStealValue">0%</div>
        </div>
        <div class="stat-item">
            <div class="stat-icon">💚</div>
            <div class="stat-value" id="healthRegenValue">0.5/s</div>
        </div>
        <div class="stat-item">
            <div class="stat-icon">🔋</div>
            <div class="stat-value" id="bulletRegenValue">0.5/s</div>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(statsContainer);
}

// ========================================
// STYLES INITIALIZATION
// ========================================

function initializeHUDStyles() {
    if (document.getElementById('mobaHUDStyles')) return;
    
    const style = document.createElement('style');
    style.id = 'mobaHUDStyles';
    style.textContent = `
        /* Base HUD Container Styling */
        .moba-hud-container {
            background: rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            color: #ffffff;
            font-family: 'Rajdhani', sans-serif;
            font-weight: 500;
        }

        /* Combo Container */
        .combo-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .combo-value {
            font-size: 28px;
            font-weight: 700;
            color: #00ff88;
            font-family: 'Rajdhani', monospace;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }

        /* Buff Container */
        .buff-item-moba {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 8px;
            margin-bottom: 6px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            position: relative;
        }

        .buff-icon-container {
            position: relative;
            width: 24px;
            height: 24px;
            background: rgba(0, 0, 0, 0.35);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .buff-icon-moba {
            font-size: 14px;
        }

        .buff-countdown-ring {
            position: absolute;
            top: -2px;
            left: -2px;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: #00ff88;
            transition: transform 0.1s linear;
        }

        .buff-info-moba {
            flex: 1;
        }

        .buff-name-moba {
            font-size: 11px;
            font-weight: 600;
            color: #ffffff;
            margin-bottom: 2px;
        }

        .buff-time-moba {
            font-size: 10px;
            color: #00ff88;
            font-family: 'Rajdhani', monospace;
        }

        /* Weapon Hotkeys Row */
        .weapon-hotkeys-row {
            display: flex;
            gap: 8px;
        }

        .weapon-slot {
            position: relative;
            width: 48px;
            height: 48px;
            background: rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .weapon-slot.active {
            border-color: #00ff88;
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.4);
            transform: scale(1.05);
        }

        .weapon-slot.on-cooldown {
            opacity: 0.6;
        }

        .weapon-icon {
            font-size: 20px;
            z-index: 2;
        }

        .weapon-key {
            position: absolute;
            top: -6px;
            right: -6px;
            background: rgba(0, 0, 0, 0.8);
            color: #ffffff;
            font-size: 10px;
            font-weight: 600;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .weapon-cost {
            position: absolute;
            bottom: -6px;
            right: -6px;
            background: rgba(0, 212, 255, 0.8);
            color: #000;
            font-size: 9px;
            font-weight: 700;
            padding: 2px 4px;
            border-radius: 6px;
            font-family: 'Rajdhani', monospace;
        }

        .weapon-cooldown-ring {
            position: absolute;
            top: -2px;
            left: -2px;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 2px solid transparent;
            border-top-color: #ff1744;
            opacity: 0;
            transition: all 0.1s linear;
        }

        .weapon-slot.on-cooldown .weapon-cooldown-ring {
            opacity: 1;
            animation: cooldownSpin 0.1s linear infinite;
        }

        @keyframes cooldownSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Player Resources */
        .player-resources-row {
            display: flex;
            gap: 16px;
            align-items: center;
        }

        .health-bar-container,
        .bullet-bar-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }

        .resource-label {
            font-size: 10px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .health-bar,
        .bullet-bar {
            position: relative;
            width: 160px;
            height: 12px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 6px;
            overflow: hidden;
        }

        .health-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88 0%, #00cc6a 100%);
            transition: width 0.3s ease;
            border-radius: 6px;
        }

        .health-fill.warning {
            background: linear-gradient(90deg, #ffa726 0%, #ff9800 100%);
        }

        .health-fill.critical {
            background: linear-gradient(90deg, #ff1744 0%, #d50000 100%);
            animation: criticalPulse 0.8s ease-in-out infinite;
        }

        .shield-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, rgba(65, 105, 225, 0.8) 0%, rgba(30, 144, 255, 0.9) 100%);
            border-radius: 6px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .shield-overlay.active {
            opacity: 1;
            animation: shieldFlow 2s ease-in-out infinite;
        }

        .bullet-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff 0%, #0ea5e9 100%);
            transition: width 0.3s ease;
            border-radius: 6px;
        }

        .health-text,
        .bullet-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 10px;
            font-weight: 600;
            color: #ffffff;
            text-shadow: 0 0 4px rgba(0, 0, 0, 0.8);
            font-family: 'Rajdhani', monospace;
            z-index: 3;
        }

        /* Score Container */
        .score-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .score-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .score-value {
            font-size: 18px;
            font-weight: 700;
            color: #00ff88;
            font-family: 'Rajdhani', monospace;
        }

        /* Stats Dashboard */
        .stat-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
        }

        .stat-icon {
            font-size: 14px;
        }

        .stat-value {
            font-size: 11px;
            font-weight: 600;
            color: #ffffff;
            font-family: 'Rajdhani', monospace;
        }

        /* Animations */
        @keyframes criticalPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }

        @keyframes shieldFlow {
            0%, 100% { 
                background: linear-gradient(90deg, rgba(65, 105, 225, 0.8) 0%, rgba(30, 144, 255, 0.9) 100%);
            }
            50% { 
                background: linear-gradient(90deg, rgba(30, 144, 255, 0.9) 0%, rgba(65, 105, 225, 1.0) 100%);
            }
        }

        /* Mobile Responsiveness */
        @media (max-width: 768px) {
            .moba-hud-container {
                padding: 8px 12px;
                font-size: 12px;
            }
            
            #mobaPlayerCockpit {
                min-width: 320px;
                bottom: 10px;
            }
            
            .weapon-slot {
                width: 40px;
                height: 40px;
            }
            
            .health-bar,
            .bullet-bar {
                width: 120px;
                height: 10px;
            }
            
            #mobaStatsContainer {
                gap: 12px;
                padding: 8px 16px;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ========================================
// UPDATE FUNCTIONS
// ========================================

function updateComboDisplay() {
    const comboContainer = document.getElementById('mobaComboContainer');
    const comboValue = document.getElementById('comboValue');
    
    if (!comboContainer || !comboValue) return;
    
    const shouldShow = gameState.comboCount >= 2 && gameState.comboTimer > 0;
    
    if (shouldShow) {
        comboContainer.style.opacity = '1';
        comboValue.textContent = `${gameState.comboCount}x`;
        
        // Color based on combo level
        if (gameState.comboCount >= 50) {
            comboValue.style.color = '#ff1744';
        } else if (gameState.comboCount >= 20) {
            comboValue.style.color = '#ffa726';
        } else if (gameState.comboCount >= 10) {
            comboValue.style.color = '#00d4ff';
        } else {
            comboValue.style.color = '#00ff88';
        }
    } else {
        comboContainer.style.opacity = '0';
    }
}

function updateBuffDisplay() {
    const buffContainer = document.getElementById('mobaBuffContainer');
    if (!buffContainer) return;
    
    const activeBuffsHTML = [];
    const currentBuffs = new Set();
    
    if (activeDropBuffs && typeof activeDropBuffs === 'object') {
        const buffKeys = Object.keys(activeDropBuffs);
        const activeTempBuffs = buffKeys.filter(key => activeDropBuffs[key] > 0);
        
        activeTempBuffs.slice(0, 5).forEach(buffKey => {
            const remaining = activeDropBuffs[buffKey];
            const dropInfo = getDropInfoByKey(buffKey);
            if (!dropInfo) return;
            
            const seconds = Math.ceil(remaining / 60);
            const progress = Math.min(remaining / 600, 1) * 360; // Assume 10s max for ring
            
            activeBuffsHTML.push(`
                <div class="buff-item-moba">
                    <div class="buff-icon-container">
                        <div class="buff-icon-moba">${dropInfo.icon}</div>
                        <div class="buff-countdown-ring" style="transform: rotate(${360 - progress}deg);"></div>
                    </div>
                    <div class="buff-info-moba">
                        <div class="buff-name-moba">${dropInfo.name}</div>
                        <div class="buff-time-moba">${seconds}s</div>
                    </div>
                </div>
            `);
            
            currentBuffs.add(buffKey);
        });
    }
    
    buffContainer.innerHTML = activeBuffsHTML.join('');
    buffContainer.style.display = activeBuffsHTML.length > 0 ? 'block' : 'none';
    
    previousBuffs = currentBuffs;
}

function updateWeaponDisplay() {
    const weaponSlots = document.querySelectorAll('.weapon-slot');
    
    weaponSlots.forEach((slot, index) => {
        const weaponType = slot.dataset.type;
        const isActive = projectileSystem.currentTypeIndex === index;
        
        // Update active state
        if (isActive) {
            slot.classList.add('active');
        } else {
            slot.classList.remove('active');
        }
        
        // Update cooldown state
        const cooldownProperty = getCooldownProperty(weaponType);
        const currentCooldown = projectileSystem[cooldownProperty] || 0;
        const maxCooldown = PROJECTILE_CONFIGS[weaponType]?.cooldown || 1;
        
        if (currentCooldown > 0) {
            slot.classList.add('on-cooldown');
            const progress = (currentCooldown / maxCooldown) * 360;
            const ring = slot.querySelector('.weapon-cooldown-ring');
            if (ring) {
                ring.style.transform = `rotate(${360 - progress}deg)`;
            }
        } else {
            slot.classList.remove('on-cooldown');
        }
        
        // Update cost display
        const costElement = slot.querySelector('.weapon-cost');
        const config = PROJECTILE_CONFIGS[weaponType];
        if (costElement && config) {
            costElement.textContent = config.cost;
            
            // Color based on affordability
            if (gameState.bullets >= config.cost || gameState.isBerserker) {
                costElement.style.backgroundColor = 'rgba(0, 212, 255, 0.8)';
            } else {
                costElement.style.backgroundColor = 'rgba(255, 23, 68, 0.8)';
            }
        }
    });
}

function updateResourceBars() {
    // Health Bar
    const healthFill = document.getElementById('healthFill');
    const healthText = document.getElementById('healthText');
    const shieldOverlay = document.getElementById('shieldOverlay');
    
    if (healthFill && healthText) {
        const hpPercent = Math.max(0, (gameState.currentHP / gameState.maxHP) * 100);
        healthFill.style.width = `${hpPercent}%`;
        healthText.textContent = `${gameState.currentHP}/${gameState.maxHP}`;
        
        // Health color based on percentage
        healthFill.className = 'health-fill';
        if (hpPercent <= 20) {
            healthFill.classList.add('critical');
        } else if (hpPercent <= 50) {
            healthFill.classList.add('warning');
        }
    }
    
    // Shield Display
    if (shieldOverlay) {
        if (gameState.shieldCharges > 0) {
            shieldOverlay.classList.add('active');
        } else {
            shieldOverlay.classList.remove('active');
        }
    }
    
    // Bullet Bar
    const bulletFill = document.getElementById('bulletFill');
    const bulletText = document.getElementById('bulletText');
    
    if (bulletFill && bulletText) {
        const bulletPercent = Math.max(0, (gameState.bullets / gameState.maxBullets) * 100);
        bulletFill.style.width = `${bulletPercent}%`;
        
        if (gameState.isBerserker) {
            bulletText.textContent = '∞';
        } else {
            bulletText.textContent = `${gameState.bullets}/${gameState.maxBullets}`;
        }
    }
}

function updateScoreDisplay() {
    const levelValue = document.getElementById('levelValue');
    const scoreValue = document.getElementById('scoreValue');
    
    if (levelValue) levelValue.textContent = gameState.level;
    if (scoreValue) scoreValue.textContent = gameState.score.toLocaleString();
}

function updateStatsDisplay() {
    const stats = gameState.playerStats || {};
    
    const updates = [
        ['damageValue', `${stats.damageBonus || 0}%`],
        ['critValue', `${stats.critChance || 0}%`],
        ['speedValue', `${stats.moveSpeed || 0}%`],
        ['lifeStealValue', `${stats.lifeSteal || 0}%`],
        ['healthRegenValue', `${(stats.healthRegen || 0.5).toFixed(1)}/s`],
        ['bulletRegenValue', `${(stats.bulletRegen || 0.5).toFixed(1)}/s`]
    ];
    
    updates.forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function getCooldownProperty(weaponType) {
    const cooldownMap = {
        'normal': 'normalCooldown',
        'laserBeam': 'laserCooldown',
        'energyShotgun': 'shotgunCooldown',
        'chainLightning': 'lightningCooldown',
        'seekingBolt': 'seekingCooldown'
    };
    return cooldownMap[weaponType] || 'normalCooldown';
}

function getDropInfoByKey(key) {
    const dropInfoMap = {
        'speedBoost': { icon: '⚡', name: 'Speed' },
        'jumpBoost': { icon: '🚀', name: 'Jump' },
        'scoreMultiplier': { icon: '💰', name: '2x Score' },
        'magnetMode': { icon: '🌟', name: 'Magnet' },
        'berserkerMode': { icon: '🔥', name: 'Berserker' },
        'ghostWalk': { icon: '👻', name: 'Ghost' },
        'timeSlow': { icon: '⏰', name: 'Slow' },
        'healingBoost': { icon: '💚', name: 'Heal+' },
        'regeneration': { icon: '💖', name: 'Regen' }
    };
    return dropInfoMap[key];
}

// ========================================
// UPDATE LOOP
// ========================================

function startHUDUpdateLoop() {
    setInterval(() => {
        if (!gameState) return;
        
        updateComboDisplay();
        updateBuffDisplay();
        updateWeaponDisplay();
        updateResourceBars();
        updateScoreDisplay();
        updateStatsDisplay();
    }, 100);
}

// ========================================
// UI INTEGRATION - OVERRIDE OLD updateUI
// ========================================

// Override functions that recreate old HUD elements
function disableOldHUDSystems() {
    // Disable enhanced UI recreations
    if (window.initEnhancedContainers) {
        window.initEnhancedContainers = function() {
            console.log('🚫 MOBA HUD: Blocked initEnhancedContainers');
        };
    }
    
    if (window.updateEnhancedDisplays) {
        window.updateEnhancedDisplays = function() {
            console.log('🚫 MOBA HUD: Blocked updateEnhancedDisplays');
        };
    }
    
    if (window.updateEnhancedBuffDisplay) {
        window.updateEnhancedBuffDisplay = function() {
            console.log('🚫 MOBA HUD: Blocked updateEnhancedBuffDisplay');
        };
    }
    
    if (window.updateEnhancedComboDisplay) {
        window.updateEnhancedComboDisplay = function() {
            console.log('🚫 MOBA HUD: Blocked updateEnhancedComboDisplay');
        };
    }
    
    // Also disable the old UI enhancement system
    if (window.initEnhancements) {
        const originalInitEnhancements = window.initEnhancements;
        window.initEnhancements = function() {
            console.log('🚫 MOBA HUD: Blocked initEnhancements');
            // Don't call the original function
        };
    }
    
    console.log('🛡️ MOBA HUD: Disabled old HUD recreation systems');
}

// Override the old updateUI function to work with MOBA HUD
function overrideUpdateUI() {
    // Save original updateUI if it exists
    const originalUpdateUI = window.updateUI;
    
    // Replace with MOBA HUD compatible version
    window.updateUI = function() {
        if (!gameState) return;
        
        // Update MOBA HUD elements (these functions handle null checks internally)
        updateScoreDisplay();
        updateResourceBars();
        updateStatsDisplay();
        updateComboDisplay();
        updateBuffDisplay();
        updateWeaponDisplay();
        
        // Update buff selection screen if visible
        if (gameState.currentState === 'levelComplete') {
            if (window.updateBuffButtons) {
                window.updateBuffButtons();
            }
        }
    };
    
    console.log('🎮 MOBA HUD: Replaced updateUI function');
}

// ========================================
// GLOBAL INTEGRATION
// ========================================

export function integrateMobaHUD() {
    // Initialize when the game is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                disableOldHUDSystems(); // Disable first
                initMobaHUD(); // Then initialize
                overrideUpdateUI(); // Then override updates
                
                // Cleanup any remaining old elements after a delay
                setTimeout(removeExistingHUD, 1000);
            }, 500);
        });
    } else {
        setTimeout(() => {
            disableOldHUDSystems(); // Disable first
            initMobaHUD(); // Then initialize
            overrideUpdateUI(); // Then override updates
            
            // Cleanup any remaining old elements after a delay
            setTimeout(removeExistingHUD, 1000);
        }, 500);
    }
    
    // Make functions available globally
    window.initMobaHUD = initMobaHUD;
    window.integrateMobaHUD = integrateMobaHUD;
    window.overrideUpdateUI = overrideUpdateUI;
    window.disableOldHUDSystems = disableOldHUDSystems;
}

// Auto-integrate
integrateMobaHUD();