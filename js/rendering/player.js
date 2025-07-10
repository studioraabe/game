// js/rendering/player.js - Fixed Shoot Detection for Enhanced Projectile System

import { activeDropBuffs } from '../systems.js';
import { spriteManager } from './sprite-system.js';
import { GAME_CONSTANTS } from '../core/constants.js';
import { keys } from '../core/input.js';

export function drawPlayer(ctx, x, y, player, gameState) {
    // Use sprite renderer if sprites are loaded
    if (spriteManager.loaded) {
        drawPlayerSprite(ctx, x, y, player, gameState);
        return;
    }
    
    // Fallback to original pixel art renderer
    const scale = 4;
    const isInvulnerable = gameState.postBuffInvulnerability > 0 || gameState.postDamageInvulnerability > 0;
    const isDead = gameState.lives <= 0;
    const facingLeft = player.facingDirection === -1;
    
    // ... rest of your original drawPlayer code ...
    // (Der original Code bleibt als Fallback)
}

// FIXED: Enhanced sprite-based player rendering with better shoot detection
function drawPlayerSprite(ctx, x, y, player, gameState) {
    const scale = 3.2;
    const isInvulnerable = gameState.postBuffInvulnerability > 0 || 
                          gameState.postDamageInvulnerability > 0;
    const facingLeft = player.facingDirection === -1;
    
    const spriteScale = (player.width / 480) * scale;
    const offsetX = -36;
    const offsetY = -24;
    
    const SPRITE_FRAME_WIDTH = 480;
    const SPRITE_FRAME_HEIGHT = 480;
    const renderedSpriteWidth = SPRITE_FRAME_WIDTH * spriteScale;
    const renderedSpriteHeight = SPRITE_FRAME_HEIGHT * spriteScale;
    
    const centerX = x + offsetX + (renderedSpriteWidth / 2);
    const centerY = y + offsetY + (renderedSpriteHeight / 2);
    
    const effectScale = spriteScale * 4.0;
    
    // Initialize animation timers if not exists
    if (!player.shootAnimTimer) player.shootAnimTimer = 0;
    if (!player.hitAnimTimer) player.hitAnimTimer = 0;
    if (!player.lastShootTime) player.lastShootTime = 0;
    
    // Blink effect when invulnerable
    if (isInvulnerable) {
        const blinkFrequency = 8;
        const activeInvulnerability = Math.max(
            gameState.postBuffInvulnerability, 
            gameState.postDamageInvulnerability
        );
        
        if (Math.floor(activeInvulnerability / blinkFrequency) % 2 === 0) {
            return;
        }
    }
    
    // Determine current state based on player actions
    let currentState = 'idle';
    
    // Hit state - extended duration
    if (player.damageResistance > 0 && player.damageResistance > GAME_CONSTANTS.DAMAGE_RESISTANCE_TIME - 30) {
        currentState = 'hit';
        player.hitAnimTimer = 30;
    }
    // FIXED: Enhanced shoot state detection
    else if (player.shootAnimTimer > 0) {
        currentState = 'shoot';
        player.shootAnimTimer--;
    }
    // Check if jumping/falling
    else if (!player.grounded || player.velocityY !== 0) {
        currentState = 'jump';
    } 
    // Check if running
    else if (Math.abs(player.velocityX) > 0.5) {
        currentState = 'run';
    }
    
    // FIXED: Enhanced shoot detection for all projectile types
    const currentTime = Date.now();
    const isShootingInput = (keys.s || keys.Space) && !player.wasSpacePressed;
    const hasBullets = gameState.bullets > 0 || gameState.isBerserker;
    const canShoot = hasBullets && !gameState.isCorrupted;
    
    // Check for actual shooting (either input or recent shoot action)
    const timeSinceLastShoot = currentTime - player.lastShootTime;
    const recentlyShot = timeSinceLastShoot < 150; // 150ms window
    
    // Enhanced shoot detection
    if (canShoot && (isShootingInput || recentlyShot)) {
        // Track when we detect a shoot attempt
        if (isShootingInput) {
            player.lastShootTime = currentTime;
        }
        
        // Trigger shoot animation
        if (player.shootAnimTimer <= 0) {
            player.shootAnimTimer = 15; // Show shoot animation for 15 frames
        }
    }
    
    // Alternative method: Check if enhanced projectile system fired anything
    if (window.projectileSystem) {
        const anyProjectileOnCooldown = 
            window.projectileSystem.normalCooldown > 0 ||
            window.projectileSystem.laserCooldown > 0 ||
            window.projectileSystem.shotgunCooldown > 0 ||
            window.projectileSystem.lightningCooldown > 0 ||
            window.projectileSystem.seekingCooldown > 0;
        
        if (anyProjectileOnCooldown && player.shootAnimTimer <= 0) {
            player.shootAnimTimer = 10; // Shorter animation for cooldown-based detection
        }
    }
    
    // Monitor bullet count decrease as shooting indicator
    if (!player.lastBulletCount) player.lastBulletCount = gameState.bullets;
    if (gameState.bullets < player.lastBulletCount && !gameState.isBerserker) {
        player.shootAnimTimer = Math.max(player.shootAnimTimer, 12);
        player.lastShootTime = currentTime;
    }
    player.lastBulletCount = gameState.bullets;
    
    ctx.save();
    
    // Apply all visual effects before drawing sprite
    
    // Shield Effect
    if (gameState.shieldCharges > 0) {
        ctx.save();
        for (let i = 0; i < Math.min(gameState.shieldCharges, 3); i++) {
            const shieldPulse = 0.7 + Math.sin(Date.now() * 0.003 + i * 0.5) * 0.3;
            const shieldRadius = (35 + (i * 8)) * effectScale;
            const shieldAlpha = shieldPulse * (0.8 - i * 0.15);
            
            ctx.strokeStyle = `rgba(65, 105, 225, ${shieldAlpha})`;
            ctx.lineWidth = (3 - i) * effectScale;
            ctx.beginPath();
            ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = `rgba(65, 105, 225, ${shieldAlpha * 0.15})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, shieldRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    // Corruption Effect
    if (gameState.isCorrupted) {
        ctx.save();
        const corruptionIntensity = gameState.corruptionTimer / 120;
        const corruptionPulse = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
        
        const corruptionGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 50 * effectScale
        );
        corruptionGradient.addColorStop(0, `rgba(139, 0, 139, ${corruptionIntensity * corruptionPulse * 0.6})`);
        corruptionGradient.addColorStop(0.5, `rgba(75, 0, 130, ${corruptionIntensity * corruptionPulse * 0.4})`);
        corruptionGradient.addColorStop(1, 'rgba(25, 25, 112, 0)');
        ctx.fillStyle = corruptionGradient;
        ctx.fillRect(centerX - 50 * effectScale, centerY - 50 * effectScale, 100 * effectScale, 100 * effectScale);
        ctx.restore();
    }
    
    // Score Multiplier Effect
    if (activeDropBuffs.scoreMultiplier) {
        ctx.save();
        const goldPulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, 40 * effectScale
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${goldPulse * 0.3})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${goldPulse * 0.2})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(centerX - 40 * effectScale, centerY - 40 * effectScale, 80 * effectScale, 80 * effectScale);
        
        // Gold sparkles
        for (let i = 0; i < 6; i++) {
            const sparkTime = Date.now() * 0.005 + i * 1.5;
            const sparkX = centerX + Math.cos(sparkTime) * 25 * effectScale;
            const sparkY = centerY + Math.sin(sparkTime) * 25 * effectScale;
            const sparkSize = (1 + Math.sin(sparkTime * 3) * 0.5) * effectScale;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${goldPulse})`;
            ctx.fillRect(sparkX - sparkSize, sparkY - sparkSize, sparkSize * 2, sparkSize * 2);
        }
        ctx.restore();
    }
    
    // Berserker Mode Fire
    if (gameState.isBerserker) {
        ctx.save();
        
        for (let i = 0; i < 12; i++) {
            const fireTime = Date.now() * 0.008 + i * 0.5;
            const angle = (i / 12) * Math.PI * 2;
            const distance = (20 + Math.sin(fireTime * 2) * 10) * effectScale;
            const fireX = centerX + Math.cos(angle) * distance;
            const fireY = centerY + Math.sin(angle) * distance;
            const fireSize = (6 + Math.sin(fireTime * 3) * 3) * effectScale;
            
            ctx.fillStyle = `rgba(255, 0, 0, ${0.8 - (distance - 20 * effectScale) / (20 * effectScale)})`;
            ctx.fillRect(fireX - fireSize/2, fireY - fireSize, fireSize, fireSize * 2);
            
            ctx.fillStyle = `rgba(255, 215, 0, ${0.9 - (distance - 20 * effectScale) / (20 * effectScale)})`;
            ctx.fillRect(fireX - fireSize/3, fireY - fireSize * 0.7, fireSize * 0.6, fireSize * 1.4);
            
            if (distance < 25 * effectScale) {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - (distance - 20 * effectScale) / (10 * effectScale)})`;
                ctx.fillRect(fireX - fireSize/4, fireY - fireSize * 0.5, fireSize * 0.4, fireSize);
            }
        }
        ctx.restore();
    }
    
    // Jump Boost Springs
    if (activeDropBuffs.jumpBoost) {
        ctx.save();
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2 * effectScale;
        const springBounce = Math.abs(Math.sin(Date.now() * 0.008)) * 3 * effectScale;
        
        const springOffsetX = 20 * effectScale;
        const springBaseY = centerY + renderedSpriteHeight/2 + 2 * effectScale;
        
        // Left spring
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(centerX - springOffsetX, 
                    springBaseY + i * 3 * effectScale - springBounce, 
                    3 * effectScale, 0, Math.PI);
            ctx.stroke();
        }
        
        // Right spring
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(centerX + springOffsetX, 
                    springBaseY + i * 3 * effectScale - springBounce, 
                    3 * effectScale, 0, Math.PI);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // Magnet Mode
    if (activeDropBuffs.magnetMode) {
        ctx.save();
        const magnetPulse = Date.now() * 0.002;
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.4)';
        ctx.lineWidth = 1 * effectScale;
        
        for (let i = 0; i < 3; i++) {
            const radius = (30 + i * 15) * effectScale + Math.sin(magnetPulse + i) * 5 * effectScale;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Magnetic particles
        for (let i = 0; i < 4; i++) {
            const angle = magnetPulse * 2 + i * Math.PI / 2;
            const particleX = centerX + Math.cos(angle) * 40 * effectScale;
            const particleY = centerY + Math.sin(angle) * 40 * effectScale;
            const particleSize = 2 * effectScale;
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(particleX - particleSize, particleY - particleSize, 
                         particleSize * 2, particleSize * 2);
        }
        ctx.restore();
    }
    
    // Time Slow
    if (activeDropBuffs.timeSlow) {
        ctx.save();
        const timePulse = Date.now() * 0.001;
        ctx.strokeStyle = 'rgba(0, 206, 209, 0.3)';
        ctx.lineWidth = 2 * effectScale;
        ctx.setLineDash([5 * effectScale, 5 * effectScale]);
        ctx.lineDashOffset = timePulse * 10;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, 45 * effectScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }
    
    // Ghost Walking Trail
    if (gameState.isGhostWalking) {
        ctx.save();
        
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = 0.1 / i;
            spriteManager.drawSprite(
                ctx, 'player', currentState,
                x + offsetX - (i * 5 * player.facingDirection),
                y + offsetY, spriteScale, facingLeft,
                gameState.deltaTime
            );
        }
        
        ctx.restore();
    }
    
    // Death state
    if (gameState.lives <= 0) {
        ctx.globalAlpha = 0.5;
        ctx.filter = 'grayscale(100%)';
    }
    
    // Ghost Walking Transparency for main sprite
    if (gameState.isGhostWalking) {
        ctx.globalAlpha = 0.5;
    }
    
    // DRAW THE ACTUAL SPRITE
    spriteManager.drawSprite(
        ctx, 'player', currentState,
        x + offsetX, y + offsetY, spriteScale, facingLeft,
        gameState.deltaTime
    );
    
    ctx.restore();
}