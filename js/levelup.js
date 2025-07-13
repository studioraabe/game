// js/levelup-notification-complete.js - Complete arcade-style level up notification system

(function() {
    
    // Track last level to detect level ups
    let lastLevel = 1;
    let notificationActive = false;
    let initialized = false;

    // Create the level up notification
    function showLevelUpNotification(level) {
        
        if (notificationActive) {
            console.log('⚠️ Notification already active, skipping');
            return;
        }
        
        notificationActive = true;
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'level-up-notification';
        notification.style.cssText = `
            position: absolute;
            top: 30%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 10000;
            pointer-events: none;
        `;
        
        notification.innerHTML = `
            <div class="level-up-text" style="
                font-family: 'Rajdhani', sans-serif;
                font-size: 72px;
                font-weight: 900;
                color: #00ff88;
                text-shadow: 
                    0 0 20px rgba(0, 255, 136, 0.8),
                    0 0 40px rgba(0, 255, 136, 0.6),
                    0 0 60px rgba(0, 255, 136, 0.4),
                    0 4px 8px rgba(0, 0, 0, 0.8);
                letter-spacing: 4px;
                margin-bottom: 10px;
                animation: levelUpSlam 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            ">LEVEL ${level}</div>
            <div class="level-up-subtitle" style="
                font-family: 'Rajdhani', sans-serif;
                font-size: 24px;
                font-weight: 600;
                color: #ffffff;
                text-shadow: 
                    0 0 10px rgba(255, 255, 255, 0.5),
                    0 2px 4px rgba(0, 0, 0, 0.8);
                letter-spacing: 2px;
                opacity: 0;
                animation: fadeInUp 0.5s ease-out 0.3s forwards;
            ">POWER INCREASED!</div>
        `;
        
        // Add to game container
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) {
            console.error('❌ Game container not found!');
            notificationActive = false;
            return;
        }
        
        gameContainer.appendChild(notification);
        
        // Play sound effect
        try {
            if (window.soundManager && window.soundManager.powerUp) {
                window.soundManager.powerUp();
                // Additional triumphant sound
                setTimeout(() => {
                    if (window.soundManager && window.soundManager.play) {
                        window.soundManager.play(800, 0.3, 'sine');
                    }
                }, 100);
                setTimeout(() => {
                    if (window.soundManager && window.soundManager.play) {
                        window.soundManager.play(1200, 0.3, 'sine');
                    }
                }, 200);
            }
        } catch (e) {
            console.log('⚠️ Sound effects failed:', e);
        }
        
        // Create particle effects
        createLevelUpParticles();
        
        // Remove after animation
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translate(-50%, -50%) scale(0.9) translateY(-20px)';
            notification.style.transition = 'all 0.5s ease-in';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
                notificationActive = false;
                console.log('✅ Notification removed');
            }, 500);
        }, 2000);
    }

    // Create particle effects for level up
    function createLevelUpParticles() {
        const gameContainer = document.getElementById('gameContainer');
        if (!gameContainer) return;
        
        // Create multiple particles
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'level-up-particle';
            
            // Random position around center
            const angle = (Math.PI * 2 * i) / 20;
            const distance = 100 + Math.random() * 50;
            const x = 50 + Math.cos(angle) * distance * 0.3;
            const y = 30 + Math.sin(angle) * distance * 0.3; // 30% to match notification position
            
            particle.style.cssText = `
                position: absolute;
                width: 6px;
                height: 6px;
                background: #00ff88;
                border-radius: 50%;
                pointer-events: none;
                box-shadow: 0 0 10px #00ff88;
                left: ${x}%;
                top: ${y}%;
                opacity: 1;
                z-index: 9999;
                animation: particleBurst 2s ease-out forwards;
            `;
            
            gameContainer.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, 2500);
        }
    }

    // Add styles
    function addLevelUpStyles() {
        if (document.getElementById('levelUpStyles')) return;
        
        const style = document.createElement('style');
        style.id = 'levelUpStyles';
        style.textContent = `
            @keyframes levelUpSlam {
                0% {
                    transform: scale(0.3) rotate(-10deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2) rotate(5deg);
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
            
            @keyframes fadeInUp {
                0% {
                    opacity: 0;
                    transform: translateY(20px);
                }
                100% {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes particleBurst {
                0% {
                    transform: translate(0, 0) scale(0);
                    opacity: 1;
                }
                50% {
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--tx, 100px), var(--ty, -100px)) scale(1);
                    opacity: 0;
                }
            }
            
            .level-up-particle:nth-child(odd) {
                --tx: -100px;
                --ty: -50px;
            }
            
            .level-up-particle:nth-child(even) {
                --tx: 100px;
                --ty: -80px;
            }
            
            .level-up-particle:nth-child(3n) {
                --tx: 0px;
                --ty: -120px;
            }
        `;
        
        document.head.appendChild(style);
    }

    // Check for level up
    function checkForLevelUp() {
        if (!window.gameState) return;
        
        const currentLevel = window.gameState.level || 1;
        
        if (currentLevel > lastLevel) {
            showLevelUpNotification(currentLevel);
            lastLevel = currentLevel;
        }
    }

    // Initialize and hook into game
    function init() {
        if (initialized) return;
        
        
        // Add styles
        addLevelUpStyles();
        
        // Set initial level
        if (window.gameState && window.gameState.level) {
            lastLevel = window.gameState.level;
        }
        
        // Hook into the game update loop
        if (window.update) {
            const originalUpdate = window.update;
            window.update = function() {
                originalUpdate();
                checkForLevelUp();
            };
        }
        
        // Also check periodically as backup
        setInterval(checkForLevelUp, 500);
        
        initialized = true;
        
        // Test notification (remove this in production)
        // setTimeout(() => {
        //     console.log('🧪 Testing notification...');
        //     showLevelUpNotification(99);
        // }, 3000);
    }

    // Make function globally available for testing
    window.showLevelUpNotification = showLevelUpNotification;
    window.testLevelUpNotification = function() {
        console.log('🧪 Manual test triggered');
        showLevelUpNotification(99);
    };

    // Wait for everything to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 2000);
        });
    } else {
        setTimeout(init, 2000);
    }

})();