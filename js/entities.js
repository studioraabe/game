// entities.js - Compatibility Layer for Split Entity System
// This file maintains backward compatibility while using the new split architecture

// ========================================
// RE-EXPORT ALL CORE FUNCTIONALITY
// ========================================

export {
    // Entity Arrays
    obstacles,
    bulletsFired,
    explosions,
    environmentElements,
    bloodParticles,
    lightningEffects,
    scorePopups,
    doubleJumpParticles,
    dropParticles,
    drops,
    batProjectiles,
    
    // Spawn tracking
    recentSpawnPositions,
    obstacleTimer,
    lastSpawnPosition,
    bulletBoxesFound,
    
    // Core functions
    resetBulletBoxesFound,
    clearArrays,
    createBloodParticles,
    createScorePopup,
    createLightningEffect,
    createDoubleJumpParticles,
    getObstacleHitbox,
    spawnObstacle,
    updateExplosions,
    updateEffects,
    updateDrops,
    initEnvironmentElements,
    updateEnvironmentElements
} from './entities-core.js';

// ========================================
// RE-EXPORT ALL COMBAT FUNCTIONALITY
// ========================================

export {
    // Combat Systems
    updateBatProjectiles,
    shoot,
    updateBullets,
    updateObstacles,
    checkCollisions,
    isPlayerInvulnerable,
    updateAllEntities
} from './entities-combat.js';








let shootCooldown = 0;
const BASE_SHOOT_COOLDOWN = 15; // frames at 60fps - 4 shots per second

export function shoot(gameStateParam) {
    if (!gameStateParam.gameRunning || (gameStateParam.bullets <= 0 && !gameStateParam.isBerserker)) return;
    
    // Apply attack speed calculation
    const attackSpeedMultiplier = 1 + (gameStateParam.playerStats.attackSpeed / 100);
    const finalCooldown = BASE_SHOOT_COOLDOWN / attackSpeedMultiplier;
    
    // Check if we can shoot based on cooldown
    if (shootCooldown > 0) {
        return;
    }
    
    // Reset cooldown
    shootCooldown = finalCooldown;
    
    // Apply projectile speed multiplier
    const projectileSpeedMultiplier = 1 + (gameStateParam.playerStats.projectileSpeed / 100);
    
    // Single bullet shooting (Chain Lightning removed)
    const baseX = player.facingDirection === 1 ? player.x + player.width : player.x;
    const startX = baseX + (24 * player.facingDirection);
    
    const bulletSpeed = GAME_CONSTANTS.BULLET_SPEED * 
                        player.facingDirection * 
                        GAME_CONSTANTS.BULLET_SPEED_MULTIPLIER *
                        projectileSpeedMultiplier;
    
    bulletsFired.push({
        x: startX,
        y: player.y + player.height / 1.00,
        speed: bulletSpeed,
        enhanced: false,
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
    
    if (!gameStateParam.isBerserker) {
        gameStateParam.bullets -= 1;
    }
    soundManager.shoot();
}







// ========================================
// LEGACY COMPATIBILITY WRAPPER FUNCTIONS
// ========================================

// If there were any functions that need special handling or were renamed,
// you can create wrapper functions here. For example:

// Legacy function name mapping (if needed)
// export const legacyFunctionName = modernFunctionName;

// ========================================
// NOTES FOR DEVELOPERS
// ========================================

/*
This file serves as a compatibility layer for the split entity system.

NEW IMPORTS (recommended for new code):
- import { ... } from './entities-core.js'    // Basic entity management
- import { ... } from './entities-combat.js'  // Combat, AI, collisions

LEGACY IMPORTS (still supported):
- import { ... } from './entities.js'         // Everything (compatibility)

SPLIT ARCHITECTURE:
├── entities-core.js     → Basic entity management, spawn system, effects
├── entities-combat.js   → Combat system, AI, collision detection  
└── entities.js         → This compatibility layer (re-exports both)

MIGRATION STRATEGY:
1. Keep this file for backward compatibility
2. Gradually update imports in new/modified files to use specific split files
3. Eventually this file can be removed when all imports are updated
*/