// entities.js - Enhanced with Roguelike Combat System

import { GAME_CONSTANTS, SPAWN_CHANCES, ENEMY_CONFIG, MIN_SPAWN_DISTANCE, CANVAS } from './core/constants.js';
import { camera, getScreenX } from './core/camera.js';
import { player } from './core/player.js';
import { gameState } from './core/gameState.js';
import { soundManager, rollForDrop, collectDrop, calculateDamage, rollCritical, applyLifesteal, damagePlayer, activeWeaponDrops } from './systems.js';
import { createDamageNumber } from './ui-enhancements.js';
import { triggerDamageEffects } from './enhanced-damage-system.js';
import { cleanupSkeletonEntity } from './rendering/sprite-system.js';

// Entity Arrays
export const obstacles = [];
export const bulletsFired = [];
export const explosions = [];
export const environmentElements = [];
export const bloodParticles = [];
export const lightningEffects = [];
export const scorePopups = [];
export const doubleJumpParticles = [];
export const dropParticles = [];
export const drops = [];
export const batProjectiles = [];

// Spawn tracking
export const recentSpawnPositions = [];
export let obstacleTimer = 0;
export let lastSpawnPosition = 0;
export let bulletBoxesFound = 0;

export function resetBulletBoxesFound() {
    bulletBoxesFound = 0;
}

export function clearArrays() {
    obstacles.length = 0;
    bulletsFired.length = 0;
    explosions.length = 0;
    bloodParticles.length = 0;
    lightningEffects.length = 0;
    scorePopups.length = 0;
    doubleJumpParticles.length = 0;
    drops.length = 0;
    dropParticles.length = 0;
    batProjectiles.length = 0;
}

// Utility Functions
export function createBloodParticles(x, y) {
    for (let i = 0; i < 8; i++) {
        bloodParticles.push({
            x: x + Math.random() * 20 - 10,
            y: y + Math.random() * 20 - 10,
            velocityX: (Math.random() - 0.5) * 6,
            velocityY: (Math.random() - 0.5) * 6 - 2,
            life: 30,
            maxLife: 30
        });
    }
}

export function createScorePopup(x, y, points) {
    scorePopups.push({
        x: x,
        y: y,
        points: points,
        life: 60,
        maxLife: 60
    });
}

export function createLightningEffect(x, y) {
    lightningEffects.push({
        x: x,
        y: y,
        life: 15,
        maxLife: 15,
        branches: Math.floor(Math.random() * 3) + 2
    });
}

export function createDoubleJumpParticles(x, y) {
    const particleCount = 8;
    
    for (let i = 0; i < particleCount; i++) {
        doubleJumpParticles.push({
            x: x + 20 + Math.random() * 20 - 10,
            y: y + 20 + Math.random() * 20 - 10,
            velocityX: (Math.random() - 0.5) * 6,
            velocityY: (Math.random() - 0.5) * 6,
            life: 30,
            maxLife: 30,
            size: 1 + Math.random() * 2
        });
    }
}

export function getObstacleHitbox(obstacle) {
    const reduction = 0.2;
    const widthReduction = obstacle.width * reduction;
    const heightReduction = obstacle.height * reduction;
    
    return {
        x: obstacle.x + widthReduction / 2,
        y: obstacle.y + heightReduction / 2,
        width: obstacle.width - widthReduction,
        height: obstacle.height - heightReduction
    };
}

// Enhanced Enemy Scaling for Roguelike
function getEnemyScaledStats(enemyType, level) {
    const baseConfig = ENEMY_CONFIG[enemyType];
    if (!baseConfig) return { health: 50, damage: 10 };
    
    const healthMultiplier = Math.pow(1.5, level - 1); // 1.5x HP per level
    const damageMultiplier = Math.pow(1.3, level - 1); // 1.3x damage per level
    
    return {
        health: Math.floor(baseConfig.baseHealth * healthMultiplier),
        maxHealth: Math.floor(baseConfig.baseHealth * healthMultiplier),
        damage: Math.floor(baseConfig.baseDamage * damageMultiplier)
    };
}

// Spawn Functions
function isSpawnPositionValid(x, width) {
    for (const spawn of recentSpawnPositions) {
        if (x < spawn.x + spawn.width + MIN_SPAWN_DISTANCE && 
            x + width + MIN_SPAWN_DISTANCE > spawn.x) {
            return false;
        }
    }
    return true;
}

function calculateSpawnTimer(baseTimer, minTimer, level) {
    const maxReductionPercent = 0.65;
    const maxReduction = baseTimer * maxReductionPercent;
    
    const reductionProgress = 1 - Math.exp(-level * 0.25);
    const totalReduction = maxReduction * reductionProgress;
    
    const finalTimer = Math.floor(baseTimer - totalReduction);
    
    const effectiveMinTimer = Math.max(minTimer, Math.floor(baseTimer * 0.25));
    return Math.max(finalTimer, effectiveMinTimer);
}

function createObstacle(type, x, y, width, height) {
    const scaledStats = getEnemyScaledStats(type, gameState.level);
    
    const obstacle = {
        x: x,
        y: y,
        width: width,
        height: height,
        type: type,
        passed: false,
        health: scaledStats.health,
        maxHealth: scaledStats.maxHealth,
        damage: scaledStats.damage,
        animationTime: Math.random() * 1000,
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        lastDamageTime: 0,
        damageFlashTimer: 0
    };
    
    // Add type-specific properties
    if (type === 'skeleton') {
        obstacle.velocityX = 0;
        obstacle.lastAnimation = 'idle';
        obstacle.isDead = false;
        obstacle.isAttacking = false;
        obstacle.damageResistance = 0;
        obstacle.deathTimer = 0;
    }
    
    if (type === 'alphaWolf') {
        const jumpFrequency = Math.max(60 - (gameState.level * 5), 20);
        obstacle.verticalMovement = 0;
        obstacle.jumpTimer = jumpFrequency;
        obstacle.originalY = y;
    }
    
    return obstacle;
}

// Enhanced Bat Projectile System
function createBatProjectile(startX, startY, targetX, targetY) {
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const speed = 4;
    const velocityX = (dx / distance) * speed;
    const velocityY = (dy / distance) * speed;
    
    // Scale projectile damage by level
    const baseDamage = 15;
    const projectileDamage = Math.floor(baseDamage * Math.pow(1.3, gameState.level - 1));
    
    batProjectiles.push({
        x: startX,
        y: startY,
        velocityX: velocityX,
        velocityY: velocityY,
        life: 300,
        maxLife: 300,
        size: 8,
        damage: projectileDamage,
        corrupt: true,
        glowIntensity: 1.0,
        trailParticles: [],
        hasHitGround: false
    });
}

export function updateBatProjectiles(gameStateParam) {
    for (let i = batProjectiles.length - 1; i >= 0; i--) {
        const projectile = batProjectiles[i];
        
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
            
            // Enhanced corruption damage system
            const corruptionDamage = Math.floor(projectile.damage * 0.5); // Corruption does 50% damage
            const playerDied = damagePlayer(corruptionDamage, 'corruption');
            
            if (playerDied) {
                window.gameOver();
                return;
            }
            
            gameStateParam.isCorrupted = true;
            gameStateParam.corruptionTimer = 180;
            gameStateParam.postDamageInvulnerability = 30;
            
            createBloodParticles(player.x + player.width/2, player.y + player.height/2);
            createScorePopup(player.x + player.width/2, player.y - 20, `CORRUPTED! -${corruptionDamage} HP`);
            
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
            continue;
        }
        
        // Ground collision
        if (projectile.y + projectile.size >= CANVAS.groundY && !projectile.hasHitGround) {
            projectile.hasHitGround = true;
            projectile.velocityY = -projectile.velocityY * 0.3;
            projectile.velocityX *= 0.7;
            projectile.life = Math.min(projectile.life, 60);
            
            for (let p = 0; p < 6; p++) {
                createBloodParticles(
                    projectile.x + (Math.random() - 0.5) * 16,
                    CANVAS.groundY - 5
                );
            }
        }
        
        if (projectile.life <= 0 || 
            projectile.x < camera.x - 100 || 
            projectile.x > camera.x + CANVAS.width + 100 || 
            projectile.y > CANVAS.groundY + 50) {
            batProjectiles.splice(i, 1);
        }
    }
}

// Enhanced Obstacle Spawning
export function spawnObstacle(level, gameSpeed, timeSlowFactor) {
    obstacleTimer -= gameState.deltaTime * timeSlowFactor;
    
    if (obstacleTimer <= 0) {
        const obstacleType = Math.random();
        let spawnX = camera.x + CANVAS.width;
        let attemptCount = 0;
        const maxAttempts = 5;
        
        let obstacleWidth, obstacleHeight, obstacleTypeStr, obstacleY;
        let timerValue;
        
        const bossChance = SPAWN_CHANCES.getBossChance(level);
        const flyingChance = SPAWN_CHANCES.getFlyingChance(level, bossChance);
        const mediumChance = SPAWN_CHANCES.getMediumChance(level, flyingChance);
        const humanChance = SPAWN_CHANCES.getHumanChance(level, mediumChance);
        
        const remainingChance = 1.0 - humanChance;
        const staticObstacleChance = remainingChance * 0.8;
        
        const skeletonChance = humanChance + staticObstacleChance * 0.40;
        const teslaChance = humanChance + staticObstacleChance * 0.60;
        const frankensteinChance = humanChance + staticObstacleChance * 0.75;
        const rockChance = humanChance + staticObstacleChance * 1.0;
        
        // Determine obstacle properties with enhanced spawning
        if (obstacleType < 0.15 && bulletBoxesFound < 4) {
            obstacleTypeStr = 'boltBox';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < bossChance) {
            obstacleTypeStr = 'alphaWolf';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 30;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < flyingChance) {
            obstacleTypeStr = 'bat';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = 150 + Math.random() * 100;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < mediumChance) {
            obstacleTypeStr = 'spider';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - 20;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < mediumChance + 0.05) {
            obstacleTypeStr = 'wolf';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - 30;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < humanChance) {
            obstacleTypeStr = 'vampire';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - 35;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < skeletonChance) {
            obstacleTypeStr = 'skeleton';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 60;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < teslaChance) {
            obstacleTypeStr = 'teslaCoil';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = 0;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < frankensteinChance) {
            obstacleTypeStr = 'frankensteinTable';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 150;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < rockChance) {
            obstacleTypeStr = 'rock';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - 20;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < rockChance + 0.05) {
            obstacleTypeStr = 'sarcophagus';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 10;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else {
            obstacleTypeStr = 'rock';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - 20;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        }
        
        // Try to find valid spawn position
        while (attemptCount < maxAttempts && !isSpawnPositionValid(spawnX, obstacleWidth)) {
            spawnX += MIN_SPAWN_DISTANCE + Math.random() * 40;
            attemptCount++;
        }
        
        if (attemptCount >= maxAttempts) {
            obstacleTimer = 300;
            return;
        }
        
        // Create obstacle with enhanced stats
        const newObstacle = createObstacle(obstacleTypeStr, spawnX, obstacleY, obstacleWidth, obstacleHeight);
        
        // Add special properties
        if (obstacleTypeStr === 'alphaWolf') {
            const jumpFrequency = Math.max(60 - (level * 5), 20);
            newObstacle.verticalMovement = 0;
            newObstacle.jumpTimer = jumpFrequency;
            newObstacle.originalY = obstacleY;
        }
        
        if (obstacleTypeStr === 'boltBox') {
            bulletBoxesFound++;
        }
        
        if (obstacleTypeStr === 'teslaCoil') {
            newObstacle.chargeTime = 120;
            newObstacle.zapDuration = 80;
            newObstacle.cooldown = 120;
            newObstacle.state = 'charging';
            newObstacle.stateTimer = newObstacle.chargeTime;
            newObstacle.zapActive = false;
            newObstacle.isPermanent = true;
            newObstacle.isIndestructible = true;
            // Scale tesla damage
            newObstacle.damage = Math.floor(25 * Math.pow(1.3, level - 1));
        }
        
        if (obstacleTypeStr === 'frankensteinTable') {
            newObstacle.chargeTime = 120;
            newObstacle.zapDuration = 80;
            newObstacle.cooldown = 180;
            newObstacle.state = 'charging';
            newObstacle.stateTimer = newObstacle.chargeTime;
            newObstacle.zapActive = false;
            newObstacle.isPermanent = true;
            newObstacle.isIndestructible = true;
            // Scale frankenstein damage
            newObstacle.damage = Math.floor(30 * Math.pow(1.3, level - 1));
        }
        
        obstacles.push(newObstacle);
        
        recentSpawnPositions.push({ x: spawnX, width: obstacleWidth });
        recentSpawnPositions.splice(0, recentSpawnPositions.length - 10);
        
        obstacleTimer = Math.floor(timerValue / timeSlowFactor);
    }
    
    // Check visible enemies and adjust timer
    const visibleEnemies = obstacles.filter(o => {
        const screenX = getScreenX(o.x);
        return screenX > -100 && screenX < CANVAS.width + 200;
    }).length;
    
    if (visibleEnemies < 2) {
        obstacleTimer = Math.min(obstacleTimer, 30);
    }
    
    if (visibleEnemies === 0 && obstacleTimer > 5) {
        obstacleTimer = 5;
    }
}

// Enhanced Shooting System with Weapon Support
export function shoot(gameStateParam) {
    if (!gameStateParam.gameRunning || (gameStateParam.bullets <= 0 && !gameStateParam.isBerserker)) return;
    
    // MAJOR PERFORMANCE FIX: Simple time-based cooldown
    const now = Date.now();
    if (!gameState.lastShotTime) gameState.lastShotTime = 0;
    
    // Calculate fire rate (simpler calculation)
    const attackSpeedBonus = gameState.stats?.attackSpeed || 0;
    const baseFireRate = 100; // milliseconds between shots
    const actualFireRate = Math.max(50, baseFireRate / (1 + attackSpeedBonus * 0.5));
    
    // Too soon to shoot again?
    if (now - gameState.lastShotTime < actualFireRate) return;
    gameState.lastShotTime = now;
    
    // SIMPLIFIED WEAPON DETECTION (avoid repeated object lookups)
    const weapons = activeWeaponDrops || {};
    const buffs = gameStateParam.activeBuffs || {};
    
    const hasMultiShot = buffs.chainLightning > 0;
    const hasShotgun = weapons.shotgunBlast > 0;
    const hasPiercing = weapons.piercingShots > 0 || gameStateParam.hasPiercingBullets;
    
    // Determine bullet count
    let bulletCount = 1;
    if (hasShotgun) bulletCount = 5;
    else if (hasMultiShot && (gameStateParam.bullets >= 3 || gameStateParam.isBerserker)) bulletCount = 3;
    
    // CREATE BULLETS (simplified)
    const startX = player.x + (player.facingDirection === 1 ? player.width + 24 : -24);
    const startY = player.y + player.height / 2;
    const baseSpeed = GAME_CONSTANTS.BULLET_SPEED * player.facingDirection;
    
    for (let i = 0; i < bulletCount; i++) {
        const offsetY = bulletCount > 1 ? (i - Math.floor(bulletCount/2)) * 8 : 0;
        const offsetAngle = hasShotgun ? (i - 2) * 0.2 : 0;
        
        // SIMPLIFIED BULLET OBJECT (only essential properties)
        const bullet = {
            x: startX,
            y: startY + offsetY,
            speed: baseSpeed,
            velocityX: baseSpeed * Math.cos(offsetAngle),
            velocityY: baseSpeed * Math.sin(offsetAngle),
            enhanced: bulletCount > 1,
            direction: player.facingDirection,
            piercing: hasPiercing,
            age: 0,
            tailX: startX,
            currentLength: 30,
            hit: false,
            hitTime: 0
        };
        
        // Only add advanced properties if needed (performance)
        if (weapons.ricochetShots > 0) {
            bullet.ricochet = true;
            bullet.ricochets = 0;
            bullet.maxRicochets = 3;
        }
        
        if (weapons.explosiveRounds > 0) bullet.explosive = true;
        if (weapons.homingMissiles > 0) bullet.homing = true;
        if (weapons.chainLightning2 > 0) bullet.chainLightning = true;
        
        bulletsFired.push(bullet);
    }
    
    // Update ammo
    if (!gameStateParam.isBerserker) {
        gameStateParam.bullets -= Math.min(bulletCount, gameStateParam.bullets);
    }
    
    soundManager.shoot();
}

function initializeObstacleProperties(obstacle) {
    if (obstacle.type === 'teslaCoil') {
        if (!obstacle.state) {
            obstacle.state = 'charging';
            obstacle.stateTimer = obstacle.chargeTime || 120;
            obstacle.zapActive = false;
            console.log('Tesla coil initialized');
        }
    }
    
    if (obstacle.type === 'frankensteinTable') {
        if (!obstacle.state) {
            obstacle.state = 'charging';
            obstacle.stateTimer = obstacle.chargeTime || 120;
            obstacle.zapActive = false;
            console.log('Frankenstein table initialized');
        }
    }
    
    if (obstacle.type === 'bat') {
        if (obstacle.spitTimer === undefined) {
            obstacle.spitTimer = 180 + Math.random() * 120;
            obstacle.isSpitting = false;
            obstacle.spitChargeTime = 0;
            obstacle.hasTargeted = false;
            obstacle.facingPlayer = 1;
            console.log('Bat AI initialized');
        }
    }
}


// Enhanced Bullet Update System
export function updateBullets(gameStateParam) {
    // PERFORMANCE: Early exit if no bullets
    if (bulletsFired.length === 0) return;
    
    let anyBulletHit = false;
    
    for (let i = bulletsFired.length - 1; i >= 0; i--) {
        const bullet = bulletsFired[i];
        
        bullet.age++;
        
        if (!bullet.hit) {
            // SIMPLIFIED HOMING (only if needed)
            if (bullet.homing && bullet.homingTarget && !bullet.homingTarget.isDead) {
                const target = bullet.homingTarget;
                const dx = (target.x + target.width/2) - bullet.x;
                const dy = (target.y + target.height/2) - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    const homingStrength = 0.1;
                    bullet.velocityX += (dx / distance) * homingStrength;
                    bullet.velocityY += (dy / distance) * homingStrength;
                    
                    // Normalize speed
                    const currentSpeed = Math.sqrt(bullet.velocityX * bullet.velocityX + bullet.velocityY * bullet.velocityY);
                    const targetSpeed = Math.abs(bullet.speed);
                    bullet.velocityX = (bullet.velocityX / currentSpeed) * targetSpeed;
                    bullet.velocityY = (bullet.velocityY / currentSpeed) * targetSpeed;
                }
            }
            
            // Move bullet
            bullet.x += (bullet.velocityX || bullet.speed) * gameState.deltaTime;
            bullet.y += (bullet.velocityY || 0) * gameState.deltaTime;
            
            // SIMPLIFIED stretch effect
            if (bullet.age < 10) {
                bullet.currentLength = 30 + (30 * (bullet.age / 10));
            }
            
            const tailDelay = bullet.currentLength / Math.abs(bullet.speed);
            if (bullet.age > tailDelay) {
                bullet.tailX += (bullet.velocityX || bullet.speed) * gameState.deltaTime;
            }
        } else {
            // Contract on hit
            bullet.hitTime++;
            if (bullet.hitTime < 8) {
                bullet.tailX += (bullet.velocityX || bullet.speed) * 3 * gameState.deltaTime;
                bullet.currentLength = Math.max(4, bullet.currentLength - 10);
            } else {
                bulletsFired.splice(i, 1);
                continue;
            }
        }
        
        let bulletHitSomething = false;
        
        // PERFORMANCE: Simple collision detection (only check obstacles on screen)
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            
            // Safety check
            if (!obstacle || !obstacle.type) continue;
            
            // Skip certain types
            if (obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable' || 
                obstacle.type === 'boltBox' || (obstacle.type === 'skeleton' && obstacle.isDead)) {
                continue;
            }
            
            // SIMPLE AABB collision (faster than complex shapes)
            if (bullet.x < obstacle.x + obstacle.width &&
                bullet.x + 8 > obstacle.x &&
                bullet.y < obstacle.y + obstacle.height &&
                bullet.y + 4 > obstacle.y) {
                
                // Calculate damage
                const isCritical = rollCritical();
                const baseDamage = gameState.baseDamage;
                const finalDamage = calculateDamage(baseDamage, isCritical);
                
                // Apply damage
                obstacle.health -= finalDamage;
                obstacle.lastDamageTime = Date.now();
                obstacle.damageFlashTimer = 15;
                
                // Create damage number (only occasionally to save performance)
                if (Math.random() < 0.7) { // Only 70% of the time
                    createDamageNumber(
                        obstacle.x + obstacle.width/2, 
                        obstacle.y,
                        finalDamage,
                        isCritical,
                        isCritical ? '#FFD700' : '#FF6B6B'
                    );
                }
                
                // Sound effects (limit frequency)
                if (Math.random() < 0.3) { // Only 30% of the time
                    if (isCritical) {
                        soundManager.criticalHit();
                    } else {
                        soundManager.hit();
                    }
                }
                
                // Apply lifesteal
                applyLifesteal(finalDamage, obstacle.health);
                
                // Mark bullet as hit
                if (!bullet.piercing) {
                    bullet.hit = true;
                    bullet.hitTime = 0;
                }
                
                // Handle enemy death
                if (obstacle.health <= 0) {
                    handleEnemyDeath(obstacle, j, gameStateParam);
                } else {
                    // Enemy still alive
                    if (obstacle.type === 'skeleton') {
                        obstacle.damageResistance = 30;
                    }
                }
                
                // Advanced weapon effects (only if needed)
                if (bullet.explosive) {
                    createExplosion(bullet.x, bullet.y, 60, finalDamage * 0.7);
                }
                
                if (bullet.chainLightning) {
                    createChainLightning(obstacle, finalDamage * 0.8, 7);
                }
                
                createLightningEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                
                gameStateParam.consecutiveHits++;
                bulletHitSomething = true;
                anyBulletHit = true;
                
                if (!bullet.piercing) {
                    bulletsFired.splice(i, 1);
                    break;
                }
            }
        }
        
        // Clean up off-screen bullets
        if (bullet && (bullet.x > camera.x + CANVAS.width + 100 || bullet.x < camera.x - 100 || 
            bullet.y < -100 || bullet.y > CANVAS.height + 100)) {
            if (!bulletHitSomething) {
                gameStateParam.consecutiveHits = 0;
            }
            bulletsFired.splice(i, 1);
        }
    }
}
// Enhanced Enemy Death Handler
function handleEnemyDeath(obstacle, index, gameStateParam) {
    // Safety check
    if (!obstacle || index < 0 || index >= obstacles.length) return;
    
    if (obstacle.type === 'skeleton') {
        obstacle.isDead = true;
        obstacle.deathTimer = 0;
    } else {
        // Safely remove obstacle
        if (obstacles[index]) {
            obstacles.splice(index, 1);
        }
    }
    
    const config = ENEMY_CONFIG[obstacle.type];
    const basePoints = config?.points || 10;
    const levelBonus = (gameStateParam.level - 1) * 5;
    const points = (basePoints + levelBonus) * gameStateParam.scoreMultiplier;
    
    gameStateParam.score += points;
    createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, points);

    const isCritical = gameStateParam.comboCount >= 20;
    const currentTime = Date.now();
    if (currentTime - gameStateParam.lastScoreTime < 30000) {
        gameStateParam.scoreIn30Seconds += points;
    } else {
        gameStateParam.scoreIn30Seconds = points;
        gameStateParam.lastScoreTime = currentTime;
    }
    
    rollForDrop(obstacle.type, obstacle.x + obstacle.width/2, obstacle.y);
    
    if (obstacle.type === 'alphaWolf') {
        gameStateParam.bossesKilled++;
    }
    
    gameStateParam.enemiesDefeated++;
    gameStateParam.bulletsHit++;
    gameStateParam.levelProgress += 3;
    
    gameStateParam.comboCount++;
    if (gameStateParam.comboCount >= 2) {
        gameStateParam.comboTimer = 300;
    }
    
    // Enhanced life gain system for HP-based gameplay
    const bulletsNeeded = gameStateParam.activeBuffs.undeadResilience > 0 ? 10 : 15;
    if (gameStateParam.bulletsHit >= bulletsNeeded) {
        const healAmount = Math.floor(gameStateParam.maxHealth * 0.25); // Heal 25% max health
        gameStateParam.currentHealth = Math.min(gameStateParam.currentHealth + healAmount, gameStateParam.maxHealth);
        createScorePopup(player.x + player.width/2, player.y, `+${healAmount} HP!`);
        gameStateParam.bulletsHit = 0;
    }
}

// New Weapon Effect Functions
function createExplosion(x, y, radius, damage) {
    explosions.push({
        x: x,
        y: y,
        radius: radius,
        maxRadius: radius,
        frame: 0,
        maxFrame: 20,
        damage: damage
    });
    
    // Damage nearby enemies
    obstacles.forEach(obstacle => {
        const dx = (obstacle.x + obstacle.width/2) - x;
        const dy = (obstacle.y + obstacle.height/2) - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < radius && obstacle.health > 0) {
            const explosionDamage = Math.floor(damage * (1 - distance / radius));
            obstacle.health -= explosionDamage;
            
            createDamageNumber(
                obstacle.x + obstacle.width/2,
                obstacle.y,
                explosionDamage,
                false,
                '#FF8800'
            );
            
            if (obstacle.health <= 0) {
                handleEnemyDeath(obstacle, obstacles.indexOf(obstacle), gameState);
            }
        }
    });
}

function createChainLightning(startEnemy, damage, maxChains) {
    // Safety check
    if (!startEnemy || !startEnemy.type) return;
    
    const chainedEnemies = new Set([startEnemy]);
    let currentDamage = damage;
    let currentEnemy = startEnemy;
    
    for (let i = 0; i < maxChains; i++) {
        let nextEnemy = null;
        let closestDistance = 150; // Chain range
        
        obstacles.forEach(obstacle => {
            if (!obstacle || !obstacle.type) return; // Safety check
            if (!chainedEnemies.has(obstacle) && obstacle.health > 0) {
                const dx = (obstacle.x + obstacle.width/2) - (currentEnemy.x + currentEnemy.width/2);
                const dy = (obstacle.y + obstacle.height/2) - (currentEnemy.y + currentEnemy.height/2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    nextEnemy = obstacle;
                }
            }
        });
        
        if (!nextEnemy) break;
        
        // Create lightning effect
        createLightningEffect(
            (currentEnemy.x + currentEnemy.width/2 + nextEnemy.x + nextEnemy.width/2) / 2,
            (currentEnemy.y + currentEnemy.height/2 + nextEnemy.y + nextEnemy.height/2) / 2
        );
        
        // Apply damage
        nextEnemy.health -= Math.floor(currentDamage);
        createDamageNumber(
            nextEnemy.x + nextEnemy.width/2,
            nextEnemy.y,
            Math.floor(currentDamage),
            false,
            '#00FFFF'
        );
        
        if (nextEnemy.health <= 0) {
            const enemyIndex = obstacles.indexOf(nextEnemy);
            if (enemyIndex >= 0) {
                handleEnemyDeath(nextEnemy, enemyIndex, gameState);
            }
        }
        
        chainedEnemies.add(nextEnemy);
        currentEnemy = nextEnemy;
        currentDamage *= 0.8; // Reduce damage with each chain
    }
}

function createRicochetBullet(originalBullet, hitEnemy) {
    // Safety checks
    if (!originalBullet || !hitEnemy) return;
    
    // Find nearest enemy for ricochet
    let targetEnemy = null;
    let closestDistance = 200;
    
    obstacles.forEach(obstacle => {
        if (!obstacle || !obstacle.type) return; // Safety check
        if (obstacle !== hitEnemy && obstacle.health > 0 && obstacle.type !== 'boltBox' && obstacle.type !== 'rock') {
            const dx = (obstacle.x + obstacle.width/2) - originalBullet.x;
            const dy = (obstacle.y + obstacle.height/2) - originalBullet.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                targetEnemy = obstacle;
            }
        }
    });
    
    if (targetEnemy) {
        const dx = (targetEnemy.x + targetEnemy.width/2) - originalBullet.x;
        const dy = (targetEnemy.y + targetEnemy.height/2) - originalBullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const newBullet = {
            ...originalBullet,
            velocityX: (dx / distance) * Math.abs(originalBullet.speed),
            velocityY: (dy / distance) * Math.abs(originalBullet.speed),
            age: 0,
            hit: false,
            ricochets: originalBullet.ricochets + 1
        };
        
        bulletsFired.push(newBullet);
        createLightningEffect(originalBullet.x, originalBullet.y);
    }
}

// Enhanced Collision System for HP-based Combat
export function checkCollisions(gameStateParam) {
    if (isPlayerInvulnerable(gameStateParam)) {
        return false;
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Safety check: ensure obstacle exists and has required properties
        if (!obstacle || !obstacle.type) continue;
        
        // Tesla Coil damage
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
                    
                    return handlePlayerDamage(gameStateParam, obstacle.damage || 25, 'Tesla Coil');
                }
            }
            continue;
        }
        
        // Frankenstein Table damage
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
                    
                    return handlePlayerDamage(gameStateParam, obstacle.damage || 30, 'Frankenstein Table');
                }
            }
            continue;
        }
        
        // Regular enemy collision
        const hitbox = getObstacleHitbox(obstacle);
        
        if (player.x < hitbox.x + hitbox.width &&
            player.x + player.width > hitbox.x &&
            player.y < hitbox.y + hitbox.height &&
            player.y + player.height > hitbox.y) {
            
            if (obstacle.type === 'boltBox') {
                gameStateParam.bullets += 20;
                createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, '+20 Bolts');
                obstacles.splice(i, 1);
                continue;
            }
            
            if (obstacle.type === 'rock' || obstacle.type === 'sarcophagus') {
                continue;
            }
            
            return handlePlayerDamage(gameStateParam, obstacle.damage || 15, obstacle.type, i);
        }
    }
    
    return false;
}

// Enhanced Player Damage Handler
function handlePlayerDamage(gameStateParam, damageAmount, damageSource, obstacleIndex = -1) {
    console.log(`🎯 Player taking ${damageAmount} damage from ${damageSource}`);
    
    // Shield protection
    if (gameStateParam.shieldCharges > 0) {
        const wasLastShield = gameStateParam.shieldCharges === 1;
        gameStateParam.shieldCharges--;
        
        if (gameStateParam.shieldCharges <= 0) {
            gameStateParam.hasShield = false;
            gameStateParam.shieldCharges = 0;
            createScorePopup(player.x + player.width/2, player.y, 'Shield Broken!');
        } else {
            createScorePopup(player.x + player.width/2, player.y, 
                `Shield: ${gameStateParam.shieldCharges} left`);
        }
        
        triggerDamageEffects(gameStateParam, 'shield');
        
        if (obstacleIndex >= 0 && obstacles[obstacleIndex]) {
            obstacles.splice(obstacleIndex, 1);
        }
        gameStateParam.postDamageInvulnerability = 60;
        player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
        
        soundManager.hit();
        return false;
    }
    
    // Apply damage to HP
    const finalDamage = Math.max(1, damageAmount);
    const playerDied = damagePlayer(finalDamage, damageSource);
    
    if (playerDied) {
        return true; // Game Over
    }
    
    // Enhanced damage effects
    triggerDamageEffects(gameStateParam, 'health');
    
    // Set invulnerability and reset stats
    gameStateParam.postDamageInvulnerability = 120;
    player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
    
    gameStateParam.bulletsHit = 0;
    gameStateParam.comboCount = 0;
    gameStateParam.comboTimer = 0;
    gameStateParam.consecutiveHits = 0;
    
    // Remove obstacle
    if (obstacleIndex >= 0 && obstacles[obstacleIndex]) {
        obstacles.splice(obstacleIndex, 1);
    }
    
    soundManager.hit();
    return false; // Continue playing
}

export function isPlayerInvulnerable(gameStateParam) {
    return player.damageResistance > 0 || 
           gameStateParam.postBuffInvulnerability > 0 || 
           gameStateParam.postDamageInvulnerability > 0 || 
           gameStateParam.isGhostWalking;
}

// Keep all existing update functions but enhance them for the new system
export function updateObstacles(gameSpeed, enemySlowFactor, level, magnetRange, gameStateParam) {
    const speed = gameSpeed * enemySlowFactor * 0.7;
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Initialize properties if needed
        initializeObstacleProperties(obstacle);
        
        // Update damage flash timer
        if (obstacle.damageFlashTimer > 0) {
            obstacle.damageFlashTimer -= gameState.deltaTime;
        }
        
        // TESLA COIL LOGIC - FIXED
        if (obstacle.type === 'teslaCoil') {
            obstacle.stateTimer -= gameState.deltaTime;
            
            switch (obstacle.state) {
                case 'charging':
                    if (obstacle.stateTimer <= 0) {
                        obstacle.state = 'zapping';
                        obstacle.stateTimer = obstacle.zapDuration || 80;
                        obstacle.zapActive = true;
                        console.log('⚡ Tesla coil ZAPPING!');
                    }
                    break;
                    
                case 'zapping':
                    if (obstacle.stateTimer <= 0) {
                        obstacle.state = 'cooldown';
                        obstacle.stateTimer = obstacle.cooldown || 120;
                        obstacle.zapActive = false;
                        console.log('❄️ Tesla coil cooling down');
                    }
                    break;
                    
                case 'cooldown':
                    if (obstacle.stateTimer <= 0) {
                        obstacle.state = 'charging';
                        obstacle.stateTimer = obstacle.chargeTime || 120;
                        console.log('🔋 Tesla coil charging');
                    }
                    break;
            }
            continue; // Tesla coils don't move
        }
        
        // FRANKENSTEIN TABLE LOGIC - FIXED
        if (obstacle.type === 'frankensteinTable') {
            obstacle.stateTimer -= gameState.deltaTime;
            
            switch (obstacle.state) {
                case 'charging':
                    if (obstacle.stateTimer <= 0) {
                        obstacle.state = 'zapping';
                        obstacle.stateTimer = obstacle.zapDuration || 80;
                        obstacle.zapActive = true;
                        console.log('⚡ Frankenstein table ZAPPING!');
                    }
                    break;
                    
                case 'zapping':
                    if (obstacle.stateTimer <= 0) {
                        obstacle.state = 'cooldown';
                        obstacle.stateTimer = obstacle.cooldown || 180;
                        obstacle.zapActive = false;
                        console.log('❄️ Frankenstein table cooling down');
                    }
                    break;
                    
                case 'cooldown':
                    if (obstacle.stateTimer <= 0) {
                        obstacle.state = 'charging';
                        obstacle.stateTimer = obstacle.chargeTime || 120;
                        console.log('🔋 Frankenstein table charging');
                    }
                    break;
            }
            continue; // Frankenstein tables don't move
        }
        
        // BAT AI LOGIC - FIXED
        if (obstacle.type === 'bat') {
            obstacle.spitTimer -= gameState.deltaTime;
            
            // Determine facing direction
            const playerCenterX = player.x + player.width/2;
            const batCenterX = obstacle.x + obstacle.width/2;
            obstacle.facingPlayer = playerCenterX > batCenterX ? 1 : -1;
            
            // Start spitting sequence
            if (obstacle.spitTimer <= 0 && !obstacle.isSpitting) {
                obstacle.isSpitting = true;
                obstacle.spitChargeTime = 60; // 1 second charge time
                obstacle.hasTargeted = true;
                console.log('🦇 Bat charging spit attack!');
            }
            
            // Handle spitting charge
            if (obstacle.isSpitting && obstacle.spitChargeTime > 0) {
                obstacle.spitChargeTime -= gameState.deltaTime;
                
                // Fire projectile when charge completes
                if (obstacle.spitChargeTime <= 0) {
                    const targetX = player.x + player.width/2;
                    const targetY = player.y + player.height/2;
                    
                    createBatProjectile(
                        obstacle.x + obstacle.width/2,
                        obstacle.y + obstacle.height/2,
                        targetX,
                        targetY
                    );
                    
                    // Reset bat state
                    obstacle.isSpitting = false;
                    obstacle.hasTargeted = false;
                    obstacle.spitTimer = 300 + Math.random() * 180; // 5-8 seconds until next attack
                    console.log('🩸 Bat fired blood projectile!');
                }
            }
            
            // Bat movement (hover around player)
            const dx = (player.x + player.width/2) - (obstacle.x + obstacle.width/2);
            const dy = (player.y + player.height/2) - (obstacle.y + obstacle.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 150) {
                // Move closer to player
                obstacle.x += Math.sign(dx) * speed * 0.5 * gameState.deltaTime;
                obstacle.y += Math.sign(dy) * speed * 0.3 * gameState.deltaTime;
            } else if (distance < 80) {
                // Move away from player
                obstacle.x -= Math.sign(dx) * speed * 0.3 * gameState.deltaTime;
                obstacle.y -= Math.sign(dy) * speed * 0.2 * gameState.deltaTime;
            }
            
            // Constrain bat to screen bounds
            obstacle.y = Math.max(50, Math.min(obstacle.y, CANVAS.groundY - obstacle.height - 50));
        }
        
        // Skeleton-specific logic for dead skeletons
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
        
        // Living skeleton logic
        if (obstacle.type === 'skeleton') {
            obstacle.velocityX = -speed;
            
            if (obstacle.damageResistance > 0) {
                obstacle.damageResistance -= gameState.deltaTime;
            }
            
            obstacle.y += Math.sin(Date.now() * 0.002 * enemySlowFactor + i) * 0.2 * gameState.deltaTime;
        }
        
        // Movement for non-stationary obstacles
        const isStationary = obstacle.type === 'boltBox' || obstacle.type === 'rock' || 
                            obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable' ||
                            obstacle.type === 'sarcophagus';
        
        if (!isStationary) {
            obstacle.x -= speed * gameState.deltaTime;
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

// Keep all other existing functions (updateExplosions, updateEffects, etc.)
export function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].frame += gameState.deltaTime;
        if (explosions[i].frame > 15) {
            explosions.splice(i, 1);
        }
    }
}

export function updateEffects(timeSlowFactor, gameStateParam) {
    if (gameStateParam.comboTimer > 0) {
        gameStateParam.comboTimer -= gameState.deltaTime;
        
        if (gameStateParam.comboTimer <= 0) {
            gameStateParam.comboTimer = 0;
            gameStateParam.comboCount = 0;
        }
    }
    
    // Update blood particles
    for (let i = bloodParticles.length - 1; i >= 0; i--) {
        const particle = bloodParticles[i];
        particle.x += particle.velocityX * gameState.deltaTime;
        particle.y += particle.velocityY * gameState.deltaTime;
        particle.velocityY += 0.2 * gameState.deltaTime;
        particle.life -= gameState.deltaTime;
        
        if (particle.life <= 0) {
            bloodParticles.splice(i, 1);
        }
    }

    // Update lightning effects
    for (let i = lightningEffects.length - 1; i >= 0; i--) {
        const effect = lightningEffects[i];
        effect.life -= gameState.deltaTime;
        
        if (effect.life <= 0) {
            lightningEffects.splice(i, 1);
        }
    }

    // Update score popups
    for (let i = scorePopups.length - 1; i >= 0; i--) {
        const popup = scorePopups[i];
        popup.y -= gameState.deltaTime;
        popup.life -= gameState.deltaTime;
        
        if (popup.life <= 0) {
            scorePopups.splice(i, 1);
        }
    }

    // Update double jump particles
    for (let i = doubleJumpParticles.length - 1; i >= 0; i--) {
        const particle = doubleJumpParticles[i];
        particle.x += particle.velocityX * gameState.deltaTime;
        particle.y += particle.velocityY * gameState.deltaTime;
        particle.velocityY += 0.1 * gameState.deltaTime;
        particle.life -= gameState.deltaTime;
        
        if (particle.life <= 0) {
            doubleJumpParticles.splice(i, 1);
        }
    }
    
    // Update drop particles
    for (let i = dropParticles.length - 1; i >= 0; i--) {
        const particle = dropParticles[i];
        particle.x += particle.velocityX * gameState.deltaTime;
        particle.y += particle.velocityY * gameState.deltaTime;
        particle.velocityX *= Math.pow(0.95, gameState.deltaTime);
        particle.velocityY *= Math.pow(0.95, gameState.deltaTime);
        particle.life -= gameState.deltaTime;
        
        if (particle.life <= 0) {
            dropParticles.splice(i, 1);
        }
    }
}

export function updateDrops(gameSpeed, magnetRange, gameStateParam) {
    for (let i = drops.length - 1; i >= 0; i--) {
        const drop = drops[i];
        
        drop.velocityY += 0.3 * gameState.deltaTime;
        drop.y += drop.velocityY * gameState.deltaTime;
        
        if (drop.y >= CANVAS.groundY - drop.height) {
            drop.y = CANVAS.groundY - drop.height;
            drop.velocityY = -drop.velocityY * 0.5;
        }
        
        drop.rotation += 0.05 * gameState.deltaTime;
        drop.glowIntensity = 0.5 + Math.sin(Date.now() * 0.001) * 0.3;
        
        if (magnetRange > 0) {
            const dx = (player.x + player.width/2) - (drop.x + drop.width/2);
            const dy = (player.y + player.height/2) - (drop.y + drop.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < magnetRange) {
                const force = (magnetRange - distance) / magnetRange * 0.5;
                drop.x += dx * force * 0.2;
                drop.y += dy * force * 0.2;
                
                if (drop.y > CANVAS.groundY - drop.height) {
                    drop.y = CANVAS.groundY - drop.height;
                }
            }
        }
        
        if (player.x < drop.x + drop.width &&
            player.x + player.width > drop.x &&
            player.y < drop.y + drop.height &&
            player.y + player.height > drop.y) {
            
            collectDrop(drop);
            drops.splice(i, 1);
            continue;
        }
        
        if (drop.x + drop.width < camera.x - 100) {
            drops.splice(i, 1);
        }
    }
}

export function updateAllEntities(gameStateParam) {
    updateObstacles(gameStateParam.gameSpeed, gameStateParam.enemySlowFactor, gameStateParam.level, gameStateParam.magnetRange, gameStateParam);
    updateBullets(gameStateParam);
    updateExplosions();
    updateEnvironmentElements(gameStateParam.gameSpeed, gameStateParam.timeSlowFactor);
    updateDrops(gameStateParam.gameSpeed, gameStateParam.magnetRange, gameStateParam);
    updateEffects(gameStateParam.timeSlowFactor, gameStateParam);
    updateBatProjectiles(gameStateParam);
}

// Environment functions
export function initEnvironmentElements() {
    environmentElements.length = 0;
}

export function updateEnvironmentElements(gameSpeed, timeSlowFactor) {
    // Currently empty as torches are rendered with the ground
}