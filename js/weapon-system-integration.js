// js/weapon-system-integration.js - Integration module for weapon hotkey system
// This file connects the weapon system to the main game

import { initWeaponHotkeySystem, WEAPON_BUFFS } from './weapon-hotkey-system.js';

// ========================================
// INTEGRATION WITH MAIN GAME
// ========================================

// Integrate with the game's initialization process
export function integrateWeaponSystem() {
    console.log('🔫 Integrating Weapon Hotkey System');
    
    // Hook into the game's initialization
    hookIntoGameInit();
    
    // Replace projectile buffs with weapon buffs
    replaceProjectileBuffs();
    
    console.log('🔫 Weapon System Integration Complete');
}

// Hook into the game's initialization process
function hookIntoGameInit() {
    // Save original init function
    const originalInit = window.init;
    
    // Replace with our version that also initializes the weapon system
    window.init = function() {
        // Call the original init
        if (originalInit) {
            originalInit();
        }
        
        // Initialize our weapon system
        console.log('🔫 Initializing Weapon Hotkey System from game init');
        initWeaponHotkeySystem();
    };
    
    // If game is already initialized, initialize the weapon system directly
    if (window.gameState && document.readyState === 'complete') {
        initWeaponHotkeySystem();
    }
}

// Replace projectile buffs with weapon buffs
function replaceProjectileBuffs() {
    // Try to find the PROJECTILE_BUFFS from projectile-buff-integration.js
    if (window.PROJECTILE_BUFFS) {
        console.log('🔫 Found PROJECTILE_BUFFS, replacing with WEAPON_BUFFS');
        
        // Replace the PROJECTILE_BUFFS with our WEAPON_BUFFS
        window.PROJECTILE_BUFFS = WEAPON_BUFFS;
    }
    
    // Also update createEnhancedBuffSystem if it exists
    if (window.createEnhancedBuffSystem) {
        const originalCreateEnhancedBuffSystem = window.createEnhancedBuffSystem;
        
        window.createEnhancedBuffSystem = function() {
            // Call original function
            const result = originalCreateEnhancedBuffSystem();
            
            // Find and remove the projectile buffs from STAT_BUFFS
            if (window.STAT_BUFFS) {
                // Replace the projectile buffs with weapon buffs in STAT_BUFFS
                const projectileBuffIds = ['laserMastery', 'shotgunBlast', 'chainLightning', 'seekingBolt', 'energyEfficiency', 'rapidFire'];
                
                // Filter out the existing projectile buffs
                window.STAT_BUFFS = window.STAT_BUFFS.filter(buff => !projectileBuffIds.includes(buff.id));
                
                // Add our weapon buffs
                window.STAT_BUFFS = [...window.STAT_BUFFS, ...WEAPON_BUFFS];
                
                // Also update gameState's available buffs if it exists
                if (window.gameState && window.gameState.availableBuffs) {
                    window.gameState.availableBuffs = [...window.STAT_BUFFS];
                }
                
                console.log(`🔫 Enhanced buff system updated with ${WEAPON_BUFFS.length} weapon buffs`);
            }
            
            return result;
        };
    }
}

// ========================================
// OVERRIDE PROJECTILE CONTROLS
// ========================================

// Disable the original Q/E cycle functions since we're using direct weapon selection
function overrideProjectileCycling() {
    // Replace the cycleProjectileType function with a no-op
    if (window.cycleProjectileType) {
        const originalCycleProjectileType = window.cycleProjectileType;
        
        window.cycleProjectileType = function(direction) {
            // Do nothing - we're using direct hotkeys instead
            console.log('🔫 Weapon cycling disabled - using direct hotkeys instead');
            
            // Show a message to the user
            if (window.createScorePopup && window.player) {
                window.createScorePopup(
                    window.player.x + window.player.width/2,
                    window.player.y - 40,
                    'Use Q/W/E/R to select weapons'
                );
            }
            
            return false;
        };
    }
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

export {
    initWeaponHotkeySystem,
    WEAPON_BUFFS
};

// ========================================
// AUTO-INITIALIZE
// ========================================

// Make functions available globally
window.integrateWeaponSystem = integrateWeaponSystem;

// Auto-initialize when this module is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit to ensure the game is initialized
    setTimeout(() => {
        integrateWeaponSystem();
        overrideProjectileCycling();
    }, 1000);
});

// Alternative initialization for when document is already loaded
if (document.readyState === 'complete') {
    setTimeout(() => {
        integrateWeaponSystem();
        overrideProjectileCycling();
    }, 1000);
}


// ===== INTEGRATION METHOD =====
// Just add this to the end of your js/weapon-system-integration.js, js/weapon-hotkey-system.js
// or any projectile-related file that gets loaded with your game

// Enhanced Continuous Laser Beam Integration
// ===== FIXED CONTINUOUS LASER BEAM INTEGRATION =====
// Add this to the end of your weapon system file

(function() {
    // Store the original integration function
    const originalIntegrateWeaponSystem = window.integrateWeaponSystem;
    
    // Replace with our enhanced version
    window.integrateWeaponSystem = function() {
        // Call the original integration first
        if (originalIntegrateWeaponSystem && typeof originalIntegrateWeaponSystem === 'function') {
            originalIntegrateWeaponSystem();
        }
        
        // Then add our laser beam enhancements
        console.log('🔵 Adding enhanced continuous laser beam...');
        integrateEnhancedLaserBeam();
    };
    
    // If integrateWeaponSystem was already called, apply our enhancements now
    if (window.gameState && window.ProjectileType) {
        console.log('🔵 Weapon system already initialized, applying laser beam enhancements now');
        setTimeout(integrateEnhancedLaserBeam, 500);
    }
    
    // Main integration function
    function integrateEnhancedLaserBeam() {
        if (!window.gameState || !window.ProjectileType || !window.PROJECTILE_CONFIGS) {
            console.log('🔵 Game not ready yet, retrying in 500ms...');
            setTimeout(integrateEnhancedLaserBeam, 500);
            return;
        }
        
        const { ProjectileType, PROJECTILE_CONFIGS, player, camera, gameState, obstacles, getScreenX } = window;
        
        // Make sure we have the laser beam type
        if (!ProjectileType.LASER_BEAM) {
            console.error('❌ Laser Beam projectile type not found!');
            return;
        }
        
        console.log('🔵 Enhancing Laser Beam weapon...');
        
        // Keep track of key state
        let isWKeyDown = false;
        
        // Create a global flag to track if the continuous laser is active
        window.continuousLaserActive = false;
        
        // 1. Update the projectile configuration
        PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM] = {
            name: "🔵 Laser Beam",
            desc: "Continuous energy beam, hold W to fire",
            cooldown: 30,      // Cooldown after stopping the beam
            cost: 1,           // Cost per tick (continuous cost)
            costInterval: 10,  // How often to apply the cost (every 10 frames)
            damage: 0.3,       // Damage per tick (reduced for continuous)
            damageInterval: 6, // How often to apply damage (every 6 frames)
            speed: 0,          // Instant
            penetration: true,
            range: 800,
            continuous: true   // Mark as continuous weapon
        };
        
        // 2. Define helper functions
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
        
        // FIXED: Improved key detection for continuous firing
        function isLaserKeyPressed() {
            return isWKeyDown;
        }
        
        // 3. Enhanced laser beam functions
        function fireLaserBeam(gameStateParam, config) {
            // Ensure projectileSystem is available
            const projectileSystem = window.projectileSystem;
            if (!projectileSystem) return false;
            
            // If there's already an active laser beam, just update its position
            if (projectileSystem.laserBeams && projectileSystem.laserBeams.length > 0) {
                // Keep the laser beam alive and update its position
                updateActiveLaserBeam(gameStateParam);
                return true;
            }
            
            console.log(`Creating new laser beam`);
            
            // FIXED: Mark the continuous laser as active
            window.continuousLaserActive = true;
            
            // Create instant laser beam
            // MODIFIED: Adjusted Y position by 20px down
            const laserY = player.y + player.height / 2 + 20;
            // MODIFIED: Adjusted X position by 20px forward in facing direction
            const startX = player.facingDirection === 1 ? 
                player.x + player.width + 20 : 
                player.x - 20;
            const endX = player.facingDirection === 1 ? 
                Math.min(startX + config.range, camera.x + CANVAS.width + 200) :
                Math.max(startX - config.range, camera.x - 200);
            
            const laser = {
                startX: startX,
                endX: endX,
                y: laserY,
                direction: player.facingDirection,
                damage: config.damage,
                damageInterval: config.damageInterval || 6,
                damageTimer: 0,
                life: 300, // Longer lifetime for continuous beam
                maxLife: 300,
                costTimer: 0,
                costInterval: config.costInterval || 10,
                range: config.range || 800,
                piercing: config.penetration,
                type: ProjectileType.LASER_BEAM,
                hitTargets: new Set(),
                lastHitCheck: 0,
                hitCheckInterval: 5, // Check for hits every 5 frames
                id: Date.now() + Math.random() // Unique ID for tracking
            };
            
            if (!projectileSystem.laserBeams) {
                projectileSystem.laserBeams = [];
            }
            
            projectileSystem.laserBeams.push(laser);
            console.log(`Laser created with ID: ${laser.id}`);
            
            // FIXED: Play laser sound when created
            if (window.soundManager) {
                window.soundManager.play(1200, 0.3, 'sine');
                setTimeout(() => window.soundManager.play(800, 0.2, 'sine'), 50);
            }
            
            // Don't apply cooldown yet since this is continuous
            return true;
        }
        
        function updateActiveLaserBeam(gameStateParam) {
            const projectileSystem = window.projectileSystem;
            if (!projectileSystem || !projectileSystem.laserBeams || projectileSystem.laserBeams.length === 0) return;
            
            const laser = projectileSystem.laserBeams[0];
            
            // Update position
            // MODIFIED: Adjusted Y position by 20px down
            const laserY = player.y + player.height / 2 + 20;
            // MODIFIED: Adjusted X position by 20px forward in facing direction
            const startX = player.facingDirection === 1 ? 
                player.x + player.width + 20 : 
                player.x - 20;
            const endX = player.facingDirection === 1 ? 
                Math.min(startX + laser.range, camera.x + CANVAS.width + 200) :
                Math.max(startX - laser.range, camera.x - 200);
            
            laser.startX = startX;
            laser.endX = endX;
            laser.y = laserY;
            laser.direction = player.facingDirection;
            
            // FIXED: Keep the laser alive while key is held
            laser.life = laser.maxLife;
            
            // Apply cost at intervals
            laser.costTimer += gameStateParam.deltaTime || 1;
            if (laser.costTimer >= laser.costInterval) {
                laser.costTimer = 0;
                
                // Deduct cost if not in berserker mode
                if (!gameStateParam.isBerserker) {
                    const config = PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM];
                    gameStateParam.bullets -= config.cost;
                    
                    // If we've run out of bullets, stop the laser
                    if (gameStateParam.bullets <= 0) {
                        stopLaserBeam();
                        return false;
                    }
                }
            }
            
            // Check for hits at intervals
            laser.lastHitCheck += gameStateParam.deltaTime || 1;
            if (laser.lastHitCheck >= laser.hitCheckInterval) {
                laser.lastHitCheck = 0;
                
                // Clear hit targets to allow continuous damage
                laser.hitTargets.clear();
                
                // Process hits
                processLaserHits(laser, gameStateParam);
            }
            
            return true;
        }
        
        function stopLaserBeam() {
            const projectileSystem = window.projectileSystem;
            if (!projectileSystem || !projectileSystem.laserBeams || projectileSystem.laserBeams.length === 0) return;
            
            // Instead of removing immediately, reduce life for visual fadeout
            const laser = projectileSystem.laserBeams[0];
            laser.life = 30; // Short life for fadeout effect
            laser.stopping = true;
            
            // FIXED: Mark the continuous laser as inactive
            window.continuousLaserActive = false;
            
            // Apply cooldown now that the beam is stopping
            const config = PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM];
            projectileSystem[getCooldownProperty(ProjectileType.LASER_BEAM)] = config.cooldown;
            
            // FIXED: Play stop sound
            if (window.soundManager) {
                window.soundManager.play(800, 0.1, 'sine');
                setTimeout(() => window.soundManager.play(400, 0.1, 'sine'), 50);
            }
        }
        
        // FIXED: Completely revised update function for laser beams
        function updateLaserBeams(gameStateParam) {
            const projectileSystem = window.projectileSystem;
            if (!projectileSystem) return;
            
            // Initialize laserBeams array if it doesn't exist
            if (!projectileSystem.laserBeams) {
                projectileSystem.laserBeams = [];
            }
            
            // Get current weapon type
            const currentType = window.getCurrentProjectileType ? 
                window.getCurrentProjectileType() : 
                (projectileSystem.equippedTypes && projectileSystem.currentTypeIndex !== undefined ?
                    projectileSystem.equippedTypes[projectileSystem.currentTypeIndex] : null);
            
            // Check if we should be firing the laser
            const shouldFireLaser = 
                isLaserKeyPressed() && 
                currentType === ProjectileType.LASER_BEAM && 
                gameStateParam.gameRunning && 
                gameStateParam.currentState === 'playing';
            
            // Handle continuous laser beam
            if (shouldFireLaser) {
                // If no active laser and not on cooldown, create a new one
                if (projectileSystem.laserBeams.length === 0) {
                    const cooldownProperty = getCooldownProperty(ProjectileType.LASER_BEAM);
                    if (!projectileSystem[cooldownProperty] || projectileSystem[cooldownProperty] <= 0) {
                        const config = PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM];
                        fireLaserBeam(gameStateParam, config);
                    }
                } else {
                    // Update the existing beam
                    updateActiveLaserBeam(gameStateParam);
                }
            } else if (window.continuousLaserActive) {
                // Key not pressed but laser is active, stop it
                stopLaserBeam();
            }
            
            // Process damage for active lasers
            for (const laser of projectileSystem.laserBeams) {
                if (laser.damageTimer === undefined) laser.damageTimer = 0;
                
                laser.damageTimer += gameStateParam.deltaTime || 1;
                if (laser.damageTimer >= laser.damageInterval) {
                    laser.damageTimer = 0;
                    
                    // Apply damage to any targets in the beam
                    processLaserHits(laser, gameStateParam);
                }
            }
            
            // Update existing laser beams (visual effects, fadeout, etc.)
            for (let i = projectileSystem.laserBeams.length - 1; i >= 0; i--) {
                const laser = projectileSystem.laserBeams[i];
                
                if (!shouldFireLaser || laser.stopping) {
                    // Gradually reduce life for beams that are stopping
                    laser.life -= gameStateParam.deltaTime || 1;
                    
                    // Remove when expired
                    if (laser.life <= 0) {
                        console.log(`Removing laser beam ${i}, remaining: ${projectileSystem.laserBeams.length - 1}`);
                        projectileSystem.laserBeams.splice(i, 1);
                    }
                }
            }
        }
        
        // FIXED: Improved laser hit detection with more accurate height check
        function processLaserHits(laser, gameStateParam) {
            const hitEnemies = [];
            
            // Define a list of environmental objects that should not be hit by player attacks
            const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
            
            // Calculate effective end X for collision detection (based on current beam length)
            const fullLength = Math.abs(laser.endX - laser.startX);
            const lifeRatio = laser.life / laser.maxLife;
            const currentLength = fullLength * Math.min(1, lifeRatio * 1.5);
            
            const effectiveEndX = laser.direction > 0 ? 
                laser.startX + currentLength : 
                laser.startX - currentLength;
            
            for (const obstacle of obstacles) {
                // Skip environmental objects and already hit targets
                if (environmentalTypes.includes(obstacle.type)) continue;
                if (laser.hitTargets.has(obstacle)) continue;
                
                // Check if enemy intersects with laser line
                const enemyCenterX = obstacle.x + obstacle.width/2;
                const enemyCenterY = obstacle.y + obstacle.height/2;
                
                // FIXED: More accurate height check with obstacle height
                const heightCheck = Math.abs(enemyCenterY - laser.y) < (obstacle.height/2 + 8);
                
                // Simple line intersection check with effective end
                const isOnLaserPath = heightCheck &&
                                     ((laser.direction > 0 && enemyCenterX > laser.startX && enemyCenterX < effectiveEndX) ||
                                      (laser.direction < 0 && enemyCenterX < laser.startX && enemyCenterX > effectiveEndX));
                
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
                
                if (window.createLightningEffect) {
                    window.createLightningEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                }
                
                // Check for enemy death and handle it properly
                if (enemy.health <= 0) {
                    if (window.handleProjectileEnemyDeath) {
                        window.handleProjectileEnemyDeath(enemy, gameStateParam, damage);
                    } else {
                        // Fallback enemy death handler
                        const index = obstacles.indexOf(enemy);
                        if (index > -1) {
                            obstacles.splice(index, 1);
                        }
                    }
                }
            });
        }
        
        function renderLaserBeams(ctx) {
            if (!ctx) return;
            
            const projectileSystem = window.projectileSystem;
            if (!projectileSystem || !projectileSystem.laserBeams) return;
            
            for (let i = 0; i < projectileSystem.laserBeams.length; i++) {
                const laser = projectileSystem.laserBeams[i];
                
                // MODIFIED: Implement faster fadeout for end of beam
                // Calculate base alpha based on remaining life
                const lifeRatio = laser.life / laser.maxLife;
                const baseAlpha = Math.max(0.4, lifeRatio);
                
                // Calculate beam length based on life (beam end fades faster)
                const fullLength = Math.abs(laser.endX - laser.startX);
                const currentLength = fullLength * Math.min(1, lifeRatio * 1.5);
                
                const effectiveEndX = laser.direction > 0 ? 
                    laser.startX + currentLength : 
                    laser.startX - currentLength;
                    
                const startScreenX = getScreenX(laser.startX);
                const endScreenX = getScreenX(effectiveEndX);
                
                // FIXED: Add pulse effect for continuous beam
                const pulseEffect = window.continuousLaserActive ? 
                    Math.sin(Date.now() * 0.005) * 0.1 + 0.9 : 1.0;
                
                // Save context state
                ctx.save();
                
                // Outer glow effect (draw first, behind main beam)
                ctx.strokeStyle = `rgba(0, 255, 255, ${baseAlpha * 0.3 * pulseEffect})`;
                ctx.lineWidth = 16;
                ctx.beginPath();
                ctx.moveTo(startScreenX, laser.y);
                ctx.lineTo(endScreenX, laser.y);
                ctx.stroke();
                
                // Main beam (thicker and more visible)
                ctx.strokeStyle = `rgba(0, 255, 255, ${baseAlpha * 0.9 * pulseEffect})`;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(startScreenX, laser.y);
                ctx.lineTo(endScreenX, laser.y);
                ctx.stroke();
                
                // Core beam (bright white center)
                ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha * pulseEffect})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(startScreenX, laser.y);
                ctx.lineTo(endScreenX, laser.y);
                ctx.stroke();
                
                // Inner glow
                ctx.strokeStyle = `rgba(255, 255, 255, ${baseAlpha * 0.8 * pulseEffect})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(startScreenX, laser.y);
                ctx.lineTo(endScreenX, laser.y);
                ctx.stroke();
                
                ctx.restore();
            }
        }
        
        // 4. FIXED: Improved key handling for continuous weapons
        function addContinuousWeaponListeners() {
            // Track W key state for continuous firing
            document.addEventListener('keydown', function(event) {
                if (event.code === 'KeyW') {
                    isWKeyDown = true;
                }
            });
            
            document.addEventListener('keyup', function(event) {
                if (event.code === 'KeyW') {
                    isWKeyDown = false;
                    
                    // If the laser is active, stop it
                    if (window.continuousLaserActive) {
                        stopLaserBeam();
                    }
                }
            });
            
            // Handle lost focus (e.g., tabbing out of window)
            window.addEventListener('blur', function() {
                isWKeyDown = false;
                if (window.continuousLaserActive) {
                    stopLaserBeam();
                }
            });
            
            console.log('🔵 Added continuous weapon key listeners');
        }
        
        // 5. Override original functions
        
        // Store original functions to call later if needed
        const originalUpdateLaserBeams = window.updateLaserBeams;
        const originalRenderLaserBeams = window.renderLaserBeams;
        const originalFireLaserBeam = window.fireLaserBeam;
        const originalProcessLaserHits = window.processLaserHits;
        const originalUpdateEnhancedProjectiles = window.updateEnhancedProjectiles;
        
        // Replace with our enhanced versions
        window.fireLaserBeam = fireLaserBeam;
        window.updateLaserBeams = updateLaserBeams;
        window.renderLaserBeams = renderLaserBeams;
        window.processLaserHits = processLaserHits;
        
        // Modify updateEnhancedProjectiles to ensure our updates are called
        if (window.updateEnhancedProjectiles) {
            window.updateEnhancedProjectiles = function(gameStateParam) {
                // Call original function first
                if (originalUpdateEnhancedProjectiles) {
                    originalUpdateEnhancedProjectiles(gameStateParam);
                }
                
                // Make sure our laser beam update is called
                updateLaserBeams(gameStateParam);
            };
        }
        
        // FIXED: Ensure laser beam update is called in regular game loop
        const originalUpdate = window.update;
        if (originalUpdate) {
            window.update = function() {
                // Call original update
                originalUpdate();
                
                // Also update laser beams if needed
                if (window.continuousLaserActive || 
                    (window.projectileSystem && window.projectileSystem.laserBeams && 
                     window.projectileSystem.laserBeams.length > 0)) {
                    updateLaserBeams(window.gameState);
                }
            };
        }
        
        // Add our helper functions to the global scope
        window.updateActiveLaserBeam = updateActiveLaserBeam;
        window.stopLaserBeam = stopLaserBeam;
        window.isLaserKeyPressed = isLaserKeyPressed;
        
        // Add key listeners for continuous weapons
        addContinuousWeaponListeners();
        
        console.log('🔵 Enhanced continuous laser beam successfully integrated!');
        console.log('🔵 Press and hold W to fire a continuous laser beam');
    }
})();