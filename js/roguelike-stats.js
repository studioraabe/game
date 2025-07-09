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
    // Original buffs from DUNGEON_THEME
    { 
        id: 'undeadResilience', 
        title: '🧟 Undead Vigor', 
        desc: 'Gain extra life every 10 bullet hits (was 15)',
        effect: () => {
            gameState.activeBuffs.undeadResilience = 1;
            gameState.playerStats.selectedBuffs.push('undeadResilience');
        }
    },
    { 
        id: 'shadowLeap', 
        title: '🌙 Shadow Leap', 
        desc: 'Unlock double jump with ethereal shadow form',
        effect: () => {
            gameState.activeBuffs.shadowLeap = 1;
            gameState.playerStats.selectedBuffs.push('shadowLeap');
        }
    },
    
    // New stat-based buffs
    {
        id: 'vampiricStrikes',
        title: '🩸 Vampiric Strikes',
        desc: 'Gain 2% life steal, healing on enemy kills',
        effect: () => {
            gameState.playerStats.lifeSteal += 2;
            gameState.playerStats.selectedBuffs.push('vampiricStrikes');
        }
    },
    {
        id: 'bulletStorm',
        title: '🔥 Bullet Storm',
        desc: 'Regenerate 1 bullet every 2 seconds',
        effect: () => {
            // FIXED: 1 bullet per 2 seconds = 0.5 bullets per second
            gameState.playerStats.bulletRegen += 0.5;
            gameState.playerStats.selectedBuffs.push('bulletStorm');
        }
    },
    {
        id: 'berserkerRage',
        title: '💢 Berserker Rage',
        desc: 'Gain +25% damage and +15% attack speed',
        effect: () => {
            gameState.playerStats.damageBonus += 25;
            gameState.playerStats.attackSpeed += 15;
            gameState.playerStats.selectedBuffs.push('berserkerRage');
        }
    },
    {
        id: 'survivalInstinct',
        title: '💚 Survival Instinct',
        desc: 'Regenerate 1 HP every 3 seconds',
        effect: () => {
            // FIXED: 1 HP per 3 seconds = 0.333... HP per second
            gameState.playerStats.healthRegen += 0.333;
            gameState.playerStats.selectedBuffs.push('survivalInstinct');
        }
    },
    {
        id: 'criticalFocus',
        title: '🎯 Critical Focus',
        desc: '20% chance for critical hits (2x damage)',
        effect: () => {
            gameState.playerStats.critChance += 20;
            // FIXED: critDamage should be 2.0 for 2x damage (was adding 0.5)
            gameState.playerStats.critDamage = 2.0;
            gameState.playerStats.selectedBuffs.push('criticalFocus');
        }
    },
    {
        id: 'swiftDeath',
        title: '⚡ Swift Death',
        desc: '+20% movement and projectile speed',
        effect: () => {
            gameState.playerStats.moveSpeed += 20;
            gameState.playerStats.projectileSpeed += 20;
            gameState.playerStats.selectedBuffs.push('swiftDeath');
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

export { replenishBuffSelection };

// Expose to global for debugging and UI access
window.playerStats = playerStats;
window.initRoguelikeSystem = initRoguelikeSystem;
window.applyBuff = applyBuff;
window.STAT_BUFFS = STAT_BUFFS;

// Replace the original chooseBuff function
window.originalChooseBuff = window.chooseBuff;
window.chooseBuff = chooseBuff;