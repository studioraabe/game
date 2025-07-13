// entities-core.js - Core Entity Management and Basic Systems

import { GAME_CONSTANTS, SPAWN_CHANCES, ENEMY_CONFIG, MIN_SPAWN_DISTANCE, CANVAS, calculateEnemyHP } from './core/constants.js';
import { camera, getScreenX } from './core/camera.js';
import { player } from './core/player.js';
import { gameState } from './core/gameState.js';
import { soundManager, rollForDrop, collectDrop } from './systems.js';
import { createDamageNumber } from './ui-enhancements.js';
import { triggerDamageEffects } from './enhanced-damage-system.js';
import { cleanupSkeletonEntity } from './rendering/sprite-system.js';

// ========================================
// ENTITY ARRAYS - EXPORTED FOR SHARED ACCESS
// ========================================

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

// ========================================
// SPAWN TRACKING
// ========================================

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
    const reduction = 0.1;
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
// SPAWN SYSTEM
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
    const obstacle = {
        x: x,
        y: y,
        width: width,
        height: height,
        type: type,
        passed: false,
        health: 1,        
        maxHealth: 1,     
        animationTime: Math.random() * 1000,
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    // FIXED: Comprehensive health assignment for ALL enemy types including professor
    const enemyTypes = ['skeleton', 'bat', 'vampire', 'spider', 'wolf', 'alphaWolf', 'professor'];
    
    if (enemyTypes.includes(type)) {
        obstacle.maxHealth = calculateEnemyHP(type, gameState.level);
        obstacle.health = obstacle.maxHealth;
        
        
        // EXTRA DEBUG FOR PROFESSOR
        if (type === 'professor') {
        }
    } else {
        // Non-enemy objects (boltBox, rock, etc.) keep health = 1
        obstacle.health = 1;
        obstacle.maxHealth = 1;
    }
    
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
		obstacle.lastHealth = obstacle.health; // ADD THIS LINE
    }
    
    // ADDED: Professor-specific initialization
    if (type === 'professor') {
        obstacle.attackCooldown = 0;
        obstacle.isAttacking = false;
        obstacle.facingDirection = -1;
        obstacle.detectionRange = 400;
        obstacle.attackRange = 350;
        obstacle.moveSpeed = 0.5;
        obstacle.hasDetectedPlayer = false;
    }
    
    return obstacle;
}

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
        if (obstacleType < 0.15 && bulletBoxesFound < 3) {
            obstacleTypeStr = 'boltBox';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight - 20;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < bossChance) {
            obstacleTypeStr = 'alphaWolf';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < flyingChance) {
            obstacleTypeStr = 'bat';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = 120 + Math.random() * 110;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < mediumChance) {
            obstacleTypeStr = 'spider';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 10;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
		} else if (obstacleType < mediumChance + 0.03) {
				obstacleTypeStr = 'wolf';
				const config = ENEMY_CONFIG[obstacleTypeStr];
				obstacleWidth = config.width;
				obstacleHeight = config.height;
				obstacleY = CANVAS.groundY - obstacleHeight - 20;
				timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
			} else if (obstacleType < mediumChance + 0.08) {
				// FIXED: Professor spawn - lowered by 40px
				obstacleTypeStr = 'professor';
				const config = ENEMY_CONFIG[obstacleTypeStr];
				obstacleWidth = config.width;
				obstacleHeight = config.height;
				obstacleY = CANVAS.groundY - obstacleHeight +5; // Changed from -30 to -70
				timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
			} else if (obstacleType < humanChance) {
				obstacleTypeStr = 'vampire';
				const config = ENEMY_CONFIG[obstacleTypeStr];
				obstacleWidth = config.width;
				obstacleHeight = config.height;
				obstacleY = CANVAS.groundY - obstacleHeight - 30;
				timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
			}				
				else if (obstacleType < skeletonChance) {
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
            obstacleY = CANVAS.groundY - obstacleHeight;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < frankensteinChance) {
            obstacleTypeStr = 'frankensteinTable';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 160;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < rockChance) {
            obstacleTypeStr = 'rock';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight + 2;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else if (obstacleType < rockChance + 0.05) {
            obstacleTypeStr = 'sarcophagus';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight - 3;
            timerValue = calculateSpawnTimer(config.timerBase, config.timerMin, level);
        } else {
            obstacleTypeStr = 'rock';
            const config = ENEMY_CONFIG[obstacleTypeStr];
            obstacleWidth = config.width;
            obstacleHeight = config.height;
            obstacleY = CANVAS.groundY - obstacleHeight;
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
// BASIC UPDATE FUNCTIONS
// ========================================

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

// Environment functions
export function initEnvironmentElements() {
    environmentElements.length = 0;
}

export function updateEnvironmentElements(gameSpeed, timeSlowFactor) {
    // Currently empty as torches are rendered with the ground
}