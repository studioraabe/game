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
    // FIXED: Start with all weapons unlocked and equipped
    unlockedTypes: [
        ProjectileType.NORMAL,
        ProjectileType.LASER_BEAM,
        ProjectileType.ENERGY_SHOTGUN,
        ProjectileType.CHAIN_LIGHTNING
    ],
    // FIXED: Start with all weapons equipped (remove SEEKING_BOLT for now)
    equippedTypes: [
        ProjectileType.NORMAL,
        ProjectileType.LASER_BEAM,
        ProjectileType.ENERGY_SHOTGUN,
        ProjectileType.CHAIN_LIGHTNING
    ],
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
}

// ========================================
// PROJECTILE CONFIGS
// ========================================

const PROJECTILE_CONFIGS = {
    [ProjectileType.NORMAL]: {
        name: "⚡ Lightning Bolt",
        desc: "Standard energy projectile",
        cooldown: 10,
        cost: 1,
        damage: 1.0,
        speed: 18,
        penetration: false
    },
	
	
	
    
    [ProjectileType.LASER_BEAM]: {
        name: "🔵 Laser Beam",
        desc: "Instant piercing beam",
        cooldown: 180,
        cost: 10,
        damage: 1.5,
        speed: 0, // Instant
        penetration: true,
        range: 600
    },
    
    [ProjectileType.ENERGY_SHOTGUN]: {
        name: "💥 Energy Shotgun",
        desc: "Spreads 5 bolts in a cone",
        cooldown: 120,
        cost: 4,
        damage: 0.8,
        speed: 20,
        penetration: false,
        pellets: 4,
        spread: 0.2
    },
    
    [ProjectileType.CHAIN_LIGHTNING]: {
        name: "⚡ Chain Lightning",
        desc: "Jumps between 3 enemies",
        cooldown: 240,
        cost: 15,
        damage: 1.1,
        speed: 20,
        penetration: false,
        maxChains: 3,
        chainRange: 300
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

const ORIGINAL_PROJECTILE_CONFIGS = JSON.parse(JSON.stringify(PROJECTILE_CONFIGS));
// Add a reset function
export function resetProjectileConfigs() {
    // Deep copy original configs back
      Object.keys(ORIGINAL_PROJECTILE_CONFIGS).forEach(type => {
        PROJECTILE_CONFIGS[type] = JSON.parse(JSON.stringify(ORIGINAL_PROJECTILE_CONFIGS[type]));
    });
	
	
	
	   PROJECTILE_CONFIGS[ProjectileType.NORMAL] = {
        name: "⚡ Lightning Bolt",
        desc: "Standard energy projectile",
        cooldown: 10,
        cost: 1,
        damage: 1.0,
        speed: 18,
        penetration: false
    };
    
    PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM] = {
        name: "🔵 Laser Beam",
        desc: "Instant piercing beam",
        cooldown: 180,
        cost: 10,
        damage: 1.5,
        speed: 0,
        penetration: true,
        range: 600
    };
    
    PROJECTILE_CONFIGS[ProjectileType.ENERGY_SHOTGUN] = {
        name: "💥 Energy Shotgun",
        desc: "Spreads 5 bolts in a cone",
        cooldown: 120,
        cost: 4,
        damage: 0.8,
        speed: 20,
        penetration: false,
        pellets: 4,  // IMPORTANT: Reset to default 4 pellets
        spread: 0.2
    };
    
    PROJECTILE_CONFIGS[ProjectileType.CHAIN_LIGHTNING] = {
        name: "⚡ Chain Lightning",
        desc: "Jumps between 3 enemies",
        cooldown: 240,
        cost: 15,
        damage: 1.1,
        speed: 20,
        penetration: false,
        maxChains: 3,  // IMPORTANT: Reset to default 3 chains
        chainRange: 300
    };
	
    
    console.log('🔫 Projectile configurations reset to default values');
}


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
    
    // Create instant laser beam
    const laserY = player.y + player.height / 2 + 22;
    const startX = player.facingDirection === 1 ? player.x + player.width : player.x;
    const endX = player.facingDirection === 1 ? 
        Math.min(startX + config.range, camera.x + CANVAS.width + 200) :
        Math.max(startX - config.range, camera.x - 200);
    
    const laser = {
        startX: startX + 20,
        endX: endX,
        y: laserY,
        direction: player.facingDirection,
        damage: config.damage,
        life: 20, // FIXED: Increased duration for better visibility
        maxLife: 30,
        piercing: config.penetration,
        type: ProjectileType.LASER_BEAM,
        hitTargets: new Set(),
        id: Date.now() + Math.random() // FIXED: Add unique ID for tracking
    };
    
    projectileSystem.laserBeams.push(laser);
    
    // Immediately check for hits along the laser path
    processLaserHits(laser, gameStateParam);
    
    return true;
}

function fireEnergyShotgun(gameStateParam, config) {
    const projectileSpeedMultiplier = 1 + (gameStateParam.playerStats?.projectileSpeed || 0) / 100;
    const baseSpeed = config.speed * projectileSpeedMultiplier;
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    const startY = player.y + player.height / 2 + 15; // Lower the shotgun pellet height
    
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
    const startY = player.y + player.height / 2 + 20; // Lower the chain lightning height
    
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
    
    // Remove the frame-based throttling - update smoothly every frame
    cooldownKeys.forEach(key => {
        if (projectileSystem[key] > 0) {
            // Smooth cooldown reduction using deltaTime
            projectileSystem[key] = Math.max(0, projectileSystem[key] - (gameStateParam.deltaTime || 1));
        }
    });
}

function updateLaserBeams(gameStateParam) {
    for (let i = projectileSystem.laserBeams.length - 1; i >= 0; i--) {
        const laser = projectileSystem.laserBeams[i];
        
        laser.life -= gameStateParam.deltaTime || 1;
        
        // FIXED: More thorough cleanup and debug logging
        if (laser.life <= 0) {
            projectileSystem.laserBeams.splice(i, 1);
        }
    }
    
    // FIXED: Debug logging to track laser beam state
    if (projectileSystem.laserBeams.length > 0) {
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
    // ========================================
    // SCORE CALCULATION WITH COMBO SYSTEM
    // ========================================
    
    // Get base enemy configuration
    const config = window.ENEMY_CONFIG?.[enemy.type] || { points: 10 };
    let basePoints = config.points || 10;
    
    // Special handling for professor (boss enemy)
    if (enemy.type === 'professor') {
        basePoints = 100; // Boss-level points
        gameStateParam.bossesKilled++; // Count as boss kill
    }
    
    // Calculate level bonus
    const levelBonus = (gameStateParam.level - 1) * 5;
    
    // Get combo multiplier for enhanced scoring
    const comboMultiplier = window.getComboPointsMultiplier ? window.getComboPointsMultiplier() : 1;
    
    // Calculate final points with all bonuses
    const points = Math.floor((basePoints + levelBonus) * gameStateParam.scoreMultiplier * comboMultiplier);
    
    // Add points to score
    gameStateParam.score += points;
    
    // Show score popup with combo indicator if applicable
    if (window.createScorePopup) {
        if (gameStateParam.comboCount >= 5) {
            window.createScorePopup(
                enemy.x + enemy.width/2,
                enemy.y,
                `${points} (+${Math.round((comboMultiplier - 1) * 100)}%)`
            );
        } else {
            window.createScorePopup(enemy.x + enemy.width/2, enemy.y, points);
        }
    }

    // ========================================
    // LIFESTEAL APPLICATION (FIXED)
    // ========================================
    
    // Apply lifesteal if player has it and damage was dealt
    if (damage > 0 && gameStateParam.playerStats?.lifeSteal > 0) {
        const lifeStealPercent = gameStateParam.playerStats.lifeSteal;
        const healAmount = Math.max(1, Math.floor(damage * (lifeStealPercent / 100)));
        
        console.log(`🩸 Lifesteal: ${damage} damage * ${lifeStealPercent}% = ${healAmount} heal`);
        
        // Apply healing if not at max health
        if (gameStateParam.currentHP < gameStateParam.maxHP) {
            const oldHP = gameStateParam.currentHP;
            gameStateParam.currentHP = Math.min(gameStateParam.maxHP, gameStateParam.currentHP + healAmount);
            const actualHeal = gameStateParam.currentHP - oldHP;
            
            if (actualHeal > 0 && window.createScorePopup) {
                window.createScorePopup(
                    window.player.x + window.player.width/2, 
                    window.player.y - 15, 
                    `+${actualHeal} 🩸`
                );
                
                console.log(`🩸 Lifesteal healed: ${actualHeal} HP (${oldHP} -> ${gameStateParam.currentHP})`);
            }
        }
    }

    // ========================================
    // DROP SYSTEM
    // ========================================
    
    // Roll for item drops with combo bonus
    if (window.rollForDrop) {
        window.rollForDrop(enemy.type, enemy.x + enemy.width/2, enemy.y);
    }
    
    // Count alpha wolf as boss kill
    if (enemy.type === 'alphaWolf') {
        gameStateParam.bossesKilled++;
    }

    // ========================================
    // GAME PROGRESSION & STATS
    // ========================================
    
    // Update game statistics
    gameStateParam.enemiesDefeated++;
    gameStateParam.bulletsHit++;
    gameStateParam.levelProgress += 3;
    
    // Update combo system
    gameStateParam.comboCount++;
    if (gameStateParam.comboCount >= 2) {
        gameStateParam.comboTimer = 300; // Combo lasts 5 seconds at 60fps
    }
    
    // Update consecutive hits for achievements
    gameStateParam.consecutiveHits++;

    // ========================================
    // AUDIO FEEDBACK
    // ========================================
    
    // Play hit sound
    if (window.soundManager) {
        window.soundManager.hit();
    }

    // ========================================
    // SPRITE CLEANUP
    // ========================================
    
    // Clean up sprite system entities if sprite manager exists
    if (enemy.id && window.spriteManager) {
        window.spriteManager.cleanupEntity(enemy.type, enemy.id);
    }

    // ========================================
    // REMOVE ENEMY FROM GAME
    // ========================================
    
    // Remove enemy from obstacles array
    const enemyIndex = window.obstacles.indexOf(enemy);
    if (enemyIndex > -1) {
        window.obstacles.splice(enemyIndex, 1);
    }

    // ========================================
    // HEALING SYSTEM (UNDEAD RESILIENCE BUFF)
    // ========================================
    
    // Handle healing from undead resilience buff
    const bulletsNeeded = gameStateParam.activeBuffs?.undeadResilience > 0 ? 10 : 15;
    if (gameStateParam.bulletsHit >= bulletsNeeded) {
        // Calculate base heal amount (25% of max HP)
        const baseHealAmount = Math.floor(gameStateParam.maxHP * 0.25);
        
        // Apply enhanced healing with buff support
        const actualHeal = window.enhancedHealPlayer ? 
            window.enhancedHealPlayer(baseHealAmount) : 
            window.healPlayer ? window.healPlayer(baseHealAmount) : 0;
        
        if (actualHeal > 0) {
            // Show healing popup
            if (window.createScorePopup && window.player) {
                window.createScorePopup(
                    window.player.x + window.player.width/2, 
                    window.player.y, 
                    `+${actualHeal} HP`
                );
            }
        } else {
            // If at full health, give bonus points instead
            const comboMultiplier = window.getComboPointsMultiplier ? window.getComboPointsMultiplier() : 1;
            const bonusPoints = Math.floor(500 * gameStateParam.scoreMultiplier * comboMultiplier);
            gameStateParam.score += bonusPoints;
            
            if (window.createScorePopup && window.player) {
                window.createScorePopup(
                    window.player.x + window.player.width/2, 
                    window.player.y, 
                    `+${bonusPoints} Bonus!`
                );
            }
        }
        
        // Reset bullet hit counter
        gameStateParam.bulletsHit = 0;
    }

    // ========================================
    // DEBUG LOGGING
    // ========================================
    
    console.log(`💀 ${enemy.type} killed by projectile:`, {
        damage: damage,
        points: points,
        combo: gameStateParam.comboCount,
        lifesteal: gameStateParam.playerStats?.lifeSteal || 0,
        currentHP: gameStateParam.currentHP,
        maxHP: gameStateParam.maxHP
    });
}

function processChainLightning(bullet, gameStateParam) {
    // Environmental objects to skip
    const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
    
    // Start chain from the first hit enemy
    let currentX = bullet.x;
    let currentY = bullet.y;
    
    // Maximum jumps (default to 3 enemies for chain lightning)
    const maxChains = bullet.maxChains || 3;
    
    // Chain jump range
    const chainRange = bullet.chainRange || 400;
    
    // Initialize chainedTargets if it doesn't exist
    if (!bullet.chainedTargets) {
        bullet.chainedTargets = new Set();
    }
    
    // Find initially hit enemy and add to chained targets
    for (const obstacle of obstacles) {
        if (environmentalTypes.includes(obstacle.type)) continue;
        
        if (bullet.x < obstacle.x + obstacle.width &&
            bullet.x + 8 > obstacle.x &&
            bullet.y < obstacle.y + obstacle.height &&
            bullet.y + 4 > obstacle.y) {
            
            bullet.chainedTargets.add(obstacle);
            currentX = obstacle.x + obstacle.width/2;
            currentY = obstacle.y + obstacle.height/2;
            
            // Apply slow effect to the hit enemy
            applySlowEffect(obstacle);
            break;
        }
    }
    
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
        
        // Critical hit calculation
        let isCritical = false;
        const critChance = gameStateParam.playerStats?.critChance || 0;
        if (Math.random() * 100 < critChance) {
            isCritical = true;
            const critMultiplier = gameStateParam.playerStats?.critDamage || 1.5;
            damage *= critMultiplier;
        }
        
        damage = Math.floor(damage);
        
        // Apply damage
        nextTarget.health -= damage;
        
        // Apply slow effect to the chained target
        applySlowEffect(nextTarget);
        
        // Show damage number
        if (window.createDamageNumber) {
            window.createDamageNumber(
                nextTarget.x + nextTarget.width/2,
                nextTarget.y + nextTarget.height/4,
                damage,
                isCritical
            );
        }
        
        // Create chain lightning effect
        createChainLightningEffect(
            currentX, currentY,
            nextTarget.x + nextTarget.width/2,
            nextTarget.y + nextTarget.height/2
        );
        
        // Check for enemy death
        if (nextTarget.health <= 0) {
            if (window.handleProjectileEnemyDeath) {
                window.handleProjectileEnemyDeath(nextTarget, gameStateParam, damage);
            } else {
                const index = obstacles.indexOf(nextTarget);
                if (index > -1) {
                    obstacles.splice(index, 1);
                }
            }
        }
        
        // Update current position to this target for next jump
        currentX = nextTarget.x + nextTarget.width/2;
        currentY = nextTarget.y + nextTarget.height/2;
    }
}




function applySlowEffect(enemy) {
    // Skip if already slowed
    if (enemy.isSlowed) return;
    
    // Apply slow effect
    enemy.isSlowed = true;
    enemy.slowDuration = 180; // 3 seconds at 60fps
    enemy.originalSpeed = enemy.speed || 1;
    enemy.speed = (enemy.speed || 1) * 0.6; // 40% speed reduction
    
    // Visual indicator for slowed enemies
    if (!enemy.effects) enemy.effects = [];
    enemy.effects.push({
        type: 'slow',
        duration: 180
    });
    
    // Create visual slow effect
    createSlowEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
}

// Create visual indicator for slow effect
function createSlowEffect(x, y) {
    // Create slow particles
    for (let i = 0; i < 5; i++) {
        if (window.dropParticles) {
            window.dropParticles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                velocityX: (Math.random() - 0.5) * 2,
                velocityY: (Math.random() - 0.5) * 2,
                life: 60,
                maxLife: 60,
                color: '#00BFFF' // Light blue for slow effect
            });
        }
    }
    
    // Create a score popup to indicate slowing
    if (window.createScorePopup) {
        window.createScorePopup(x, y - 15, 'Slowed!', '#00BFFF');
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

// In the renderLaserBeams function, replace with this:

function renderLaserBeams(ctx) {
    if (!ctx) return;
    
    projectileSystem.laserBeams.forEach((laser, index) => {
        // Calculate how much of the beam should be visible
        const lifeRatio = laser.life / laser.maxLife;
        
        // Determine if beam is retracting (stopping)
        const isRetracting = laser.life < laser.maxLife;
        
        let startScreenX, endScreenX;
        
        if (isRetracting) {
            // Beam retracts from player position toward target
            // Start from player's current position
            const playerStartX = player.facingDirection === 1 ? 
                player.x + player.width + 20 : 
                player.x - 20;
            
            // Calculate how far the beam has retracted
            const fullLength = Math.abs(laser.endX - playerStartX);
            const visibleLength = fullLength * lifeRatio;
            
            // New start position moves away from player
            const newStartX = player.facingDirection === 1 ?
                playerStartX  :
                playerStartX  ;
            
            startScreenX = getScreenX(newStartX);
            endScreenX = getScreenX(laser.endX);
        } else {
            // Normal full beam - use laser's stored positions
            startScreenX = getScreenX(laser.startX);
            endScreenX = getScreenX(laser.endX);
        }
        
        // Skip if beam has retracted completely
        if (Math.abs(endScreenX - startScreenX) < 1) return;
        
        // Calculate alpha based on life
        const alpha = Math.min(1, lifeRatio + 0.2); // Add 0.2 to keep it visible longer
        
        // Save context state
        ctx.save();
        
        // Outer glow effect (largest, most transparent)
        const gradient1 = ctx.createLinearGradient(startScreenX, laser.y, endScreenX, laser.y);
        gradient1.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.1})`);
        gradient1.addColorStop(0.5, `rgba(0, 255, 255, ${alpha * 0.3})`);
        gradient1.addColorStop(1, `rgba(0, 255, 255, ${alpha * 0.1})`);
        ctx.strokeStyle = gradient1;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Middle glow
        const gradient2 = ctx.createLinearGradient(startScreenX, laser.y, endScreenX, laser.y);
        gradient2.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.3})`);
        gradient2.addColorStop(0.5, `rgba(0, 255, 255, ${alpha * 0.6})`);
        gradient2.addColorStop(1, `rgba(0, 255, 255, ${alpha * 0.3})`);
        ctx.strokeStyle = gradient2;
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Main beam
        const gradient3 = ctx.createLinearGradient(startScreenX, laser.y, endScreenX, laser.y);
        gradient3.addColorStop(0, `rgba(0, 255, 255, ${alpha * 0.7})`);
        gradient3.addColorStop(0.5, `rgba(0, 255, 255, ${alpha * 0.9})`);
        gradient3.addColorStop(1, `rgba(0, 255, 255, ${alpha * 0.7})`);
        ctx.strokeStyle = gradient3;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Core beam (bright white center)
        const gradient4 = ctx.createLinearGradient(startScreenX, laser.y, endScreenX, laser.y);
        gradient4.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.8})`);
        gradient4.addColorStop(0.5, `rgba(255, 255, 255, ${alpha})`);
        gradient4.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.8})`);
        ctx.strokeStyle = gradient4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Add tip glow effect (at the retracting start position where beam is disappearing)
        if (isRetracting) {
            const tipGlow = 1 - lifeRatio; // Stronger glow as beam retracts
            const glowRadius = 10 + tipGlow * 20;
            
            const tipGradient = ctx.createRadialGradient(
                startScreenX, laser.y, 0,
                startScreenX, laser.y, glowRadius
            );
            tipGradient.addColorStop(0, `rgba(255, 255, 255, ${tipGlow})`);
            tipGradient.addColorStop(0.3, `rgba(0, 255, 255, ${tipGlow * 0.8})`);
            tipGradient.addColorStop(0.6, `rgba(0, 255, 255, ${tipGlow * 0.4})`);
            tipGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
            
            ctx.fillStyle = tipGradient;
            ctx.fillRect(
                startScreenX - glowRadius,
                laser.y - glowRadius,
                glowRadius * 2,
                glowRadius * 2
            );
        }
        
        ctx.restore();
    });
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