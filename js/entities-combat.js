// entities-combat.js - Fixed healing system integration

import { GAME_CONSTANTS, CANVAS, ENEMY_BASE_STATS, calculateEnemyDamage, calculateEnemyHP, calculatePlayerDamage } from './core/constants.js';
import { startJump, stopJump } from './enhanced-player.js';
import { camera } from './core/camera.js';
import { player } from './core/player.js';
import { gameState, takeDamage, healPlayer } from './core/gameState.js'; // FIXED: Added healPlayer import
import { soundManager, rollForDrop, enhancedHealPlayer } from './systems.js'; // FIXED: Added enhancedHealPlayer import
import { triggerDamageEffects } from './enhanced-damage-system.js';
import { createDamageNumber } from './ui-enhancements.js';
import { 
    obstacles, 
    bulletsFired, 
    batProjectiles,
    createBloodParticles, 
    createScorePopup, 
    createLightningEffect,
    getObstacleHitbox 
} from './entities-core.js';

import { enhancedShoot } from './enhanced-projectile-system.js';
import { getComboPointsMultiplier } from './systems.js';
import { lightningEffects } from './entities-core.js';



// ... keep all existing BAT PROJECTILE SYSTEM code ...

function createBatProjectile(startX, startY, targetX, targetY) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 4;
    const velocityX = (dx / distance) * speed;
    const velocityY = (dy / distance) * speed;
    
    batProjectiles.push({
        x: startX,
        y: startY,
        velocityX: velocityX,
        velocityY: velocityY,
        life: 300,
        maxLife: 300,
        size: 8,
        corrupt: true,
        glowIntensity: 1.0,
        trailParticles: [],
        hasHitGround: false
    });
}


export function updateBatProjectiles(gameStateParam) {
    for (let i = batProjectiles.length - 1; i >= 0; i--) {
        const projectile = batProjectiles[i];
        
        // Move projectile
        projectile.x += projectile.velocityX * gameState.deltaTime;
        projectile.y += projectile.velocityY * gameState.deltaTime;
        
        projectile.velocityY += 0.05 * gameState.deltaTime;
        projectile.life -= gameState.deltaTime;
        
        // Trail effect
        if (projectile.trailParticles.length < 5) {
            projectile.trailParticles.push({
                x: projectile.x,
                y: projectile.y,
                life: 15,
                alpha: 0.8
            });
        }
        
        // Update trail particles
        for (let t = projectile.trailParticles.length - 1; t >= 0; t--) {
            projectile.trailParticles[t].life--;
            projectile.trailParticles[t].alpha *= 0.9;
            if (projectile.trailParticles[t].life <= 0) {
                projectile.trailParticles.splice(t, 1);
            }
        }
        
        // Check collision with player
 if (!isPlayerInvulnerable(gameStateParam) &&
    projectile.x < player.x + player.width &&
    projectile.x + projectile.size > player.x &&
    projectile.y < player.y + player.height &&
    projectile.y + projectile.size > player.y) {
    
    // CORRUPTION EFFECT
    gameStateParam.isCorrupted = true;
    gameStateParam.corruptionTimer = 180;
    
    // Calculate corruption damage
    const corruptionDamage = Math.max(8, Math.floor(gameStateParam.maxHP * 0.08));
    
    // FIXED: Use handlePlayerDamageWithAmount for direct damage values
    // This ensures shields are properly checked and consumed
    const playerDied = handlePlayerDamageWithAmount(gameStateParam, corruptionDamage, 'Bat Blood Curse', 'corruption');
    
    // Visual effects
    createDamageNumber(player.x + player.width/2, player.y - 10, corruptionDamage);
    createBloodParticles(player.x + player.width/2, player.y + player.height/2);
    createScorePopup(player.x + player.width/2, player.y, 'BLOOD CURSED!');
    
    // Corruption damage effects
    triggerDamageEffects(gameStateParam, 'corruption');
            
    // Impact particles
    for (let p = 0; p < 12; p++) {
        createBloodParticles(
            projectile.x + (Math.random() - 0.5) * 20,
            projectile.y + (Math.random() - 0.5) * 20
        );
    }
    
    batProjectiles.splice(i, 1);
    soundManager.hit();
    
    // Return game over status
    if (playerDied) {
        return true; // Signal game over to the caller
    }
    continue;
}
        
        // Ground collision
        if (projectile.y + projectile.size >= CANVAS.groundY && !projectile.hasHitGround) {
            projectile.hasHitGround = true;
            projectile.velocityY = -projectile.velocityY * 0.3;
            projectile.velocityX *= 0.7;
            projectile.life = Math.min(projectile.life, 60);
            
            // Ground impact effect
            for (let p = 0; p < 6; p++) {
                createBloodParticles(
                    projectile.x + (Math.random() - 0.5) * 16,
                    CANVAS.groundY - 5
                );
            }
        }
        
        // Remove if expired or off screen
        if (projectile.life <= 0 || 
            projectile.x < camera.x - 100 || 
            projectile.x > camera.x + CANVAS.width + 100 || 
            projectile.y > CANVAS.groundY + 50) {
            batProjectiles.splice(i, 1);
        }
    }
}
// ... keep all existing SHOOTING SYSTEM code ...















function handleEnemyDeathWithLifesteal(obstacle, index, gameStateParam, damage) {
    // Apply lifesteal if player has it
    const lifeSteal = gameStateParam.playerStats?.lifeSteal || 0;
    if (lifeSteal > 0) {
        const healAmount = Math.max(1, Math.floor(damage * (lifeSteal / 100)));
        
        // Apply healing if not at max health
        if (gameStateParam.currentHP < gameStateParam.maxHP) {
            const oldHP = gameStateParam.currentHP;
            gameStateParam.currentHP = Math.min(gameStateParam.maxHP, gameStateParam.currentHP + healAmount);
            const actualHeal = gameStateParam.currentHP - oldHP;
            
            if (actualHeal > 0) {
                createScorePopup(
                    player.x + player.width/2, 
                    player.y - 15, 
                    `+${actualHeal} 🩸`,
                    true
                );
            }
        }
    }
    
    // Continue with normal enemy death handling
    handleEnemyDeath(obstacle, index, gameStateParam);
}


export { enhancedShoot as shoot };




export function updateBullets(gameStateParam) {
    let anyBulletHit = false;
    
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
                // Don't remove Chain Lightning bullets immediately after hit
                // This allows time for the chain effect to process
                if (bullet.type !== 'chainLightning' || bullet.chainProcessed) {
                    bulletsFired.splice(i, 1);
                }
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
                    
                    // Get base damage - keep existing damage calculation
                    const baseDamage = gameStateParam.baseDamage || 20;
                    let damage = bullet.enhanced ? baseDamage * 3 : baseDamage;
                    
                    // Apply player stat bonuses
                    const damageBonus = gameStateParam.playerStats?.damageBonus || 0;
                    damage = damage * (1 + (damageBonus / 100));
                    
                    // Critical hit calculation
                    let isCritical = false;
                    const critChance = gameStateParam.playerStats?.critChance || 0;
                    if (Math.random() * 100 < critChance) {
                        isCritical = true;
                        const critMultiplier = gameStateParam.playerStats?.critDamage || 1.5;
                        damage *= critMultiplier;
                    }
                    
                    damage = Math.floor(damage);
                    
                    // Ensure obstacle has proper health before damage
                    if (!obstacle.maxHealth || obstacle.maxHealth <= 0) {
                        const enemyTypes = ['skeleton', 'bat', 'vampire', 'spider', 'wolf', 'alphaWolf'];
                        if (enemyTypes.includes(obstacle.type)) {
                            if (window.calculateEnemyHP) {
                                obstacle.maxHealth = window.calculateEnemyHP(obstacle.type, gameStateParam.level);
                            } else {
                                obstacle.maxHealth = 100; // fallback
                            }
                            obstacle.health = obstacle.maxHealth;
                        }
                    }
                    
                    // Apply damage
                    obstacle.health -= damage;
                    
                    
                    // Show damage number with critical indication
                    if (window.createDamageNumber) {
                        window.createDamageNumber(
                            obstacle.x + obstacle.width/2, 
                            obstacle.y + obstacle.height/4, 
                            damage, 
                            isCritical
                        );
                    }
                    
                    // For Chain Lightning, process the chain effect immediately
                    if (bullet.type === 'chainLightning') {
                        // Initialize the chain properties if not already set
                        if (!bullet.chainedTargets) {
                            bullet.chainedTargets = new Set();
                        }
                        bullet.chainedTargets.add(obstacle); // Add the first hit enemy
                        
                        // Execute the chain lightning effect immediately
                        executeChainLightning(bullet, obstacle, gameStateParam);
                        
                        // Mark as processed
                        bullet.chainProcessed = true;
                    }
                    
                    if (obstacle.type === 'skeleton') {
                        obstacle.damageResistance = 30;
                        
                        if (obstacle.health <= 0) {
                            obstacle.isDead = true;
                            obstacle.deathTimer = 0;
                            handleEnemyDeath(obstacle, j, gameStateParam, damage);
                        }
                    }
                    
                    if (window.createLightningEffect) {
                        window.createLightningEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    }
                    
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

// Enhanced function to handle Chain Lightning jumps with clear visual effects


// FIXED: Chain Lightning implementation with slow effect
// Replace the executeChainLightning function in entities-combat.js

function executeChainLightning(bullet, firstTarget, gameStateParam) {
    // Environmental objects to skip
    const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
    
    // Start chain from the first hit enemy
    let currentX = firstTarget.x + firstTarget.width/2;
    let currentY = firstTarget.y + firstTarget.height/2;
    
    // FIXED: Apply slow effect to the initial target
    applySlowEffect(firstTarget);
    
    // Maximum jumps (default to 2 additional enemies after the first hit)
    const maxChains = bullet.maxChains || 2;
    
    // Chain jump range
    const chainRange = bullet.chainRange || 120;
    
    // Process chain jumps
    for (let chainCount = 0; chainCount < maxChains; chainCount++) {
        let nextTarget = null;
        let nextDistance = chainRange;
        
        // Find nearest enemy that hasn't been hit yet
        for (const obstacle of obstacles) {
            // Skip environmental objects and already hit targets
            if (environmentalTypes.includes(obstacle.type)) continue;
            if (bullet.chainedTargets.has(obstacle)) continue;
            
            const dx = (obstacle.x + obstacle.width/2) - currentX;
            const dy = (obstacle.y + obstacle.height/2) - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nextDistance) {
                nextTarget = obstacle;
                nextDistance = distance;
            }
        }
        
        // No more targets in range
        if (!nextTarget) break;
        
        // Add to chained targets
        bullet.chainedTargets.add(nextTarget);
        
        // Calculate damage (using same calculation as the first hit)
        const baseDamage = gameStateParam.baseDamage || 20;
        let damage = bullet.damage * baseDamage;
        
        // Apply player stat bonuses
        const damageBonus = gameStateParam.playerStats?.damageBonus || 0;
        damage = damage * (1 + (damageBonus / 100));
        damage = Math.floor(damage);
        
        // Apply damage
        nextTarget.health -= damage;
        
        // FIXED: Apply slow effect to the chained target
        applySlowEffect(nextTarget);
        
        // Show damage number
        if (window.createDamageNumber) {
            window.createDamageNumber(
                nextTarget.x + nextTarget.width/2,
                nextTarget.y + nextTarget.height/4,
                damage
            );
        }
        
        // Create enhanced visual effect for chain lightning jump
        createChainLightningEffect(
            currentX, currentY,
            nextTarget.x + nextTarget.width/2,
            nextTarget.y + nextTarget.height/2
        );


		for (let p = 0; p < 5; p++) {
    const particleOffset = 15;
    const px = nextTarget.x + nextTarget.width/2 + (Math.random() - 0.5) * particleOffset;
    const py = nextTarget.y + nextTarget.height/2 + (Math.random() - 0.5) * particleOffset;
    
    lightningEffects.push({
        x: px,
        y: py,
        life: 8,
        maxLife: 8,
        branches: 2
    });
}
        
        // Handle enemy death if needed
        if (nextTarget.health <= 0) {
            const index = obstacles.indexOf(nextTarget);
            if (index > -1) {
                if (window.handleEnemyDeath) {
                    window.handleEnemyDeath(nextTarget, index, gameStateParam, damage);
                } else if (window.handleProjectileEnemyDeath) {
                    window.handleProjectileEnemyDeath(nextTarget, gameStateParam, damage);
                } else {
                    obstacles.splice(index, 1);
                }
            }
        }
        
        // Update current position to this target for next jump
        currentX = nextTarget.x + nextTarget.width/2;
        currentY = nextTarget.y + nextTarget.height/2;
        
        // Update combo counter for each chain hit
        if (gameStateParam.comboCount !== undefined) {
            gameStateParam.comboCount++;
            if (gameStateParam.comboCount >= 2) {
                gameStateParam.comboTimer = 300;
            }
        }
        
        // Update consecutive hits
        if (gameStateParam.consecutiveHits !== undefined) {
            gameStateParam.consecutiveHits++;
        }
        
        // Create a small delay between chain jumps for better visibility
        setTimeout(() => {
        }, chainCount * 50);
    }
}

// FIXED: Ensure the applySlowEffect function exists in entities-combat.js
function applySlowEffect(enemy) {
    // Skip if already slowed
    if (enemy.isSlowed) return;
    
    // FIXED: Use speedMultiplier instead of modifying speed directly
    enemy.isSlowed = true;
    enemy.slowDuration = 180; // 3 seconds at 60fps
    enemy.speedMultiplier = 0.6; // 40% speed reduction
    
    // Visual indicator for slowed enemies
    if (!enemy.effects) enemy.effects = [];
    enemy.effects.push({
        type: 'slow',
        duration: 180
    });
    
    // Create visual slow effect
    createSlowEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
    
}


// FIXED: Ensure the createSlowEffect function exists
function createSlowEffect(x, y) {
    // Create slow particles with ice-blue color
    for (let i = 0; i < 8; i++) { // More particles for better visibility
        if (window.dropParticles) {
            window.dropParticles.push({
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                velocityX: (Math.random() - 0.5) * 3,
                velocityY: (Math.random() - 0.5) * 3,
                life: 90, // Longer life for better visibility
                maxLife: 90,
                color: '#87CEEB', // Sky blue for slow effect
                size: 2 + Math.random() * 2
            });
        }
    }
    
    // Create a score popup to indicate slowing
    if (window.createScorePopup) {
        window.createScorePopup(x, y - 25, '❄️ SLOWED!');
    }
    
    // Add lightning effect for chain lightning visual
    if (window.createLightningEffect) {
        window.createLightningEffect(x, y);
    }
}
// Make sure to also update the createChainLightningEffect function for better visuals
function createChainLightningEffect(startX, startY, endX, endY) {
    // First create regular lightning effect at the target
    if (window.createLightningEffect) {
        window.createLightningEffect(endX, endY);
    }
    
    // Create multiple lightning effects along the path for the chain visual
    const segments = 3;
    for (let i = 0; i < segments; i++) {
        const t = (i + 1) / (segments + 1);
        const segX = startX + (endX - startX) * t;
        const segY = startY + (endY - startY) * t;
        
        // Add random offset for zigzag lightning effect
        const offsetMagnitude = 10;
        const randOffsetX = (Math.random() - 0.5) * offsetMagnitude;
        const randOffsetY = (Math.random() - 0.5) * offsetMagnitude;
        
        // Create small lightning effect at each segment point with slight delay
        setTimeout(() => {
            if (window.createLightningEffect) {
                window.createLightningEffect(segX + randOffsetX, segY + randOffsetY);
            }
        }, i * 30);
    }
    
    // Create a chain-specific effect by adding to lightningEffects array if it exists
	 lightningEffects.push({
		startX: startX,
		startY: startY,
		endX: endX,
		endY: endY,
		life: 12,
		maxLife: 12,
		branches: 2,
		isChain: true,
		isSlowing: true // Mark this as a slowing chain
	});
    
}


function applyLifesteal(damage, gameStateParam) {
    if (gameStateParam.playerStats.lifeSteal <= 0) return 0;
    
    // Calculate healing from lifesteal
    const healAmount = Math.max(1, Math.floor(damage * (gameStateParam.playerStats.lifeSteal / 100)));
    
    // Apply healing if not at max health
    if (gameStateParam.currentHP < gameStateParam.maxHP) {
        const oldHP = gameStateParam.currentHP;
        gameStateParam.currentHP = Math.min(gameStateParam.maxHP, gameStateParam.currentHP + healAmount);
        
        // Return the amount healed
        return gameStateParam.currentHP - oldHP;
    }
    
    return 0;
}


export function handleEnemyDeath(obstacle, index, gameStateParam, damage = 0) {
    const config = window.ENEMY_CONFIG?.[obstacle.type] || { points: 10 };
    let basePoints = config.points || 10;

    const levelBonus = (gameStateParam.level - 1) * 5;
    
    // Enhanced combo point multiplier
    const comboMultiplier = getComboPointsMultiplier();
    const points = Math.floor((basePoints + levelBonus) * gameStateParam.scoreMultiplier * comboMultiplier);
    
    gameStateParam.score += points;

    if (obstacle.type === 'professor') {
        basePoints = 100;
        gameStateParam.bossesKilled++;
    }
    
    // Show enhanced popup with combo indicator
    if (gameStateParam.comboCount >= 5) {
        createScorePopup(
            obstacle.x + obstacle.width/2, 
            obstacle.y, 
            `${points} (+${Math.round((comboMultiplier - 1) * 100)}%)`
        );
    } else {
        createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, points);
    }

    // FIXED: Apply lifesteal consistently using the enhanced function
    if (damage > 0) {
        const actualLifesteal = applyEnhancedLifesteal(damage, gameStateParam);
        if (actualLifesteal > 0) {
            createScorePopup(
                player.x + player.width/2, 
                player.y - 15, 
                `+${actualLifesteal} 🩸`,
                true
            );
        }
    }
    
    // Roll for drops with enhanced combo bonus
    rollForDrop(obstacle.type, obstacle.x + obstacle.width/2, obstacle.y);
    
    if (obstacle.type === 'alphaWolf') {
        gameStateParam.bossesKilled++;
    }
    
    // Cleanup and progression
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
    
    // Enhanced healing with combo bonus
    const bulletsNeeded = gameStateParam.activeBuffs.undeadResilience > 0 ? 10 : 15;
    if (gameStateParam.bulletsHit >= bulletsNeeded) {
        const baseHealAmount = Math.floor(gameStateParam.maxHP * 0.25);
        const actualHeal = enhancedHealPlayer(baseHealAmount);
        
        if (actualHeal > 0) {
            createScorePopup(player.x + player.width/2, player.y, `+${actualHeal} HP`);
        } else {
            const bonusPoints = Math.floor(500 * gameStateParam.scoreMultiplier * comboMultiplier);
            gameStateParam.score += bonusPoints;
            createScorePopup(player.x + player.width/2, player.y, `+${bonusPoints} Bonus!`);
        }
        gameStateParam.bulletsHit = 0;
    }
}


export function applyEnhancedLifesteal(damage, gameStateParam) {
    // FIXED: Consistent reference to playerStats
    const playerStats = gameStateParam.playerStats;
    if (!playerStats || !playerStats.lifeSteal || playerStats.lifeSteal <= 0) {
        return 0;
    }
    
    // Calculate healing from lifesteal percentage
    const healAmount = Math.max(1, Math.floor(damage * (playerStats.lifeSteal / 100)));
    
    console.log(`🩸 Lifesteal calculation: ${damage} damage * ${playerStats.lifeSteal}% = ${healAmount} heal`);
    
    // Apply healing if not at max health
    if (gameStateParam.currentHP < gameStateParam.maxHP) {
        const oldHP = gameStateParam.currentHP;
        gameStateParam.currentHP = Math.min(gameStateParam.maxHP, gameStateParam.currentHP + healAmount);
        const actualHeal = gameStateParam.currentHP - oldHP;
        
        console.log(`🩸 Lifesteal healed: ${actualHeal} HP (${oldHP} -> ${gameStateParam.currentHP})`);
        return actualHeal;
    }
    
    return 0;
}



// FIXED: Enemy movement system that respects individual enemy speeds
// Replace the updateObstacles function in entities-combat.js

export function updateObstacles(gameSpeed, enemySlowFactor, level, magnetRange, gameStateParam) {
    const speed = gameSpeed * enemySlowFactor * 0.7;
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        if (obstacle.type === 'skeleton' && obstacle.isDead) {
            obstacle.deathTimer += gameState.deltaTime;
            
            if (obstacle.deathTimer > 30) {
                if (obstacle.id && window.spriteManager) {
                    window.spriteManager.cleanupEntity('skeleton', obstacle.id);
                }
                obstacles.splice(i, 1);
                continue;
            }
            continue;
        }
        
        // FIXED: Handle slow effect processing with better logic
        if (obstacle.isSlowed && obstacle.slowDuration > 0) {
            obstacle.slowDuration -= gameState.deltaTime || 1;
            
            // When slow effect expires, restore original speed multiplier
            if (obstacle.slowDuration <= 0) {
                obstacle.isSlowed = false;
                obstacle.speedMultiplier = 1.0; // Reset to normal speed
            }
        }
        
        // FIXED: Calculate individual enemy speed with multiplier
        const individualSpeedMultiplier = obstacle.speedMultiplier || 1.0;
        const effectiveSpeed = speed * individualSpeedMultiplier;
        
        // SKELETON-SPECIFIC LOGIC
        if (obstacle.type === 'skeleton') {
            // FIXED: Apply speed multiplier to skeleton movement
            obstacle.velocityX = -effectiveSpeed;
            
            if (obstacle.damageResistance > 0) {
                obstacle.damageResistance -= gameState.deltaTime;
            }
        }
        
        const isStationary = obstacle.type === 'boltBox' || obstacle.type === 'rock' || 
                            obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable' ||
                            obstacle.type === 'sarcophagus';
        
        // FIXED: Apply individual speed to non-stationary enemies
        if (!isStationary || ((obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable') && !obstacle.isPermanent)) {
            obstacle.x -= effectiveSpeed * gameState.deltaTime;
        }
        
        // Tesla Coil State Machine
        if (obstacle.type === 'teslaCoil') {
            updateTeslaCoil(obstacle);
        }
        
        // Frankenstein Table State Machine
        if (obstacle.type === 'frankensteinTable') {
            updateFrankensteinTable(obstacle);
        }
        
        // ALPHA WOLF FURY ATTACK
        if (obstacle.type === 'alphaWolf') {
            updateAlphaWolf(obstacle, level, gameStateParam);
        }
        


        // BAT AI SYSTEM - FIXED: Apply speed multiplier to bat movement
        if (obstacle.type === 'bat') {
            updateBatAI(obstacle, gameStateParam, individualSpeedMultiplier);
        }
		
		
				if (obstacle.type === 'professor') {
			updateProfessorAI(obstacle, level, gameStateParam);
		}

		if (obstacle.type === 'munsta') {
    const laserKilledPlayer = updateMunstaAI(obstacle, level, gameStateParam);
    if (laserKilledPlayer) {
        // The laser killed the player, trigger game over
        if (window.gameOver) {
            window.gameOver();
        }
        return; // Stop processing
			}
		}


        // Ground enemy movement
        if (obstacle.type === 'spider') {
            obstacle.y += Math.sin(Date.now() * 0.004 * enemySlowFactor + i) * 0.4 * gameState.deltaTime;
        }
        
        obstacle.animationTime = Date.now();
        
        // Magnet effect for bolt boxes
        if (magnetRange > 0 && obstacle.type === 'boltBox') {
            const dx = (player.x + player.width/2) - (obstacle.x + obstacle.width/2);
            const dy = (player.y + player.height/2) - (obstacle.y + obstacle.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < magnetRange) {
                const force = (magnetRange - distance) / magnetRange * 0.6;
                obstacle.x += dx * force * 0.3;
                obstacle.y += dy * force * 0.3;
                
                if (obstacle.y > CANVAS.groundY - obstacle.height) {
                    obstacle.y = CANVAS.groundY - obstacle.height;
                }
            }
        }
        
        // Check if passed player
        if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
            obstacle.passed = true;
            
            // Only give points for actual enemies
            const enemyTypes = ['skeleton', 'bat', 'vampire', 'spider', 'wolf', 'alphaWolf', 'teslaCoil', 'frankensteinTable'];
            if (!enemyTypes.includes(obstacle.type)) {
                continue;
            }    
            
            // NEW: Enhanced combo point multiplier for avoidance
            const comboMultiplier = 1 + (gameStateParam.comboCount * 0.01);
            const basePoints = 10;
            const points = Math.floor(basePoints * gameStateParam.scoreMultiplier * comboMultiplier);
            
            gameStateParam.score += points;
            gameStateParam.obstaclesAvoided++;
            gameStateParam.levelProgress += 2;
            
            // Show enhanced popup for avoidance
            if (gameStateParam.comboCount >= 5) {
                createScorePopup(
                    obstacle.x + obstacle.width/2, 
                    obstacle.y - 30, 
                    `+${points} Avoided (+${Math.round((comboMultiplier - 1) * 100)}%)`
                );
            }
            
            gameStateParam.comboCount++;
            if (gameStateParam.comboCount >= 2) {
                gameStateParam.comboTimer = 300;
            }
            
            if (gameStateParam.obstaclesAvoided % 10 === 0) {
                gameStateParam.bullets += 10;
            }
        }
        
        // Remove if off screen
        if (obstacle.x + obstacle.width < camera.x - 100) {
            obstacles.splice(i, 1);
        }
    }
}

function updateTeslaCoil(obstacle) {
    obstacle.stateTimer -= gameState.deltaTime;
    
    switch(obstacle.state) {
        case 'idle':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'charging';
                obstacle.stateTimer = obstacle.chargeTime;
            }
            break;
            
        case 'charging':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'zapping';
                obstacle.stateTimer = obstacle.zapDuration;
                obstacle.zapActive = true;
                
                createLightningEffect(
                    obstacle.x + obstacle.width/2, 
                    obstacle.y + obstacle.height
                );
            }
            break;
            
        case 'zapping':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'cooldown';
                obstacle.stateTimer = obstacle.cooldown;
                obstacle.zapActive = false;
            }
            break;
            
        case 'cooldown':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'charging';
                obstacle.stateTimer = obstacle.chargeTime;
            }
            break;
    }
}

function updateFrankensteinTable(obstacle) {
    obstacle.stateTimer -= gameState.deltaTime;
    
    switch(obstacle.state) {
        case 'idle':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'charging';
                obstacle.stateTimer = obstacle.chargeTime;
            }
            break;
            
        case 'charging':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'zapping';
                obstacle.stateTimer = obstacle.zapDuration;
                obstacle.zapActive = true;
                
                createLightningEffect(
                    obstacle.x + obstacle.width/2, 
                    obstacle.y
                );
            }
            break;
            
        case 'zapping':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'cooldown';
                obstacle.stateTimer = obstacle.cooldown;
                obstacle.zapActive = false;
            }
            break;
            
        case 'cooldown':
            if (obstacle.stateTimer <= 0) {
                obstacle.state = 'idle';
                obstacle.stateTimer = Math.random() * 120 + 60;
            }
            break;
    }
}

function updateAlphaWolf(obstacle, level, gameStateParam) {
    if (obstacle.jumpTimer === undefined) return;
    
    // Initialize fury attack properties
    if (obstacle.furyAttackCooldown === undefined) {
        obstacle.furyAttackCooldown = 0;
        obstacle.isFuryCharging = false;
        obstacle.furyChargeTime = 0;
        obstacle.isLeaping = false;
        obstacle.leapVelocityX = 0;
        obstacle.leapVelocityY = 0;
        obstacle.furyTriggered = false;
        obstacle.targetX = 0;
        obstacle.targetY = 0;
        obstacle.facingDirection = 1;
        obstacle.lastHealth = obstacle.health;
    }
    
    // Fury trigger on health loss
    const healthLost = obstacle.lastHealth - obstacle.health;
const healthPercent = obstacle.health / obstacle.maxHealth;
if ((healthLost >= obstacle.maxHealth * 0.5 || healthPercent < 0.5) && 
    !obstacle.furyTriggered && obstacle.furyAttackCooldown <= 0) {
        obstacle.isFuryCharging = true;
        obstacle.furyChargeTime = 90;
        obstacle.furyTriggered = true;
        
        obstacle.lastHealth = obstacle.health;
        obstacle.verticalMovement = 0;
        obstacle.y = obstacle.originalY;
        
        // Predict player position
        const predictedX = player.x + (player.velocityX * 30);
        const predictedY = player.y + (player.velocityY * 15);
        obstacle.targetX = predictedX + player.width/2;
        obstacle.targetY = Math.max(predictedY + player.height/2, CANVAS.groundY - 25);
        
        const directionToPlayer = obstacle.targetX > (obstacle.x + obstacle.width/2) ? 1 : -1;
        obstacle.facingDirection = directionToPlayer;
    }
    
    // FURY CHARGING PHASE
    if (obstacle.isFuryCharging && obstacle.furyChargeTime > 0) {
        obstacle.furyChargeTime -= gameState.deltaTime;
        
        const currentDirectionToPlayer = (player.x + player.width/2) > (obstacle.x + obstacle.width/2) ? 1 : -1;
        obstacle.facingDirection = currentDirectionToPlayer;
        
        obstacle.jumpTimer = 60;
        
        if (obstacle.furyChargeTime <= 0) {
            obstacle.isFuryCharging = false;
            obstacle.isLeaping = true;
            
            const dx = obstacle.targetX - (obstacle.x + obstacle.width/2);
            const dy = obstacle.targetY - (obstacle.y + obstacle.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const leapSpeed = 6;
			const maxLeapHeight = 50;
            obstacle.leapVelocityX = (dx / distance) * leapSpeed;
            obstacle.leapVelocityY = (dy / distance) * leapSpeed - 3;
            
            obstacle.furyAttackCooldown = 120;
        }
    }
    
    // FURY LEAP MOVEMENT
    if (obstacle.isLeaping) {
        obstacle.x += obstacle.leapVelocityX * gameState.deltaTime;
        obstacle.y += obstacle.leapVelocityY * gameState.deltaTime;
		
		    // ADD THIS: Apply gravity during leap
    obstacle.leapVelocityY += 0.3 * gameState.deltaTime; // Gravity pulls wolf down
    
    // ADD THIS: Prevent wolf from going too high off screen
    if (obstacle.y < 50) { // Minimum Y position (top bound)
        obstacle.y = 50;
        obstacle.leapVelocityY = Math.max(0, obstacle.leapVelocityY); // Stop upward movement
    }
        
        obstacle.facingDirection = obstacle.leapVelocityX > 0 ? 1 : -1;
        
        if (!obstacle.leapStartX) {
            obstacle.leapStartX = obstacle.x;
            obstacle.leapStartY = obstacle.y;
            obstacle.maxLeapDistance = 150;
        }
        
        const distanceTraveled = Math.sqrt(
            (obstacle.x - obstacle.leapStartX) * (obstacle.x - obstacle.leapStartX) +
            (obstacle.y - obstacle.leapStartY) * (obstacle.y - obstacle.leapStartY)
        );
        
        if (!obstacle.leapTimer) obstacle.leapTimer = 60;
        obstacle.leapTimer -= gameState.deltaTime;
        
        if (obstacle.y >= obstacle.originalY || obstacle.leapTimer <= 0) {
    obstacle.y = obstacle.originalY;
    obstacle.isLeaping = false;
    obstacle.leapVelocityX = 0;
    obstacle.leapVelocityY = 0;
    obstacle.furyTriggered = false;
    
    // Landing damage check remains the same
    const landingRadius = 60; // Increased from 40
    const playerCenterX = player.x + player.width/2;
    const playerCenterY = player.y + player.height/2;
    const wolfCenterX = obstacle.x + obstacle.width/2;
    const wolfCenterY = obstacle.y + obstacle.height/2;
    
    const distanceToPlayer = Math.sqrt(
        (playerCenterX - wolfCenterX) * (playerCenterX - wolfCenterX) +
        (playerCenterY - wolfCenterY) * (playerCenterY - wolfCenterY)
    );
    
    if (distanceToPlayer < landingRadius && !isPlayerInvulnerable(gameStateParam)) {
        handlePlayerDamage(gameStateParam, 'Alpha Wolf Fury', 'fury');
    }
    
    // Visual effects
    createBloodParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height);
    createLightningEffect(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
}
    }
    
    // Normal jump logic when not in fury mode
    if (!obstacle.isFuryCharging && !obstacle.isLeaping) {
        obstacle.jumpTimer -= gameState.deltaTime;
        obstacle.furyAttackCooldown -= gameState.deltaTime;
        
        if (obstacle.verticalMovement !== undefined && 
            (obstacle.verticalMovement !== 0 || obstacle.y < obstacle.originalY)) {
            
            obstacle.y += obstacle.verticalMovement * gameState.deltaTime;
            obstacle.verticalMovement += 0.5 * gameState.deltaTime;
            
            if (obstacle.y >= obstacle.originalY) {
                obstacle.y = obstacle.originalY;
                obstacle.verticalMovement = 0;
            }
        }
        
        if (obstacle.jumpTimer <= 0 && obstacle.y >= obstacle.originalY && 
            (obstacle.verticalMovement === 0 || obstacle.verticalMovement === undefined)) {
            
            obstacle.verticalMovement = -5;
            const jumpFrequency = Math.max(60 - (level * 5), 60);
            obstacle.jumpTimer = Math.random() * jumpFrequency * 2 + jumpFrequency;
        }
    }
}

function updateBatAI(obstacle, gameStateParam) {
    obstacle.y += Math.sin(Date.now() * 0.01 + obstacle.animationTime) * 1.5 * gameStateParam.deltaTime;
    
    if (obstacle.spitCooldown === undefined) {
        obstacle.spitCooldown = Math.random() * 30 + 30;
        obstacle.isSpitting = false;
        obstacle.spitChargeTime = 0;
        obstacle.hasTargeted = false;
        obstacle.targetX = 0;
        obstacle.targetY = 0;
        obstacle.firstAttack = true;
    }
    
    obstacle.spitCooldown -= gameStateParam.deltaTime;
    
    const horizontalDistance = Math.abs(player.x - obstacle.x);
    const verticalDistance = Math.abs(player.y - obstacle.y);
    const inRange = horizontalDistance < 350 && verticalDistance < 220;
    
    if (obstacle.spitCooldown <= 0 && inRange) {
        if (!obstacle.isSpitting) {
            obstacle.isSpitting = true;
            obstacle.spitChargeTime = obstacle.firstAttack ? 30 : 60;
            obstacle.firstAttack = false;
            obstacle.hasTargeted = false;
        }
        
        if (obstacle.isSpitting && obstacle.spitChargeTime > 0) {
            obstacle.spitChargeTime -= gameStateParam.deltaTime;
            
            const targetingThreshold = obstacle.firstAttack ? 10 : 15;
            if (!obstacle.hasTargeted && obstacle.spitChargeTime <= targetingThreshold) {
                obstacle.hasTargeted = true;
                
                const predictedX = player.x + (player.velocityX * 25);
                const predictedY = player.y + (player.velocityY * 10);
                obstacle.targetX = predictedX + player.width/2;
                obstacle.targetY = Math.max(predictedY + player.height/2, CANVAS.groundY - 50);
                
                obstacle.facingPlayer = obstacle.targetX > obstacle.x ? 1 : -1;
            }
            
            if (obstacle.spitChargeTime <= 0) {
                createBatProjectile(
                    obstacle.x + obstacle.width/2,
                    obstacle.y + obstacle.height/2,
                    obstacle.targetX,
                    obstacle.targetY
                );
                
                obstacle.isSpitting = false;
                
                const distanceToPlayer = Math.sqrt(horizontalDistance * horizontalDistance + verticalDistance * verticalDistance);
                const baseCooldown = 120;
                const distanceBonus = Math.max(0, (350 - distanceToPlayer) / 350 * 60);
                
                obstacle.spitCooldown = Math.random() * baseCooldown + (baseCooldown - distanceBonus);
                obstacle.hasTargeted = false;
            }
        }
    }
    
    // Bat follows player
    if (inRange && !obstacle.isSpitting) {
        const followIntensity = 0.3;
        
        const targetY = player.y + player.height/2;
        const currentY = obstacle.y + obstacle.height/2;
        const yDiff = targetY - currentY;
        obstacle.y += Math.sign(yDiff) * Math.min(Math.abs(yDiff), 1) * followIntensity * gameStateParam.deltaTime;
        
        const targetX = player.x + player.width/2;
        const currentX = obstacle.x + obstacle.width/2;
        const xDiff = targetX - currentX;
        obstacle.x += Math.sign(xDiff) * Math.min(Math.abs(xDiff), 0.5) * followIntensity * 0.3 * gameStateParam.deltaTime;
        
        obstacle.y = Math.max(100, Math.min(obstacle.y, CANVAS.groundY - 100));
    }
    
    if (inRange) {
        obstacle.facingPlayer = player.x < obstacle.x ? -1 : 1;
    }
}

// ========================================
// COLLISION SYSTEM - FIXED FOR ONE-WAY DAMAGE
// ========================================



function handlePlayerDamageWithAmount(gameStateParam, damageAmount, damageSource = 'unknown', damageCategory = 'enemy') {
    
    // Shield check first
    if (gameStateParam.shieldCharges > 0) {
        const wasLastShield = gameStateParam.shieldCharges === 1;
        gameStateParam.shieldCharges--;
        
        if (gameStateParam.shieldCharges <= 0) {
            gameStateParam.hasShield = false;
            gameStateParam.shieldCharges = 0;
            createScorePopup(player.x + player.width/2, player.y, 'Shield Broken!');
            triggerDamageEffects(gameStateParam, 'shield');
        } else {
            createScorePopup(player.x + player.width/2, player.y, 
                `Shield: ${gameStateParam.shieldCharges} left`);
            triggerDamageEffects(gameStateParam, 'shield');
        }
        
        // NEW: Reset combo on shield hit (player still got hit!)
        gameStateParam.comboCount = 0;
        gameStateParam.comboTimer = 0;
        gameStateParam.consecutiveHits = 0;
        gameStateParam.bulletsHit = 0;
        
        // Set invulnerability but don't remove enemy (for bat projectiles, they're already removed)
        gameStateParam.postDamageInvulnerability = 60;
        player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
        
        if (!wasLastShield) {
            soundManager.hit();
        }
        
        return false; // Player didn't die, shield absorbed damage
    }
    
    // HP damage to player
    const playerDied = takeDamage(damageAmount);
    
    // Show damage number
    createDamageNumber(
        player.x + player.width/2, 
        player.y - 10, 
        damageAmount, 
        damageAmount >= gameStateParam.maxHP * 0.25 // Critical if 25%+ of max HP
    );
    
    createBloodParticles(player.x + player.width/2, player.y + player.height/2);
    
    gameStateParam.postDamageInvulnerability = 120;
    player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
    
    // Reset combo on HP damage (this was already here)
    gameStateParam.bulletsHit = 0;
    gameStateParam.comboCount = 0;
    gameStateParam.comboTimer = 0;
    gameStateParam.consecutiveHits = 0;
    
    soundManager.hit();
    
    return playerDied;
}





function handlePlayerDamage(gameStateParam, damageSource, damageCategory = 'enemy') {
    
    // Calculate damage amount
    let damageAmount = 0;
    
    if (damageSource === 'corruption' || damageSource === 'Blood Curse') {
        damageAmount = Math.max(10, Math.floor(gameStateParam.maxHP * 0.1)); // 10% of max HP
    } else if (typeof damageSource === 'string') {
        // Enemy damage based on type and level
        damageAmount = calculateEnemyDamage(damageSource, gameStateParam.level);
    } else {
        // Fallback damage
        damageAmount = Math.max(15, Math.floor(gameStateParam.maxHP * 0.15));
    }
    
    // Shield check first
    if (gameStateParam.shieldCharges > 0) {
        const wasLastShield = gameStateParam.shieldCharges === 1;
        gameStateParam.shieldCharges--;
        
        if (gameStateParam.shieldCharges <= 0) {
            gameStateParam.hasShield = false;
            gameStateParam.shieldCharges = 0;
            createScorePopup(player.x + player.width/2, player.y, 'Shield Broken!');
            triggerDamageEffects(gameStateParam, 'shield');
        } else {
            createScorePopup(player.x + player.width/2, player.y, 
                `Shield: ${gameStateParam.shieldCharges} left`);
            triggerDamageEffects(gameStateParam, 'shield');
        }
        
        // NEW: Reset combo on shield hit (player still got hit!)
        gameStateParam.comboCount = 0;
        gameStateParam.comboTimer = 0;
        gameStateParam.consecutiveHits = 0;
        gameStateParam.bulletsHit = 0;
        
        // Do NOT remove enemy - only set invulnerability
        gameStateParam.postDamageInvulnerability = 60;
        player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
        
        if (!wasLastShield) {
            soundManager.hit();
        }
        
        return false;
    }
    
    // HP damage to player only
    const playerDied = takeDamage(damageAmount);
    
    // Show damage number
    createDamageNumber(
        player.x + player.width/2, 
        player.y - 10, 
        damageAmount, 
        damageAmount >= gameStateParam.maxHP * 0.25 // Critical if 25%+ of max HP
    );
    
    createBloodParticles(player.x + player.width/2, player.y + player.height/2);
    
    gameStateParam.postDamageInvulnerability = 120;
    player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
    
    // Reset combo on HP damage (this was already here)
    gameStateParam.bulletsHit = 0;
    gameStateParam.comboCount = 0;
    gameStateParam.comboTimer = 0;
    gameStateParam.consecutiveHits = 0;
    
    soundManager.hit();
    
    return playerDied;
}


function handleDamage(gameStateParam, damageSource, obstacleIndex = -1, damageCategory = 'enemy') {
    
    // Calculate damage amount
    let damageAmount = 0;
    
    if (damageSource === 'corruption' || damageSource === 'Blood Curse') {
        damageAmount = Math.max(10, Math.floor(gameStateParam.maxHP * 0.1)); // 10% of max HP
    } else if (typeof damageSource === 'string') {
        // Enemy damage based on type and level
        damageAmount = calculateEnemyDamage(damageSource, gameStateParam.level);
    } else {
        // Fallback damage
        damageAmount = Math.max(15, Math.floor(gameStateParam.maxHP * 0.15));
    }
    
    // Shield check first
    if (gameStateParam.shieldCharges > 0) {
        const wasLastShield = gameStateParam.shieldCharges === 1;
        gameStateParam.shieldCharges--;
        
        if (gameStateParam.shieldCharges <= 0) {
            gameStateParam.hasShield = false;
            gameStateParam.shieldCharges = 0;
            createScorePopup(player.x + player.width/2, player.y, 'Shield Broken!');
            triggerDamageEffects(gameStateParam, 'shield');
        } else {
            createScorePopup(player.x + player.width/2, player.y, 
                `Shield: ${gameStateParam.shieldCharges} left`);
            triggerDamageEffects(gameStateParam, 'shield');
        }
        
        // NEW: Reset combo on shield hit (player still got hit!)
        gameStateParam.comboCount = 0;
        gameStateParam.comboTimer = 0;
        gameStateParam.consecutiveHits = 0;
        gameStateParam.bulletsHit = 0;
        
        // Remove obstacle
        if (obstacleIndex >= 0 && obstacles[obstacleIndex]) {
            obstacles.splice(obstacleIndex, 1);
        }
        gameStateParam.postDamageInvulnerability = 60;
        player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
        
        if (!wasLastShield) {
            soundManager.hit();
        }
        
        return false;
    }
    
    // HP damage
    const playerDied = takeDamage(damageAmount);
    
    // Show damage number
    createDamageNumber(
        player.x + player.width/2, 
        player.y - 10, 
        damageAmount, 
        damageAmount >= gameStateParam.maxHP * 0.25 // Critical if 25%+ of max HP
    );
    
    createBloodParticles(player.x + player.width/2, player.y + player.height/2);
    
    gameStateParam.postDamageInvulnerability = 120;
    player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
    
    // Reset combo on HP damage (this was already here)
    gameStateParam.bulletsHit = 0;
    gameStateParam.comboCount = 0;
    gameStateParam.comboTimer = 0;
    gameStateParam.consecutiveHits = 0;
    
    if (obstacleIndex >= 0 && obstacles[obstacleIndex]) {
        obstacles.splice(obstacleIndex, 1);
    }
    
    soundManager.hit();
    
    return playerDied;
}
export function checkCollisions(gameStateParam) {
    if (isPlayerInvulnerable(gameStateParam)) {
        return false;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Check if obstacle is stationary environmental object
        const isStationary = obstacle.type === 'boltBox' || obstacle.type === 'rock' || 
                            obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable' ||
                            obstacle.type === 'sarcophagus';
        
        // Tesla Coil collision (special case - active zapping)
        if (obstacle.type === 'teslaCoil') {
            if (obstacle.state === 'zapping' && obstacle.zapActive) {
                // Tesla hangs from ceiling at y=0, height is 60*2 = 120
                // The visual beam starts at bottom of extended coil
                const extendedHeight = obstacle.height * 2; // Matches drawing code
                const actualY = 0; // Tesla starts at ceiling
                
                // Match the exact beam position from drawTeslaCoil
                const beamX = obstacle.x + obstacle.width/2 - 10; // Matches beamX in drawing
                const beamY = actualY + extendedHeight; // Bottom of the extended coil
                const beamWidth = 20; // Matches visual beam width
                const beamHeight = CANVAS.height - beamY; // To the bottom of screen
                
                // Check if player overlaps with the zap beam
                if (player.x < beamX + beamWidth &&
                    player.x + player.width > beamX &&
                    player.y < beamY + beamHeight &&
                    player.y + player.height > beamY) {
                    
                    // Player is in the zap beam - take damage
                    return handlePlayerDamage(gameStateParam, 'teslaCoil');
                }
            }
            continue;
        }
        
        // Frankenstein Table collision (special case - active zapping)
        if (obstacle.type === 'frankensteinTable') {
            if (obstacle.state === 'zapping' && obstacle.zapActive) {
                const zapX = obstacle.x + obstacle.width/2 - 12;
                const zapY = 0;
                const zapWidth = 24;
                const zapHeight = obstacle.y;
                
                // FIXED: Actually check if player is in the zap beam area
                if (player.x < zapX + zapWidth &&
                    player.x + player.width > zapX &&
                    player.y < zapY + zapHeight &&
                    player.y + player.height > zapY) {
                    
                    // Player is in the zap beam - take damage
                    return handlePlayerDamage(gameStateParam, 'frankensteinTable');
                }
            }
            continue;
        }
        
        // Normal collision detection
        const hitbox = getObstacleHitbox(obstacle);
        
        if (player.x < hitbox.x + hitbox.width &&
            player.x + player.width > hitbox.x &&
            player.y < hitbox.y + hitbox.height &&
            player.y + player.height > hitbox.y) {
            
        if (obstacle.type === 'boltBox') {
    // NEW: Respect bullet capacity
    const bulletsToAdd = 20;
    const oldBullets = gameState.bullets;
    gameState.bullets = Math.min(gameState.maxBullets, gameState.bullets + bulletsToAdd);
    const actualBulletsAdded = gameState.bullets - oldBullets;
    
    if (actualBulletsAdded > 0) {
        createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, `+${actualBulletsAdded} Bolts`);
    } else {
        // At max capacity - give score bonus instead
        const bonusScore = 200 * gameState.scoreMultiplier;
        gameState.score += bonusScore;
        createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, `+${bonusScore} (Full Ammo)`);
    }
    
    obstacles.splice(i, 1);
    continue;
}
            
            if (obstacle.type === 'rock' || obstacle.type === 'sarcophagus') {
                // Decorative elements - no collision, player walks through
                continue;
            }
            
            if (isStationary) {
                // Other environmental obstacles block movement, no damage
                if (player.velocityX > 0) {
                    player.x = hitbox.x - player.width;
                } else if (player.velocityX < 0) {
                    player.x = hitbox.x + hitbox.width;
                }
                player.velocityX = 0;
                // NO DAMAGE - just blocking
                continue;
            }
            
            // All non-stationary obstacles (enemies) cause damage to player only
            // Do NOT remove or damage the enemy - only damage the player
            return handlePlayerDamage(gameStateParam, obstacle.type);
        }
    }
    
    return false;
}

export function isPlayerInvulnerable(gameStateParam) {
    return player.damageResistance > 0 || 
           gameStateParam.postBuffInvulnerability > 0 || 
           gameStateParam.postDamageInvulnerability > 0 || 
           gameStateParam.isGhostWalking;
}

// ========================================
// MAIN UPDATE FUNCTION
// ========================================

export function updateAllEntities(gameStateParam) {
    updateObstacles(gameStateParam.gameSpeed, gameStateParam.enemySlowFactor, gameStateParam.level, gameStateParam.magnetRange, gameStateParam);
    updateBullets(gameStateParam);
    updateBatProjectiles(gameStateParam);
}


function updateProfessorAI(obstacle, level, gameStateParam) {
    // Initialize professor AI properties if not exists
    if (obstacle.attackCooldown === undefined) {
        obstacle.attackCooldown = 0; // Start ready to attack
        obstacle.isAttacking = false;
        obstacle.facingDirection = -1;
        obstacle.detectionRange = 400;
        obstacle.attackRange = 350;
        obstacle.moveSpeed = 1.0;
        obstacle.hasDetectedPlayer = false;
    }
    
    // Floating movement (slight hover effect)
    obstacle.y += Math.sin(Date.now() * 0.003 + obstacle.animationTime) * 0.5 * gameState.deltaTime;
    
    const playerDistance = Math.abs(player.x - obstacle.x);
    const playerVerticalDistance = Math.abs(player.y - obstacle.y);
    const playerInDetectionRange = playerDistance < obstacle.detectionRange;
    const playerInAttackRange = playerDistance < obstacle.attackRange && playerVerticalDistance < 200;
    
    // Face the player when detected
    if (playerInDetectionRange) {
        obstacle.facingDirection = player.x < obstacle.x ? -1 : 1;
        obstacle.hasDetectedPlayer = true;
    }
    
    // Movement behavior: Run until player detected, then stop and attack
    if (!obstacle.hasDetectedPlayer) {
        // Keep running until player is detected
        obstacle.x -= obstacle.moveSpeed * gameState.deltaTime;
    } else if (playerInDetectionRange && playerDistance > obstacle.attackRange) {
        // Move closer to attack range
        const direction = player.x > obstacle.x ? 1 : -1;
        obstacle.x += (obstacle.moveSpeed * 0.25) * direction * gameState.deltaTime;
    }
    // If in attack range, stop moving and just attack
    
    // FIXED: Attack logic with better debugging
    obstacle.attackCooldown -= gameState.deltaTime;
    

    
    if (obstacle.attackCooldown <= 0 && 
        playerInAttackRange && 
        !obstacle.isAttacking && 
        obstacle.hasDetectedPlayer &&
        !gameStateParam.isGhostWalking) { // Don't attack ghost walking player
        
        
        // Start attack
        obstacle.isAttacking = true;
        
        // Predict player movement for better aim
        const predictedX = player.x + (player.velocityX * 15);
        const predictedY = player.y + (player.velocityY * 8);
        const targetX = predictedX + player.width/2;
        const targetY = Math.max(predictedY + player.height/2, CANVAS.groundY - 50);
        
        // FIXED: Ensure createMagicalProjectile function exists
        if (typeof createMagicalProjectile === 'function') {
            createMagicalProjectile(
                obstacle.x + obstacle.width/2,
                obstacle.y + obstacle.height/2,
                targetX,
                targetY,
                1 // Fixed power level
            );
        } else {
        }
        
        // Reset attack state
        obstacle.isAttacking = false;
        obstacle.attackCooldown = 120; // 2 seconds at 60fps
        
    }
}






// Add magical projectile creation function:
function createMagicalProjectile(startX, startY, targetX, targetY, power) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 5 + (power * 0.5);
    const velocityX = (dx / distance) * speed;
    const velocityY = (dy / distance) * speed;
    
    // FIXED: Start attack 60px higher
    const adjustedStartY = startY - 60;
    
    batProjectiles.push({
        x: startX,
        y: adjustedStartY, // Use adjusted Y position
        velocityX: velocityX,
        velocityY: velocityY,
        life: 300,
        maxLife: 300,
        size: 14 + power,
        magical: true,
        power: power,
        glowIntensity: 1.0,
        trailParticles: [],
        hasHitGround: false,
        type: 'magical'
    });
    
}

function updateMunstaAI(obstacle, level, gameStateParam) {
    // Initialize munsta AI properties if not exists
    if (obstacle.attackCooldown === undefined) {
        obstacle.attackCooldown = 0;
        obstacle.isAttacking = false;
        obstacle.facingDirection = -1;
        obstacle.detectionRange = 450;
        obstacle.attackRange = 400;
        obstacle.moveSpeed = 0.8;
        obstacle.hasDetectedPlayer = false;
        obstacle.chargingLaser = false;
        obstacle.chargeTime = 0;
        obstacle.maxChargeTime = 90;
        obstacle.laserDuration = 60;
        obstacle.laserActive = false;
        obstacle.laserTimer = 0;
    }
    
    // Floating movement (slight hover effect)
    obstacle.y += Math.sin(Date.now() * 0.003 + obstacle.animationTime) * 0.5 * gameState.deltaTime;
    
    const playerDistance = Math.abs(player.x - obstacle.x);
    const playerVerticalDistance = Math.abs(player.y - obstacle.y);
    const playerInDetectionRange = playerDistance < obstacle.detectionRange;
    const playerInAttackRange = playerDistance < obstacle.attackRange && playerVerticalDistance < 200;
    
    // Correct facing direction
    if (playerInDetectionRange) {
        // If player is to the LEFT of munsta, face LEFT (-1)
        // If player is to the RIGHT of munsta, face RIGHT (1)
        obstacle.facingDirection = player.x < obstacle.x ? -1 : 1;
        obstacle.hasDetectedPlayer = true;
    }
    
    // Movement behavior
    if (!obstacle.hasDetectedPlayer) {
        // Keep running left until player is detected
        obstacle.x -= obstacle.moveSpeed * gameState.deltaTime;
    } else if (playerInDetectionRange && playerDistance > obstacle.attackRange) {
        // Move closer to attack range
        const direction = player.x > obstacle.x ? 1 : -1;
        obstacle.x += (obstacle.moveSpeed * 0.25) * direction * gameState.deltaTime;
    }
    
    // Attack cooldown management
    obstacle.attackCooldown -= gameState.deltaTime;
    
    // Laser charging logic
    if (obstacle.chargingLaser) {
        obstacle.chargeTime += gameState.deltaTime;
        
        if (obstacle.chargeTime >= obstacle.maxChargeTime) {
            // Fire laser beam
            obstacle.chargingLaser = false;
            obstacle.laserActive = true;
            obstacle.laserTimer = obstacle.laserDuration;
            obstacle.chargeTime = 0;
        }
    }
    
    // REMOVED: Collision detection (now handled in gameState.js)
    // Just manage the laser timer
    if (obstacle.laserActive) {
        obstacle.laserTimer -= gameState.deltaTime;
        
        if (obstacle.laserTimer <= 0) {
            obstacle.laserActive = false;
            obstacle.attackCooldown = 180; // 3 seconds cooldown
        }
    }
    
    // Start attack sequence
    if (obstacle.attackCooldown <= 0 && 
        playerInAttackRange && 
        !obstacle.isAttacking && 
        !obstacle.chargingLaser &&
        !obstacle.laserActive &&
        obstacle.hasDetectedPlayer &&
        !gameStateParam.isGhostWalking) {
        
        // Start charging the laser
        obstacle.chargingLaser = true;
        obstacle.chargeTime = 0;
        
        // Update facing direction one more time before firing
        obstacle.facingDirection = player.x < obstacle.x ? -1 : 1;
    }
}