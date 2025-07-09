// js/projectile-buff-integration.js - Buff System Integration for Projectiles

import { 
    ProjectileType, 
    unlockProjectileType, 
    equipProjectileType,
    getCurrentProjectileType,
    cycleProjectileType
} from './enhanced-projectile-system.js';

// ========================================
// PROJECTILE-RELATED BUFFS
// ========================================

export const PROJECTILE_BUFFS = [
    {
        id: 'laserMastery',
        title: '🔵 Laser Mastery',
        desc: 'Unlock Laser Beam projectiles - instant piercing damage',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('laserMastery');
                unlockProjectileType(ProjectileType.LASER_BEAM);
            }
        }
    },
    {
        id: 'shotgunBlast',
        title: '💥 Shotgun Blast',
        desc: 'Unlock Energy Shotgun - spread attack with 5 pellets',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('shotgunBlast');
                unlockProjectileType(ProjectileType.ENERGY_SHOTGUN);
            }
        }
    },
    {
        id: 'chainLightning',
        title: '⚡ Chain Lightning',
        desc: 'Unlock Chain Lightning - jumps between 3 enemies',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('chainLightning');
                unlockProjectileType(ProjectileType.CHAIN_LIGHTNING);
            }
        }
    },
    {
        id: 'seekingBolt',
        title: '🎯 Seeking Bolt',
        desc: 'Unlock Seeking Bolt - homes in on nearest enemy',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('seekingBolt');
                unlockProjectileType(ProjectileType.SEEKING_BOLT);
            }
        }
    },
    {
        id: 'energyEfficiency',
        title: '⚡ Energy Efficiency',
        desc: 'All projectiles cost 1 less bullet (minimum 1)',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('energyEfficiency');
                
                // Reduce all projectile costs by 1 (minimum 1)
                if (window.PROJECTILE_CONFIGS) {
                    Object.keys(window.PROJECTILE_CONFIGS).forEach(type => {
                        window.PROJECTILE_CONFIGS[type].cost = Math.max(1, 
                            window.PROJECTILE_CONFIGS[type].cost - 1
                        );
                    });
                }
            }
        }
    },
    {
        id: 'rapidFire',
        title: '🔥 Rapid Fire',
        desc: '+50% attack speed and reduced projectile cooldowns',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.attackSpeed += 50;
                gameState.playerStats.selectedBuffs.push('rapidFire');
                
                // Reduce all projectile cooldowns by 30%
                if (window.PROJECTILE_CONFIGS) {
                    Object.keys(window.PROJECTILE_CONFIGS).forEach(type => {
                        window.PROJECTILE_CONFIGS[type].cooldown = Math.floor(
                            window.PROJECTILE_CONFIGS[type].cooldown * 0.7
                        );
                    });
                }
            }
        }
    }
];

// ========================================
// ENHANCED BUFF SYSTEM WITH PROJECTILES
// ========================================

export function createEnhancedBuffSystem() {
	
	
	if (!window.gameState) {
        console.warn('⚠️ Game state not ready, deferring buff system creation');
        setTimeout(createEnhancedBuffSystem, 100);
        return;
    }
    
	
    // Import existing stat buffs
    const existingBuffs = window.STAT_BUFFS || [];
    
    // Combine existing buffs with projectile buffs
    const allBuffs = [...existingBuffs, ...PROJECTILE_BUFFS];
    
    // Replace the global STAT_BUFFS with enhanced version
    window.STAT_BUFFS = allBuffs;
    
    // Update available buffs in game state
    const gameState = window.gameState;
    if (gameState) {
        gameState.availableBuffs = [...allBuffs];
    }
    
    console.log(`🚀 Enhanced buff system loaded with ${allBuffs.length} total buffs`);
    console.log(`📊 Projectile buffs: ${PROJECTILE_BUFFS.length}`);
    console.log(`📊 Existing buffs: ${existingBuffs.length}`);
    
    return allBuffs;
}

// ========================================
// PROJECTILE UI INTEGRATION
// ========================================

export function createProjectileUI() {
    // Create projectile display in UI
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    // Check if UI already exists
    if (document.getElementById('projectileUI')) return;
    
    const projectileUI = document.createElement('div');
    projectileUI.id = 'projectileUI';
    projectileUI.style.cssText = `
        position: absolute;
        top: 60px;
        right: -240px;
        background: rgba(0, 0, 0, 0.7);
        border: 2px solid #00ff88;
        border-radius: 8px;
        padding: 10px;
        color: #ffffff;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        z-index: 10;
        min-width: 200px;
    `;
    
    gameContainer.appendChild(projectileUI);
    
    // Update UI every frame
    if (!window.projectileUIUpdateInterval) {
        window.projectileUIUpdateInterval = setInterval(updateProjectileUI, 100);
    }
}

function updateProjectileUI() {
    const projectileUI = document.getElementById('projectileUI');
    if (!projectileUI || !window.projectileSystem) return;
    
    const currentType = window.getCurrentProjectileType();
    const config = window.PROJECTILE_CONFIGS[currentType];
    const system = window.projectileSystem;
    
    if (!config) return;
    
    // Get current cooldown
    const cooldownProperty = `${currentType}Cooldown`;
    const currentCooldown = system[cooldownProperty] || 0;
    const cooldownPercent = Math.max(0, (currentCooldown / config.cooldown) * 100);
    
    projectileUI.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px; color: #00ff88;">
            🎯 WEAPON SYSTEM
        </div>
        
        <div style="margin-bottom: 6px;">
            <div style="font-weight: bold; color: #ffffff;">
                ${config.name}
            </div>
            <div style="font-size: 12px; color: #cccccc;">
                ${config.desc}
            </div>
        </div>
        
        <div style="margin-bottom: 4px;">
            <span style="color: #ff6b6b;">Cost:</span> 
            <span>${config.cost} ⚡</span>
        </div>
        
        <div style="margin-bottom: 8px;">
            <span style="color: #4ecdc4;">Damage:</span> 
            <span>${Math.round(config.damage * 100)}%</span>
        </div>
        
        ${currentCooldown > 0 ? `
            <div style="margin-bottom: 4px;">
                <div style="font-size: 12px; color: #ff6b6b;">
                    Cooldown: ${Math.ceil(currentCooldown / 60)}s
                </div>
                <div style="background: #333; height: 4px; border-radius: 2px; overflow: hidden;">
                    <div style="background: #ff6b6b; height: 100%; width: ${cooldownPercent}%; transition: width 0.1s;"></div>
                </div>
            </div>
        ` : ''}
        
        <div style="margin-top: 8px; font-size: 12px; color: #888;">
            ${system.equippedTypes.length > 1 ? 'Q/E: Cycle Weapons' : 'Unlock more weapons!'}
        </div>
        
        <div style="margin-top: 4px;">
            <div style="font-size: 12px; color: #00ff88;">
                Equipped: ${system.equippedTypes.length}/3
            </div>
            <div style="display: flex; gap: 4px; margin-top: 2px;">
                ${system.equippedTypes.map((type, index) => {
                    const typeConfig = window.PROJECTILE_CONFIGS[type];
                    const isActive = index === system.currentTypeIndex;
                    const icon = typeConfig.name.split(' ')[0];
                    
                    return `
                        <span style="
                            padding: 2px 4px;
                            background: ${isActive ? '#00ff88' : '#333'};
                            color: ${isActive ? '#000' : '#fff'};
                            border-radius: 3px;
                            font-size: 10px;
                        ">
                            ${icon}
                        </span>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

















function createCooldownDisplay() {
    // Check if cooldown display already exists
    if (document.getElementById('projectileCooldownDisplay')) return;
    
    const gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) return;
    
    const cooldownDisplay = document.createElement('div');
    cooldownDisplay.id = 'projectileCooldownDisplay';
    cooldownDisplay.style.cssText = `
        position: absolute;
        top: 60px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 15;
        pointer-events: none;
    `;
    
    gameContainer.appendChild(cooldownDisplay);
    
    // Add CSS for circular progress
    if (!document.getElementById('cooldownDisplayStyles')) {
        const style = document.createElement('style');
        style.id = 'cooldownDisplayStyles';
        style.textContent = `
            .weapon-cooldown-item {
                position: relative;
                width: 50px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 0, 0, 0.8);
                border-radius: 50%;
                border: 2px solid #333;
                transition: all 0.2s ease;
            }
            
            .weapon-cooldown-item.active {
                border-color: #00ff88;
                box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
                transform: scale(1.1);
            }
            
            .weapon-cooldown-item.on-cooldown {
                border-color: #ff6b6b;
            }
            
            .weapon-icon {
                font-size: 20px;
                z-index: 2;
                filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
            }
            
            .cooldown-progress {
                position: absolute;
                top: -2px;
                left: -2px;
                width: 54px;
                height: 54px;
                border-radius: 50%;
                background: conic-gradient(
                    from 0deg,
                    #ff6b6b 0deg,
                    #ff6b6b var(--progress),
                    transparent var(--progress),
                    transparent 360deg
                );
                z-index: 1;
            }
            
            .weapon-name {
                position: absolute;
                bottom: -18px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                font-family: 'Rajdhani', sans-serif;
                font-weight: bold;
                color: #ccc;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
                white-space: nowrap;
            }
            
            .weapon-cooldown-item.active .weapon-name {
                color: #00ff88;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Start update loop
    if (!window.cooldownDisplayInterval) {
        window.cooldownDisplayInterval = setInterval(updateCooldownDisplay, 50); // More frequent updates for smooth animation
    }
}

function updateCooldownDisplay() {
    const display = document.getElementById('projectileCooldownDisplay');
    if (!display || !window.projectileSystem) return;
    
    const currentType = window.getCurrentProjectileType();
    const equippedTypes = window.projectileSystem.equippedTypes || ['normal'];
    
    // Get weapon configs and icons
    const weaponInfo = {
        'normal': { icon: '⚡', name: 'Bolt', cooldownKey: 'normalCooldown' },
        'laserBeam': { icon: '🔵', name: 'Laser', cooldownKey: 'laserCooldown' },
        'energyShotgun': { icon: '💥', name: 'Shotgun', cooldownKey: 'shotgunCooldown' },
        'chainLightning': { icon: '⚡', name: 'Chain', cooldownKey: 'lightningCooldown' },
        'seekingBolt': { icon: '🎯', name: 'Seeking', cooldownKey: 'seekingCooldown' }
    };
    
    let html = '';
    
    // Only show equipped weapons
    equippedTypes.forEach((weaponType, index) => {
        const info = weaponInfo[weaponType];
        if (!info) return;
        
        const config = window.PROJECTILE_CONFIGS[weaponType];
        if (!config) return;
        
        const cooldownValue = window.projectileSystem[info.cooldownKey] || 0;
        const maxCooldown = config.cooldown || 1;
        const isActive = currentType === weaponType;
        const isOnCooldown = cooldownValue > 0;
        
        // Calculate progress percentage (0-100)
        const progressPercent = isOnCooldown ? (cooldownValue / maxCooldown) * 100 : 0;
        const progressDegrees = (progressPercent / 100) * 360;
        
        const timeLeft = Math.ceil(cooldownValue / 60);
        
        html += `
            <div class="weapon-cooldown-item ${isActive ? 'active' : ''} ${isOnCooldown ? 'on-cooldown' : ''}"
                 style="margin-bottom: ${index < equippedTypes.length - 1 ? '4px' : '0'};">
                ${isOnCooldown ? `
                    <div class="cooldown-progress" style="--progress: ${progressDegrees}deg;"></div>
                ` : ''}
                <div class="weapon-icon">${info.icon}</div>
                <div class="weapon-name">${info.name}</div>
            </div>
        `;
    });
    
    display.innerHTML = html;
}

// Clean up old display and create new one
function reinitializeCooldownDisplay() {
    const existing = document.getElementById('projectileCooldownDisplay');
    if (existing) {
        existing.remove();
    }
    
    if (window.cooldownDisplayInterval) {
        clearInterval(window.cooldownDisplayInterval);
        window.cooldownDisplayInterval = null;
    }
    
    createCooldownDisplay();
}

// Initialize the cooldown display
function initializeCooldownDisplay() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createCooldownDisplay);
    } else {
        setTimeout(createCooldownDisplay, 1000); // Delay to ensure projectile system is loaded
    }
}

// Auto-initialize
initializeCooldownDisplay();

// Make functions available globally
window.createCooldownDisplay = createCooldownDisplay;
window.updateCooldownDisplay = updateCooldownDisplay;
window.reinitializeCooldownDisplay = reinitializeCooldownDisplay;

// Debug commands
window.clearLaserBeams = function() {
    if (window.projectileSystem) {
        const count = window.projectileSystem.laserBeams.length;
        window.projectileSystem.laserBeams.length = 0;
        console.log(`Cleared ${count} laser beams`);
    }
};

window.debugLaserBeams = function() {
    if (window.projectileSystem) {
        console.log('Laser Beams:', window.projectileSystem.laserBeams);
        console.log('Laser Cooldown:', window.projectileSystem.laserCooldown);
    }
};

window.debugWeapons = function() {
    if (window.projectileSystem) {
        console.log('Equipped Types:', window.projectileSystem.equippedTypes);
        console.log('Current Type:', window.getCurrentProjectileType());
        console.log('Cooldowns:', {
            normal: window.projectileSystem.normalCooldown,
            laser: window.projectileSystem.laserCooldown,
            shotgun: window.projectileSystem.shotgunCooldown,
            lightning: window.projectileSystem.lightningCooldown,
            seeking: window.projectileSystem.seekingCooldown
        });
    }
};













// ========================================
// INTEGRATION HOOKS
// ========================================

export function integrateProjectileSystem() {
    // Replace the original shoot function with enhanced version
    const originalShoot = window.shoot;
    window.shoot = function(gameStateParam) {
        if (window.enhancedShoot) {
            return window.enhancedShoot(gameStateParam);
        } else {
            return originalShoot(gameStateParam);
        }
    };
    
    // Hook into the update loop
    const originalUpdate = window.update;
    window.update = function() {
        if (originalUpdate) originalUpdate();
        
        if (window.updateEnhancedProjectiles) {
            window.updateEnhancedProjectiles(window.gameState);
        }
    };
    
    // Hook into the render loop - FIXED
    const originalRender = window.render;
    window.render = function(ctx) {
        if (originalRender) originalRender(ctx);
        
        // Only call renderEnhancedProjectiles if we have a valid context
        if (ctx && window.renderEnhancedProjectiles) {
            window.renderEnhancedProjectiles(ctx);
        }
    };
    
    // Create enhanced buff system
    createEnhancedBuffSystem();
    
    // Create projectile UI
    createProjectileUI();
    
    console.log('🚀 Projectile system fully integrated!');
}


// ========================================
// AUTO-INITIALIZE
// ========================================

// Auto-initialize when the game is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(integrateProjectileSystem, 1000);
    });
} else {
    setTimeout(integrateProjectileSystem, 1000);
}

// Make functions available globally
window.createEnhancedBuffSystem = createEnhancedBuffSystem;
window.createProjectileUI = createProjectileUI;
window.integrateProjectileSystem = integrateProjectileSystem;
window.PROJECTILE_BUFFS = PROJECTILE_BUFFS;

export default {
    PROJECTILE_BUFFS,
    createEnhancedBuffSystem,
    createProjectileUI,
    integrateProjectileSystem
};