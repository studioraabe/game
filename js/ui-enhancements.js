// ui-enhancements.js - Enhanced UI Visualizations - ADDED HEALTH BUFF SUPPORT

import { gameState } from './core/gameState.js';
import { activeDropBuffs } from './systems.js';
import { DROP_INFO, DROP_CONFIG, CANVAS } from './core/constants.js';
import { camera } from './core/camera.js';
import { setComboGlow, clearComboGlow } from './enhanced-damage-system.js';

// Initialize enhanced UI containers
export function initEnhancedContainers() {
    // Remove existing containers
    const existingBuff = document.getElementById('enhancedBuffs');
    const existingCombo = document.getElementById('comboDisplay');
    if (existingBuff) existingBuff.remove();
    if (existingCombo) existingCombo.remove();
    
    // Create enhanced buffs container
    const buffContainer = document.createElement('div');
    buffContainer.id = 'enhancedBuffs';
    buffContainer.className = 'enhanced-buffs-container';
    buffContainer.style.cssText = `
        position: absolute !important;
        bottom: 12px !important;
        left: 16px !important;
        z-index: 20 !important;
    `;
    document.getElementById('gameContainer').appendChild(buffContainer);
    
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

// Helper function für RGBA conversion
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
    
    // Timer-Ablauf/Reset Detection
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
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) canvas.style.filter = '';
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
            if (count >= 200) return '#FF00FF';
            if (count >= 100) return '#DC143C';
            if (count >= 50) return '#FF4500';
            if (count >= 30) return '#00ff88';
            if (count >= 20) return '#00ff88';
            if (count >= 10) return '#00ff88';
            if (count >= 5) return '#00ff88';
            return '#00ff88';
        };
        
        const timerPercent = Math.max(0, Math.min(100, (gameState.comboTimer / 300) * 100));
        const comboColor = getComboColor(gameState.comboCount);
        const shouldWiggle = gameState.comboCount > (lastComboCount - 1) && displayWasVisible;
        
        comboDisplay.innerHTML = `
            <div class="combo-number-subtle ${shouldWiggle ? 'combo-wiggle' : ''}" style="color: ${comboColor}">
                ${gameState.comboCount}x
            </div>
            <div class="combo-timer-subtle">
                <div class="combo-timer-fill-subtle" style="width: ${timerPercent}%; background-color: ${comboColor}"></div>
            </div>
        `;
        
        // Canvas glow effect using enhanced glow system
        if (gameState.comboCount >= 20) {
            const glowIntensity = Math.min((gameState.comboCount - 20) * 0.5, 10);
            const comboColor = getComboColor(gameState.comboCount);
            setComboGlow(glowIntensity, comboColor);
        } else {
            clearComboGlow();
        }
    }
}

// Enhanced Buff Display - ADDED HEALTH BUFF SUPPORT
let previousBuffs = new Set();

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
            max-width: 160px;
            z-index: 100 !important;
            pointer-events: none;
            display: block !important;
            visibility: visible !important;
        `;
        document.getElementById('gameContainer').appendChild(buffContainer);
    }
    
    const activeBuffsHTML = [];
    const currentBuffs = new Set();
    
    // ONLY temporary buffs with timers (max 5)
    if (activeDropBuffs && typeof activeDropBuffs === 'object') {
        const buffKeys = Object.keys(activeDropBuffs);
        const activeTempBuffs = buffKeys.filter(key => activeDropBuffs[key] > 0);
        
        // Limit to 5 buffs maximum
        const displayBuffs = activeTempBuffs.slice(0, 5);
        
        displayBuffs.forEach(buffKey => {
            const remaining = activeDropBuffs[buffKey];
            if (remaining <= 0) return;
            
            const dropInfo = getDropInfoByKey(buffKey);
            if (!dropInfo) return;
            
            const originalDuration = getOriginalDuration(buffKey);
            const percentage = (remaining / originalDuration) * 100;
            const isLow = remaining < 180; // Less than 3 seconds
            const isNew = !previousBuffs.has(buffKey);
            
            activeBuffsHTML.push(`
                <div class="buff-item ${isLow ? 'buff-expiring' : ''} buff-${buffKey} ${isNew ? 'buff-new' : ''}">
                    <div class="buff-icon">${dropInfo.icon}</div>
                    <div class="buff-info">
                        <div class="buff-name">${dropInfo.name}</div>
                        <div class="buff-timer">${Math.ceil(remaining / 60)}s</div>
                        <div class="buff-progress">
                            <div class="buff-progress-fill" style="width: ${percentage}%"></div>
                        </div>
                    </div>
                </div>
            `);
            currentBuffs.add(buffKey);
        });
        
        // Add overflow indicator if more than 5 buffs
        if (activeTempBuffs.length > 5) {
            const overflowCount = activeTempBuffs.length - 5;
            activeBuffsHTML.push(`
                <div class="buff-item buff-overflow">
                    <div class="buff-icon">⋯</div>
                    <div class="buff-info">
                        <div class="buff-name">+${overflowCount} more</div>
                        <div class="buff-timer">Hidden</div>
                    </div>
                </div>
            `);
        }
    }
    
    // Update container
    buffContainer.innerHTML = activeBuffsHTML.join('');
    
    if (activeBuffsHTML.length === 0) {
        buffContainer.style.display = 'none';
    } else {
        buffContainer.style.display = 'block';
    }
    
    previousBuffs = currentBuffs;
}

// Stats Overlay
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
    
    // Count current temporary buffs
    const currentTempBuffs = activeDropBuffs ? Object.keys(activeDropBuffs).filter(key => activeDropBuffs[key] > 0).length : 0;
    
    // Calculate HP percentage
    const hpPercent = Math.round((gameState.currentHP / gameState.maxHP) * 100);
    
    overlay.innerHTML = `
        <div class="stats-overlay-content">
            <h3>📊 GAME STATISTICS</h3>
            
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
                    <span>Health:</span>
                    <span class="stat-value">${gameState.currentHP}/${gameState.maxHP} (${hpPercent}%)</span>
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
                    <span>Active Buffs:</span>
                    <span class="stat-value">${currentTempBuffs}/5</span>
                </div>
                <div class="stat-row">
                    <span>Achievements:</span>
                    <span class="stat-value">${unlockedCount}/${totalAchievements}</span>
                </div>
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
                    <span class="stat-value">+${Math.min(gameState.comboCount, 20)}%</span>
                </div>
                <div class="stat-row">
                    <span>Achievement Drop Bonus:</span>
                    <span class="stat-value">${achievements.firstBlood?.unlocked ? '+10%' : '0%'}</span>
                </div>
                <div class="stat-row">
                    <span>Healing Boost:</span>
                    <span class="stat-value">${activeDropBuffs.healingBoost > 0 ? '+20%' : 'None'}</span>
                </div>
                <div class="stat-row">
                    <span>Regeneration:</span>
                    <span class="stat-value">${activeDropBuffs.regeneration > 0 ? 'Active' : 'None'}</span>
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

// Damage Numbers
export function createDamageNumber(x, y, damage, critical = false) {
    const screenX = x - camera.x;
    if (screenX < -50 || screenX > CANVAS.width + 50) return;
    
    const damageNum = document.createElement('div');
    damageNum.className = `damage-number ${critical ? 'damage-critical' : ''}`;
    damageNum.textContent = damage;
    damageNum.style.left = `${screenX}px`;
    damageNum.style.top = `${y}px`;
    
    document.getElementById('gameContainer').appendChild(damageNum);
    
    // Animate and remove
    setTimeout(() => damageNum.remove(), 1000);
}

// Helper functions - ENHANCED WITH HEALTH BUFF SUPPORT
function getDropInfoByKey(key) {
    const keyToType = {
        'speedBoost': 'speedBoost',
        'jumpBoost': 'jumpBoost',
        'scoreMultiplier': 'scoreMultiplier',
        'magnetMode': 'magnetMode',
        'berserkerMode': 'berserkerMode',
        'ghostWalk': 'ghostWalk',
        'timeSlow': 'timeSlow',
        // NEW: Health-related buffs
        'healingBoost': 'healingBoost',
        'regeneration': 'regeneration'
    };
    
    const dropType = keyToType[key];
    
    // Check if it's in the standard DROP_INFO
    let dropInfo = DROP_INFO[dropType];
    
    // NEW: Handle health-specific buffs that might not be in DROP_INFO
    if (!dropInfo) {
        switch(key) {
            case 'healingBoost':
                dropInfo = {
                    icon: '💚',
                    color: '#00ff88',
                    name: 'Healing Boost'
                };
                break;
            case 'regeneration':
                dropInfo = {
                    icon: '💖',
                    color: '#ff69b4',
                    name: 'Regeneration'
                };
                break;
            default:
                // Fallback if not found
                dropInfo = {
                    icon: '⭐',
                    color: '#ffd700',
                    name: key.charAt(0).toUpperCase() + key.slice(1)
                };
        }
    }
    
    return dropInfo;
}

function getOriginalDuration(buffKey) {
    // NEW: Health buff durations
    const healthBuffDurations = {
        'healingBoost': 1800,  // 30 seconds
        'regeneration': 600    // 10 seconds
    };
    
    if (healthBuffDurations[buffKey]) {
        return healthBuffDurations[buffKey];
    }
    
    // Standard buff durations
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
    
    // Add keyboard listener for stats overlay
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Tab' && gameState && gameState.gameRunning) {
            e.preventDefault();
            toggleStatsOverlay();
        }
    });
}