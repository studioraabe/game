// js/roguelike-integration.js - System Integration Module

import { gameState, resetGame } from './core/gameState.js';
import { keys } from './core/input.js';
import { player } from './core/player.js';
import { enhancedUpdatePlayer } from './enhanced-player.js';
import { enhancedShoot, enhancedUpdateBullets } from './entities-combat-enhanced.js';
import { playerStats, updatePlayerStats, initRoguelikeSystem, STAT_BUFFS } from './roguelike-stats.js';

// Integration entry point - Call this from main.js
export function initRoguelikeIntegration() {
    console.log('🎮 Initializing Roguelike Integration...');
    
    // Initialize stats system
    initRoguelikeSystem();
    
    // Replace original functions with enhanced versions
    window.updatePlayer = () => enhancedUpdatePlayer(keys, gameState);
    window.enhancedShoot = () => enhancedShoot(gameState);
    window.shoot = () => enhancedShoot(gameState); // Replace original shoot
    window.updateBullets = () => enhancedUpdateBullets(gameState);
    
    // Add stats update to game loop
    const originalUpdate = window.update;
    window.update = function() {
        // Call original update first
        if (originalUpdate) {
            originalUpdate();
        }
        
        // Add stats update
        updatePlayerStats();
    };
    
    // Override reset game to initialize stats
    const originalResetGame = resetGame;
    window.resetGame = function() {
        // Call original reset
        originalResetGame();
        
        // Reset stats system
        initRoguelikeSystem();
    };
    
    // Replace buff selection display with enhanced version
    patchBuffSelection();
    
    console.log('🎮 Roguelike Integration Complete!');
    
    // Debug helper for stats
    window.debugStats = function() {
        console.log('===== PLAYER STATS =====');
        console.log(`Damage Bonus: +${playerStats.damageBonus}%`);
        console.log(`Attack Speed: +${playerStats.attackSpeed}%`);
        console.log(`Move Speed: +${playerStats.moveSpeed}%`);
        console.log(`Projectile Speed: +${playerStats.projectileSpeed}%`);
        console.log(`Health Regen: ${playerStats.healthRegen.toFixed(2)}/sec`);
        console.log(`Bullet Regen: ${playerStats.bulletRegen.toFixed(2)}/sec`);
        console.log(`Life Steal: ${playerStats.lifeSteal}%`);
        console.log(`Crit Chance: ${playerStats.critChance}%`);
        console.log(`Crit Damage: x${playerStats.critDamage.toFixed(2)}`);
        console.log('=======================');
        return playerStats;
    };
}

// Enhanced buff selection display
function patchBuffSelection() {
    // Modify the updateBuffButtons function in ui.js
    if (window.updateBuffButtons) {
        const originalUpdateBuffButtons = window.updateBuffButtons;
        
        window.updateBuffButtons = function() {
            const buffButtonsContainer = document.getElementById('buffButtons');
            if (!buffButtonsContainer) return;
            
            buffButtonsContainer.innerHTML = '';
            
            // Use our enhanced STAT_BUFFS for reference
            gameState.availableBuffs.forEach(buff => {
                // Find detailed buff info
                const buffInfo = STAT_BUFFS.find(b => b.id === buff.id) || buff;
                
                const button = document.createElement('div');
                button.className = 'buff-card';
                button.onclick = () => window.chooseBuff(buff.id);
                
                const title = document.createElement('div');
                title.className = 'buff-title';
                title.textContent = buffInfo.title || buff.title;
                
                const desc = document.createElement('div');
                desc.className = 'buff-desc';
                desc.textContent = buffInfo.desc || buff.desc;
                
                // Add buff icon/category visual
                const category = getBufCategory(buff.id);
                const icon = document.createElement('div');
                icon.className = 'buff-icon';
                icon.textContent = getCategoryIcon(category);
                
                const info = document.createElement('div');
                info.className = 'buff-info';
                info.textContent = category;
                
                button.appendChild(title);
                button.appendChild(desc);
                button.appendChild(icon);
                button.appendChild(info);
                buffButtonsContainer.appendChild(button);
            });
            
            // Add styling for new elements
            addBuffCardStyles();
        };
    }
}

// Buff categorization helper
function getBufCategory(buffId) {
    // Categorize buffs by type
    if (['berserkerRage', 'criticalFocus'].includes(buffId)) {
        return 'Damage';
    }
    if (['bulletStorm', 'vampiricStrikes', 'survivalInstinct', 'undeadResilience'].includes(buffId)) {
        return 'Survival';
    }
    if (['shadowLeap', 'swiftDeath'].includes(buffId)) {
        return 'Mobility';
    }
    if (buffId.includes('upgraded')) {
        return 'Upgrade';
    }
    return 'Special';
}

// Icon for buff categories
function getCategoryIcon(category) {
    switch (category) {
        case 'Damage': return '💥';
        case 'Survival': return '💖';
        case 'Mobility': return '🌀';
        case 'Upgrade': return '⬆️';
        default: return '✨';
    }
}

// Add styles for enhanced buff cards
function addBuffCardStyles() {
    // Check if styles already exist
    if (document.getElementById('enhanced-buff-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'enhanced-buff-styles';
    style.textContent = `
        .buff-card {
            position: relative;
            overflow: hidden;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .buff-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        }
        
        .buff-icon {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 24px;
            opacity: 0.7;
        }
        
        .buff-info {
            position: absolute;
            bottom: 10px;
            right: 10px;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.6);
            padding: 3px 8px;
            border-radius: 10px;
            color: #fff;
        }
        
        .buff-title {
            font-size: 18px;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }
        
        .buff-desc {
            font-size: 14px;
            line-height: 1.4;
            margin-bottom: 30px;
        }
    `;
    
    document.head.appendChild(style);
}

// Stat display for UI
export function createStatDisplay() {
    // Check if it already exists
    if (document.getElementById('stat-display')) return;
    
    const container = document.createElement('div');
    container.id = 'stat-display';
    container.className = 'stat-display';
    container.style.cssText = `
        position: absolute;
        top: 80px;
        left: -200px;
        background: rgba(0, 0, 0, 0.7);
        padding: 10px;
        border-radius: 5px;
        font-family: 'Rajdhani', sans-serif;
        font-size: 14px;
        color: #fff;
        z-index: 100;
        max-width: 200px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    `;
    
    updateStatDisplay();
    
    document.getElementById('gameContainer').appendChild(container);
    
    // Add toggle button

    

}

// Update stat display content
export function updateStatDisplay() {
    const container = document.getElementById('stat-display');
    if (!container) return;
    
    container.innerHTML = `
     
        <div class="stat-row">
            <span>Damage:</span>
            <span>+${playerStats.damageBonus}%</span>
        </div>
        <div class="stat-row">
            <span>Attack Speed:</span>
            <span>+${playerStats.attackSpeed}%</span>
        </div>
        <div class="stat-row">
            <span>Move Speed:</span>
            <span>+${playerStats.moveSpeed}%</span>
        </div>
        <div class="stat-row">
            <span>Projectile Speed:</span>
            <span>+${playerStats.projectileSpeed}%</span>
        </div>
        <div class="stat-row">
            <span>Health Regen:</span>
            <span>${playerStats.healthRegen.toFixed(2)}/sec</span>
        </div>
        <div class="stat-row">
            <span>Bullet Regen:</span>
            <span>${playerStats.bulletRegen.toFixed(2)}/sec</span>
        </div>
        <div class="stat-row">
            <span>Life Steal:</span>
            <span>${playerStats.lifeSteal}%</span>
        </div>
        <div class="stat-row">
            <span>Crit Chance:</span>
            <span>${playerStats.critChance}%</span>
        </div>
        <div class="stat-row">
            <span>Crit Damage:</span>
            <span>x${playerStats.critDamage.toFixed(2)}</span>
        </div>
        <div class="stat-row">
            <span>Buffs:</span>
            <span>${playerStats.selectedBuffs.length}</span>
        </div>
    `;
}

// Toggle stat display visibility
function toggleStatDisplay() {
    const container = document.getElementById('stat-display');
    if (container) {
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }
}

// Create stats update loop
export function startStatsUpdateLoop() {
    // Clear any existing interval
    if (window.statsUpdateInterval) {
        clearInterval(window.statsUpdateInterval);
    }
    
    window.statsUpdateInterval = setInterval(() => {
        try {
            updateStatDisplay();
        } catch (error) {
            console.warn('⚠️ Error updating stat display:', error);
        }
    }, 1000);
    
    console.log('📊 Stats update loop started');
}


 export function forceRefreshStats() {
    console.log('🔄 Force refreshing stats...');
    
    // Check what we have
    console.log('gameState:', window.gameState);
    console.log('playerStats:', window.gameState?.playerStats);
    
    // Update display
    updateStatDisplay();
    
    // Recreate if needed
    if (!document.getElementById('stat-display')) {
        console.log('📊 Recreating stat display...');
        createStatDisplay();
    }
}

// Debug function to check stats
export function debugPlayerStats() {
    console.log('=== PLAYER STATS DEBUG ===');
    if (window.gameState && window.gameState.playerStats) {
        const stats = window.gameState.playerStats;
        console.log('Player Stats:', stats);
        console.log('Selected Buffs:', stats.selectedBuffs);
        console.log('Damage Bonus:', stats.damageBonus);
        console.log('Attack Speed:', stats.attackSpeed);
        console.log('Move Speed:', stats.moveSpeed);
        console.log('Health Regen:', stats.healthRegen);
        console.log('Bullet Regen:', stats.bulletRegen);
        console.log('Life Steal:', stats.lifeSteal);
        console.log('Crit Chance:', stats.critChance);
        console.log('Crit Damage:', stats.critDamage);
    } else {
        console.log('❌ Player stats not available');
        console.log('gameState exists:', !!window.gameState);
        console.log('playerStats exists:', !!window.gameState?.playerStats);
    }
    console.log('=========================');
}

// Make functions globally available for debugging
window.forceRefreshStats = forceRefreshStats;
window.debugPlayerStats = debugPlayerStats;
window.updateStatDisplay = updateStatDisplay;

console.log(`
📊 ENHANCED STAT DISPLAY SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Debug commands:
forceRefreshStats()  - Force refresh the display
debugPlayerStats()   - Show current stats in console
updateStatDisplay()  - Manual update

📋 Features:
- Hover over left edge to see stats
- Auto-updates every second
- Error handling for missing data
- Toggle button for easy access

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Make functions available globally
window.createStatDisplay = createStatDisplay;
window.updateStatDisplay = updateStatDisplay;
window.startStatsUpdateLoop = startStatsUpdateLoop;