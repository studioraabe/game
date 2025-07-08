// js/entities-combat-enhanced.js - Enhanced Combat System with Roguelike Stats

import { GAME_CONSTANTS, CANVAS, ENEMY_BASE_STATS, calculateEnemyDamage } from './core/constants.js';
import { camera, getScreenX } from './core/camera.js';
import { player } from './core/player.js';
import { gameState, takeDamage, healPlayer } from './core/gameState.js';
import { soundManager, rollForDrop, enhancedHealPlayer } from './systems.js';
import { triggerDamageEffects } from './enhanced-damage-system.js';
import { createDamageNumber } from './ui-enhancements.js';
import { playerStats, calculateDamage, applyLifesteal } from './roguelike-stats.js';
import { 
    obstacles, 
    bulletsFired, 
    batProjectiles,
    createBloodParticles, 
    createScorePopup, 
    createLightningEffect,
    getObstacleHitbox 
} from './entities-core.js';



// Import the new stats system


// Attack speed variables
let shootCooldown = 0;
const BASE_SHOOT_COOLDOWN = 15; // frames at 60fps - 4 shots per second

// Enhanced shooting system with attack speed
export function enhancedShoot(gameStateParam) {
    if (!gameStateParam.gameRunning || 
        (gameStateParam.bullets <= 0 && !gameStateParam.isBerserker)) {
        return false;
    }
    
    // Apply attack speed calculation
    const attackSpeedMultiplier = 1 + (playerStats.attackSpeed / 100);
    const finalCooldown = BASE_SHOOT_COOLDOWN / attackSpeedMultiplier;
    
    // Check if we can shoot based on cooldown
    if (shootCooldown > 0) {
        return false;
    }
    
    // Reset cooldown
    shootCooldown = finalCooldown;
    
    // Always shoot a single bullet - Chain Lightning has been removed
    const bulletCount = 1;
    const enhanced = false; // No enhancement from Chain Lightning
    
    // Apply projectile speed multiplier
    const projectileSpeedMultiplier = 1 + (playerStats.projectileSpeed / 100);
    
    for (let i = 0; i < bulletCount; i++) {
        const offsetY = 0; // No offset needed for single bullet
        const baseX = player.facingDirection === 1 ? player.x + player.width : player.x;
        const startX = baseX + (24 * player.facingDirection);
        
        // Enhanced bullet speed with stats
        const bulletSpeed = GAME_CONSTANTS.BULLET_SPEED * 
                          player.facingDirection * 
                          GAME_CONSTANTS.BULLET_SPEED_MULTIPLIER *
                          projectileSpeedMultiplier;
        
        bulletsFired.push({
            x: startX,
            y: player.y + player.height / 1.00 + offsetY,
            speed: bulletSpeed,
            enhanced: enhanced,
            direction: player.facingDirection,
            piercing: gameStateParam.hasPiercingBullets,
            // Stretch effect properties
            age: 0,
            tailX: startX,
            baseLength: 30,
            currentLength: 4,
            maxStretch: 60,
            hit: false,
            hitTime: 0
        });
    }
    
    if (!gameStateParam.isBerserker) {
        gameStateParam.bullets -= bulletCount;
    }
    
    soundManager.shoot();
    return true;
}

// Update bullets with enhanced damage calculation
export function enhancedUpdateBullets(gameStateParam) {
    let anyBulletHit = false;
    
    // Update shooting cooldown
    if (shootCooldown > 0) {
        shootCooldown -= gameState.deltaTime;
    }
    
    for (let i = bulletsFired.length - 1; i >= 0; i--) {
        const bullet = bulletsFired[i];
        
        bullet.age++;
        
        if (!bullet.hit) {
            bullet.x += bullet.speed * gameState.deltaTime;
            
            if (bullet.age < 10) {
                bullet.currentLength = bullet.baseLength + (bullet.maxStretch * (bullet.age / 10));
            } else {
                bullet.currentLength = bullet.baseLength + bullet.maxStretch;
            }
            
            const tailDelay = bullet.currentLength / Math.abs(bullet.speed);
            if (bullet.age > tailDelay) {
                bullet.tailX += bullet.speed * gameState.deltaTime;
            }
        } else {
            bullet.hitTime++;
            
            if (bullet.hitTime < 8) {
                bullet.tailX += bullet.speed * 3 * gameState.deltaTime;
                bullet.currentLength = Math.max(4, bullet.currentLength - 10);
            } else {
                bulletsFired.splice(i, 1);
                continue;
            }
        }
        
        let bulletHitSomething = false;
        
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            
            if (obstacle.type !== 'teslaCoil' && 
                obstacle.type !== 'frankensteinTable' && 
                obstacle.type !== 'boltBox' && 
                !(obstacle.type === 'skeleton' && obstacle.isDead)) {
                
                if (bullet.x < obstacle.x + obstacle.width &&
                    bullet.x + 8 > obstacle.x &&
                    bullet.y < obstacle.y + obstacle.height &&
                    bullet.y + 4 > obstacle.y) {
                    
                    bullet.hit = true;
                    bullet.hitTime = 0;
                    
                    // Get base damage
                    const baseDamage = gameStateParam.baseDamage || 
                                     calculatePlayerDamage(gameStateParam.level);
                    
                    // Apply enhanced damage calculation with crit system
                    const { damage, isCritical } = calculateDamage(
                        bullet.enhanced ? baseDamage * 3 : baseDamage
                    );
                    
                    // Ensure obstacle has proper health before damage
                    if (!obstacle.maxHealth || obstacle.maxHealth <= 0) {
                        const enemyTypes = ['skeleton', 'bat', 'vampire', 'spider', 'wolf', 'alphaWolf'];
                        if (enemyTypes.includes(obstacle.type)) {
                            obstacle.maxHealth = calculateEnemyHP(obstacle.type, gameStateParam.level);
                            obstacle.health = obstacle.maxHealth;
                        }
                    }
                    
                    // Apply damage
                    obstacle.health -= damage;
                    
                    console.log(`💥 ${obstacle.type} hit for ${damage} damage. Health: ${obstacle.health}/${obstacle.maxHealth}`);
                    
                    // Show damage number with critical indication
                    createDamageNumber(
                        obstacle.x + obstacle.width/2, 
                        obstacle.y + obstacle.height/4, 
                        damage, 
                        isCritical
                    );
                    
                    if (obstacle.type === 'skeleton') {
                        obstacle.damageResistance = 30;
                        
                        if (obstacle.health <= 0) {
                            obstacle.isDead = true;
                            obstacle.deathTimer = 0;
                            handleEnemyDeath(obstacle, j, gameStateParam, damage);
                        }
                    }
                    
                    createLightningEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    
                    gameStateParam.consecutiveHits++;
                    bulletHitSomething = true;
                    anyBulletHit = true;
                    
                    if (obstacle.health <= 0 && obstacle.type !== 'skeleton') {
                        handleEnemyDeath(obstacle, j, gameStateParam, damage);
                    }
                    
                    if (!bullet.piercing || !gameStateParam.hasPiercingBullets) {
                        bulletsFired.splice(i, 1);
                        break;
                    }
                }
            }
        }
        
        // Clean up off-screen bullets
        if (bullet && (bullet.x > camera.x + CANVAS.width + 100 || bullet.x < camera.x - 100)) {
            if (!bulletHitSomething) {
                gameStateParam.consecutiveHits = 0;
            }
            bulletsFired.splice(i, 1);
        }
    }
}

// Enhanced enemy death handler with lifesteal
function handleEnemyDeath(obstacle, index, gameStateParam, damage) {
    const config = window.ENEMY_CONFIG?.[obstacle.type] || { points: 10 };
    const basePoints = config.points || 10;
    const levelBonus = (gameStateParam.level - 1) * 5;
    const points = (basePoints + levelBonus) * gameStateParam.scoreMultiplier;
    
    gameStateParam.score += points;
    createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, points);

    // Apply lifesteal when killing enemies
    if (playerStats.lifeSteal > 0) {
        const lifeStealAmount = applyLifesteal(damage);
        if (lifeStealAmount > 0) {
            createScorePopup(
                player.x + player.width/2, 
                player.y - 15, 
                `+${lifeStealAmount} 🩸`,
                true
            );
        }
    }
    
    // Roll for drops
    rollForDrop(obstacle.type, obstacle.x + obstacle.width/2, obstacle.y);
    
    if (obstacle.type === 'alphaWolf') {
        gameStateParam.bossesKilled++;
    }
    
    // Cleanup before removal
    if (obstacle.id && window.spriteManager) {
        window.spriteManager.cleanupEntity(obstacle.type, obstacle.id);
    }
    
    obstacles.splice(index, 1);
    gameStateParam.enemiesDefeated++;
    gameStateParam.bulletsHit++;
    gameStateParam.levelProgress += 3;
    soundManager.hit();
    
    gameStateParam.comboCount++;
    if (gameStateParam.comboCount >= 2) {
        gameStateParam.comboTimer = 300;
    }
    
    // Handle undead resilience buff for healing after hits
    const bulletsNeeded = gameStateParam.activeBuffs.undeadResilience > 0 ? 10 : 15;
    if (gameStateParam.bulletsHit >= bulletsNeeded) {
        // Enhanced healing system with buff support
        const baseHealAmount = Math.floor(gameStateParam.maxHP * 0.25);
        const actualHeal = enhancedHealPlayer(baseHealAmount);
        
        if (actualHeal > 0) {
            createScorePopup(player.x + player.width/2, player.y, `+${actualHeal} HP`);
        } else {
            gameStateParam.score += 500 * gameStateParam.scoreMultiplier;
            createScorePopup(player.x + player.width/2, player.y, '+500 Bonus!');
        }
        gameStateParam.bulletsHit = 0;
    }
}

// Helper function to calculate player damage with level scaling
function calculatePlayerDamage(level) {
    return GAME_CONSTANTS.PLAYER_BASE_DAMAGE + (level - 1) * GAME_CONSTANTS.PLAYER_DAMAGE_PER_LEVEL;
}

// Helper function to calculate enemy HP with level scaling
function calculateEnemyHP(enemyType, level) {
    const baseStats = ENEMY_BASE_STATS[enemyType];
    if (!baseStats) return 100; // Fallback
    
    const multiplier = Math.pow(GAME_CONSTANTS.ENEMY_HP_MULTIPLIER_PER_LEVEL, level - 1);
    return Math.floor(baseStats.hp * multiplier);
}

// Export the enhanced functions
export { 
    handleEnemyDeath,
    calculatePlayerDamage,
    calculateEnemyHP
};