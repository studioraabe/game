// entities-combat.js - Fixed healing system integration

import { GAME_CONSTANTS, CANVAS, ENEMY_BASE_STATS, calculateEnemyDamage } from './core/constants.js';
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
            
            // CORRUPTION EFFECT + DAMAGE
            gameStateParam.isCorrupted = true;
            gameStateParam.corruptionTimer = 180;
            gameStateParam.postDamageInvulnerability = 30;
            
            // Deal corruption damage
            const corruptionDamage = Math.max(8, Math.floor(gameStateParam.maxHP * 0.08));
            const playerDied = takeDamage(corruptionDamage);
            
            createDamageNumber(player.x + player.width/2, player.y - 10, corruptionDamage);
            createBloodParticles(player.x + player.width/2, player.y + player.height/2);
            createScorePopup(player.x + player.width/2, player.y, 'BLOOD CURSED!');
            
            // NEW: Corruption damage effects
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
         if (playerDied) {
                return true; // Signal game over
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
	 return false;
}

// ... keep all existing SHOOTING SYSTEM code ...

export function shoot(gameStateParam) {
    if (!gameStateParam.gameRunning || (gameStateParam.bullets <= 0 && !gameStateParam.isBerserker)) return;
    
    const canUseMultiShot = gameStateParam.activeBuffs.chainLightning > 0 && (gameStateParam.bullets >= 3 || gameStateParam.isBerserker);
    const bulletCount = canUseMultiShot ? 3 : 1;
    const enhanced = canUseMultiShot;
    
    for (let i = 0; i < bulletCount; i++) {
        const offsetY = bulletCount > 1 ? (i - 1) * 8 : 0;
        const baseX = player.facingDirection === 1 ? player.x + player.width : player.x;
        const startX = baseX + (24 * player.facingDirection);
        
        const bulletSpeed = GAME_CONSTANTS.BULLET_SPEED * player.facingDirection * GAME_CONSTANTS.BULLET_SPEED_MULTIPLIER;
        
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
}

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
                    
                    // FIXED: Enhanced damage calculation with proper scaling
                    const baseDamage = gameStateParam.baseDamage || calculatePlayerDamage(gameStateParam.level);
                    const damage = bullet.enhanced ? baseDamage * 3 : baseDamage;
                    
                    // FIXED: Ensure obstacle has proper health before damage
                    if (!obstacle.maxHealth || obstacle.maxHealth <= 0) {
                        const enemyTypes = ['skeleton', 'bat', 'vampire', 'spider', 'wolf', 'alphaWolf'];
                        if (enemyTypes.includes(obstacle.type)) {
                            obstacle.maxHealth = calculateEnemyHP(obstacle.type, gameStateParam.level);
                            obstacle.health = obstacle.maxHealth;
                        }
                    }
                    
                    obstacle.health -= damage;
                    
                    console.log(`💥 ${obstacle.type} hit for ${damage} damage. Health: ${obstacle.health}/${obstacle.maxHealth}`);
                    
                    if (obstacle.type === 'skeleton') {
                        obstacle.damageResistance = 30;
                        
                        if (obstacle.health <= 0) {
                            obstacle.isDead = true;
                            obstacle.deathTimer = 0;
                            handleEnemyDeath(obstacle, j, gameStateParam);
                        }
                    }
                    
                    createLightningEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                    
                    gameStateParam.consecutiveHits++;
                    bulletHitSomething = true;
                    anyBulletHit = true;
                    
                    if (obstacle.health <= 0 && obstacle.type !== 'skeleton') {
                        handleEnemyDeath(obstacle, j, gameStateParam);
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

function handleEnemyDeath(obstacle, index, gameStateParam) {
    const config = window.ENEMY_CONFIG?.[obstacle.type] || { points: 10 };
    const basePoints = config.points || 10;
    const levelBonus = (gameStateParam.level - 1) * 5;
    const points = (basePoints + levelBonus) * gameStateParam.scoreMultiplier;
    
    gameStateParam.score += points;
    createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, points);

    // FIXED: Enhanced drop rolling
    rollForDrop(obstacle.type, obstacle.x + obstacle.width/2, obstacle.y);
    
    if (obstacle.type === 'alphaWolf') {
        gameStateParam.bossesKilled++;
    }
    
    // FIXED: Proper cleanup before removal
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
    
    const bulletsNeeded = gameStateParam.activeBuffs.undeadResilience > 0 ? 10 : 15;
    if (gameStateParam.bulletsHit >= bulletsNeeded) {
        // ENHANCED: Use enhanced healing system with buff support
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

// ... keep all existing ENEMY UPDATE SYSTEMS code ...

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
        
        // SKELETON-SPECIFIC LOGIC
        if (obstacle.type === 'skeleton') {
            obstacle.velocityX = -speed;
            
            if (obstacle.damageResistance > 0) {
                obstacle.damageResistance -= gameState.deltaTime;
            }
            
            obstacle.y += Math.sin(Date.now() * 0.002 * enemySlowFactor + i) * 0.2 * gameState.deltaTime;
        }
        
        const isStationary = obstacle.type === 'boltBox' || obstacle.type === 'rock' || 
                            obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable' ||
                            obstacle.type === 'sarcophagus';
        
        if (!isStationary || ((obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable') && !obstacle.isPermanent)) {
            obstacle.x -= speed * gameState.deltaTime;
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
        
        // BAT AI SYSTEM
        if (obstacle.type === 'bat') {
            updateBatAI(obstacle, gameStateParam);
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
            const points = 10 * gameStateParam.scoreMultiplier;
            gameStateParam.score += points;
            gameStateParam.obstaclesAvoided++;
            gameStateParam.levelProgress += 2;
            
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
    if (healthLost > 0 && !obstacle.furyTriggered && obstacle.furyAttackCooldown <= 0) {
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
            
            const leapSpeed = 8;
            obstacle.leapVelocityX = (dx / distance) * leapSpeed;
            obstacle.leapVelocityY = (dy / distance) * leapSpeed;
            
            obstacle.furyAttackCooldown = 180;
        }
    }
    
    // FURY LEAP MOVEMENT
    if (obstacle.isLeaping) {
        obstacle.x += obstacle.leapVelocityX * gameState.deltaTime;
        obstacle.y += obstacle.leapVelocityY * gameState.deltaTime;
        
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
        
        if (obstacle.y >= obstacle.originalY || 
            distanceTraveled >= obstacle.maxLeapDistance || 
            obstacle.leapTimer <= 0) {
            
            obstacle.y = obstacle.originalY;
            obstacle.isLeaping = false;
            obstacle.leapVelocityX = 0;
            obstacle.leapVelocityY = 0;
            
            delete obstacle.leapStartX;
            delete obstacle.leapStartY;
            delete obstacle.leapTimer;
            delete obstacle.maxLeapDistance;
            
            // Landing damage check
            const landingRadius = 40;
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
            
            createBloodParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height);
            createLightningEffect(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
            
            obstacle.furyTriggered = false;
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

// NEW: Player-only damage function (enemies unaffected)
function handlePlayerDamage(gameStateParam, damageSource, damageCategory = 'enemy') {
    console.log(`🎯 Player takes damage from ${damageSource} (${damageCategory}) - enemy unaffected`);
    
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
    
    // Reset combo on damage
    gameStateParam.bulletsHit = 0;
    gameStateParam.comboCount = 0;
    gameStateParam.comboTimer = 0;
    gameStateParam.consecutiveHits = 0;
    
    // Do NOT remove the enemy - they should remain alive after collision
    // Enemies are only damaged/destroyed by bullets, not by player collision
    
    soundManager.hit();
    
    return playerDied;
}

// ORIGINAL: Bullet damage function (for bullets hitting enemies)
function handleDamage(gameStateParam, damageSource, obstacleIndex = -1, damageCategory = 'enemy') {
    console.log(`🎯 Damage from ${damageSource} (${damageCategory})`);
    
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
    
    // Reset combo on damage
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
                const zapX = obstacle.x + obstacle.width/2 - 8;
                const zapY = obstacle.y + obstacle.height;
                const zapWidth = 16;
                const zapHeight = CANVAS.groundY - zapY;
                
                if (player.x < zapX + zapWidth &&
                    player.x + player.width > zapX &&
                    player.y < zapY + zapHeight &&
                    player.y + player.height > zapY) {
                    
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
                const zapHeight = obstacle.y + obstacle.height - 55;
                
                if (player.x < zapX + zapWidth &&
                    player.x + player.width > zapX &&
                    player.y < zapY + zapHeight &&
                    player.y + player.height > zapY) {
                    
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
                // Bolt boxes give ammo
                gameStateParam.bullets += 20;
                createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, '+20 Bolts');
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