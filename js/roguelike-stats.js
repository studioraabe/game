// js/roguelike-stats.js - Stats System for Roguelike Progression

import { updateUI } from './ui.js';
import { createScorePopup } from './entities.js';
import { player } from './core/player.js';
import { DUNGEON_THEME, GAME_CONSTANTS } from './core/constants.js'; // ← ADD GAME_CONSTANTS here
import { PROJECTILE_BUFFS } from './projectile-buff-integration.js';


// Initialize the player stats system
export let playerStats = null;


const ENHANCED_BUFF_EFFECTS = {
    'survivalInstinct': () => {
        const gameState = window.gameState;
        if (gameState && gameState.playerStats) {
            // Add 0.333 to baseline 0.5 = 0.833 HP/sec total
            gameState.playerStats.healthRegen += 0.333;
            gameState.playerStats.selectedBuffs.push('survivalInstinct');
            
            console.log(`✅ Survival Instinct applied! Health regen: ${gameState.playerStats.healthRegen.toFixed(3)}/sec`);
            
            // Force UI update
            if (window.updateRegenIndicators) {
                window.updateRegenIndicators();
            }
        }
    },
    
    'bulletStorm': () => {
        const gameState = window.gameState;
        if (gameState && gameState.playerStats) {
            // Add 0.5 to baseline 0.5 = 1.0 bullets/sec total (doubles the rate)
            gameState.playerStats.bulletRegen += 0.5;
            gameState.playerStats.selectedBuffs.push('bulletStorm');
            
            console.log(`✅ Bullet Storm applied! Bullet regen: ${gameState.playerStats.bulletRegen.toFixed(3)}/sec`);
            
            // Force UI update
            if (window.updateRegenIndicators) {
                window.updateRegenIndicators();
            }
        }
    }
};




export const STAT_BUFFS = [
    // Original buffs from DUNGEON_THEME
    { 
        id: 'undeadResilience', 
        title: '🧟 Undead Vigor', 
        desc: 'Gain extra life every 10 bullet hits (was 15)',
        effect: () => {
            const gameState = window.gameState;
            if (gameState) {
                gameState.activeBuffs.undeadResilience = 1;
                if (gameState.playerStats) {
                    gameState.playerStats.selectedBuffs.push('undeadResilience');
                }
            }
        }
    },
    { 
        id: 'shadowLeap', 
        title: '🌙 Shadow Leap', 
        desc: 'Unlock double jump with ethereal shadow form',
        effect: () => {
            const gameState = window.gameState;
            if (gameState) {
                gameState.activeBuffs.shadowLeap = 1;
                if (gameState.playerStats) {
                    gameState.playerStats.selectedBuffs.push('shadowLeap');
                }
            }
        }
    },
    
    // FIXED: Enhanced regeneration buffs
    {
        id: 'survivalInstinct',
        title: '💚 Survival Instinct',
        desc: 'Regenerate 1 HP every 3 seconds (+66% health regen)',
        effect: ENHANCED_BUFF_EFFECTS.survivalInstinct
    },
    {
        id: 'bulletStorm',
        title: '🔥 Bullet Storm',
        desc: 'Regenerate 1 bullet every 2 seconds (doubles bullet regen)',
        effect: ENHANCED_BUFF_EFFECTS.bulletStorm
    },
    
    // Other stat-based buffs
    {
        id: 'vampiricStrikes',
        title: '🩸 Vampiric Strikes',
        desc: 'Gain 2% life steal, healing on enemy kills',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.lifeSteal += 2;
                gameState.playerStats.selectedBuffs.push('vampiricStrikes');
                console.log(`✅ Vampiric Strikes applied! Life steal: ${gameState.playerStats.lifeSteal}%`);
            }
        }
    },
    {
        id: 'berserkerRage',
        title: '💢 Berserker Rage',
        desc: 'Gain +25% damage and +15% attack speed',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.damageBonus += 25;
                gameState.playerStats.attackSpeed += 15;
                gameState.playerStats.selectedBuffs.push('berserkerRage');
                console.log(`✅ Berserker Rage applied! Damage: +${gameState.playerStats.damageBonus}%, Attack Speed: +${gameState.playerStats.attackSpeed}%`);
            }
        }
    },
    {
        id: 'criticalFocus',
        title: '🎯 Critical Focus',
        desc: '20% chance for critical hits (2x damage)',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.critChance += 20;
                gameState.playerStats.critDamage = 2.0;
                gameState.playerStats.selectedBuffs.push('criticalFocus');
                console.log(`✅ Critical Focus applied! Crit chance: ${gameState.playerStats.critChance}%`);
            }
        }
    },
    {
        id: 'swiftDeath',
        title: '⚡ Swift Death',
        desc: '+20% movement and projectile speed',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.moveSpeed += 20;
                gameState.playerStats.projectileSpeed += 20;
                gameState.playerStats.selectedBuffs.push('swiftDeath');
                console.log(`✅ Swift Death applied! Move speed: +${gameState.playerStats.moveSpeed}%, Projectile speed: +${gameState.playerStats.projectileSpeed}%`);
            }
        }
    },
    
    // PROJECTILE BUFFS - (keep existing projectile buffs as they are)
    {
        id: 'laserMastery',
        title: '🔵 Laser Mastery',
        desc: 'Unlock Laser Beam projectiles - instant piercing damage',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('laserMastery');
                if (window.unlockProjectileType) {
                    window.unlockProjectileType('laserBeam');
                }
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
                if (window.unlockProjectileType) {
                    window.unlockProjectileType('energyShotgun');
                }
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
                if (window.unlockProjectileType) {
                    window.unlockProjectileType('chainLightning');
                }
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
                if (window.unlockProjectileType) {
                    window.unlockProjectileType('seekingBolt');
                }
            }
        }
    },
    {
        id: 'weaponMaster',
        title: '🗡️ Weapon Master',
        desc: 'Unlock weapon cycling - switch between projectile types',
        effect: () => {
            const gameState = window.gameState;
            if (gameState && gameState.playerStats) {
                gameState.playerStats.selectedBuffs.push('weaponMaster');
                
                // Enable weapon cycling
                if (window.projectileSystem) {
                    window.projectileSystem.weaponCyclingEnabled = true;
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
            }
        }
    }
];

// Update available buffs in gameState for selection screen
export function initializeStatBuffs() {
    const gameState = window.gameState;
    if (!gameState) return;
    
    // Start with all 6 new stat buffs + the 2 original buffs we kept
    // This ensures all 6 new stat buffs are always in the selection
    const startingBuffs = [...STAT_BUFFS];
    
    // Replace the default buffs with our expanded set
    gameState.availableBuffs = startingBuffs;
    
    console.log('🎮 Roguelike Stats System Initialized');
    console.log(`📊 Available Buffs: ${startingBuffs.length}`);
}

export function applyBuff(buffId) {
    const buff = STAT_BUFFS.find(b => b.id === buffId);
    if (!buff) {
        console.warn(`Buff not found: ${buffId}`);
        return false;
    }
    
    // Apply the buff effect
    buff.effect();
    
    // Create a popup to indicate buff applied
    createScorePopup(
        player.x + player.width/2, 
        player.y - 30, 
        `${buff.title}`
    );
    
    console.log(`🎮 Applied buff: ${buff.id}`);
    updateUI();
    
    return true;
}

// Enhanced chooseBuff function to replace the one in ui.js
export function chooseBuff(buffId) {
    const gameState = window.gameState;
    if (!gameState) return;
    
    // Apply the buff
    applyBuff(buffId);
    
    // Remove the selected buff from available buffs
    gameState.availableBuffs = gameState.availableBuffs.filter(buff => buff.id !== buffId);
    
    // Add more buffs to selection if running low
    if (gameState.availableBuffs.length < 2) {
        replenishBuffSelection();
    }
    
    // Standard level up procedure
    gameState.level++;
    gameState.levelProgress = 1;
    window.bulletBoxesFound = 0;
    gameState.damageThisLevel = 0;
    gameState.gameSpeed += 0.6;
    gameState.bullets += 12;
    
    gameState.postBuffInvulnerability = 120;
    
    // Hide all screens and resume with countdown
    window.hideAllScreens();
    window.showUniversalCountdown('resume', () => {
        gameState.currentState = window.GameState.PLAYING;
        gameState.gameRunning = true;
        window.updateUI();
    });
}

// Add new buffs to selection when needed
function replenishBuffSelection() {
    const gameState = window.gameState;
    if (!gameState || !gameState.playerStats) return;
    
    // Get buffs that haven't been selected yet
    const remainingBuffs = STAT_BUFFS.filter(buff => 
        !gameState.playerStats.selectedBuffs.includes(buff.id) && 
        !gameState.availableBuffs.some(b => b.id === buff.id)
    );
    
    // If we have remaining buffs, add some to the available selection
    if (remainingBuffs.length > 0) {
        // Add up to 3 new buffs
        const newBuffs = remainingBuffs.slice(0, 3);
        gameState.availableBuffs = [...gameState.availableBuffs, ...newBuffs];
        console.log(`🎮 Added ${newBuffs.length} new buffs to selection`);
    } else {
        // If all unique buffs are taken, offer upgraded versions of existing buffs
        const upgradeBuffs = createUpgradedBuffs();
        gameState.availableBuffs = [...gameState.availableBuffs, ...upgradeBuffs];
        console.log(`🎮 Added ${upgradeBuffs.length} upgraded buffs to selection`);
    }
}

// Create upgraded versions of existing buffs
function createUpgradedBuffs() {
    const gameState = window.gameState;
    if (!gameState || !gameState.playerStats) return [];
    
    // Get most recently selected buffs to offer upgrades
    const recentBuffIds = gameState.playerStats.selectedBuffs.slice(-3);
    
    return recentBuffIds.map(id => {
        const originalBuff = STAT_BUFFS.find(b => b.id === id);
        if (!originalBuff) return null;
        
        // Create upgraded version
        const upgradedBuff = {
            id: `${id}_upgraded`,
            title: `${originalBuff.title} II`,
            desc: `Upgraded: ${originalBuff.desc}`,
            effect: originalBuff.effect // Same effect, stacking the bonus
        };
        
        return upgradedBuff;
    }).filter(buff => buff !== null);
}

// Update stats per frame - handle regeneration and timers
export function updatePlayerStats() {
    // Stats are now handled directly in gameState update function
}

// Apply lifesteal when an enemy is killed
export function applyLifesteal(damage) {
    const gameState = window.gameState;
    if (!gameState || !gameState.playerStats || gameState.playerStats.lifeSteal <= 0) return 0;
    
    // Calculate healing from lifesteal
    const healAmount = Math.max(1, Math.floor(damage * (gameState.playerStats.lifeSteal / 100)));
    
    // Apply healing if not at max health
    if (gameState.currentHP < gameState.maxHP) {
        const oldHP = gameState.currentHP;
        gameState.currentHP = Math.min(gameState.maxHP, gameState.currentHP + healAmount);
        
        // Return the amount healed
        return gameState.currentHP - oldHP;
    }
    
    return 0;
}

// Calculate damage with critical hit chance
export function calculateDamage(baseDamage) {
    const gameState = window.gameState;
    if (!gameState || !gameState.playerStats) {
        return {
            damage: Math.floor(baseDamage),
            isCritical: false
        };
    }
    
    // Apply damage bonus from gameState
    let damage = baseDamage * (1 + (gameState.playerStats.damageBonus || 0) / 100);
    
    // Roll for critical hit
    const isCritical = Math.random() * 100 < (gameState.playerStats.critChance || 0);
    
    if (isCritical) {
        damage *= gameState.playerStats.critDamage || 1.5;
        console.log(`🎯 Critical hit! Damage: ${Math.floor(damage)}`);
    }
    
    return {
        damage: Math.floor(damage),
        isCritical
    };
}


// Initialize the system
export function initRoguelikeSystem() {
    const gameState = window.gameState;
    if (!gameState) {
        console.error('❌ gameState not available for roguelike system initialization');
        return;
    }
    
    // Initialize stats in gameState if not already present
  if (!gameState.playerStats) {
        gameState.playerStats = {
            damageBonus: 0,
            attackSpeed: 0,
            moveSpeed: 0,
            projectileSpeed: 0,
            healthRegen: GAME_CONSTANTS.PLAYER_BASE_HEALTH_REGEN,  // 0.5 HP/sec baseline
            bulletRegen: GAME_CONSTANTS.PLAYER_BASE_BULLET_REGEN,  // 0.5 bullets/sec baseline
            lifeSteal: 0,
            critChance: 0,
            critDamage: 1.5,
            selectedBuffs: []
        };
    } else {
        // Reset existing stats but KEEP baseline regeneration
        Object.assign(gameState.playerStats, {
            damageBonus: 0,
            attackSpeed: 0,
            moveSpeed: 0,
            projectileSpeed: 0,
            healthRegen: GAME_CONSTANTS.PLAYER_BASE_HEALTH_REGEN,  // Reset to baseline, not 0
            bulletRegen: GAME_CONSTANTS.PLAYER_BASE_BULLET_REGEN,  // Reset to baseline, not 0
            lifeSteal: 0,
            critChance: 0,
            critDamage: 1.5,
            selectedBuffs: []
        });
    }
    
    
    // Set the playerStats reference to point to gameState.playerStats
    playerStats = gameState.playerStats;
    
    // Initialize available buffs
    initializeStatBuffs();
    
    console.log('🎮 Roguelike Stats System Ready');
}

export { replenishBuffSelection };

// Expose to global for debugging and UI access
window.playerStats = null; // Will be set to gameState.playerStats during init
window.initRoguelikeSystem = initRoguelikeSystem;
window.applyBuff = applyBuff;
window.STAT_BUFFS = STAT_BUFFS;

// Replace the original chooseBuff function
window.originalChooseBuff = window.chooseBuff;
window.chooseBuff = chooseBuff;