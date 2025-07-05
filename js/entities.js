// entities.js - VOLLSTÄNDIG KORRIGIERTE VERSION OHNE SYNTAX FEHLER

import { GAME_CONSTANTS, SPAWN_CHANCES, ENEMY_CONFIG, MIN_SPAWN_DISTANCE, CANVAS } from './core/constants.js';
import { camera, getScreenX } from './core/camera.js';
import { player } from './core/player.js';
import { gameState } from './core/gameState.js';
import { soundManager, rollForDrop, collectDrop } from './systems.js';
import { createDamageNumber } from './ui-enhancements.js';
import { triggerDamageEffects } from './enhanced-damage-system.js';


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

// ========================================
// UTILITY FUNCTIONS
// ========================================

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

// ========================================
// SPAWN FUNCTIONS
// ========================================

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
    return {
        x: x,
        y: y,
        width: width,
        height: height,
        type: type,
        passed: false,
        health: 1,
        maxHealth: 1,
        animationTime: Math.random() * 1000
    };
}

// ========================================
// BAT PROJEKTILE SYSTEM
// ========================================

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
    gameStateParam.postDamageInvulnerability = 30;
    
    createBloodParticles(player.x + player.width/2, player.y + player.height/2);
    createScorePopup(player.x + player.width/2, player.y - 20, 'BLOOD CURSED!');
    
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

// ========================================
// OBSTACLE SPAWNING
// ========================================

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
        
        // Determine obstacle properties
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
            obstacleY = CANVAS.groundY - obstacleHeight + 20;
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
        
        // Create obstacle
        const newObstacle = createObstacle(obstacleTypeStr, spawnX, obstacleY, obstacleWidth, obstacleHeight);
        
        // Add special properties
        const config = ENEMY_CONFIG[obstacleTypeStr];
        if (config.health > 1) {
            newObstacle.health = config.health;
            newObstacle.maxHealth = config.health;
        }
        
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

// ========================================
// UPDATE FUNCTIONS
// ========================================

export function updateObstacles(gameSpeed, enemySlowFactor, level, magnetRange, gameStateParam) {
    const speed = gameSpeed * enemySlowFactor * 0.7;
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        const isStationary = obstacle.type === 'boltBox' || obstacle.type === 'rock' || 
                            obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable' ||
                            obstacle.type === 'sarcophagus';
        
        if (!isStationary || ((obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable') && !obstacle.isPermanent)) {
            obstacle.x -= speed * gameState.deltaTime;
        }
        
        // Tesla Coil State Machine
        if (obstacle.type === 'teslaCoil') {
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
        
        // Frankenstein Table State Machine
        if (obstacle.type === 'frankensteinTable') {
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
        
        // ALPHA WOLF FURY ATTACK - KORRIGIERTER CODE
        if (obstacle.type === 'alphaWolf' && obstacle.jumpTimer !== undefined) {
            // NEUE: Fury Attack Initialisierung
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
                obstacle.lastHealth = obstacle.health; // NEUE: Track health changes
            }
            
            // VERBESSERTER FURY TRIGGER - AB ERSTEM TREFFER!
            const healthLost = obstacle.lastHealth - obstacle.health;
            if (healthLost > 0 && !obstacle.furyTriggered && obstacle.furyAttackCooldown <= 0) {
                obstacle.isFuryCharging = true;
                obstacle.furyChargeTime = 90; // 1.5 Sekunden bei 60 FPS
                obstacle.furyTriggered = true;
                
                // Update lastHealth für nächsten Fury (alle 2-3 Treffer)
                obstacle.lastHealth = obstacle.health;
                
                // Stoppe normale Bewegung
                obstacle.verticalMovement = 0;
                obstacle.y = obstacle.originalY;
                
                // Ziel-Vorhersage
                const predictedX = player.x + (player.velocityX * 30);
                const predictedY = player.y + (player.velocityY * 15);
                obstacle.targetX = predictedX + player.width/2;
                obstacle.targetY = Math.max(predictedY + player.height/2, CANVAS.groundY - 25);
                
                // SOFORT zum Spieler drehen
                const directionToPlayer = obstacle.targetX > (obstacle.x + obstacle.width/2) ? 1 : -1;
                obstacle.facingDirection = directionToPlayer;
                
                console.log(`🐺 Alpha Wolf FURY triggered! Health: ${obstacle.health}/${obstacle.maxHealth}`);
            }
            
            // FURY CHARGING PHASE
            if (obstacle.isFuryCharging && obstacle.furyChargeTime > 0) {
                obstacle.furyChargeTime -= gameState.deltaTime;
                
                // KONTINUIERLICH zum Spieler schauen während Charging
                const currentDirectionToPlayer = (player.x + player.width/2) > (obstacle.x + obstacle.width/2) ? 1 : -1;
                obstacle.facingDirection = currentDirectionToPlayer;
                
                // Stoppe alle normale Bewegung während Charging
                obstacle.jumpTimer = 60; // Reset jump timer
                
                if (obstacle.furyChargeTime <= 0) {
                    // FURY LEAP STARTEN
                    obstacle.isFuryCharging = false;
                    obstacle.isLeaping = true;
                    
                    // Berechne Sprung-Vektor zum Ziel
                    const dx = obstacle.targetX - (obstacle.x + obstacle.width/2);
                    const dy = obstacle.targetY - (obstacle.y + obstacle.height/2);
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const leapSpeed = 8; // Sehr schnell
                    obstacle.leapVelocityX = (dx / distance) * leapSpeed;
                    obstacle.leapVelocityY = (dy / distance) * leapSpeed;
                    
                    // KÜRZERER Fury Cooldown für häufigere Angriffe
                    obstacle.furyAttackCooldown = 180; // 3 Sekunden statt 5
                    
                    console.log(`🐺 Alpha Wolf LEAPING! Target: ${obstacle.targetX}, ${obstacle.targetY}`);
                }
            }
            
            // FURY LEAP BEWEGUNG
            if (obstacle.isLeaping) {
                obstacle.x += obstacle.leapVelocityX * gameState.deltaTime;
                obstacle.y += obstacle.leapVelocityY * gameState.deltaTime;
                
                // Richtung während Sprung beibehalten
                obstacle.facingDirection = obstacle.leapVelocityX > 0 ? 1 : -1;
                
                // Sprung-Distanz begrenzen
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
                    
                    // Reset für nächsten Sprung
                    delete obstacle.leapStartX;
                    delete obstacle.leapStartY;
                    delete obstacle.leapTimer;
                    delete obstacle.maxLeapDistance;
                    
                    // Landungsschaden-Check mit Shield-Support
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
                        // SHIELD CHECK ZUERST
                        if (gameStateParam.shieldCharges > 0) {
                            gameStateParam.shieldCharges--;
                            if (gameStateParam.shieldCharges <= 0) {
                                gameStateParam.hasShield = false;
                                gameStateParam.shieldCharges = 0;
                            }
                            createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, 
                                gameStateParam.shieldCharges > 0 ? `Shield: ${gameStateParam.shieldCharges} left` : 'Shield Broken by Fury!');
                            gameStateParam.postDamageInvulnerability = 60; // 1 Sekunde
                        } else {
                            // Normaler Landungsschaden
                            gameStateParam.lives--;
                            gameStateParam.damageThisLevel++;
                            createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, 'FURY STRIKE!');
                            gameStateParam.postDamageInvulnerability = 120; // 2 Sekunden
                        }
                        
                        player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
                        gameStateParam.bulletsHit = 0;
                        gameStateParam.comboCount = 0;
                        gameStateParam.comboTimer = 0;
                        gameStateParam.consecutiveHits = 0;
                        soundManager.hit();
                    }
                    
                    // Landungs-Effekte
                    createBloodParticles(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height);
                    createLightningEffect(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                    
                    // NEUE: Reset furyTriggered für nächsten Fury
                    obstacle.furyTriggered = false;
                    
                    console.log(`🐺 Alpha Wolf landed! Ready for next fury in ${obstacle.furyAttackCooldown} frames`);
                }
            }
            
            // Normale Sprung-Logik nur wenn nicht in Fury Mode
            if (!obstacle.isFuryCharging && !obstacle.isLeaping) {
                obstacle.jumpTimer -= enemySlowFactor * gameState.deltaTime;
                obstacle.furyAttackCooldown -= gameState.deltaTime;
                
                if (obstacle.verticalMovement !== undefined && 
                    (obstacle.verticalMovement !== 0 || obstacle.y < obstacle.originalY)) {
                    
                    obstacle.y += obstacle.verticalMovement * enemySlowFactor * gameState.deltaTime;
                    obstacle.verticalMovement += 0.5 * enemySlowFactor * gameState.deltaTime;
                    
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
        
        // BAT SPEZIELLE LOGIK - OMNIDIREKTIONAL
        if (obstacle.type === 'bat') {
            obstacle.y += Math.sin(Date.now() * 0.01 * enemySlowFactor + i) * 1.5 * gameStateParam.deltaTime;
            
            if (obstacle.spitCooldown === undefined) {
                obstacle.spitCooldown = Math.random() * 30 + 30; // 0.5-1 Sekunde
                obstacle.isSpitting = false;
                obstacle.spitChargeTime = 0;
                obstacle.hasTargeted = false;
                obstacle.targetX = 0;
                obstacle.targetY = 0;
                obstacle.firstAttack = true;
            }
            
            obstacle.spitCooldown -= gameStateParam.deltaTime;
            
            // OMNIDIREKTIONALE DETECTION - keine Richtungseinschränkung
            const horizontalDistance = Math.abs(player.x - obstacle.x);
            const verticalDistance = Math.abs(player.y - obstacle.y);
            const inRange = horizontalDistance < 350 && verticalDistance < 220;
            
            if (obstacle.spitCooldown <= 0 && inRange) {
                if (!obstacle.isSpitting) {
                    obstacle.isSpitting = true;
                    
                    if (obstacle.firstAttack) {
                        obstacle.spitChargeTime = 30; // 0.5 Sekunden für ersten Angriff
                        obstacle.firstAttack = false;
                    } else {
                        obstacle.spitChargeTime = 60; // 1 Sekunde für weitere Angriffe
                    }
                    
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
                        
                        // Richtung für Rendering
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
            
            // Bat folgt dem Spieler
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
        
        // Ground enemy movement
        if (obstacle.type === 'skeleton') {
            obstacle.y += Math.sin(Date.now() * 0.002 * enemySlowFactor + i) * 0.6 * gameState.deltaTime;
        }
        
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


export function shoot(gameStateParam) {
    if (!gameStateParam.gameRunning || (gameStateParam.bullets <= 0 && !gameStateParam.isBerserker)) return;
    
    const canUseMultiShot = gameStateParam.activeBuffs.chainLightning > 0 && (gameStateParam.bullets >= 3 || gameStateParam.isBerserker);
    const bulletCount = canUseMultiShot ? 3 : 1;
    const enhanced = canUseMultiShot;
    
    for (let i = 0; i < bulletCount; i++) {
        const offsetY = bulletCount > 1 ? (i - 1) * 8 : 0;
        const startX = player.facingDirection === 1 ? player.x + player.width : player.x;
        const bulletSpeed = GAME_CONSTANTS.BULLET_SPEED * player.facingDirection * GAME_CONSTANTS.BULLET_SPEED_MULTIPLIER;
        
        bulletsFired.push({
            x: startX,
            y: player.y + player.height / 1.00 + offsetY,
            speed: bulletSpeed,
            enhanced: enhanced,
            direction: player.facingDirection,
            piercing: gameStateParam.hasPiercingBullets
        });
    }
    
    if (!gameStateParam.isBerserker) {
        gameStateParam.bullets -= bulletCount;
    }
    soundManager.shoot();
}

export function updateBullets(gameStateParam) {
    for (let i = bulletsFired.length - 1; i >= 0; i--) {
        const bullet = bulletsFired[i];
        bullet.x += bullet.speed * gameState.deltaTime;
        
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            
            if (obstacle.type === 'teslaCoil' || obstacle.type === 'frankensteinTable') {
                continue;
            }
            
            if (obstacle.type === 'boltBox') {
                continue;
            }
            
            if (bullet.x < obstacle.x + obstacle.width &&
                bullet.x + 8 > obstacle.x &&
                bullet.y < obstacle.y + obstacle.height &&
                bullet.y + 4 > obstacle.y) {
                
                const damage = bullet.enhanced ? 1 : 1;
                obstacle.health -= damage;
                
                createLightningEffect(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
                
                gameStateParam.consecutiveHits++;
                
                if (obstacle.health <= 0) {
                    handleObstacleDestroyed(obstacle, j, gameStateParam);
                }
                
                if (!bullet.piercing || !gameStateParam.hasPiercingBullets) {
                    bulletsFired.splice(i, 1);
                    break;
                }
            }
        }
        
        if (bullet && (bullet.x > camera.x + CANVAS.width + 100 || bullet.x < camera.x - 100)) {
            bulletsFired.splice(i, 1);
        }
    }
}

function handleObstacleDestroyed(obstacle, index, gameStateParam) {
    const config = ENEMY_CONFIG[obstacle.type];
    const basePoints = config?.points || 10;
    const levelBonus = (gameStateParam.level - 1) * 5;
    const points = (basePoints + levelBonus) * gameStateParam.scoreMultiplier;
    
    gameStateParam.score += points;
    createScorePopup(obstacle.x + obstacle.width/2, obstacle.y, points);

    const isCritical = gameStateParam.comboCount >= 20;
    createDamageNumber(
    obstacle.x + obstacle.width/2, 
    obstacle.y + obstacle.height/2, 
    points, 
    isCritical
    );
    
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
        if (gameStateParam.lives < 5) {
            gameStateParam.lives++;
            if (gameStateParam.lives > gameStateParam.maxLives) gameStateParam.maxLives = gameStateParam.lives;
        } else {
            gameStateParam.score += 500 * gameStateParam.scoreMultiplier;
            createScorePopup(player.x + player.width/2, player.y, '+500 Bonus!');
        }
        gameStateParam.bulletsHit = 0;
    }
}

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

// ENTITIES.JS - COLLISION SYSTEM KORREKTUR

// ENTITIES.JS - KORRIGIERTE COLLISION SYSTEM

export function checkCollisions(gameStateParam) {
    // WICHTIG: Invulnerability check ZUERST für ALLE Collision-Types
    if (isPlayerInvulnerable(gameStateParam)) {
        // ❌ PROBLEM WAR HIER: Shield handling während Invulnerability
        // Das alte System hat sowohl Shield UND Leben abgezogen
        return false; // WICHTIG: Kein Schaden während Invulnerability
    }

    // ✅ KORREKTE SHIELD LOGIC - nur wenn NICHT invulnerable
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        
        // Tesla Coil - nur Schaden bei ZAP + Position Check
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
                    
                    return handleDamage(gameStateParam, 'Tesla Coil');
                }
            }
            continue;
        }
        
        // Frankenstein Table - nur Schaden bei ZAP + Position Check
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
                    
                    return handleDamage(gameStateParam, 'Frankenstein Table');
                }
            }
            continue;
        }
        
        // NORMALE GEGNER COLLISION
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
                continue; // Kein Schaden
            }
            
            // ✅ KORREKTE DAMAGE LOGIC mit Shield-Priorität
            return handleDamage(gameStateParam, obstacle.type, i);
        }
    }
    
    return false; // Kein Game Over
}

// ✅ NEUE ZENTRALE DAMAGE-HANDLING FUNKTION



function handleDamage(gameStateParam, damageSource, obstacleIndex = -1, damageCategory = 'enemy') {
    console.log(`🎯 Damage from ${damageSource} (${damageCategory})`);
    
    // 1. SHIELD CHECK FIRST
    if (gameStateParam.shieldCharges > 0) {
        const wasLastShield = gameStateParam.shieldCharges === 1;
        gameStateParam.shieldCharges--;
        
        if (gameStateParam.shieldCharges <= 0) {
            // Last shield broken
            gameStateParam.hasShield = false;
            gameStateParam.shieldCharges = 0;
            createScorePopup(player.x + player.width/2, player.y, 'Shield Broken!');
            
            // NEW: Enhanced shield break effects
            triggerDamageEffects(gameStateParam, 'shield');
            
        } else {
            // Shield absorbed damage
            createScorePopup(player.x + player.width/2, player.y, 
                `Shield: ${gameStateParam.shieldCharges} left`);
            
            // NEW: Shield hit effects
            triggerDamageEffects(gameStateParam, 'shield');
        }
        
        // Remove obstacle and set invulnerability
        if (obstacleIndex >= 0 && obstacles[obstacleIndex]) {
            obstacles.splice(obstacleIndex, 1);
        }
        gameStateParam.postDamageInvulnerability = 60;
        player.damageResistance = GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME;
        
        if (!wasLastShield) {
            soundManager.hit(); // Normal shield hit sound
        }
        
        return false; // No game over
    }
    
    // 2. NO SHIELD - HEALTH DAMAGE
    gameStateParam.lives--;
    gameStateParam.damageThisLevel++;
    createBloodParticles(player.x + player.width/2, player.y + player.height/2);
    
    // NEW: Enhanced health damage effects
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
    
    // Check for game over
    if (gameStateParam.lives <= 0) {
        return true; // Game Over
    }
    
    return false; // Continue playing
}












// ✅ KORRIGIERTE INVULNERABILITY CHECK
export function isPlayerInvulnerable(gameStateParam) {
    return player.damageResistance > 0 || 
           gameStateParam.postBuffInvulnerability > 0 || 
           gameStateParam.postDamageInvulnerability > 0 || 
           gameStateParam.isGhostWalking;
    // ❌ ENTFERNT: gameStateParam.hasShield - Shield ist KEIN Invulnerability!
}

// ✅ ZUSÄTZLICH: Shield Collection korrigieren in systems.js
// In der collectDrop Funktion für DropType.SHIELD:





// Environment functions
export function initEnvironmentElements() {
    environmentElements.length = 0;
}

export function updateEnvironmentElements(gameSpeed, timeSlowFactor) {
    // Currently empty as torches are rendered with the ground
}