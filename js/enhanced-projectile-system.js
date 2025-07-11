// js/enhanced-projectile-system.js - Advanced Projectile Types with Blue Theme

import { GAME_CONSTANTS, CANVAS } from './core/constants.js';
import { camera, getScreenX } from './core/camera.js';
import { player } from './core/player.js';
import { gameState } from './core/gameState.js';
import { obstacles, createLightningEffect, createBloodParticles } from './entities.js';
import { soundManager } from './systems.js';

// ========================================
// PROJECTILE TYPES ENUM
// ========================================

const ProjectileType = {
    NORMAL: 'normal',
    LASER_BEAM: 'laserBeam',
    ENERGY_SHOTGUN: 'energyShotgun',
    CHAIN_LIGHTNING: 'chainLightning',
    SEEKING_BOLT: 'seekingBolt'
};

// ========================================
// PROJECTILE SYSTEM STATE
// ========================================

const projectileSystem = {
    availableTypes: [
        ProjectileType.NORMAL,
        ProjectileType.LASER_BEAM,
        ProjectileType.ENERGY_SHOTGUN,
        ProjectileType.CHAIN_LIGHTNING,
        ProjectileType.SEEKING_BOLT
    ],
    unlockedTypes: [ProjectileType.NORMAL], // Player starts with normal
    equippedTypes: [ProjectileType.NORMAL], // Max 3 equipped
    currentTypeIndex: 0,
    
    // Projectile arrays
    laserBeams: [],
    seekingBolts: [],
    chainLightning: [],
    
    // Cooldowns
    normalCooldown: 0,
    laserCooldown: 0,
    shotgunCooldown: 0,
    lightningCooldown: 0,
    seekingCooldown: 0
};

// ========================================
// PROJECTILE CONFIGS
// ========================================

const PROJECTILE_CONFIGS = {
    [ProjectileType.NORMAL]: {
        name: "⚡ Lightning Bolt",
        desc: "Standard energy projectile",
        cooldown: 1,
        cost: 1,
        damage: 1.0,
        speed: 16,
        penetration: false
    },
    
    [ProjectileType.LASER_BEAM]: {
        name: "🔵 Laser Beam",
        desc: "Instant piercing beam",
        cooldown: 120,
        cost: 10,
        damage: 1.5,
        speed: 0, // Instant
        penetration: true,
        range: 800
    },
    
    [ProjectileType.ENERGY_SHOTGUN]: {
        name: "💥 Energy Shotgun",
        desc: "Spreads 5 bolts in a cone",
        cooldown: 90,
        cost: 5,
        damage: 0.7,
        speed: 20,
        penetration: false,
        pellets: 5,
        spread: 0.2
    },
    
    [ProjectileType.CHAIN_LIGHTNING]: {
        name: "⚡ Chain Lightning",
        desc: "Jumps between 3 enemies",
        cooldown: 60,
        cost: 4,
        damage: 1.2,
        speed: 18,
        penetration: false,
        maxChains: 3,
        chainRange: 120
    },
    
    [ProjectileType.SEEKING_BOLT]: {
        name: "🎯 Seeking Bolt",
        desc: "Homes in on nearest enemy",
        cooldown: 25,
        cost: 2,
        damage: 0.9,
        speed: 20,
        penetration: false,
        seekRange: 600,
        turnRate: 0.35
    }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function getCooldownProperty(projectileType) {
    const cooldownMap = {
        [ProjectileType.NORMAL]: 'normalCooldown',
        [ProjectileType.LASER_BEAM]: 'laserCooldown',
        [ProjectileType.ENERGY_SHOTGUN]: 'shotgunCooldown',
        [ProjectileType.CHAIN_LIGHTNING]: 'lightningCooldown',
        [ProjectileType.SEEKING_BOLT]: 'seekingCooldown'
    };
    return cooldownMap[projectileType] || 'normalCooldown';
}

// ========================================
// PROJECTILE TYPE CYCLING
// ========================================

 function cycleProjectileType(direction = 1) {
    // Only cycle if player has more than 1 weapon type
    if (projectileSystem.equippedTypes.length <= 1) {
        // Show a message that only 1 weapon is available
        if (window.createScorePopup && window.player) {
            window.createScorePopup(
                window.player.x + window.player.width/2,
                window.player.y - 40,
                'Need More Weapons!'
            );
        }
        return;
    }
    
    projectileSystem.currentTypeIndex = (projectileSystem.currentTypeIndex + direction) % projectileSystem.equippedTypes.length;
    if (projectileSystem.currentTypeIndex < 0) {
        projectileSystem.currentTypeIndex = projectileSystem.equippedTypes.length - 1;
    }
    
    const currentType = getCurrentProjectileType();
    const config = PROJECTILE_CONFIGS[currentType];
    
    // Show weapon switch notification
    if (window.createScorePopup && window.player) {
        window.createScorePopup(
            window.player.x + window.player.width/2,
            window.player.y - 40,
            config.name
        );
    }
    
    soundManager.pickup();
    
    console.log(`🔄 Switched to: ${config.name} (${projectileSystem.currentTypeIndex + 1}/${projectileSystem.equippedTypes.length})`);
}

function getCurrentProjectileType() {
    return projectileSystem.equippedTypes[projectileSystem.currentTypeIndex] || ProjectileType.NORMAL;
}

// ========================================
// ENHANCED SHOOTING FUNCTION
// ========================================

function enhancedShoot(gameStateParam) {
    if (!gameStateParam.gameRunning) return false;
    
    const currentType = getCurrentProjectileType();
    const config = PROJECTILE_CONFIGS[currentType];
    
    // Check if player has enough bullets (unless berserker)
    if (!gameStateParam.isBerserker && gameStateParam.bullets < config.cost) {
        return false;
    }
    
    // Check cooldowns
    const cooldownProperty = getCooldownProperty(currentType);
    if (projectileSystem[cooldownProperty] > 0) {
        return false;
    }
    
    // Fire the appropriate projectile type
    let success = false;
    
    switch (currentType) {
        case ProjectileType.NORMAL:
            success = fireNormalBolt(gameStateParam, config);
            break;
        case ProjectileType.LASER_BEAM:
            success = fireLaserBeam(gameStateParam, config);
            break;
        case ProjectileType.ENERGY_SHOTGUN:
            success = fireEnergyShotgun(gameStateParam, config);
            break;
        case ProjectileType.CHAIN_LIGHTNING:
            success = fireChainLightning(gameStateParam, config);
            break;
        case ProjectileType.SEEKING_BOLT:
            success = fireSeekingBolt(gameStateParam, config);
            break;
    }
    
    if (success) {
        // Deduct bullets
        if (!gameStateParam.isBerserker) {
            gameStateParam.bullets -= config.cost;
        }
        
        // Set cooldown
        projectileSystem[getCooldownProperty(currentType)] = config.cooldown;
        
        // Play appropriate sound
        playProjectileSound(currentType);
    }
    
    return success;
}

// ========================================
// INDIVIDUAL PROJECTILE FIRING FUNCTIONS
// ========================================

function fireNormalBolt(gameStateParam, config) {
    // Use existing bullet system
    const projectileSpeedMultiplier = 1 + (gameStateParam.playerStats?.projectileSpeed || 0) / 100;
    const bulletSpeed = config.speed * player.facingDirection * projectileSpeedMultiplier;
    
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    const startY = player.y + player.height / 2 + 22; // Lower the projectile start height
    
    window.bulletsFired.push({
        x: startX,
        y: startY,
        speed: bulletSpeed,
        enhanced: false,
        direction: player.facingDirection,
        piercing: config.penetration,
        type: ProjectileType.NORMAL,
        damage: config.damage,
        age: 0,
        tailX: startX,
        baseLength: 30,
        currentLength: 4,
        maxStretch: 60,
        hit: false,
        hitTime: 0,
        showTrail: true  // FIXED: Add visual trail for normal bullets
    });
    
    return true;
}

function fireLaserBeam(gameStateParam, config) {
    // FIXED: Debug logging to track laser creation
    console.log(`Creating laser beam. Current active: ${projectileSystem.laserBeams.length}`);
    
    // Create instant laser beam
    const laserY = player.y + player.height / 2 - 2;
    const startX = player.facingDirection === 1 ? player.x + player.width : player.x;
    const endX = player.facingDirection === 1 ? 
        Math.min(startX + config.range, camera.x + CANVAS.width + 200) :
        Math.max(startX - config.range, camera.x - 200);
    
    const laser = {
        startX: startX,
        endX: endX,
        y: laserY,
        direction: player.facingDirection,
        damage: config.damage,
        life: 45, // FIXED: Increased duration for better visibility
        maxLife: 45,
        piercing: config.penetration,
        type: ProjectileType.LASER_BEAM,
        hitTargets: new Set(),
        id: Date.now() + Math.random() // FIXED: Add unique ID for tracking
    };
    
    projectileSystem.laserBeams.push(laser);
    console.log(`Laser created with ID: ${laser.id}, total active: ${projectileSystem.laserBeams.length}`);
    
    // Immediately check for hits along the laser path
    processLaserHits(laser, gameStateParam);
    
    return true;
}

function fireEnergyShotgun(gameStateParam, config) {
    const projectileSpeedMultiplier = 1 + (gameStateParam.playerStats?.projectileSpeed || 0) / 100;
    const baseSpeed = config.speed * projectileSpeedMultiplier;
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    const startY = player.y + player.height / 2 - 2; // Lower the shotgun pellet height
    
    // Create multiple pellets in a spread pattern
    for (let i = 0; i < config.pellets; i++) {
        const spreadAngle = (i - (config.pellets - 1) / 2) * config.spread;
        const speedX = baseSpeed * Math.cos(spreadAngle) * player.facingDirection;
        const speedY = baseSpeed * Math.sin(spreadAngle);
        
        window.bulletsFired.push({
            x: startX,
            y: startY,
            speed: speedX,
            velocityY: speedY,
            enhanced: true,
            direction: player.facingDirection,
            piercing: false,
            type: ProjectileType.ENERGY_SHOTGUN,
            damage: config.damage,
            age: 0,
            tailX: startX,
            baseLength: 20,
            currentLength: 3,
            maxStretch: 40,
            hit: false,
            hitTime: 0,
            pelletIndex: i,
            showTrail: true  // FIXED: Add visual trail for shotgun pellets
        });
    }
    
    return true;
}

function fireChainLightning(gameStateParam, config) {
    const projectileSpeedMultiplier = 1 + (gameStateParam.playerStats?.projectileSpeed || 0) / 100;
    const bulletSpeed = config.speed * player.facingDirection * projectileSpeedMultiplier;
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    const startY = player.y + player.height / 2 - 2; // Lower the chain lightning height
    
    window.bulletsFired.push({
        x: startX,
        y: startY,
        speed: bulletSpeed,
        enhanced: true,
        direction: player.facingDirection,
        piercing: false,
        type: ProjectileType.CHAIN_LIGHTNING,
        damage: config.damage,
        maxChains: config.maxChains,
        chainRange: config.chainRange,
        chainedTargets: new Set(),
        age: 0,
        tailX: startX,
        baseLength: 40,
        currentLength: 6,
        maxStretch: 80,
        hit: false,
        hitTime: 0,
        showTrail: true  // FIXED: Add visual trail for chain lightning
    });
    
    return true;
}

function fireSeekingBolt(gameStateParam, config) {
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    const startY = player.y + player.height / 2 - 2; // Lower the seeking bolt height
    
    // Find nearest enemy within seek range
    let nearestEnemy = null;
    let nearestDistance = config.seekRange;
    
    for (const obstacle of obstacles) {
        if (obstacle.type === 'boltBox' || obstacle.type === 'rock') continue;
        
        const dx = (obstacle.x + obstacle.width/2) - startX;
        const dy = (obstacle.y + obstacle.height/2) - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
            nearestEnemy = obstacle;
            nearestDistance = distance;
        }
    }
    
    const seekingBolt = {
        x: startX,
        y: startY,
        velocityX: config.speed * player.facingDirection,
        velocityY: 0,
        target: nearestEnemy,
        damage: config.damage,
        seekRange: config.seekRange,
        turnRate: config.turnRate,
        type: ProjectileType.SEEKING_BOLT,
        life: 300, // Max lifetime
        age: 0,
        trail: []
    };
    
    projectileSystem.seekingBolts.push(seekingBolt);
    
    return true;
}

// ========================================
// PROJECTILE UPDATE FUNCTIONS
// ========================================

function updateEnhancedProjectiles(gameStateParam) {
    updateProjectileCooldowns(gameStateParam);
    updateLaserBeams(gameStateParam);
    updateSeekingBolts(gameStateParam);
    updateEnhancedBullets(gameStateParam);
}

function updateProjectileCooldowns(gameStateParam) {
    const cooldownKeys = ['normalCooldown', 'laserCooldown', 'shotgunCooldown', 'lightningCooldown', 'seekingCooldown'];
    
    cooldownKeys.forEach(key => {
        if (projectileSystem[key] > 0) {
            projectileSystem[key] -= gameStateParam.deltaTime || 1;
            if (projectileSystem[key] < 0) {
                projectileSystem[key] = 0;
            }
        }
    });
}

function updateLaserBeams(gameStateParam) {
    for (let i = projectileSystem.laserBeams.length - 1; i >= 0; i--) {
        const laser = projectileSystem.laserBeams[i];
        
        laser.life -= gameStateParam.deltaTime || 1;
        
        // FIXED: More thorough cleanup and debug logging
        if (laser.life <= 0) {
            console.log(`Removing laser beam ${i}, remaining: ${projectileSystem.laserBeams.length - 1}`);
            projectileSystem.laserBeams.splice(i, 1);
        }
    }
    
    // FIXED: Debug logging to track laser beam state
    if (projectileSystem.laserBeams.length > 0) {
        console.log(`Active laser beams: ${projectileSystem.laserBeams.length}`);
    }
}

function updateSeekingBolts(gameStateParam) {
    // Define a list of environmental objects that should not be hit by player attacks
    const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
    
    for (let i = projectileSystem.seekingBolts.length - 1; i >= 0; i--) {
        const bolt = projectileSystem.seekingBolts[i];
        
        bolt.life -= gameStateParam.deltaTime;
        bolt.age += gameStateParam.deltaTime;
        
        // Update trail more frequently for better visibility
        if (bolt.age % 2 === 0) { // Was % 3, now % 2 for more trail particles
            bolt.trail.push({ x: bolt.x, y: bolt.y, life: 20 }); // Increased life from 15 to 20
        }
        
        // Update trail particles
        for (let t = bolt.trail.length - 1; t >= 0; t--) {
            bolt.trail[t].life -= gameStateParam.deltaTime;
            if (bolt.trail[t].life <= 0) {
                bolt.trail.splice(t, 1);
            }
        }
        
        // Seeking behavior - only target non-environmental objects
        if (bolt.target && bolt.target.health > 0 && !environmentalTypes.includes(bolt.target.type)) {
            const dx = (bolt.target.x + bolt.target.width/2) - bolt.x;
            const dy = (bolt.target.y + bolt.target.height/2) - bolt.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const targetVelX = (dx / distance) * 15;
                const targetVelY = (dy / distance) * 15;
                
                bolt.velocityX += (targetVelX - bolt.velocityX) * bolt.turnRate;
                bolt.velocityY += (targetVelY - bolt.velocityY) * bolt.turnRate;
            }
        }
        
        // Move bolt
        bolt.x += bolt.velocityX * gameStateParam.deltaTime;
        bolt.y += bolt.velocityY * gameStateParam.deltaTime;
        
        // Check collision with enemies
        let hit = false;
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obstacle = obstacles[j];
            
            // Skip environmental objects
            if (environmentalTypes.includes(obstacle.type)) continue;
            
            if (bolt.x < obstacle.x + obstacle.width &&
                bolt.x + 8 > obstacle.x &&
                bolt.y < obstacle.y + obstacle.height &&
                bolt.y + 8 > obstacle.y) {
                
                // Hit enemy
                const damage = Math.floor(bolt.damage * (gameStateParam.baseDamage || 20));
                obstacle.health -= damage;
                
                if (window.createDamageNumber) {
                    window.createDamageNumber(
                        obstacle.x + obstacle.width/2,
                        obstacle.y + obstacle.height/4,
                        damage
                    );
                }
                
                createLightningEffect(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                
                // Check for enemy death and handle it properly
                if (obstacle.health <= 0) {
                    handleProjectileEnemyDeath(obstacle, gameStateParam, damage);
                } else {
                    // Update combo for hits that don't kill
                    gameStateParam.consecutiveHits++;
                    gameStateParam.comboCount++;
                    if (gameStateParam.comboCount >= 2) {
                        gameStateParam.comboTimer = 300;
                    }
                }
                
                hit = true;
                break;
            }
        }
        
        // Remove if hit or expired or off screen
        if (hit || bolt.life <= 0 || bolt.x < camera.x - 100 || bolt.x > camera.x + CANVAS.width + 100) {
            projectileSystem.seekingBolts.splice(i, 1);
        }
    }
}

function updateEnhancedBullets(gameStateParam) {
    // Enhanced bullet update for shotgun pellets and chain lightning
    for (let i = window.bulletsFired.length - 1; i >= 0; i--) {
        const bullet = window.bulletsFired[i];
        
        if (bullet.type === ProjectileType.ENERGY_SHOTGUN) {
            // FIXED: Improved shotgun pellet physics with less dramatic gravity
            if (bullet.velocityY !== undefined) {
                bullet.y += bullet.velocityY * gameStateParam.deltaTime;
                // Reduced gravity for more natural flight path
                bullet.velocityY += 0.1 * gameStateParam.deltaTime; // Was 0.2, now 0.1
                
                // Add slight air resistance to velocityY for more realistic arc
                bullet.velocityY *= 0.998;
            }
        }
        
        // Handle chain lightning after hit
        if (bullet.type === ProjectileType.CHAIN_LIGHTNING && bullet.hit && !bullet.chainProcessed) {
            processChainLightning(bullet, gameStateParam);
            bullet.chainProcessed = true;
        }
    }
}

// ========================================
// SPECIAL PROJECTILE LOGIC
// ========================================


function processLaserHits(laser, gameStateParam) {
    const hitEnemies = [];
    
    // Define a list of environmental objects that should not be hit by player attacks
    const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
    
    for (const obstacle of obstacles) {
        // Skip environmental objects and already hit targets
        if (environmentalTypes.includes(obstacle.type)) continue;
        if (laser.hitTargets.has(obstacle)) continue;
        
        // Check if enemy intersects with laser line
        const enemyCenterX = obstacle.x + obstacle.width/2;
        const enemyCenterY = obstacle.y + obstacle.height/2;
        
        // Simple line intersection check
        const isOnLaserPath = Math.abs(enemyCenterY - laser.y) < obstacle.height/2 &&
                              ((laser.direction > 0 && enemyCenterX > laser.startX && enemyCenterX < laser.endX) ||
                               (laser.direction < 0 && enemyCenterX < laser.startX && enemyCenterX > laser.endX));
        
        if (isOnLaserPath) {
            laser.hitTargets.add(obstacle);
            hitEnemies.push(obstacle);
        }
    }
    
    // Apply damage to all hit enemies
    hitEnemies.forEach(enemy => {
        const damage = Math.floor(laser.damage * (gameStateParam.baseDamage || 20));
        enemy.health -= damage;
        
        if (window.createDamageNumber) {
            window.createDamageNumber(
                enemy.x + enemy.width/2,
                enemy.y + enemy.height/4,
                damage
            );
        }
        
        createLightningEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        
        // Check for enemy death and handle it properly
        if (enemy.health <= 0) {
            handleProjectileEnemyDeath(enemy, gameStateParam, damage);
        }
    });
}


function handleProjectileEnemyDeath(enemy, gameStateParam, damage) {
    // Calculate score
    const config = window.ENEMY_CONFIG?.[enemy.type] || { points: 10 };
    const basePoints = config.points || 10;
    const levelBonus = (gameStateParam.level - 1) * 5;
    const points = (basePoints + levelBonus) * gameStateParam.scoreMultiplier;
    
    gameStateParam.score += points;
    if (window.createScorePopup) {
        window.createScorePopup(enemy.x + enemy.width/2, enemy.y, points);
    }

    // Apply lifesteal if player has it
    const lifeSteal = gameStateParam.playerStats?.lifeSteal || 0;
    if (lifeSteal > 0) {
        const healAmount = Math.max(1, Math.floor(damage * (lifeSteal / 100)));
        
        if (gameStateParam.currentHP < gameStateParam.maxHP) {
            const oldHP = gameStateParam.currentHP;
            gameStateParam.currentHP = Math.min(gameStateParam.maxHP, gameStateParam.currentHP + healAmount);
            const actualHeal = gameStateParam.currentHP - oldHP;
            
            if (actualHeal > 0 && window.createScorePopup) {
                window.createScorePopup(
                    player.x + player.width/2, 
                    player.y - 15, 
                    `+${actualHeal} 🩸`
                );
            }
        }
    }
    
    // Roll for drops
    if (window.rollForDrop) {
        window.rollForDrop(enemy.type, enemy.x + enemy.width/2, enemy.y);
    }
    
    if (enemy.type === 'alphaWolf') {
        gameStateParam.bossesKilled++;
    }
    
    // Update game stats
    gameStateParam.enemiesDefeated++;
    gameStateParam.bulletsHit++;
    gameStateParam.levelProgress += 3;
    if (window.soundManager) {
        window.soundManager.hit();
    }
    
    gameStateParam.comboCount++;
    if (gameStateParam.comboCount >= 2) {
        gameStateParam.comboTimer = 300;
    }
    
    // Remove enemy from obstacles array
    const enemyIndex = obstacles.indexOf(enemy);
    if (enemyIndex > -1) {
        obstacles.splice(enemyIndex, 1);
    }
}

function processChainLightning(bullet, gameStateParam) {
    if (!bullet.chainedTargets) bullet.chainedTargets = new Set();
    
    // Define a list of environmental objects that should not be hit by player attacks
    const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
    
    let chainCount = 0;
    let currentX = bullet.x;
    let currentY = bullet.y;
    
    while (chainCount < bullet.maxChains) {
        let nearestEnemy = null;
        let nearestDistance = bullet.chainRange;
        
        for (const obstacle of obstacles) {
            // Skip environmental objects and already chained targets
            if (environmentalTypes.includes(obstacle.type)) continue;
            if (bullet.chainedTargets.has(obstacle)) continue;
            
            const dx = (obstacle.x + obstacle.width/2) - currentX;
            const dy = (obstacle.y + obstacle.height/2) - currentY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance) {
                nearestEnemy = obstacle;
                nearestDistance = distance;
            }
        }
        
        if (!nearestEnemy) break;
        
        // Chain to this enemy
        bullet.chainedTargets.add(nearestEnemy);
        
        const damage = Math.floor(bullet.damage * (gameStateParam.baseDamage || 20));
        nearestEnemy.health -= damage;
        
        if (window.createDamageNumber) {
            window.createDamageNumber(
                nearestEnemy.x + nearestEnemy.width/2,
                nearestEnemy.y + nearestEnemy.height/4,
                damage
            );
        }
        
        // Create lightning effect between current position and enemy
        createLightningEffect(nearestEnemy.x + nearestEnemy.width/2, nearestEnemy.y + nearestEnemy.height/2);
        
        // Check for enemy death and handle it properly
        if (nearestEnemy.health <= 0) {
            handleProjectileEnemyDeath(nearestEnemy, gameStateParam, damage);
        }
        
        currentX = nearestEnemy.x + nearestEnemy.width/2;
        currentY = nearestEnemy.y + nearestEnemy.height/2;
        chainCount++;
    }
}
// ========================================
// PROJECTILE UNLOCKING SYSTEM
// ========================================

function unlockProjectileType(type) {
    if (!projectileSystem.unlockedTypes.includes(type)) {
        projectileSystem.unlockedTypes.push(type);
        
        // Auto-equip if there's space
        if (projectileSystem.equippedTypes.length < 3) {
            projectileSystem.equippedTypes.push(type);
        }
        
        const config = PROJECTILE_CONFIGS[type];
        if (window.createScorePopup) {
            window.createScorePopup(
                player.x + player.width/2,
                player.y - 50,
                `Unlocked: ${config.name}!`
            );
        }
        
        soundManager.powerUp();
        return true;
    }
    
    return false;
}

function equipProjectileType(type) {
    if (!projectileSystem.unlockedTypes.includes(type)) return false;
    if (projectileSystem.equippedTypes.includes(type)) return false;
    if (projectileSystem.equippedTypes.length >= 3) return false;
    
    projectileSystem.equippedTypes.push(type);
    return true;
}

function unequipProjectileType(type) {
    if (type === ProjectileType.NORMAL) return false; // Can't unequip normal
    
    const index = projectileSystem.equippedTypes.indexOf(type);
    if (index > -1) {
        projectileSystem.equippedTypes.splice(index, 1);
        
        // Adjust current index if necessary
        if (projectileSystem.currentTypeIndex >= projectileSystem.equippedTypes.length) {
            projectileSystem.currentTypeIndex = 0;
        }
        
        return true;
    }
    
    return false;
}

// ========================================
// SOUND EFFECTS
// ========================================

function playProjectileSound(type) {
    switch (type) {
        case ProjectileType.NORMAL:
            soundManager.shoot();
            break;
        case ProjectileType.LASER_BEAM:
            soundManager.play(1200, 0.3, 'sine');
            setTimeout(() => soundManager.play(800, 0.2, 'sine'), 50);
            break;
        case ProjectileType.ENERGY_SHOTGUN:
            soundManager.play(600, 0.4, 'sawtooth');
            setTimeout(() => soundManager.play(400, 0.3, 'sawtooth'), 30);
            break;
        case ProjectileType.CHAIN_LIGHTNING:
            soundManager.play(1000, 0.2, 'triangle');
            setTimeout(() => soundManager.play(1400, 0.15, 'triangle'), 40);
            setTimeout(() => soundManager.play(800, 0.1, 'triangle'), 80);
            break;
        case ProjectileType.SEEKING_BOLT:
            soundManager.play(900, 0.25, 'sine');
            setTimeout(() => soundManager.play(1100, 0.2, 'sine'), 60);
            break;
    }
}

// ========================================
// RENDERING FUNCTIONS
// ========================================

function renderEnhancedProjectiles(ctx) {
    // Safety check for context
    if (!ctx) {
        console.warn('renderEnhancedProjectiles called without valid context');
        return;
    }
    
    renderLaserBeams(ctx);
    renderSeekingBolts(ctx);
}

function renderLaserBeams(ctx) {
    if (!ctx) return;
    
    // FIXED: Debug logging for laser rendering
    if (projectileSystem.laserBeams.length > 0) {
        console.log(`Rendering ${projectileSystem.laserBeams.length} laser beams`);
    }
    
    for (let i = 0; i < projectileSystem.laserBeams.length; i++) {
        const laser = projectileSystem.laserBeams[i];
        
        // FIXED: Force minimum visibility and log laser state
        const alpha = Math.max(0.4, laser.life / laser.maxLife);
        const startScreenX = getScreenX(laser.startX);
        const endScreenX = getScreenX(laser.endX);
        
        console.log(`Laser ${laser.id}: life=${laser.life}/${laser.maxLife}, alpha=${alpha}, startX=${startScreenX}, endX=${endScreenX}`);
        
        // Save context state
        ctx.save();
        
        // Outer glow effect (draw first, behind main beam)
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 16;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Main beam (thicker and more visible)
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Core beam (bright white center)
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Inner glow
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        ctx.restore();
    }
}

function renderSeekingBolts(ctx) {
    if (!ctx) return;
    
    for (const bolt of projectileSystem.seekingBolts) {
        const screenX = getScreenX(bolt.x);
        
        ctx.save();
        
        // Draw trail (more visible)
        for (let i = 0; i < bolt.trail.length; i++) {
            const trailPoint = bolt.trail[i];
            const trailScreenX = getScreenX(trailPoint.x);
            const trailAlpha = (trailPoint.life / 15) * 0.8; // More visible trail
            const trailSize = 3 + (trailPoint.life / 15) * 2; // Variable size trail
            
            ctx.fillStyle = `rgba(0, 255, 255, ${trailAlpha})`;
            ctx.fillRect(trailScreenX - trailSize/2, trailPoint.y - trailSize/2, trailSize, trailSize);
        }
        
        // Draw outer glow for seeking bolt
        ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
        ctx.fillRect(screenX - 8, bolt.y - 8, 16, 16);
        
        // Draw main seeking bolt (larger and more visible)
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(screenX - 6, bolt.y - 6, 12, 12);
        
        // Draw bright core
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(screenX - 3, bolt.y - 3, 6, 6);
        
        // Add pulsing effect
        const pulse = 0.7 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.fillRect(screenX - 1, bolt.y - 1, 2, 2);
        
        // Draw seeking indicator if has target (more visible)
        if (bolt.target) {
            const targetScreenX = getScreenX(bolt.target.x + bolt.target.width/2);
            ctx.strokeStyle = `rgba(0, 255, 255, 0.6)`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.lineDashOffset = Date.now() * 0.01;
            ctx.beginPath();
            ctx.moveTo(screenX, bolt.y);
            ctx.lineTo(targetScreenX, bolt.target.y + bolt.target.height/2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }
}

// ========================================
// GLOBAL EXPORTS
// ========================================

// Make functions available globally
window.cycleProjectileType = cycleProjectileType;
window.getCurrentProjectileType = getCurrentProjectileType;
window.enhancedShoot = enhancedShoot;
window.updateEnhancedProjectiles = updateEnhancedProjectiles;
window.unlockProjectileType = unlockProjectileType;
window.equipProjectileType = equipProjectileType;
window.unequipProjectileType = unequipProjectileType;
window.renderEnhancedProjectiles = renderEnhancedProjectiles;
window.projectileSystem = projectileSystem;
window.ProjectileType = ProjectileType;
window.PROJECTILE_CONFIGS = PROJECTILE_CONFIGS;

// ========================================
// EXPORTS
// ========================================

export {
    ProjectileType,
    projectileSystem,
    cycleProjectileType,
    getCurrentProjectileType,
    enhancedShoot,
    updateEnhancedProjectiles,
    unlockProjectileType,
    equipProjectileType,
    unequipProjectileType,
    renderEnhancedProjectiles,
    PROJECTILE_CONFIGS
};

// Default export for compatibility
export default {
    ProjectileType,
    projectileSystem,
    cycleProjectileType,
    getCurrentProjectileType,
    enhancedShoot,
    updateEnhancedProjectiles,
    unlockProjectileType,
    equipProjectileType,
    unequipProjectileType,
    renderEnhancedProjectiles,
    PROJECTILE_CONFIGS
};