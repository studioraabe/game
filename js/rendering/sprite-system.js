// FIXED: sprite-system.js - Complete corrected version with proper async handling

import { getScreenX } from '../core/camera.js';

export class SpriteManager {
    constructor() {
        this.sprites = {};
        this.loaded = false;
        this.animations = {}; // Track animation states
    }
    
    async loadSprites() {
        try {
            // Player sprite - existing
            await this.loadSprite('player', {
                imagePath: 'assets/sprites/player.png',
                frameWidth: 480,
                frameHeight: 480,
                animations: {
                    idle: { 
                        row: 0, 
                        frames: 1,
                        frameRate: 1
                    },
                    jump: { 
                        row: 1, 
                        frames: 1,
                        frameRate: 1
                    },
                    run: { 
                        row: 2, 
                        frames: 1,
                        frameRate: 1
                    },
                    shoot: { 
                        row: 3, 
                        frames: 1,
                        frameRate: 1
                    },
                    hit: {
                        row: 4,
                        frames: 1,
                        frameRate: 1
                    }
                }
            });
            
            // FIXED: Skeleton sprite with improved animation settings
            await this.loadSprite('skeleton', {
                imagePath: 'assets/sprites/skeleton.png',
                frameWidth: 480,
                frameHeight: 480,
                animations: {
                    idle: { 
                        row: 0, 
                        frames: 16,
                        frameRate: 8,        // FIXED: Slower for smoother idle
                        loop: true,
                        smooth: true         // FIXED: Enable smooth blending
                    },
                    walk: { 
                        row: 0, 
                        frames: 16,
                        frameRate: 10,       // FIXED: Slightly slower walk cycle
                        loop: true,
                        smooth: true
                    },
                    attack: { 
                        row: 0, 
                        frames: 8,
                        frameRate: 15,       // FIXED: Faster attack
                        loop: false,
                        smooth: false        // Sharp attack frames
                    },
                    hit: {
                        row: 0,
                        frames: 3,
                        frameRate: 20,       // FIXED: Very fast hit reaction
                        loop: false,
                        smooth: false
                    },
                    death: {
                        row: 0,
                        frames: 8,
                        frameRate: 6,        // FIXED: Slower death animation
                        loop: false,
                        smooth: true
                    }
                }
            });
            
            this.loaded = true;
            console.log('✅ All sprites loaded successfully!');
        } catch (error) {
            console.error('❌ Error loading sprites:', error);
            this.loaded = false;
        }
    }
    
    async loadSprite(name, config) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[name] = {
                    image: img,
                    config: config
                };
                
                // Initialize animation states for all entities of this type
                this.animations[name] = {};
                
                console.log(`✅ Loaded sprite: ${name}`);
                resolve();
            };
            img.onerror = () => {
                console.error(`❌ Failed to load sprite: ${name}`);
                reject(new Error(`Failed to load ${name}`));
            };
            img.src = config.imagePath;
        });
    }
    
    // Get or create animation state for a specific entity instance
    getAnimationState(spriteName, entityId, animationName) {
        if (!this.animations[spriteName]) {
            this.animations[spriteName] = {};
        }
        
        if (!this.animations[spriteName][entityId]) {
            this.animations[spriteName][entityId] = {};
        }
        
        if (!this.animations[spriteName][entityId][animationName]) {
            this.animations[spriteName][entityId][animationName] = {
                currentFrame: 0,
                elapsedTime: 0,
                finished: false,
                previousFrame: -1,
                transitionTime: 0
            };
        }
        
        return this.animations[spriteName][entityId][animationName];
    }
    
    // FIXED: Enhanced drawSprite method with better animation smoothing
    drawSprite(ctx, spriteName, animationName, x, y, scale = 1, flipX = false, deltaTime = 1, entityId = 'default') {
        const sprite = this.sprites[spriteName];
        if (!sprite) {
            console.warn(`Sprite not found: ${spriteName}`);
            return false;
        }
        
        const { image, config } = sprite;
        const animation = config.animations[animationName];
        if (!animation) {
            console.warn(`Animation not found: ${animationName} for sprite ${spriteName}`);
            return false;
        }
        
        // Get animation state for this specific entity instance
        const animState = this.getAnimationState(spriteName, entityId, animationName);
        
        // FIXED: Improved smoothing control
        const smoothing = animation.smooth !== false && animation.frames > 1;
        
        // Single frame shortcut
        if (animation.frames === 1) {
            const sourceX = 0;
            const sourceY = animation.row * config.frameHeight;
            
            ctx.save();
            
            if (flipX) {
                ctx.scale(-1, 1);
                x = -x - (config.frameWidth * scale);
            }
            
            ctx.drawImage(
                image,
                sourceX, sourceY, config.frameWidth, config.frameHeight,
                x, y, config.frameWidth * scale, config.frameHeight * scale
            );
            
            ctx.restore();
            return true;
        }
        
        // FIXED: Enhanced multi-frame animation with better timing
        const normalizedDeltaTime = Math.min(deltaTime, 2);
        
        // Update animation timer
        animState.elapsedTime += normalizedDeltaTime;
        
        // FIXED: Better frame duration calculation
        const frameDuration = Math.max(60 / animation.frameRate, 1);
        
        // Update frame if needed
        if (animState.elapsedTime >= frameDuration) {
            const frameAdvance = Math.floor(animState.elapsedTime / frameDuration);
            animState.elapsedTime = animState.elapsedTime % frameDuration;
            animState.currentFrame += frameAdvance;
            
            // Handle looping with better logic
            if (animState.currentFrame >= animation.frames) {
                if (animation.loop !== false) {
                    animState.currentFrame = animState.currentFrame % animation.frames;
                    animState.finished = false;
                } else {
                    animState.currentFrame = animation.frames - 1;
                    animState.finished = true;
                }
            }
        }
        
        // Update transition timer
        if (animState.transitionTime > 0) {
            animState.transitionTime -= normalizedDeltaTime;
        }
        
        ctx.save();
        
        if (flipX) {
            ctx.scale(-1, 1);
            x = -x - (config.frameWidth * scale);
        }
        
        // FIXED: Enhanced smooth frame blending
        if (smoothing && !animState.finished) {
            const frameProgress = animState.elapsedTime / frameDuration;
            
            // Only blend if we have reasonable frame progress
            if (frameProgress > 0.1 && frameProgress < 0.9 && animState.currentFrame > 0) {
                // Draw previous frame
                const prevFrame = (animState.currentFrame - 1 + animation.frames) % animation.frames;
                const prevSourceX = prevFrame * config.frameWidth;
                const prevSourceY = animation.row * config.frameHeight;
                
                const easedProgress = this.easeInOutSine(frameProgress);
                const prevAlpha = Math.max(0.1, 1 - easedProgress);
                
                ctx.globalAlpha = prevAlpha;
                ctx.drawImage(
                    image,
                    prevSourceX, prevSourceY, config.frameWidth, config.frameHeight,
                    x, y, config.frameWidth * scale, config.frameHeight * scale
                );
            }
            
            // Draw current frame
            const sourceX = animState.currentFrame * config.frameWidth;
            const sourceY = animation.row * config.frameHeight;
            
            if (frameProgress > 0.1 && frameProgress < 0.9 && animState.currentFrame > 0) {
                const easedProgress = this.easeInOutSine(frameProgress);
                ctx.globalAlpha = Math.max(0.1, easedProgress);
            } else {
                ctx.globalAlpha = 1;
            }
            
            ctx.drawImage(
                image,
                sourceX, sourceY, config.frameWidth, config.frameHeight,
                x, y, config.frameWidth * scale, config.frameHeight * scale
            );
        } else {
            // Non-smooth rendering
            const sourceX = animState.currentFrame * config.frameWidth;
            const sourceY = animation.row * config.frameHeight;
            
            ctx.globalAlpha = 1;
            ctx.drawImage(
                image,
                sourceX, sourceY, config.frameWidth, config.frameHeight,
                x, y, config.frameWidth * scale, config.frameHeight * scale
            );
        }
        
        ctx.restore();
        return true;
    }
    
    // FIXED: Better easing functions
    easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
    }
    
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    easeOutQuad(t) {
        return t * (2 - t);
    }
    
    easeInOutQuad(t) {
        return t < 0.5 
            ? 2 * t * t 
            : -1 + (4 - 2 * t) * t;
    }
    
    // FIXED: Enhanced animation state management
    resetAnimation(spriteName, entityId, animationName) {
        const animState = this.getAnimationState(spriteName, entityId, animationName);
        animState.currentFrame = 0;
        animState.elapsedTime = 0;
        animState.finished = false;
        animState.transitionTime = 0;
        animState.previousFrame = -1;
    }
    
    // Check if a non-looping animation has finished
    isAnimationFinished(spriteName, entityId, animationName) {
        if (this.animations[spriteName] && 
            this.animations[spriteName][entityId] && 
            this.animations[spriteName][entityId][animationName]) {
            return this.animations[spriteName][entityId][animationName].finished;
        }
        return false;
    }
    
    // FIXED: Better animation transition handling
    setAnimation(spriteName, entityId, animationName) {
        const currentAnimState = this.animations[spriteName]?.[entityId];
        
        // Store current frame for smooth transition
        if (currentAnimState) {
            const currentAnim = Object.keys(currentAnimState)[0];
            if (currentAnim && currentAnimState[currentAnim]) {
                const previousFrame = currentAnimState[currentAnim].currentFrame;
                this.resetAnimation(spriteName, entityId, animationName);
                
                // Set previous frame for smooth transition
                const newAnimState = this.getAnimationState(spriteName, entityId, animationName);
                newAnimState.previousFrame = previousFrame;
                newAnimState.transitionTime = 5;
            }
        } else {
            this.resetAnimation(spriteName, entityId, animationName);
        }
    }
    
    // Clean up animation states for destroyed entities
    cleanupEntity(spriteName, entityId) {
        if (this.animations[spriteName] && this.animations[spriteName][entityId]) {
            delete this.animations[spriteName][entityId];
        }
    }
}

// Create global sprite manager instance
export const spriteManager = new SpriteManager();

// FIXED: Enhanced Skeleton Sprite Rendering Function
export function drawSkeletonSprite(ctx, skeleton, gameState, screenX = null) {
    if (!spriteManager.loaded || !spriteManager.sprites.skeleton) {
        console.warn('Skeleton sprite not available, using fallback');
        return false;
    }
    
    if (screenX === null) {
        screenX = getScreenX(skeleton.x);
    }
    
    // FIXED: Use the persistent ID created during skeleton creation
    const entityId = skeleton.id; // This is now consistent across frames
    
    const scale = 0.30;
    const facingLeft = false;
    
    // Improved animation state determination
    let currentAnimation = 'idle';
    
    if (skeleton.isDead || skeleton.health <= 0) {
        currentAnimation = 'death';
        skeleton.canDamagePlayer = false;
    } else if (skeleton.damageResistance > 25) {
        currentAnimation = 'hit';
        skeleton.canDamagePlayer = true;
    } else if (skeleton.isAttacking) {
        currentAnimation = 'attack';
        skeleton.canDamagePlayer = true;
    } else if (Math.abs(skeleton.velocityX || 0) > 0.3) {
        currentAnimation = 'walk';
        skeleton.canDamagePlayer = true;
    } else {
        currentAnimation = 'idle';
        skeleton.canDamagePlayer = true;
    }
    
    // Handle animation transitions
    if (skeleton.lastAnimation !== currentAnimation) {
        spriteManager.setAnimation('skeleton', entityId, currentAnimation);
        skeleton.lastAnimation = currentAnimation;
    }
    
    ctx.save();
    
    // Death fade effect
    if (skeleton.isDead || skeleton.health <= 0) {
        const fadeProgress = Math.min((skeleton.deathTimer || 0) / 30, 1);
        ctx.globalAlpha = Math.max(0.1, 1 - fadeProgress);
        ctx.filter = 'grayscale(100%) brightness(0.5)';
    }
    
    // Minimal Y-axis floating
    let adjustedY = skeleton.y;
    if (!skeleton.isDead && skeleton.health > 0) {
        const floatOffset = Math.sin(Date.now() * 0.001 + skeleton.x * 0.01) * 2;
        adjustedY += floatOffset;
    }
    
    // Corruption effect
    if (skeleton.isCorrupted && !skeleton.isDead) {
        const corruptionPulse = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
        const gradient = ctx.createRadialGradient(
            screenX + skeleton.width/2, adjustedY + skeleton.height/2, 0,
            screenX + skeleton.width/2, adjustedY + skeleton.height/2, 30 * scale
        );
        gradient.addColorStop(0, `rgba(139, 0, 139, ${corruptionPulse * 0.3})`);
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(screenX - 15, adjustedY - 15, skeleton.width + 30, skeleton.height + 30);
    }
    
    // Better sprite positioning
    const spriteWidth = 480 * scale;
    const spriteHeight = 480 * scale;
    const spriteX = screenX - (spriteWidth - skeleton.width) / 2;
    const spriteY = adjustedY - (spriteHeight - skeleton.height) / 2 - 10;
    
    // Draw the skeleton sprite
    const success = spriteManager.drawSprite(
        ctx, 'skeleton', currentAnimation,
        spriteX, spriteY, scale, facingLeft,
        gameState.deltaTime, entityId
    );
    
    ctx.restore();
    return success;
}
// Cleanup function
export function cleanupSkeletonEntity(skeletonId) {
    if (spriteManager && spriteManager.cleanupEntity) {
        spriteManager.cleanupEntity('skeleton', skeletonId);
    }
}

// Utility Functions
export async function addSpriteType(name, config) {
    try {
        await spriteManager.loadSprite(name, config);
        console.log(`✅ Added new sprite type: ${name}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to add sprite type ${name}:`, error);
        return false;
    }
}

export function getSpriteStatus() {
    return {
        loaded: spriteManager.loaded,
        spriteCount: Object.keys(spriteManager.sprites).length,
        availableSprites: Object.keys(spriteManager.sprites),
        activeAnimations: Object.keys(spriteManager.animations).reduce((total, sprite) => {
            return total + Object.keys(spriteManager.animations[sprite]).length;
        }, 0)
    };
}

export function cleanupAllAnimations() {
    spriteManager.animations = {};
    console.log('🧹 Cleaned up all animation states');
}

export function getEntityAnimationInfo(spriteName, entityId) {
    if (spriteManager.animations[spriteName] && spriteManager.animations[spriteName][entityId]) {
        return spriteManager.animations[spriteName][entityId];
    }
    return null;
}