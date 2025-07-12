// comprehensive-cooldown-fix.js
// Add this after all your other scripts have loaded

(function() {
    console.log('🔧 Applying comprehensive cooldown fix...');
    
    // Wait for everything to load
    setTimeout(() => {
        // 1. Fix the updateProjectileCooldowns to use consistent timing
        if (window.updateProjectileCooldowns) {
            window.updateProjectileCooldowns = function(gameStateParam) {
                const cooldownKeys = ['normalCooldown', 'laserCooldown', 'shotgunCooldown', 'lightningCooldown', 'seekingCooldown'];
                
                cooldownKeys.forEach(key => {
                    if (window.projectileSystem && window.projectileSystem[key] > 0) {
                        // Use consistent deltaTime, default to 1 if not available
                        const delta = gameStateParam && gameStateParam.deltaTime ? gameStateParam.deltaTime : 1;
                        window.projectileSystem[key] = Math.max(0, window.projectileSystem[key] - delta);
                    }
                });
            };
            console.log('✅ Fixed updateProjectileCooldowns');
        }
        
        // 2. Ensure frameCount is initialized
        if (window.gameState && window.gameState.frameCount === undefined) {
            window.gameState.frameCount = 0;
            console.log('✅ Initialized frameCount');
        }
        
        // 3. Clear ALL competing update intervals
        const intervalsToCheck = [
            'cooldownDisplayInterval',
            'projectileUIUpdateInterval',
            'weaponUpdateInterval'
        ];
        
        intervalsToCheck.forEach(intervalName => {
            if (window[intervalName]) {
                if (typeof window[intervalName] === 'number') {
                    clearInterval(window[intervalName]);
                } else {
                    cancelAnimationFrame(window[intervalName]);
                }
                window[intervalName] = null;
                console.log(`✅ Cleared ${intervalName}`);
            }
        });
        
        // 4. Remove all old UI elements that might be updating
        const elementsToRemove = [
            'projectileUI',
            'projectileCooldownDisplay',
            'weaponCooldownDisplay'
        ];
        
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
                console.log(`✅ Removed ${id}`);
            }
        });
        
        // 5. Override any functions that might be creating new displays
        window.createCooldownDisplay = function() {
            console.log('🚫 Blocked createCooldownDisplay');
        };
        
        window.updateCooldownDisplay = function() {
            // Do nothing
        };
        
        window.createProjectileUI = function() {
            console.log('🚫 Blocked createProjectileUI');
        };
        
        window.updateProjectileUI = function() {
            // Do nothing
        };
        
        // 6. Ensure the main update loop is using consistent timing
        const originalUpdate = window.update;
        if (originalUpdate) {
            window.update = function() {
                // Ensure frameCount increments consistently
                if (window.gameState) {
                    if (window.gameState.frameCount === undefined) {
                        window.gameState.frameCount = 0;
                    }
                    window.gameState.frameCount++;
                }
                
                // Call original update
                originalUpdate();
            };
            console.log('✅ Wrapped update function for consistent frameCount');
        }
        
        // 7. Force a single update mechanism for weapon cooldowns
        // Remove the old one first
        if (window.weaponUpdateInterval) {
            cancelAnimationFrame(window.weaponUpdateInterval);
            window.weaponUpdateInterval = null;
        }
        
        // Create a new, stable update loop
        let lastCooldownUpdate = 0;
        function stableWeaponUpdate(timestamp) {
            // Update visual display every 100ms
            if (timestamp - lastCooldownUpdate >= 100) {
                if (window.updateWeaponCooldowns) {
                    window.updateWeaponCooldowns();
                }
                lastCooldownUpdate = timestamp;
            }
            
            window.weaponUpdateInterval = requestAnimationFrame(stableWeaponUpdate);
        }
        
        // Start the stable update loop
        window.weaponUpdateInterval = requestAnimationFrame(stableWeaponUpdate);
        console.log('✅ Started stable weapon update loop');
        
        console.log('🎯 Comprehensive cooldown fix applied!');
        
    }, 2000); // Wait 2 seconds to ensure everything is loaded
})();