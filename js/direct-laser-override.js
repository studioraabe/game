// direct-laser-override.js - Add to your HTML after all other scripts
// This version uses direct override approach to ensure the changes take effect

(function() {
    // Wait a short time for everything to load
    setTimeout(function() {
        integrateDirectLaserBeam();
    }, 1000);
    
    function integrateDirectLaserBeam() {
        if (!window.ProjectileType || !window.PROJECTILE_CONFIGS) {
            return;
        }
        
        // Store key references to required objects
        const { ProjectileType, PROJECTILE_CONFIGS } = window;
        
        // Global key state tracking
        let isWKeyDown = false;
        window.continuousLaserActive = false;
        
        // KEY DETECTION SYSTEM
        // ---------------------
        // 1. Override the keyboard event handlers
        document.addEventListener('keydown', function(event) {
            if (event.code === 'KeyW') {
                
                // Check if we should start the laser
                checkLaserActivation();
            }
        }, true);
        
        document.addEventListener('keyup', function(event) {
            if (event.code === 'KeyW') {
                isWKeyDown = false;
                
                // Stop the laser if it's active
                if (window.continuousLaserActive) {
                    stopLaser();
                }
            }
        }, true);
        
        // Also handle window blur to prevent stuck laser
        window.addEventListener('blur', function() {
            if (isWKeyDown) {
                isWKeyDown = false;
                if (window.continuousLaserActive) {
                    stopLaser();
                }
            }
        });
        
        // LASER BEAM CONFIGURATION
        // -----------------------
        // 2. Override the laser beam configuration
        PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM] = {
            name: "🔵 Continuous Laser",
            desc: "Hold W key to fire a continuous beam",
            cooldown: 300,      // Cooldown after stopping
            cost: 5,           // Energy cost per tick
            costInterval: 1,  // Apply cost every 10 frames
            damage: 5.8,       // Damage per tick
            damageInterval: 1, // Apply damage every 6 frames
            speed: 0,
            penetration: true,
            range: 800,
            continuous: true
        };
        
        // CORE LASER BEAM FUNCTIONS
        // ------------------------
        // Function to check if we should start the laser
        function checkLaserActivation() {
            if (!window.gameState || !window.gameState.gameRunning) return;
            
            // Get current weapon type
            let currentType = null;
            if (window.getCurrentProjectileType) {
                currentType = window.getCurrentProjectileType();
            } else if (window.projectileSystem) {
                currentType = window.projectileSystem.equippedTypes[window.projectileSystem.currentTypeIndex];
            }
            
            // If current weapon is laser beam and W key is down, start the laser
            if (currentType === ProjectileType.LASER_BEAM && isWKeyDown && !window.continuousLaserActive) {
                startLaser();
            }
        }
        
        // Function to create a new laser beam
        function startLaser() {
            if (!window.player || !window.projectileSystem) return;
            
            window.continuousLaserActive = true;
            
            // Clean up any existing laser beams
            if (!window.projectileSystem.laserBeams) {
                window.projectileSystem.laserBeams = [];
            } else {
                window.projectileSystem.laserBeams = [];
            }
            
            // Create a new laser beam
            const laser = {
                startX: 0,
                endX: 0,
                y: 0,
                direction: window.player.facingDirection,
                damage: PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM].damage,
                damageInterval: PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM].damageInterval,
                damageTimer: 0,
                life: 10000,  // Very long life for continuous beam
                maxLife: 10000,
                costTimer: 0,
                costInterval: PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM].costInterval,
                range: PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM].range,
                hitTargets: new Set(),
                lastHitCheck: 0,
                hitCheckInterval: 5,
                id: Date.now()
            };
            
            // Update position
            updateLaserPosition(laser);
            
            // Add to the array
            window.projectileSystem.laserBeams.push(laser);
            
            // Play sound
            if (window.soundManager) {
                window.soundManager.play(1200, 0.3, 'sine');
                setTimeout(() => window.soundManager.play(800, 0.2, 'sine'), 50);
            }
            
            // Start the update loop
            if (!window._laserUpdateInterval) {
                window._laserUpdateInterval = setInterval(updateLaser, 16); // ~60fps
            }
        }
        
        // Function to stop the laser beam
        function stopLaser() {
            window.continuousLaserActive = false;
            
            // Mark the laser for fadeout
            if (window.projectileSystem && window.projectileSystem.laserBeams) {
                for (const laser of window.projectileSystem.laserBeams) {
                    laser.life = 30; // Short life for fadeout
                    laser.stopping = true;
                }
            }
            
            // Apply cooldown
            if (window.projectileSystem) {
                window.projectileSystem.laserCooldown = PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM].cooldown;
            }
            
            // Play sound
            if (window.soundManager) {
                window.soundManager.play(800, 0.1, 'sine');
                setTimeout(() => window.soundManager.play(400, 0.1, 'sine'), 50);
            }
        }
        
        // Function to update the laser beam
        function updateLaser() {
            if (!window.gameState || !window.gameState.gameRunning || 
                !window.projectileSystem || !window.projectileSystem.laserBeams) {
                return;
            }
            
            // Skip if paused
            if (window.gameState.currentState !== 'playing') {
                return;
            }
            
            // Check if we should keep the laser active
            const shouldBeActive = isWKeyDown && window.continuousLaserActive;
            
            // Process each laser beam
            for (let i = window.projectileSystem.laserBeams.length - 1; i >= 0; i--) {
                const laser = window.projectileSystem.laserBeams[i];
                
                if (shouldBeActive) {
                    // Update position for active laser
                    updateLaserPosition(laser);
                    
                    // Apply energy cost
                    laser.costTimer += 1;
                    if (laser.costTimer >= laser.costInterval) {
                        laser.costTimer = 0;
                        
                        if (!window.gameState.isBerserker) {
                            window.gameState.bullets -= PROJECTILE_CONFIGS[ProjectileType.LASER_BEAM].cost;
                            
                            // Stop if out of energy
                            if (window.gameState.bullets <= 0) {
                                stopLaser();
                                break;
                            }
                        }
                    }
                    
                    // Apply damage
                    laser.damageTimer += 1;
                    if (laser.damageTimer >= laser.damageInterval) {
                        laser.damageTimer = 0;
                        laser.hitTargets.clear();
                        
                        // Process hits
                        processLaserHits(laser);
                    }
                } else {
                    // Fadeout for stopping laser
                    laser.life -= 1;
                    
                    // Remove when expired
                    if (laser.life <= 0) {
                        window.projectileSystem.laserBeams.splice(i, 1);
                        
                        // Stop update loop if no more lasers
                        if (window.projectileSystem.laserBeams.length === 0 && window._laserUpdateInterval) {
                            clearInterval(window._laserUpdateInterval);
                            window._laserUpdateInterval = null;
                        }
                    }
                }
            }
        }
        
        // Function to update the laser position
        function updateLaserPosition(laser) {
            if (!window.player || !window.camera || !window.CANVAS) return;
            
            // MODIFIED: Adjusted Y position by 20px down
            laser.y = window.player.y + window.player.height / 2 + 20;
            
            // MODIFIED: Adjusted X position by 20px forward in facing direction
            laser.direction = window.player.facingDirection;
            laser.startX = window.player.facingDirection === 1 ? 
                window.player.x + window.player.width + 20 : 
                window.player.x - 20;
                
            laser.endX = window.player.facingDirection === 1 ? 
                Math.min(laser.startX + laser.range, window.camera.x + window.CANVAS.width + 200) :
                Math.max(laser.startX - laser.range, window.camera.x - 200);
        }
        
        // Function to process laser hits
        function processLaserHits(laser) {
            if (!window.obstacles || !window.gameState) return;
            
            const hitEnemies = [];
            const environmentalTypes = ['boltBox', 'rock', 'teslaCoil', 'frankensteinTable', 'sarcophagus'];
            
            // Calculate effective beam length
            const lifeRatio = laser.life / laser.maxLife;
            const fullLength = Math.abs(laser.endX - laser.startX);
            const currentLength = fullLength * Math.min(1, lifeRatio * 1.5);
            
            const effectiveEndX = laser.direction > 0 ? 
                laser.startX + currentLength : 
                laser.startX - currentLength;
            
            // Check for hits
            for (const obstacle of window.obstacles) {
                // Skip environmental objects and already hit targets
                if (environmentalTypes.includes(obstacle.type)) continue;
                if (laser.hitTargets.has(obstacle)) continue;
                
                // Check if enemy intersects with laser line
                const enemyCenterX = obstacle.x + obstacle.width/2;
                const enemyCenterY = obstacle.y + obstacle.height/2;
                
                // More accurate height check
                const heightCheck = Math.abs(enemyCenterY - laser.y) < (obstacle.height/2 + 8);
                
                // Line intersection check
                const isOnLaserPath = heightCheck &&
                                     ((laser.direction > 0 && enemyCenterX > laser.startX && enemyCenterX < effectiveEndX) ||
                                      (laser.direction < 0 && enemyCenterX < laser.startX && enemyCenterX > effectiveEndX));
                
                if (isOnLaserPath) {
                    laser.hitTargets.add(obstacle);
                    hitEnemies.push(obstacle);
                }
            }
            
            // Apply damage
            hitEnemies.forEach(enemy => {
                const damage = Math.floor(laser.damage * (window.gameState.baseDamage || 20));
                enemy.health -= damage;
                
                // Show damage number
                if (window.createDamageNumber) {
                    window.createDamageNumber(
                        enemy.x + enemy.width/2,
                        enemy.y + enemy.height/4,
                        damage
                    );
                }
                
                // Visual effect
                if (window.createLightningEffect) {
                    window.createLightningEffect(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                }
                
                // Handle enemy death
                if (enemy.health <= 0) {
                    if (window.handleProjectileEnemyDeath) {
                        window.handleProjectileEnemyDeath(enemy, window.gameState, damage);
                    } else {
                        // Simple fallback
                        const index = window.obstacles.indexOf(enemy);
                        if (index > -1) {
                            window.obstacles.splice(index, 1);
                        }
                    }
                }
            });
        }
        
        // RENDER FUNCTION OVERRIDE
        // -----------------------
        // 3. Override the render function
        const originalRenderLaserBeams = window.renderLaserBeams;
        window.renderLaserBeams = function(ctx) {
            if (!ctx || !window.projectileSystem || !window.projectileSystem.laserBeams) return;
            if (!window.getScreenX) return;
            
            for (const laser of window.projectileSystem.laserBeams) {
                // Calculate alpha and length based on life
                const lifeRatio = laser.life / laser.maxLife;
                const baseAlpha = Math.max(0.4, lifeRatio);
                
                // Calculate beam length with faster fadeout for end
                const fullLength = Math.abs(laser.endX - laser.startX);
                const currentLength = fullLength * Math.min(1, lifeRatio * 1.5);
                
                const effectiveEndX = laser.direction > 0 ? 
                    laser.startX + currentLength : 
                    laser.startX - currentLength;
                
                const startScreenX = window.getScreenX(laser.startX);
                const endScreenX = window.getScreenX(effectiveEndX);
                
                // Add pulse effect for continuous beam
                const pulseEffect = window.continuousLaserActive ? 
                    Math.sin(Date.now() * 0.005) * 0.1 + 0.9 : 1.0;
                
                // Render the beam
                ctx.save();
                
                // Outer glow
                ctx.strokeStyle = `rgba(0, 255, 255, ${baseAlpha * 0.3 * pulseEffect})`;
                ctx.lineWidth = 16;
                ctx.beginPath();
                ctx.moveTo(startScreenX, laser.y);
                ctx.lineTo(endScreenX, laser.y);
                ctx.stroke();
                
                // Main beam
                ctx.strokeStyle = `rgba(0, 255, 255, ${baseAlpha * 0.9 * pulseEffect})`;
                ctx.lineWidth = 8;
                ctx.beginPath();
                ctx.moveTo(startScreenX, laser.y);
                ctx.lineTo(endScreenX, laser.y);
                ctx.stroke();
                
                // Core beam
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
        };
        
        // DIRECT MODIFICATION OF PROJECTILE SYSTEM
        // ---------------------------------------
        // 4. Force projectile system to use our implementation
        // This is a more aggressive approach to ensure the changes take effect
        if (window.projectileSystem) {
            // Add our custom properties
            window.projectileSystem._continuousLaserEnabled = true;
            
            // Make sure our laser is equipped
            if (window.projectileSystem.unlockedTypes && 
                !window.projectileSystem.unlockedTypes.includes(ProjectileType.LASER_BEAM)) {
                window.projectileSystem.unlockedTypes.push(ProjectileType.LASER_BEAM);
            }
            
            if (window.projectileSystem.equippedTypes && 
                !window.projectileSystem.equippedTypes.includes(ProjectileType.LASER_BEAM)) {
                window.projectileSystem.equippedTypes.push(ProjectileType.LASER_BEAM);
            }
            
            // Override fire function
            const originalFireLaserBeam = window.fireLaserBeam;
            window.fireLaserBeam = function(gameStateParam, config) {
                
                // If W key is down, start our continuous laser
                if (isWKeyDown) {
                    startLaser();
                    return true;
                }
                
                // Otherwise fall back to original
                if (originalFireLaserBeam) {
                    return originalFireLaserBeam(gameStateParam, config);
                }
                
                return false;
            };
            
            // Completely override laser update
            window.updateLaserBeams = function(gameStateParam) {
                // We handle this in our own interval
            };
        }
        

        
        // Start checking for laser activation immediately
        if (isWKeyDown) {
            checkLaserActivation();
        }
    }
})();