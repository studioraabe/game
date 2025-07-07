// ui-enhancements.js - Enhanced UI for Roguelike System with Timer Fix and 5-Buff Limit

import { gameState } from './core/gameState.js';
import { activeDropBuffs, activeWeaponDrops } from './systems.js';
import { DROP_INFO, DROP_CONFIG, CANVAS, WEAPON_DROPS } from './core/constants.js';
import { camera } from './core/camera.js';
import { setComboGlow, clearComboGlow } from './enhanced-damage-system.js';

// Initialize enhanced UI containers
export function initEnhancedContainers() {
    // Remove existing containers
    const existingBuff = document.getElementById('enhancedBuffs');
    const existingCombo = document.getElementById('comboDisplay');
    const existingWeapons = document.getElementById('weaponsDisplay');
    if (existingBuff) existingBuff.remove();
    if (existingCombo) existingCombo.remove();
    if (existingWeapons) existingWeapons.remove();
    
    // Create enhanced buffs container
    const buffContainer = document.createElement('div');
    buffContainer.id = 'enhancedBuffs';
    buffContainer.className = 'enhanced-buffs-container';
    buffContainer.style.cssText = `
        position: absolute !important;
        bottom: 12px !important;
        left: 16px !important;
        z-index: 20 !important;
        max-width: 180px;
    `;
    document.getElementById('gameContainer').appendChild(buffContainer);
    
    // Create weapons display container
    const weaponsContainer = document.createElement('div');
    weaponsContainer.id = 'weaponsDisplay';
    weaponsContainer.className = 'weapons-display-container';
    weaponsContainer.style.cssText = `
        position: absolute !important;
        bottom: 12px !important;
        right: 16px !important;
        z-index: 20 !important;
        max-width: 200px;
    `;
    document.getElementById('gameContainer').appendChild(weaponsContainer);
    
    // Create combo display container
    const comboDisplay = document.createElement('div');
    comboDisplay.id = 'comboDisplay';
    comboDisplay.className = 'combo-display-enhanced';
    document.getElementById('gameContainer').appendChild(comboDisplay);
    
    // Create stats overlay
    createStatsOverlay();
    
    // Ensure game container positioning
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer && getComputedStyle(gameContainer).position === 'static') {
        gameContainer.style.position = 'relative';
    }
}

// Enhanced Combo Display
let lastComboCount = 0;
let lastComboTimer = 0;
let displayWasVisible = false;

// Helper function for RGBA conversion
function hexToRgba(hex, alpha = 1) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function updateEnhancedComboDisplay() {
    if (!gameState) return;
    
    let comboDisplay = document.getElementById('comboDisplay');
    
    if (!comboDisplay) {
        comboDisplay = document.createElement('div');
        comboDisplay.id = 'comboDisplay';
        comboDisplay.className = 'combo-display-enhanced';
        document.getElementById('gameContainer').appendChild(comboDisplay);
    }
    
    // Timer expiration/reset detection
    const timerExpired = lastComboTimer > 0 && gameState.comboTimer <= 0;
    const comboReset = gameState.comboCount < lastComboCount;
    
    // Hide combo display
    if (timerExpired || comboReset) {
        comboDisplay.className = 'combo-display-enhanced';
        comboDisplay.style.display = 'none';
        comboDisplay.innerHTML = '';
        
        displayWasVisible = false;
        lastComboCount = gameState.comboCount;
        lastComboTimer = gameState.comboTimer;
        
        clearComboGlow();
        return;
    }
    
    // Update tracking
    lastComboCount = gameState.comboCount;
    lastComboTimer = gameState.comboTimer;
    
    // Show combo display
    const shouldShow = gameState.comboCount >= 2 && gameState.comboTimer > 0;
    
    if (shouldShow) {
        displayWasVisible = true;
        
        comboDisplay.style.display = 'block';
        comboDisplay.className = 'combo-display-enhanced combo-subtle';
        
        const getComboColor = (count) => {
            if (count >= 200) return '#FF00FF'; // Magenta
            if (count >= 100) return '#DC143C'; // Crimson
            if (count >= 50) return '#FF4500';  // Orange Red
            if (count >= 30) return '#FFD700';  // Gold
            if (count >= 20) return '#00ff88';  // Primary green
            if (count >= 10) return '#00ff88';
            if (count >= 5) return '#00ff88';
            return '#00ff88';
        };
        
        const getComboRank = (count) => {
            if (count >= 200) return 'GODLIKE';
            if (count >= 100) return 'LEGENDARY';
            if (count >= 50) return 'EPIC';
            if (count >= 30) return 'RARE';
            if (count >= 20) return 'UNCOMMON';
            if (count >= 10) return 'GOOD';
            if (count >= 5) return 'NICE';
            return 'COMBO';
        };
        
        const timerPercent = Math.max(0, Math.min(100, (gameState.comboTimer / 300) * 100));
        const comboColor = getComboColor(gameState.comboCount);
        const comboRank = getComboRank(gameState.comboCount);
        const shouldWiggle = gameState.comboCount > (lastComboCount - 1) && displayWasVisible;
        
        comboDisplay.innerHTML = `
            <div class="combo-number-subtle ${shouldWiggle ? 'combo-wiggle' : ''}" style="color: ${comboColor}">
                ${gameState.comboCount}x
            </div>
            <div class="combo-rank" style="color: ${comboColor}; font-size: 12px; margin-top: 2px;">
                ${comboRank}
            </div>
            <div class="combo-timer-subtle">
                <div class="combo-timer-fill-subtle" style="width: ${timerPercent}%; background-color: ${comboColor}"></div>
            </div>
        `;
        
        // Enhanced glow effects for high combos
        if (gameState.comboCount >= 20) {
            const glowIntensity = Math.min((gameState.comboCount - 20) * 0.5, 10);
            setComboGlow(glowIntensity, comboColor);
        } else {
            clearComboGlow();
        }
    }
}

// Helper function to get active buff count
function getActiveBuffCount() {
    return Object.keys(activeDropBuffs || {}).length + Object.keys(activeWeaponDrops || {}).length;
}

// Enhanced Buff Display with Weapons and 5-Buff Limit
let previousBuffs = new Set();
let previousWeapons = new Set();

export function updateEnhancedBuffDisplay() {
    if (!gameState) return;
    
    let buffContainer = document.getElementById('enhancedBuffs');
    
    if (!buffContainer) {
        buffContainer = document.createElement('div');
        buffContainer.id = 'enhancedBuffs';
        buffContainer.className = 'enhanced-buffs-container';
        buffContainer.style.cssText = `
            position: absolute !important;
            bottom: 12px !important;
            left: 16px !important;
            max-width: 180px;
            z-index: 100 !important;
            pointer-events: none;
            display: block !important;
            visibility: visible !important;
        `;
        document.getElementById('gameContainer').appendChild(buffContainer);
    }
    
    const activeBuffsHTML = [];
    const currentBuffs = new Set();
    
    // NUR TEMPORARY BUFFS - Shield, Health und Stats sind separat integriert
    
    // TEMPORARY BUFFS mit präziser Zeitanzeige
    if (activeDropBuffs && typeof activeDropBuffs === 'object') {
        Object.keys(activeDropBuffs).forEach(buffKey => {
            const remaining = activeDropBuffs[buffKey];
            if (remaining <= 0) return;
            
            const dropInfo = getDropInfoByKey(buffKey);
            if (!dropInfo) return;
            
            const originalDuration = getOriginalDuration(buffKey);
            const percentage = Math.max(0, (remaining / originalDuration) * 100);
            const isLow = remaining < 180; // Less than 3 seconds (180 frames)
            const isNew = !previousBuffs.has(buffKey);
            
            // PRÄZISE Sekundenberechnung
            const secondsLeft = Math.max(0, Math.ceil(remaining / 60));
            
            activeBuffsHTML.push(`
                <div class="buff-item ${isLow ? 'buff-expiring' : ''} buff-${buffKey} ${isNew ? 'buff-new' : ''}">
                    <div class="buff-icon">${dropInfo.icon}</div>
                    <div class="buff-info">
                        <div class="buff-name">${dropInfo.name}</div>
                        <div class="buff-timer">${secondsLeft}s</div>
                        <div class="buff-progress">
                            <div class="buff-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `);
            currentBuffs.add(buffKey);
        });
    }
    
    // Zeige Buff-Counter in der UI
    if (activeBuffsHTML.length > 0) {
        const buffCount = getActiveBuffCount();
        activeBuffsHTML.unshift(`
            <div class="buff-counter">
                <span class="buff-count ${buffCount >= 5 ? 'buff-limit-reached' : ''}">${buffCount}/5</span>
                <span class="buff-label">BUFFS</span>
            </div>
        `);
    }
    
    // Update container
    buffContainer.innerHTML = activeBuffsHTML.join('');
    
    if (activeBuffsHTML.length === 0) {
        buffContainer.style.display = 'none';
    } else {
        buffContainer.style.display = 'block';
    }
    
    previousBuffs = currentBuffs;
    
    // Update weapons display
    updateWeaponsDisplay();
}

// New Weapons Display Function
export function updateWeaponsDisplay() {
    let weaponsContainer = document.getElementById('weaponsDisplay');
    
    if (!weaponsContainer) {
        weaponsContainer = document.createElement('div');
        weaponsContainer.id = 'weaponsDisplay';
        weaponsContainer.className = 'weapons-display-container';
        weaponsContainer.style.cssText = `
            position: absolute !important;
            bottom: 12px !important;
            right: 16px !important;
            max-width: 200px;
            z-index: 100 !important;
            pointer-events: none;
            display: block !important;
            visibility: visible !important;
        `;
        document.getElementById('gameContainer').appendChild(weaponsContainer);
    }
    
    const activeWeaponsHTML = [];
    const currentWeapons = new Set();
    
    if (activeWeaponDrops && typeof activeWeaponDrops === 'object') {
        Object.keys(activeWeaponDrops).forEach(weaponKey => {
            const remaining = activeWeaponDrops[weaponKey];
            if (remaining <= 0) return;
            
            const weaponInfo = WEAPON_DROPS[weaponKey];
            if (!weaponInfo) return;
            
            const originalDuration = weaponInfo.duration;
            const percentage = Math.max(0, (remaining / originalDuration) * 100);
            const isLow = remaining < 180; // Less than 3 seconds
            const isNew = !previousWeapons.has(weaponKey);
            
            // PRÄZISE Sekundenberechnung für Waffen
            const secondsLeft = Math.max(0, Math.ceil(remaining / 60));
            
            // Determine rarity styling
            const rarityClass = weaponInfo.rarity <= 1 ? 'legendary' : 
                               weaponInfo.rarity <= 2 ? 'epic' : 
                               weaponInfo.rarity <= 3 ? 'rare' : 'common';
            
            activeWeaponsHTML.push(`
                <div class="weapon-item ${rarityClass} ${isLow ? 'weapon-expiring' : ''} ${isNew ? 'weapon-new' : ''}">
                    <div class="weapon-icon">${weaponInfo.icon}</div>
                    <div class="weapon-info">
                        <div class="weapon-name">${weaponInfo.name}</div>
                        <div class="weapon-timer">${secondsLeft}s</div>
                        <div class="weapon-progress">
                            <div class="weapon-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `);
            currentWeapons.add(weaponKey);
        });
    }
    
    // Update container
    weaponsContainer.innerHTML = activeWeaponsHTML.join('');
    
    if (activeWeaponsHTML.length === 0) {
        weaponsContainer.style.display = 'none';
    } else {
        weaponsContainer.style.display = 'block';
    }
    
    previousWeapons = currentWeapons;
}

// Enhanced Stats Overlay for Roguelike
export function createStatsOverlay() {
    let overlay = document.getElementById('statsOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'statsOverlay';
        overlay.className = 'stats-overlay';
        overlay.style.display = 'none';
        document.getElementById('gameContainer').appendChild(overlay);
    }
}

export function updateStatsOverlay() {
    if (!gameState) return;
    
    const overlay = document.getElementById('statsOverlay');
    if (!overlay) return;
    
    const hitRate = gameState.bulletsHit > 0 && gameState.enemiesDefeated > 0
        ? Math.round((gameState.bulletsHit / (gameState.bulletsHit + (gameState.obstaclesAvoided || 0))) * 100) 
        : 0;
    
    // Achievement status
    const achievements = window.ACHIEVEMENTS || {};
    const unlockedCount = Object.values(achievements).filter(a => a.unlocked).length;
    const totalAchievements = Object.keys(achievements).length;
    
    const stats = gameState.stats;
    
    overlay.innerHTML = `
        <div class="stats-overlay-content">
            <h3>📊 DUNGEON STATISTICS</h3>
            
            <div class="stats-section">
                <h4>Performance</h4>
                <div class="stat-row">
                    <span>Current Score:</span>
                    <span class="stat-value">${gameState.score.toLocaleString()}</span>
                </div>
                <div class="stat-row">
                    <span>Current Combo:</span>
                    <span class="stat-value">${gameState.comboCount}x</span>
                </div>
                <div class="stat-row">
                    <span>Hit Rate:</span>
                    <span class="stat-value">${hitRate}%</span>
                </div>
                <div class="stat-row">
                    <span>Enemies Defeated:</span>
                    <span class="stat-value">${gameState.enemiesDefeated}</span>
                </div>
                <div class="stat-row">
                    <span>Obstacles Avoided:</span>
                    <span class="stat-value">${gameState.obstaclesAvoided || 0}</span>
                </div>
            </div>
            
            <div class="stats-section">
                <h4>Character Stats</h4>
                <div class="stat-row">
                    <span>Health:</span>
                    <span class="stat-value">${gameState.currentHealth}/${gameState.maxHealth} HP</span>
                </div>
                <div class="stat-row">
                    <span>Base Damage:</span>
                    <span class="stat-value">${gameState.baseDamage}</span>
                </div>
                <div class="stat-row">
                    <span>Damage Bonus:</span>
                    <span class="stat-value">+${Math.round(stats.damageBonus * 100)}%</span>
                </div>
                <div class="stat-row">
                    <span>Critical Chance:</span>
                    <span class="stat-value">${Math.round(stats.critChance * 100)}%</span>
                </div>
                <div class="stat-row">
                    <span>Critical Damage:</span>
                    <span class="stat-value">${stats.critDamage.toFixed(1)}x</span>
                </div>
                <div class="stat-row">
                    <span>Attack Speed:</span>
                    <span class="stat-value">${(1 + stats.attackSpeed).toFixed(1)}x</span>
                </div>
                <div class="stat-row">
                    <span>Move Speed:</span>
                    <span class="stat-value">${stats.moveSpeed.toFixed(1)}x</span>
                </div>
                <div class="stat-row">
                    <span>Lifesteal:</span>
                    <span class="stat-value">${Math.round(stats.lifeSteal * 100)}%</span>
                </div>
                <div class="stat-row">
                    <span>Health Regen:</span>
                    <span class="stat-value">${stats.healthRegen.toFixed(1)} HP/3s</span>
                </div>
                <div class="stat-row">
                    <span>Bullet Regen:</span>
                    <span class="stat-value">${stats.bulletRegen.toFixed(1)} bullets/2s</span>
                </div>
            </div>
            
            <div class="stats-section">
                <h4>Progress</h4>
                <div class="stat-row">
                    <span>Current Floor:</span>
                    <span class="stat-value">${gameState.level}</span>
                </div>
                <div class="stat-row">
                    <span>Bosses Killed:</span>
                    <span class="stat-value">${gameState.bossesKilled}</span>
                </div>
                <div class="stat-row">
                    <span>Shield Charges:</span>
                    <span class="stat-value">${gameState.shieldCharges}</span>
                </div>
                <div class="stat-row">
                    <span>Bolts:</span>
                    <span class="stat-value">${gameState.isBerserker ? '∞' : gameState.bullets}</span>
                </div>
                <div class="stat-row">
                    <span>Achievements:</span>
                    <span class="stat-value">${unlockedCount}/${totalAchievements}</span>
                </div>
            </div>
            
            <div class="stats-section">
                <h4>Active Weapons</h4>
                ${Object.keys(activeWeaponDrops || {}).length === 0 ? 
                    '<div class="stat-row"><span>No active weapons</span></div>' :
                    Object.keys(activeWeaponDrops).map(weapon => {
                        const weaponInfo = WEAPON_DROPS[weapon];
                        const timeLeft = Math.ceil(activeWeaponDrops[weapon] / 60);
                        return `
                            <div class="stat-row">
                                <span>${weaponInfo?.icon || '🔫'} ${weaponInfo?.name || weapon}:</span>
                                <span class="stat-value">${timeLeft}s</span>
                            </div>
                        `;
                    }).join('')
                }
            </div>
            
            <div class="stats-section">
                <h4>Multipliers & Bonuses</h4>
                <div class="stat-row">
                    <span>Score Multiplier:</span>
                    <span class="stat-value">${gameState.scoreMultiplier}x</span>
                </div>
                <div class="stat-row">
                    <span>Speed Multiplier:</span>
                    <span class="stat-value">${gameState.speedMultiplier.toFixed(1)}x</span>
                </div>
                <div class="stat-row">
                    <span>Drop Chance Bonus:</span>
                    <span class="stat-value">+${Math.round(stats.dropBonus * 100)}%</span>
                </div>
                <div class="stat-row">
                    <span>Combo Drop Bonus:</span>
                    <span class="stat-value">+${Math.min(gameState.comboCount, 20)}%</span>
                </div>
            </div>
            
            <p class="stats-hint">Press TAB to close</p>
        </div>
    `;
}

export function toggleStatsOverlay() {
    const overlay = document.getElementById('statsOverlay');
    if (!overlay) return;
    
    if (overlay.style.display === 'block') {
        overlay.style.display = 'none';
    } else {
        updateStatsOverlay();
        overlay.style.display = 'block';
    }
}

// Achievement Popups
export function showAchievementPopup(achievement) {
    const popup = document.createElement('div');
    popup.className = 'achievement-popup';
    popup.innerHTML = `
        <div class="achievement-icon">🏆</div>
        <div class="achievement-content">
            <div class="achievement-title">${achievement.name}</div>
            <div class="achievement-desc">${achievement.desc}</div>
            <div class="achievement-reward">Reward: ${achievement.reward}</div>
        </div>
    `;
    
    document.getElementById('gameContainer').appendChild(popup);
    
    // Animate in
    setTimeout(() => popup.classList.add('achievement-show'), 10);
    
    // Remove after animation
    setTimeout(() => {
        popup.classList.remove('achievement-show');
        setTimeout(() => popup.remove(), 500);
    }, 4000);
}

// Enhanced Damage Numbers with Color Coding
export function createDamageNumber(x, y, damage, critical = false, color = null) {
    const screenX = x - camera.x;
    if (screenX < -50 || screenX > CANVAS.width + 50) return;
    
    const damageNum = document.createElement('div');
    damageNum.className = `damage-number ${critical ? 'damage-critical' : ''}`;
    damageNum.textContent = damage;
    damageNum.style.left = `${screenX}px`;
    damageNum.style.top = `${y}px`;
    
    // Color coding for different damage types
    if (color) {
        damageNum.style.color = color;
    } else if (critical) {
        damageNum.style.color = '#FFD700'; // Gold for crits
    } else {
        damageNum.style.color = '#FF6B6B'; // Red for normal damage
    }
    
    // Add floating animation
    damageNum.style.animation = critical ? 
        'damageNumberCritical 1.2s ease-out forwards' : 
        'damageNumber 1s ease-out forwards';
    
    document.getElementById('gameContainer').appendChild(damageNum);
    
    // Remove after animation
    setTimeout(() => damageNum.remove(), critical ? 1200 : 1000);
}

// Helper functions
function getDropInfoByKey(key) {
    const keyToType = {
        'speedBoost': 'speedBoost',
        'jumpBoost': 'jumpBoost',
        'scoreMultiplier': 'scoreMultiplier',
        'magnetMode': 'magnetMode',
        'berserkerMode': 'berserkerMode',
        'ghostWalk': 'ghostWalk',
        'timeSlow': 'timeSlow'
    };
    
    const dropType = keyToType[key];
    const dropInfo = DROP_INFO[dropType];
    
    // Fallback if not found
    if (!dropInfo) {
        return {
            icon: '⭐',
            name: key.charAt(0).toUpperCase() + key.slice(1)
        };
    }
    
    return dropInfo;
}

function getOriginalDuration(buffKey) {
    const allItems = [...DROP_CONFIG.boss.items, ...DROP_CONFIG.common.items];
    const config = allItems.find(item => {
        const keyMap = {
            'speedBoost': 'speedBoost',
            'jumpBoost': 'jumpBoost',
            'scoreMultiplier': 'scoreMultiplier',
            'magnetMode': 'magnetMode',
            'berserkerMode': 'berserkerMode',
            'ghostWalk': 'ghostWalk',
            'timeSlow': 'timeSlow'
        };
        return item.type === keyMap[buffKey];
    });
    
    return config?.duration || 600;
}

function createComboParticle() {
    const particle = document.createElement('div');
    particle.className = 'combo-particle';
    particle.style.left = `${50 + (Math.random() - 0.5) * 100}%`;
    particle.style.top = '100px';
    particle.style.setProperty('--random-x', (Math.random() - 0.5) * 2);
    
    document.getElementById('gameContainer').appendChild(particle);
    
    setTimeout(() => particle.remove(), 1000);
}

// Initialize enhancements
export function initEnhancements() {
    // Initialize containers
    initEnhancedContainers();
    
    // Add CSS animations for damage numbers and buff counter if not already added
    if (!document.querySelector('#enhancedUIStyles')) {
        const style = document.createElement('style');
        style.id = 'enhancedUIStyles';
        style.textContent = `
            @keyframes damageNumber {
                0% { 
                    transform: translateY(0) scale(0.8); 
                    opacity: 1; 
                }
                50% { 
                    transform: translateY(-20px) scale(1.1); 
                    opacity: 1; 
                }
                100% { 
                    transform: translateY(-40px) scale(1); 
                    opacity: 0; 
                }
            }
            
            @keyframes damageNumberCritical {
                0% { 
                    transform: translateY(0) scale(1); 
                    opacity: 1; 
                    text-shadow: 0 0 10px currentColor;
                }
                25% { 
                    transform: translateY(-15px) scale(1.3); 
                    opacity: 1; 
                    text-shadow: 0 0 15px currentColor;
                }
                50% { 
                    transform: translateY(-25px) scale(1.2); 
                    opacity: 1; 
                    text-shadow: 0 0 20px currentColor;
                }
                100% { 
                    transform: translateY(-50px) scale(1); 
                    opacity: 0; 
                    text-shadow: 0 0 5px currentColor;
                }
            }
            
            .damage-number {
                position: absolute;
                font-family: 'Rajdhani', sans-serif;
                font-weight: bold;
                font-size: 16px;
                pointer-events: none;
                z-index: 1000;
                user-select: none;
            }
            
            .damage-critical {
                font-size: 20px;
                font-weight: 900;
                text-shadow: 0 0 10px currentColor;
            }
            
            .buff-counter {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid #00ff88;
                border-radius: 6px;
                padding: 4px 8px;
                margin-bottom: 6px;
                font-family: 'Rajdhani', sans-serif;
            }
            
            .buff-count {
                font-size: 12px;
                font-weight: bold;
                color: #00ff88;
            }
            
            .buff-count.buff-limit-reached {
                color: #ff4444;
            }
            
            .buff-label {
                font-size: 10px;
                color: #cccccc;
                margin-left: 4px;
            }
            
            .weapon-item {
                display: flex;
                align-items: center;
                background: rgba(0, 0, 0, 0.7);
                border-radius: 8px;
                padding: 8px;
                margin-bottom: 4px;
                border-left: 3px solid;
            }
            
            .weapon-item.legendary { border-left-color: #FF6B00; }
            .weapon-item.epic { border-left-color: #A335EE; }
            .weapon-item.rare { border-left-color: #0070DD; }
            .weapon-item.common { border-left-color: #9D9D9D; }
            
            .weapon-item.weapon-expiring {
                animation: weaponExpiring 1s infinite;
            }
            
            .weapon-item.weapon-new {
                animation: weaponNew 2s ease-out;
            }
            
            @keyframes weaponExpiring {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes weaponNew {
                0% { transform: translateX(-20px); opacity: 0; }
                100% { transform: translateX(0); opacity: 1; }
            }
            
            .weapon-icon {
                font-size: 16px;
                margin-right: 8px;
                min-width: 20px;
            }
            
            .weapon-info {
                flex: 1;
                min-width: 0;
            }
            
            .weapon-name {
                font-size: 11px;
                font-weight: bold;
                color: #ffffff;
                margin-bottom: 2px;
            }
            
            .weapon-timer {
                font-size: 10px;
                color: #cccccc;
                margin-bottom: 2px;
            }
            
            .weapon-progress {
                background: rgba(255, 255, 255, 0.2);
                height: 3px;
                border-radius: 2px;
                overflow: hidden;
            }
            
            .weapon-progress-fill {
                background: #00ff88;
                height: 100%;
                transition: width 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add keyboard listener for stats overlay
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Tab' && gameState && gameState.gameRunning) {
            e.preventDefault();
            toggleStatsOverlay();
        }
    });
}