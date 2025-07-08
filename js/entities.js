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