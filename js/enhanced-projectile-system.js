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

export const ProjectileType = {
    NORMAL: 'normal',
    LASER_BEAM: 'laserBeam',
    ENERGY_SHOTGUN: 'energyShotgun',
    CHAIN_LIGHTNING: 'chainLightning',
    SEEKING_BOLT: 'seekingBolt'
};

// ========================================
// PROJECTILE SYSTEM STATE
// ========================================

export const projectileSystem = {
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
        speed: 15,
        penetration: false
    },
    
    [ProjectileType.LASER_BEAM]: {
        name: "🔵 Laser Beam",
        desc: "Instant piercing beam",
        cooldown: 45,
        cost: 3,
        damage: 1.5,
        speed: 0, // Instant
        penetration: true,
        range: 800
    },
    
    [ProjectileType.ENERGY_SHOTGUN]: {
        name: "💥 Energy Shotgun",
        desc: "Spreads 5 bolts in a cone",
        cooldown: 30,
        cost: 5,
        damage: 0.7,
        speed: 12,
        penetration: false,
        pellets: 5,
        spread: 0.6
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
        speed: 10,
        penetration: false,
        seekRange: 200,
        turnRate: 0.15
    }
};

// ========================================
// PROJECTILE TYPE CYCLING
// ========================================

export function cycleProjectileType(direction = 1) {
    if (projectileSystem.equippedTypes.length <= 1) return;
    
    projectileSystem.currentTypeIndex = (projectileSystem.currentTypeIndex + direction) % projectileSystem.equippedTypes.length;
    if (projectileSystem.currentTypeIndex < 0) {
        projectileSystem.currentTypeIndex = projectileSystem.equippedTypes.length - 1;
    }
    
    const currentType = getCurrentProjectileType();
    const config = PROJECTILE_CONFIGS[currentType];
    
    // Show weapon switch notification
    if (window.createScorePopup) {
        window.createScorePopup(
            player.x + player.width/2,
            player.y - 40,
            config.name
        );
    }
    
    soundManager.pickup();
}

export function getCurrentProjectileType() {
    return projectileSystem.equippedTypes[projectileSystem.currentTypeIndex] || ProjectileType.NORMAL;
}

// ========================================
// ENHANCED SHOOTING FUNCTION
// ========================================

export function enhancedShoot(gameStateParam) {
    if (!gameStateParam.gameRunning) return false;
    
    const currentType = getCurrentProjectileType();
    const config = PROJECTILE_CONFIGS[currentType];
    
    // Check if player has enough bullets (unless berserker)
    if (!gameStateParam.isBerserker && gameStateParam.bullets < config.cost) {
        return false;
    }
    
    // Check cooldowns
    const cooldownProperty = `${currentType}Cooldown`;
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
        projectileSystem[cooldownProperty] = config.cooldown;
        
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
    
    window.bulletsFired.push({
        x: startX,
        y: player.y + player.height / 2,
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
        hitTime: 0
    });
    
    return true;
}

function fireLaserBeam(gameStateParam, config) {
    // Create instant laser beam
    const laserY = player.y + player.height / 2;
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
        life: 20, // Frames to display
        maxLife: 20,
        piercing: config.penetration,
        type: ProjectileType.LASER_BEAM,
        hitTargets: new Set() // Track hit enemies to prevent double hits
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
    
    // Create multiple pellets in a spread pattern
    for (let i = 0; i < config.pellets; i++) {
        const spreadAngle = (i - (config.pellets - 1) / 2) * config.spread;
        const speedX = baseSpeed * Math.cos(spreadAngle) * player.facingDirection;
        const speedY = baseSpeed * Math.sin(spreadAngle);
        
        window.bulletsFired.push({
            x: startX,
            y: player.y + player.height / 2,
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
            pelletIndex: i
        });
    }
    
    return true;
}

function fireChainLightning(gameStateParam, config) {
    const projectileSpeedMultiplier = 1 + (gameStateParam.playerStats?.projectileSpeed || 0) / 100;
    const bulletSpeed = config.speed * player.facingDirection * projectileSpeedMultiplier;
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    
    window.bulletsFired.push({
        x: startX,
        y: player.y + player.height / 2,
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
        hitTime: 0
    });
    
    return true;
}

function fireSeekingBolt(gameStateParam, config) {
    const startX = player.facingDirection === 1 ? player.x + player.width + 24 : player.x - 24;
    
    // Find nearest enemy within seek range
    let nearestEnemy = null;
    let nearestDistance = config.seekRange;
    
    for (const obstacle of obstacles) {
        if (obstacle.type === 'boltBox' || obstacle.type === 'rock') continue;
        
        const dx = (obstacle.x + obstacle.width/2) - startX;
        const dy = (obstacle.y + obstacle.height/2) - (player.y + player.height/2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nearestDistance) {
            nearestEnemy = obstacle;
            nearestDistance = distance;
        }
    }
    
    const seekingBolt = {
        x: startX,
        y: player.y + player.height / 2,
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

export function updateEnhancedProjectiles(gameStateParam) {
    updateProjectileCooldowns(gameStateParam);
    updateLaserBeams(gameStateParam);
    updateSeekingBolts(gameStateParam);
    updateEnhancedBullets(gameStateParam);
}

function updateProjectileCooldowns(gameStateParam) {
    const cooldownKeys = ['laserCooldown', 'shotgunCooldown', 'lightningCooldown', 'seekingCooldown'];
    
    cooldownKeys.forEach(key => {
        if (projectileSystem[key] > 0) {
            projectileSystem[key] -= gameStateParam.deltaTime;
        }
    });
}

function updateLaserBeams(gameStateParam) {
    for (let i = projectileSystem.laserBeams.length - 1; i >= 0; i--) {
        const laser = projectileSystem.laserBeams[i];
        
        laser.life -= gameStateParam.deltaTime;
        
        if (laser.life <= 0) {
            projectileSystem.laserBeams.splice(i, 1);
        }
    }
}

function updateSeekingBolts(gameStateParam) {
    for (let i = projectileSystem.seekingBolts.length - 1; i >= 0; i--) {
        const bolt = projectileSystem.seekingBolts[i];
        
        bolt.life -= gameStateParam.deltaTime;
        bolt.age += gameStateParam.deltaTime;
        
        // Update trail
        if (bolt.age % 3 === 0) {
            bolt.trail.push({ x: bolt.x, y: bolt.y, life: 15 });
        }
        
        // Update trail particles
        for (let t = bolt.trail.length - 1; t >= 0; t--) {
            bolt.trail[t].life -= gameStateParam.deltaTime;
            if (bolt.trail[t].life <= 0) {
                bolt.trail.splice(t, 1);
            }
        }
        
        // Seeking behavior
        if (bolt.target && bolt.target.health > 0) {
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
        for (const obstacle of obstacles) {
            if (obstacle.type === 'boltBox' || obstacle.type === 'rock') continue;
            
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
            // Handle shotgun pellet physics
            if (bullet.velocityY !== undefined) {
                bullet.y += bullet.velocityY * gameStateParam.deltaTime;
                bullet.velocityY += 0.2 * gameStateParam.deltaTime; // Slight gravity
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
    
    for (const obstacle of obstacles) {
        if (obstacle.type === 'boltBox' || obstacle.type === 'rock') continue;
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
    });
}

function processChainLightning(bullet, gameStateParam) {
    if (!bullet.chainedTargets) bullet.chainedTargets = new Set();
    
    let chainCount = 0;
    let currentX = bullet.x;
    let currentY = bullet.y;
    
    while (chainCount < bullet.maxChains) {
        let nearestEnemy = null;
        let nearestDistance = bullet.chainRange;
        
        for (const obstacle of obstacles) {
            if (obstacle.type === 'boltBox' || obstacle.type === 'rock') continue;
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
        
        currentX = nearestEnemy.x + nearestEnemy.width/2;
        currentY = nearestEnemy.y + nearestEnemy.height/2;
        chainCount++;
    }
}

// ========================================
// PROJECTILE UNLOCKING SYSTEM
// ========================================

export function unlockProjectileType(type) {
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

export function equipProjectileType(type) {
    if (!projectileSystem.unlockedTypes.includes(type)) return false;
    if (projectileSystem.equippedTypes.includes(type)) return false;
    if (projectileSystem.equippedTypes.length >= 3) return false;
    
    projectileSystem.equippedTypes.push(type);
    return true;
}

export function unequipProjectileType(type) {
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

export function renderEnhancedProjectiles(ctx) {
    renderLaserBeams(ctx);
    renderSeekingBolts(ctx);
}

function renderLaserBeams(ctx) {
    for (const laser of projectileSystem.laserBeams) {
        const alpha = laser.life / laser.maxLife;
        const startScreenX = getScreenX(laser.startX);
        const endScreenX = getScreenX(laser.endX);
        
        // Main beam
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Core beam
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
        
        // Glow effect
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha * 0.3})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(startScreenX, laser.y);
        ctx.lineTo(endScreenX, laser.y);
        ctx.stroke();
    }
}

function renderSeekingBolts(ctx) {
    for (const bolt of projectileSystem.seekingBolts) {
        const screenX = getScreenX(bolt.x);
        
        // Draw trail
        for (let i = 0; i < bolt.trail.length; i++) {
            const trailPoint = bolt.trail[i];
            const trailScreenX = getScreenX(trailPoint.x);
            const trailAlpha = trailPoint.life / 15;
            
            ctx.fillStyle = `rgba(0, 255, 255, ${trailAlpha * 0.4})`;
            ctx.fillRect(trailScreenX - 2, trailPoint.y - 2, 4, 4);
        }
        
        // Draw seeking bolt
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(screenX - 4, bolt.y - 4, 8, 8);
        
        // Draw core
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(screenX - 2, bolt.y - 2, 4, 4);
        
        // Draw seeking indicator if has target
        if (bolt.target) {
            const targetScreenX = getScreenX(bolt.target.x + bolt.target.width/2);
            ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(screenX, bolt.y);
            ctx.lineTo(targetScreenX, bolt.target.y + bolt.target.height/2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
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
	renderEnhancedProjectiles
	PROJECTILE_CONFIGS
};

