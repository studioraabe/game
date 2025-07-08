// js/roguelike-stats.js - Stats System for Roguelike Progression

import { gameState } from './core/gameState.js';
import { updateUI } from './ui.js';
import { createScorePopup } from './entities.js';
import { player } from './core/player.js';
import { DUNGEON_THEME } from './core/constants.js';

// Initialize the player stats system
export const playerStats = {
    // Core stat bonuses (percentage based)
    damageBonus: 0,       // Percentage bonus to base damage
    attackSpeed: 0,       // Percentage increase to attack rate
    moveSpeed: 0,         // Percentage increase to movement speed
    projectileSpeed: 0,   // Percentage increase to bullet speed
    
    // Resource generation
    healthRegen: 0,       // HP regen per second
    bulletRegen: 0,       // Bullet regen per second
    lifeSteal: 0,         // Percentage of damage dealt returned as healing
    
    // Critical hit system
    critChance: 0,        // Percentage chance to land a critical hit
    critDamage: 1.5,      // Multiplier for critical hit damage (starts at 50% bonus)
    
    // Timers for resource regeneration
    healthRegenTimer: 0,
    bulletRegenTimer: 0,
    
    // Buff history for UI display
    selectedBuffs: []
};

// New buff definitions with stats effects
export const STAT_BUFFS = [
    // Original buffs - keeping only these two from DUNGEON_THEME
    { 
        id: 'undeadResilience', 
        title: '🧟 Undead Vigor', 
        desc: 'Gain extra life every 10 bullet hits (was 15)',
        effect: () => {
            gameState.activeBuffs.undeadResilience = 1;
            playerStats.selectedBuffs.push('undeadResilience');
        }
    },
    { 
        id: 'shadowLeap', 
        title: '🌙 Shadow Leap', 
        desc: 'Unlock double jump with ethereal shadow form',
        effect: () => {
            gameState.activeBuffs.shadowLeap = 1;
            playerStats.selectedBuffs.push('shadowLeap');
        }
    },
    
    // New stat-based buffs - include all 6 required ones
    {
        id: 'vampiricStrikes',
        title: '🩸 Vampiric Strikes',
        desc: 'Gain 2% life steal, healing on enemy kills',
        effect: () => {
            playerStats.lifeSteal += 2;
            playerStats.selectedBuffs.push('vampiricStrikes');
        }
    },
    {
        id: 'bulletStorm',
        title: '🔥 Bullet Storm',
        desc: 'Regenerate 1 bullet every 2 seconds',
        effect: () => {
            playerStats.bulletRegen += 0.5; // 0.5 per second = 1 per 2 seconds
            playerStats.selectedBuffs.push('bulletStorm');
        }
    },
    {
        id: 'berserkerRage',
        title: '💢 Berserker Rage',
        desc: 'Gain +25% damage and +15% attack speed',
        effect: () => {
            playerStats.damageBonus += 25;
            playerStats.attackSpeed += 15;
            playerStats.selectedBuffs.push('berserkerRage');
        }
    },
    {
        id: 'survivalInstinct',
        title: '💚 Survival Instinct',
        desc: 'Regenerate 1 HP every 3 seconds',
        effect: () => {
            playerStats.healthRegen += 0.33; // 0.33 per second = 1 per 3 seconds
            playerStats.selectedBuffs.push('survivalInstinct');
        }
    },
    {
        id: 'criticalFocus',
        title: '🎯 Critical Focus',
        desc: '20% chance for critical hits (2x damage)',
        effect: () => {
            playerStats.critChance += 20;
            playerStats.critDamage += 0.5; // +50% crit damage
            playerStats.selectedBuffs.push('criticalFocus');
        }
    },
    {
        id: 'swiftDeath',
        title: '⚡ Swift Death',
        desc: '+20% movement and projectile speed',
        effect: () => {
            playerStats.moveSpeed += 20;
            playerStats.projectileSpeed += 20;
            playerStats.selectedBuffs.push('swiftDeath');
        }
    }
];

// Update available buffs in gameState for selection screen
export function initializeStatBuffs() {
    // Start with all 6 new stat buffs + the 2 original buffs we kept
    // This ensures all 6 new stat buffs are always in the selection
    const startingBuffs = [...STAT_BUFFS];
    
    // Replace the default buffs with our expanded set
    gameState.availableBuffs = startingBuffs;
    
    console.log('🎮 Roguelike Stats System Initialized');
    console.log(`📊 Available Buffs: ${startingBuffs.length}`);
}

// Apply a buff by ID
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
    // Get buffs that haven't been selected yet
    const remainingBuffs = STAT_BUFFS.filter(buff => 
        !playerStats.selectedBuffs.includes(buff.id) && 
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
    // Get most recently selected buffs to offer upgrades
    const recentBuffIds = playerStats.selectedBuffs.slice(-3);
    
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
    if (!gameState.gameRunning) return;
    
    // Health regeneration
    if (playerStats.healthRegen > 0) {
        playerStats.healthRegenTimer += gameState.deltaTime;
        const regenInterval = 60; // 1 second at 60 FPS
        
        if (playerStats.healthRegenTimer >= regenInterval) {
            playerStats.healthRegenTimer -= regenInterval;
            
            // Calculate healing amount
            const healAmount = Math.max(1, Math.floor(playerStats.healthRegen));
            
            // Apply healing if not at max health
            if (gameState.currentHP < gameState.maxHP) {
                const oldHP = gameState.currentHP;
                gameState.currentHP = Math.min(gameState.maxHP, gameState.currentHP + healAmount);
                
                // Show healing popup if health actually increased
                if (gameState.currentHP > oldHP) {
                    createScorePopup(
                        player.x + player.width/2, 
                        player.y - 30, 
                        `+${gameState.currentHP - oldHP} HP`
                    );
                }
            }
        }
    }
    
    // Bullet regeneration
    if (playerStats.bulletRegen > 0) {
        playerStats.bulletRegenTimer += gameState.deltaTime;
        const regenInterval = 60; // 1 second at 60 FPS
        
        if (playerStats.bulletRegenTimer >= regenInterval) {
            playerStats.bulletRegenTimer -= regenInterval;
            
            // Calculate bullet regen amount
            const bulletAmount = Math.max(1, Math.floor(playerStats.bulletRegen));
            
            // Add bullets
            gameState.bullets += bulletAmount;
            
            // Show bullet regen popup every 5 bullets
            if (Math.random() < 0.2) {
                createScorePopup(
                    player.x + player.width/2, 
                    player.y - 30, 
                    `+${bulletAmount} Bolt`
                );
            }
        }
    }
}

// Apply lifesteal when an enemy is killed
export function applyLifesteal(damage) {
    if (playerStats.lifeSteal <= 0) return 0;
    
    // Calculate healing from lifesteal
    const healAmount = Math.max(1, Math.floor(damage * (playerStats.lifeSteal / 100)));
    
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
    // Apply damage bonus
    let damage = baseDamage * (1 + playerStats.damageBonus / 100);
    
    // Roll for critical hit
    const isCritical = Math.random() * 100 < playerStats.critChance;
    
    if (isCritical) {
        damage *= playerStats.critDamage;
        console.log(`🎯 Critical hit! Damage: ${Math.floor(damage)}`);
    }
    
    return {
        damage: Math.floor(damage),
        isCritical
    };
}

// Initialize the system
export function initRoguelikeSystem() {
    // Reset player stats to defaults
    Object.assign(playerStats, {
        damageBonus: 0,
        attackSpeed: 0,
        moveSpeed: 0,
        projectileSpeed: 0,
        healthRegen: 0,
        bulletRegen: 0,
        lifeSteal: 0,
        critChance: 0,
        critDamage: 1.5,
        healthRegenTimer: 0,
        bulletRegenTimer: 0,
        selectedBuffs: []
    });
    
    // Initialize available buffs
    initializeStatBuffs();
    
    console.log('🎮 Roguelike Stats System Ready');
}

// Expose to global for debugging and UI access
window.playerStats = playerStats;
window.initRoguelikeSystem = initRoguelikeSystem;
window.applyBuff = applyBuff;
window.STAT_BUFFS = STAT_BUFFS;

// Replace the original chooseBuff function
window.originalChooseBuff = window.chooseBuff;
window.chooseBuff = chooseBuff;