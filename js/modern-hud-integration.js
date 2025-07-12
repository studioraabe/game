// js/modern-hud-integration.js - Integration for Modern HUD System

export class ModernHUD {
    constructor() {
        this.container = null;
        this.updateInterval = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        
        // Create the modern HUD container
        this.createHUDContainer();
        
        // Hide old UI elements
        this.hideOldUI();
        
        // Start update loop
        this.startUpdateLoop();
        
        this.initialized = true;
        console.log('🎮 Modern HUD System initialized');
    }

    createHUDContainer() {
        // Remove existing modern HUD if any
        const existing = document.getElementById('modernHUD');
        if (existing) existing.remove();

        // Create the modern HUD
        this.container = document.createElement('div');
        this.container.className = 'modern-hud';
        this.container.id = 'modernHUD';
        this.container.innerHTML = this.getHUDHTML();

        // Add to game container
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(this.container);
        }

        // Add styles
        this.addStyles();
    }

    getHUDHTML() {
        return `
            <!-- Top Left - Combo Timer -->
            <div class="hud-combo" id="hudCombo">
                <div class="combo-text" id="comboText">2x COMBO</div>
                <div class="combo-timer-bar">
                    <div class="combo-timer-fill" id="comboTimerFill"></div>
                </div>
            </div>

            <!-- Top Center - Points Display -->
            <div class="hud-points" id="hudPoints">
                <div class="points-value" id="pointsValue">21,213</div>
                <div class="points-label">Points</div>
            </div>

            <!-- Top Right - Level & Score -->
            <div class="hud-level-score" id="hudLevelScore">
                <div class="stat-item">
                    <div class="stat-label">Level</div>
                    <div class="stat-value" id="statLevel">4</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Score</div>
                    <div class="stat-value" id="statScore">21,213</div>
                </div>
            </div>

            <!-- Bottom Left - Buffs -->
            <div class="hud-buffs" id="hudBuffs"></div>

            <!-- Center Bottom - Combined Cockpit -->
            <div class="hud-cockpit" id="hudCockpit">
                <!-- Weapon Slots -->
                <div class="weapon-slot active">
                    <div class="weapon-icon">⚡</div>
                    <div class="weapon-key">Q</div>
                    <div class="weapon-cooldown"></div>
                </div>
                <div class="weapon-slot">
                    <div class="weapon-icon">🔵</div>
                    <div class="weapon-key">W</div>
                    <div class="weapon-cooldown"></div>
                </div>
                <div class="weapon-slot">
                    <div class="weapon-icon">💥</div>
                    <div class="weapon-key">E</div>
                    <div class="weapon-cooldown"></div>
                </div>
                <div class="weapon-slot">
                    <div class="weapon-icon">⚡</div>
                    <div class="weapon-key">R</div>
                    <div class="weapon-cooldown"></div>
                </div>
                
                <!-- Energy Bar (right side) -->
                <div class="cockpit-energy">
                    <div class="energy-bar">
                        <div class="energy-fill" id="energyFill"></div>
                    </div>
                    <div class="energy-text" id="energyText">461/500</div>
                </div>
                
                <!-- Health Bar (inside cockpit, below weapons) -->
                <div class="cockpit-health">
                    <div class="health-bar" id="healthBar">
                        <div class="health-fill" id="healthFill"></div>
                        <div class="shield-overlay"></div>
                    </div>
                    <div class="health-text" id="healthText">180/200</div>
                </div>
            </div>
        `;
    }

    addStyles() {
        if (document.getElementById('modernHUDStyles')) return;

        const style = document.createElement('style');
        style.id = 'modernHUDStyles';
        style.textContent = `
            .modern-hud {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
                font-family: 'Rajdhani', sans-serif;
                z-index: 1000;
            }

            .hud-combo {
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(0, 255, 136, 0.4);
                border-radius: 8px;
                padding: 8px 12px;
                display: none;
            }

            .hud-combo.active {
                display: block;
            }

            .combo-text {
                color: #00ff88;
                font-size: 20px;
                font-weight: 700;
                text-shadow: 0 0 8px currentColor;
                margin-bottom: 4px;
            }

            .combo-timer-bar {
                width: 80px;
                height: 3px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
            }

            .combo-timer-fill {
                height: 100%;
                background: #00ff88;
                transition: width 0.1s linear;
            }

            .hud-points {
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(0, 255, 136, 0.4);
                border-radius: 8px;
                padding: 8px 16px;
                text-align: center;
            }

            .points-value {
                color: #00ff88;
                font-size: 24px;
                font-weight: 700;
                font-family: 'Rajdhani', monospace;
                line-height: 1;
            }

            .points-label {
                color: #888;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 2px;
            }

            .hud-level-score {
                position: absolute;
                top: 20px;
                right: 20px;
                display: flex;
                gap: 24px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(0, 255, 136, 0.4);
                border-radius: 8px;
                padding: 8px 16px;
            }

            .hud-buffs {
                position: absolute;
                bottom: 120px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                max-height: 200px;
                overflow: hidden;
            }

            .buff-item {
                display: flex;
                align-items: center;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 6px 10px;
                max-width: 140px;
                animation: buffSlideIn 0.3s ease;
            }

            @keyframes buffSlideIn {
                from { transform: translateX(-100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }

            .buff-icon {
                font-size: 16px;
                margin-right: 8px;
            }

            .buff-info {
                flex: 1;
            }

            .buff-name {
                color: #fff;
                font-size: 10px;
                font-weight: 600;
                line-height: 1;
            }

            .buff-timer {
                color: #00ff88;
                font-size: 11px;
                font-family: 'Rajdhani', monospace;
                font-weight: 700;
            }

            .hud-cockpit {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid rgba(0, 255, 136, 0.5);
                border-radius: 20px;
                padding: 16px;
                backdrop-filter: blur(10px);
                display: grid;
                grid-template-columns: repeat(4, 50px) 1fr;
                grid-template-rows: auto auto;
                gap: 12px;
                align-items: center;
                min-width: 400px;
            }

            .weapon-slot {
                position: relative;
                width: 50px;
                height: 50px;
                background: radial-gradient(circle, rgba(0, 60, 30, 0.6), rgba(0, 20, 10, 0.8));
                border: 2px solid rgba(0, 255, 136, 0.3);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                cursor: pointer;
                pointer-events: auto;
            }

            .weapon-slot.active {
                border-color: #00ff88;
                box-shadow: 0 0 15px rgba(0, 255, 136, 0.6);
                transform: scale(1.1);
                background: radial-gradient(circle, rgba(0, 80, 40, 0.8), rgba(0, 40, 20, 0.9));
            }

            .weapon-slot.cooldown {
                opacity: 0.6;
                border-color: rgba(255, 0, 0, 0.5);
            }

            .weapon-icon {
                font-size: 20px;
                color: #00ff88;
                filter: drop-shadow(0 0 4px currentColor);
            }

            .weapon-key {
                position: absolute;
                top: -6px;
                right: -6px;
                background: rgba(0, 0, 0, 0.9);
                color: #fff;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 700;
                border: 1px solid rgba(255, 255, 255, 0.4);
            }

            .weapon-cooldown {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: transparent;
                transition: background 0.1s linear;
                pointer-events: none;
            }

            .cockpit-energy {
                grid-column: 5;
                grid-row: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                margin-left: 16px;
            }

            .energy-bar {
                width: 140px;
                height: 16px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(0, 212, 255, 0.4);
                border-radius: 8px;
                overflow: hidden;
                position: relative;
            }

            .energy-fill {
                height: 100%;
                background: linear-gradient(90deg, #00d4ff, #0ea5e9);
                transition: width 0.3s ease;
                border-radius: 8px;
                box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
            }

            .energy-text {
                color: #00d4ff;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Rajdhani', monospace;
            }

            .cockpit-health {
                grid-column: 1 / -1;
                grid-row: 2;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                margin-top: 8px;
            }

            .health-bar {
                width: 300px;
                height: 16px;
                background: rgba(0, 0, 0, 0.6);
                border: 1px solid rgba(0, 255, 136, 0.4);
                border-radius: 8px;
                overflow: hidden;
                position: relative;
            }

            .health-fill {
                height: 100%;
                background: linear-gradient(90deg, #00ff88, #00cc6a);
                transition: width 0.3s ease;
                border-radius: 8px;
                box-shadow: 0 0 8px rgba(0, 255, 136, 0.4);
            }

            .health-fill.warning {
                background: linear-gradient(90deg, #ffa726, #ff9800);
                box-shadow: 0 0 8px rgba(255, 167, 38, 0.4);
            }

            .health-fill.critical {
                background: linear-gradient(90deg, #ff1744, #d50000);
                box-shadow: 0 0 10px rgba(255, 23, 68, 0.6);
                animation: criticalPulse 0.8s ease-in-out infinite;
            }

            .shield-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, rgba(65, 105, 225, 0.8), rgba(30, 144, 255, 0.8));
                border-radius: 8px;
                opacity: 0;
                transition: opacity 0.3s ease;
                animation: shieldFlow 2s ease-in-out infinite;
            }

            .health-bar.shielded .shield-overlay {
                opacity: 1;
            }

            .health-text {
                color: #00ff88;
                font-size: 11px;
                font-weight: 700;
                font-family: 'Rajdhani', monospace;
            }

            .stat-item {
                text-align: center;
            }

            .stat-label {
                color: #888;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 2px;
            }

            .stat-value {
                color: #00ff88;
                font-size: 18px;
                font-weight: 700;
                font-family: 'Rajdhani', monospace;
            }

            @keyframes criticalPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }

            @keyframes shieldFlow {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }

                @media (max-width: 768px) {
                .hud-cockpit {
                    min-width: 300px;
                    padding: 12px;
                    gap: 8px;
                }
                
                .weapon-slot {
                    width: 40px;
                    height: 40px;
                }
                
                .weapon-icon {
                    font-size: 16px;
                }
                
                .energy-bar, .health-bar {
                    width: 100px;
                    height: 12px;
                }
                
                .energy-text, .health-text {
                    font-size: 9px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    hideOldUI() {
        // Hide existing UI elements
        const elementsToHide = [
            'healthBar', 'bulletCount', 'scorePanel', 
            'enhancedBuffs', 'comboDisplay', 'weaponHUD'
        ];
        
        elementsToHide.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });
    }

    startUpdateLoop() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.update();
        }, 100); // Update every 100ms
    }

    update() {
        if (!window.gameState) return;
        
        this.updateCombo();
        this.updateStats();
        this.updateProgress();
        this.updateVitals();
        this.updateWeapons();
        this.updateBuffs();
    }

    updateCombo() {
        const gameState = window.gameState;
        const hudCombo = document.getElementById('hudCombo');
        const comboText = document.getElementById('comboText');
        const comboTimerFill = document.getElementById('comboTimerFill');
        
        if (gameState.comboCount >= 2 && gameState.comboTimer > 0) {
            hudCombo.classList.add('active');
            comboText.textContent = `${gameState.comboCount}x COMBO`;
            const timerPercent = (gameState.comboTimer / 300) * 100;
            comboTimerFill.style.width = `${Math.max(0, timerPercent)}%`;
        } else {
            hudCombo.classList.remove('active');
        }
    }

    updateStats() {
        const gameState = window.gameState;
        
        // Update main points display
        document.getElementById('pointsValue').textContent = (gameState.score || 0).toLocaleString();
        
        // Update level and score in top right
        document.getElementById('statLevel').textContent = gameState.level || 1;
        document.getElementById('statScore').textContent = (gameState.score || 0).toLocaleString();
    }

    updateProgress() {
        // Progress bar removed - no longer needed
    }

    updateVitals() {
        const gameState = window.gameState;
        
        // Energy (Bullets)
        const energyPercent = ((gameState.bullets || 0) / (gameState.maxBullets || 100)) * 100;
        document.getElementById('energyFill').style.width = `${Math.max(0, Math.min(100, energyPercent))}%`;
        document.getElementById('energyText').textContent = `${gameState.bullets || 0}/${gameState.maxBullets || 100}`;
        
        // Health
        const healthPercent = ((gameState.currentHP || 100) / (gameState.maxHP || 100)) * 100;
        const healthFill = document.getElementById('healthFill');
        const healthBar = healthFill.parentElement;
        
        healthFill.style.width = `${Math.max(0, Math.min(100, healthPercent))}%`;
        document.getElementById('healthText').textContent = `${gameState.currentHP || 100}/${gameState.maxHP || 100}`;
        
        // Health state classes
        healthFill.className = 'health-fill';
        if (healthPercent <= 20) {
            healthFill.classList.add('critical');
        } else if (healthPercent <= 50) {
            healthFill.classList.add('warning');
        }
        
        // Shield state
        if (gameState.shieldCharges > 0) {
            healthBar.classList.add('shielded');
        } else {
            healthBar.classList.remove('shielded');
        }
    }

    updateWeapons() {
        const projectileSystem = window.projectileSystem;
        if (!projectileSystem) return;
        
        const weaponSlots = document.querySelectorAll('.weapon-slot');
        const weaponConfigs = window.PROJECTILE_CONFIGS || {};
        
        weaponSlots.forEach((slot, index) => {
            const isActive = index === (projectileSystem.currentTypeIndex || 0);
            
            slot.classList.toggle('active', isActive);
            
            // Update weapon costs if configs are available
            const weaponTypes = ['normal', 'laserBeam', 'energyShotgun', 'chainLightning'];
            const weaponType = weaponTypes[index];
            const config = weaponConfigs[weaponType];
            
            if (config) {
                const costElement = slot.querySelector('.weapon-cost');
                if (costElement) {
                    costElement.textContent = config.cost || 1;
                }
            }
            
            // Update cooldown visualization
            const cooldownElement = slot.querySelector('.weapon-cooldown');
            if (cooldownElement && projectileSystem) {
                const cooldownProperties = ['normalCooldown', 'laserCooldown', 'shotgunCooldown', 'lightningCooldown'];
                const cooldownProperty = cooldownProperties[index];
                const currentCooldown = projectileSystem[cooldownProperty] || 0;
                const maxCooldown = config?.cooldown || 60;
                
                if (currentCooldown > 0) {
                    slot.classList.add('cooldown');
                    const cooldownPercent = (currentCooldown / maxCooldown) * 360;
                    cooldownElement.style.background = `conic-gradient(from 0deg, transparent ${360 - cooldownPercent}deg, rgba(255, 0, 0, 0.6) ${360 - cooldownPercent}deg, transparent 360deg)`;
                } else {
                    slot.classList.remove('cooldown');
                    cooldownElement.style.background = 'transparent';
                }
            }
        });
    }

    updateBuffs() {
        const activeDropBuffs = window.activeDropBuffs;
        const hudBuffs = document.getElementById('hudBuffs');
        
        if (!activeDropBuffs || !hudBuffs) return;
        
        hudBuffs.innerHTML = '';
        
        Object.keys(activeDropBuffs).forEach(buffKey => {
            const remaining = activeDropBuffs[buffKey];
            if (remaining <= 0) return;
            
            const buffItem = document.createElement('div');
            buffItem.className = 'buff-item';
            
            const icon = this.getBuffIcon(buffKey);
            const name = this.getBuffName(buffKey);
            const timer = Math.ceil(remaining / 60);
            
            buffItem.innerHTML = `
                <div class="buff-icon">${icon}</div>
                <div class="buff-info">
                    <div class="buff-name">${name}</div>
                    <div class="buff-timer">${timer}s</div>
                </div>
            `;
            
            hudBuffs.appendChild(buffItem);
        });
    }

    getBuffIcon(buffKey) {
        const icons = {
            'speedBoost': '⚡',
            'jumpBoost': '🚀',
            'magnetMode': '🌟',
            'berserkerMode': '🔥',
            'ghostWalk': '👻',
            'timeSlow': '⏰',
            'scoreMultiplier': '💰',
            'healingBoost': '💚',
            'regeneration': '💖'
        };
        return icons[buffKey] || '⭐';
    }

    getBuffName(buffKey) {
        const names = {
            'speedBoost': 'SPEED',
            'jumpBoost': 'JUMP',
            'magnetMode': 'MAGNET',
            'berserkerMode': 'BERSERKER',
            'ghostWalk': 'GHOST',
            'timeSlow': 'SLOW',
            'scoreMultiplier': 'SCORE',
            'healingBoost': 'HEAL+',
            'regeneration': 'REGEN'
        };
        return names[buffKey] || buffKey.toUpperCase();
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        
        const styles = document.getElementById('modernHUDStyles');
        if (styles) {
            styles.remove();
        }
        
        this.initialized = false;
    }
}

// Global instance
export const modernHUD = new ModernHUD();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => modernHUD.init(), 1000);
    });
} else {
    setTimeout(() => modernHUD.init(), 1000);
}

// Make available globally
window.modernHUD = modernHUD;

console.log('🎮 Modern HUD Integration loaded');