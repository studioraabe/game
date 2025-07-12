// js/ui-manager.js - Centralized UI management system

import { gameState } from './core/gameState.js';
import { player } from './core/player.js';
import { setComboGlow, clearComboGlow } from './enhanced-damage-system.js';
import { getComboPointsMultiplier, getComboDropBonus, activeDropBuffs } from './systems.js';

/**
 * UI Manager - Centralizes all UI-related functionality
 * Handles initialization, updates, and state management for all UI components
 */
class UIManager {
    constructor() {
        this.components = {
            health: null,
            bullets: null,
            score: null,
            combo: null,
            buffs: null,
            weapon: null
        };
        this.initialized = false;
        
        // Track previous states to optimize updates
        this.lastStates = {
            comboCount: 0,
            comboTimer: 0,
            displayWasVisible: false,
            healthValue: 0,
            maxHealthValue: 0,
            bulletValue: 0,
            scoreValue: 0,
            levelValue: 0,
            previousBuffs: new Set()
        };
    }
    
    /**
     * Initialize the UI Manager and all components
     */
    init() {
        if (this.initialized) return;
        
        console.log('🎮 Initializing UI Manager');
        
        // Initialize all UI components
        this.initHealthBar();
        this.initBulletCounter();
        this.initScorePanel();
        this.initComboDisplay();
        this.initBuffsDisplay();
        this.initWeaponHUD();
        this.initScreens();
        
        // Hook into game lifecycle
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('🎮 UI Manager initialized');
        
        // Initial update
        this.update();
    }
    
    /**
     * Initialize health bar with shield support
     */
    initHealthBar() {
        this.components.health = document.getElementById('healthContainer');
        if (!this.components.health) {
            console.warn('Health container not found');
            return;
        }
        
        // Clear any existing content
        this.components.health.innerHTML = '';
        
        // Create the health bar structure
        const hpBar = document.createElement('div');
        hpBar.className = 'hp-bar';
        
        // HP fill element
        const hpFill = document.createElement('div');
        hpFill.className = 'hp-fill';
        hpBar.appendChild(hpFill);
        
        // Shield overlay
        const shieldOverlay = document.createElement('div');
        shieldOverlay.className = 'shield-overlay';
        hpBar.appendChild(shieldOverlay);
        
        // Health text
        const hpText = document.createElement('div');
        hpText.className = 'hp-text';
        hpBar.appendChild(hpText);
        
        // Shield counter
        const shieldCounter = document.createElement('div');
        shieldCounter.className = 'shield-counter';
        
        const shieldIcon = document.createElement('span');
        shieldIcon.className = 'shield-icon';
        shieldIcon.textContent = '🛡️';
        
        const shieldCount = document.createElement('span');
        shieldCount.className = 'shield-count';
        
        shieldCounter.appendChild(shieldIcon);
        shieldCounter.appendChild(shieldCount);
        hpBar.appendChild(shieldCounter);
        
        // Add to container
        this.components.health.appendChild(hpBar);
    }
    
    /**
     * Initialize bullet counter with regen support
     */
    initBulletCounter() {
        this.components.bullets = document.getElementById('bullets');
    }
    
    /**
     * Initialize score panel
     */
    initScorePanel() {
        this.components.score = document.getElementById('score');
        this.components.level = document.getElementById('level');
    }
    
    /**
     * Initialize combo display
     */
    initComboDisplay() {
        this.components.combo = document.getElementById('comboDisplay');
        if (!this.components.combo) {
            console.warn('Combo display not found');
            return;
        }
    }
    
    /**
     * Initialize buffs display
     */
    initBuffsDisplay() {
        this.components.buffs = document.getElementById('enhancedBuffs');
        if (!this.components.buffs) {
            console.warn('Buffs container not found');
            return;
        }
    }
    
    /**
     * Initialize weapon HUD
     */
    initWeaponHUD() {
        // Weapon HUD is managed by the weapon-hotkey-system.js
        this.components.weapon = document.getElementById('weaponHUD');
    }
    
    /**
     * Initialize game screens
     */
    initScreens() {
        // No need to initialize these - they're already in the HTML
        // Just ensure they're all hidden by default
        const screens = ['startScreen', 'levelComplete', 'gameOver', 'pauseScreen', 'infoOverlay'];
        screens.forEach(id => {
            const screen = document.getElementById(id);
            if (screen) {
                screen.style.display = 'none';
            }
        });
    }
    
    /**
     * Set up event listeners for UI components
     */
    setupEventListeners() {
        // Tab key for stats overlay
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && gameState && gameState.gameRunning) {
                e.preventDefault();
                this.toggleStatsOverlay();
            }
        });
    }
    
    /**
     * Update all UI components
     */
    update() {
        if (!gameState) return;
        
        this.updateHealthBar();
        this.updateBulletCounter();
        this.updateScorePanel();
        this.updateComboDisplay();
        this.updateBuffsDisplay();
        
        // Weapon HUD is updated by its own system
    }
    
    /**
     * Update health bar with current health, max health, and shield status
     */
    updateHealthBar() {
        if (!this.components.health || !gameState) return;
        
        // Skip if values haven't changed
        if (this.lastStates.healthValue === gameState.currentHP && 
            this.lastStates.maxHealthValue === gameState.maxHP && 
            this.lastStates.shieldValue === gameState.shieldCharges) {
            return;
        }
        
        // Update tracked values
        this.lastStates.healthValue = gameState.currentHP;
        this.lastStates.maxHealthValue = gameState.maxHP;
        this.lastStates.shieldValue = gameState.shieldCharges;
        
        // Calculate HP percentage
        const hpPercent = Math.max(0, (gameState.currentHP / gameState.maxHP) * 100);
        
        // Get components
        const hpFill = this.components.health.querySelector('.hp-fill');
        const hpText = this.components.health.querySelector('.hp-text');
        const shieldCount = this.components.health.querySelector('.shield-count');
        
        if (hpFill) {
            // Set width and color based on health percentage
            hpFill.style.width = `${hpPercent}%`;
            
            // Remove existing classes
            hpFill.classList.remove('healthy', 'warning', 'critical');
            
            // Add appropriate class based on health percentage
            if (hpPercent <= 20) {
                hpFill.classList.add('critical');
                this.components.health.classList.add('critical-health');
            } else if (hpPercent <= 50) {
                hpFill.classList.add('warning');
                this.components.health.classList.remove('critical-health');
            } else {
                hpFill.classList.add('healthy');
                this.components.health.classList.remove('critical-health');
            }
        }
        
        // Update HP text
        if (hpText) {
            hpText.textContent = `${gameState.currentHP} / ${gameState.maxHP}`;
        }
        
        // Handle shield state
        if (gameState.shieldCharges > 0) {
            this.components.health.classList.add('shield-active');
        } else {
            this.components.health.classList.remove('shield-active');
        }
        
        // Update shield counter
        if (shieldCount) {
            shieldCount.textContent = gameState.shieldCharges;
        }
        
        // Handle regeneration indicator
        const healthRegen = gameState.playerStats?.healthRegen || 0;
        if (healthRegen > 0.5) { // Only show if above baseline
            this.components.health.classList.add('regenerating');
            this.components.health.title = `Regenerating ${healthRegen.toFixed(2)} HP/second`;
        } else {
            this.components.health.classList.remove('regenerating');
            this.components.health.title = '';
        }
    }
    
    /**
     * Update bullet counter with current bullet count and max bullets
     */
    updateBulletCounter() {
        if (!this.components.bullets || !gameState) return;
        
        // Skip if value hasn't changed
        if (this.lastStates.bulletValue === gameState.bullets &&
            this.lastStates.isBerserker === gameState.isBerserker) {
            return;
        }
        
        // Update tracked values
        this.lastStates.bulletValue = gameState.bullets;
        this.lastStates.isBerserker = gameState.isBerserker;
        
        // Update bullet display
        const bulletDisplay = gameState.isBerserker ? '∞' : `${gameState.bullets}/${gameState.maxBullets}`;
        this.components.bullets.textContent = bulletDisplay;
        
        // Handle bullet regeneration indicator
        const bulletRegen = gameState.playerStats?.bulletRegen || 0;
        if (bulletRegen > 0.5) { // Only show if above baseline
            this.components.bullets.classList.add('recharging');
            this.components.bullets.title = `Regenerating ${bulletRegen.toFixed(2)} bullets/second`;
        } else {
            this.components.bullets.classList.remove('recharging');
            this.components.bullets.title = '';
        }
    }
    
    /**
     * Update score panel with current score and level
     */
    updateScorePanel() {
        if (!this.components.score || !this.components.level || !gameState) return;
        
        // Skip if values haven't changed
        if (this.lastStates.scoreValue === gameState.score && 
            this.lastStates.levelValue === gameState.level) {
            return;
        }
        
        // Update tracked values
        this.lastStates.scoreValue = gameState.score;
        this.lastStates.levelValue = gameState.level;
        
        // Update UI
        this.components.score.textContent = gameState.score.toLocaleString();
        this.components.level.textContent = gameState.level;
    }
    
    /**
     * Update combo display with current combo count and timer
     */
    updateComboDisplay() {
        if (!this.components.combo || !gameState) return;
        
        const shouldShow = gameState.comboCount >= 2 && gameState.comboTimer > 0;
        
        // Skip if nothing has changed
        if (this.lastStates.comboCount === gameState.comboCount && 
            this.lastStates.comboTimer === gameState.comboTimer &&
            this.lastStates.displayWasVisible === shouldShow) {
            return;
        }
        
        // Update tracked values
        this.lastStates.displayWasVisible = shouldShow;
        this.lastStates.comboCount = gameState.comboCount;
        this.lastStates.comboTimer = gameState.comboTimer;
        
        if (shouldShow) {
            this.components.combo.style.display = 'block';
            this.components.combo.className = 'combo-display-enhanced combo-subtle';
            
            const getComboColor = (count) => {
                if (count >= 100) return '#FF00FF';  // Magenta for 100+
                if (count >= 50) return '#DC143C';   // Crimson for 50+
                if (count >= 30) return '#FF4500';   // Orange for 30+
                if (count >= 20) return '#FFD700';   // Gold for 20+
                if (count >= 10) return '#00ff88';   // Green for 10+
                return '#00ff88';                    // Default green
            };
            
            const timerPercent = Math.max(0, Math.min(100, (gameState.comboTimer / 300) * 100));
            const comboColor = getComboColor(gameState.comboCount);
            const shouldWiggle = gameState.comboCount > (this.lastStates.comboCount - 1) && this.lastStates.displayWasVisible;
            
            // Calculate bonus percentages
            const dropBonus = Math.min(gameState.comboCount * 1, 100);
            const pointsBonus = Math.min(gameState.comboCount * 1, 100);
            
            this.components.combo.innerHTML = `
                <div class="combo-number-subtle ${shouldWiggle ? 'combo-wiggle' : ''}" style="color: ${comboColor}">
                    ${gameState.comboCount}x COMBO
                </div>
                <div class="combo-bonuses" style="font-size: 12px; color: ${comboColor}; margin-top: 2px;">
                    +${dropBonus}% Drops | +${pointsBonus}% Points
                </div>
                <div class="combo-timer-subtle">
                    <div class="combo-timer-fill-subtle" style="width: ${timerPercent}%; background-color: ${comboColor}"></div>
                </div>
            `;
            
            // Enhanced glow effect
            if (gameState.comboCount >= 20) {
                const glowIntensity = Math.min((gameState.comboCount - 20) * 0.5, 15);
                setComboGlow(glowIntensity, comboColor);
            } else {
                clearComboGlow();
            }
        } else {
            // Hide combo display
            this.components.combo.style.display = 'none';
            clearComboGlow();
        }
    }
    
    /**
     * Update buffs display with active buffs
     */
    updateBuffsDisplay() {
        if (!this.components.buffs || !gameState) return;
        
        if (!activeDropBuffs || typeof activeDropBuffs !== 'object') return;
        
        const buffKeys = Object.keys(activeDropBuffs);
        const activeTempBuffs = buffKeys.filter(key => activeDropBuffs[key] > 0);
        
        // Check if buffs have changed
        const currentBuffs = new Set(activeTempBuffs);
        let buffValuesChanged = false;
        
        // Check if the set of active buffs has changed
        if (currentBuffs.size !== this.lastStates.previousBuffs.size) {
            buffValuesChanged = true;
        } else {
            // Check if any active buff has changed
            for (const key of currentBuffs) {
                if (!this.lastStates.previousBuffs.has(key)) {
                    buffValuesChanged = true;
                    break;
                }
            }
        }
        
        // Only update if buffs have changed or we're forcing an update
        if (!buffValuesChanged) return;
        
        const activeBuffsHTML = [];
        
        // Limit to 5 buffs maximum
        const displayBuffs = activeTempBuffs.slice(0, 5);
        
        displayBuffs.forEach(buffKey => {
            const remaining = activeDropBuffs[buffKey];
            if (remaining <= 0) return;
            
            const dropInfo = this.getDropInfoByKey(buffKey);
            if (!dropInfo) return;
            
            const originalDuration = this.getOriginalDuration(buffKey);
            const percentage = (remaining / originalDuration) * 100;
            const isLow = remaining < 180; // Less than 3 seconds
            const isNew = !this.lastStates.previousBuffs.has(buffKey);
            
            activeBuffsHTML.push(`
                <div class="temp-buff-item ${isLow ? 'temp-buff-expiring' : ''} temp-buff-${buffKey} ${isNew ? 'temp-buff-new' : ''}">
                    <div class="temp-buff-icon">${dropInfo.icon}</div>
                    <div class="temp-buff-info">
                        <div class="temp-buff-name">${dropInfo.name}</div>
                        <div class="temp-buff-timer">${Math.ceil(remaining / 60)}s</div>
                        <div class="temp-buff-progress">
                            <div class="temp-buff-progress-fill" style="width: ${percentage}%"></div>
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
                <div class="temp-buff-item buff-overflow">
                    <div class="temp-buff-icon">⋯</div>
                    <div class="temp-buff-info">
                        <div class="temp-buff-name">+${overflowCount} more</div>
                        <div class="temp-buff-timer">Hidden</div>
                    </div>
                </div>
            `);
        }
        
        // Update container
        this.components.buffs.innerHTML = activeBuffsHTML.join('');
        
        if (activeBuffsHTML.length === 0) {
            this.components.buffs.style.display = 'none';
        } else {
            this.components.buffs.style.display = 'block';
        }
        
        // Update previous buffs reference
        this.lastStates.previousBuffs = currentBuffs;
    }
    
    /**
     * Show stats overlay
     */
    toggleStatsOverlay() {
        let overlay = document.getElementById('statsOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'statsOverlay';
            overlay.className = 'stats-overlay';
            overlay.style.display = 'none';
            document.getElementById('gameContainer').appendChild(overlay);
        }
        
        if (overlay.style.display === 'block') {
            overlay.style.display = 'none';
        } else {
            this.updateStatsOverlay();
            overlay.style.display = 'block';
        }
    }
    
    /**
     * Update stats overlay content
     */
    updateStatsOverlay() {
        if (!gameState) return;
        
        const overlay = document.getElementById('statsOverlay');
        if (!overlay) return;
        
        // Calculate combo bonuses
        const comboDropBonus = Math.min(gameState.comboCount * 1, 100);
        const comboPointsBonus = Math.min(gameState.comboCount * 1, 100);
        
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
                        <span>Health Regen:</span>
                        <span class="stat-value">${(gameState.playerStats?.healthRegen || 0).toFixed(1)}/s</span>
                    </div>
                    <div class="stat-row">
                        <span>Bullet Regen:</span>
                        <span class="stat-value">${(gameState.playerStats?.bulletRegen || 0).toFixed(1)}/s</span>
                    </div>
                </div>
                
                <p class="stats-hint">Press TAB to close</p>
            </div>
        `;
    }
    
    /**
     * Show achievement notification
     * @param {Object} achievement - Achievement object with name, desc, and reward
     */
    showAchievementPopup(achievement) {
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
    
    /**
     * Create damage number
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} damage - Damage amount
     * @param {boolean} critical - Whether damage is critical
     */
    createDamageNumber(x, y, damage, critical = false) {
        // Convert world position to screen position
        const screenX = window.getScreenX ? window.getScreenX(x) : x;
        
        // Check if it's within visible screen bounds
        if (screenX < -50 || screenX > 1010) return;
        
        const damageNum = document.createElement('div');
        damageNum.className = `damage-number ${critical ? 'damage-critical' : ''}`;
        damageNum.textContent = damage;
        damageNum.style.left = `${screenX}px`;
        damageNum.style.top = `${y}px`;
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(damageNum);
        }
        
        // Animate and remove
        setTimeout(() => {
            if (damageNum.parentNode) {
                damageNum.remove();
            }
        }, 1000);
    }
    
    /**
     * Helper to get drop info by key
     * @param {string} key - Buff key
     * @returns {Object} Drop info
     */
    getDropInfoByKey(key) {
        const DROP_INFO = window.DROP_INFO || {};
        
        const keyToType = {
            'speedBoost': 'speedBoost',
            'jumpBoost': 'jumpBoost',
            'scoreMultiplier': 'scoreMultiplier',
            'magnetMode': 'magnetMode',
            'berserkerMode': 'berserkerMode',
            'ghostWalk': 'ghostWalk',
            'timeSlow': 'timeSlow',
            'healingBoost': 'healingBoost',
            'regeneration': 'regeneration'
        };
        
        const dropType = keyToType[key];
        
        // Check if it's in the standard DROP_INFO
        let dropInfo = DROP_INFO[dropType];
        
        // Handle health-specific buffs that might not be in DROP_INFO
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
    
    /**
     * Helper to get original duration for a buff
     * @param {string} buffKey - Buff key
     * @returns {number} Original duration
     */
    getOriginalDuration(buffKey) {
        // Health buff durations
        const healthBuffDurations = {
            'healingBoost': 1800,  // 30 seconds
            'regeneration': 600    // 10 seconds
        };
        
        if (healthBuffDurations[buffKey]) {
            return healthBuffDurations[buffKey];
        }
        
        // Standard buff durations
        const DROP_CONFIG = window.DROP_CONFIG || {
            boss: { items: [] },
            common: { items: [] }
        };
        
        const allItems = [...(DROP_CONFIG.boss?.items || []), ...(DROP_CONFIG.common?.items || [])];
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
}

// Create singleton instance
const uiManager = new UIManager();

// Export the manager
export default uiManager;

// Make the UI manager globally available
window.uiManager = uiManager;

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        uiManager.init();
    }, 1000);
});

// Replace existing UI functions with centralized ones
window.updateUI = () => uiManager.update();
window.updateEnhancedDisplays = () => uiManager.update();
window.updateHealthBar = () => uiManager.updateHealthBar();
window.createDamageNumber = (x, y, damage, critical) => uiManager.createDamageNumber(x, y, damage, critical);
window.showAchievementPopup = (achievement) => uiManager.showAchievementPopup(achievement);
window.toggleStatsOverlay = () => uiManager.toggleStatsOverlay();