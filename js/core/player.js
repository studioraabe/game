// core/player.js - Enhanced with Movement Speed Scaling

import { GAME_CONSTANTS, CANVAS } from './constants.js';
import { updateCamera } from './camera.js';
import { soundManager, activeDropBuffs } from '../systems.js';
import { createDoubleJumpParticles, createScorePopup } from '../entities.js';

export const player = {
    x: 120,
    y: -80,
    width: 40,
    height: 40,
    velocityY: 0,
    velocityX: 0,
    jumping: false,
    grounded: true,
    jumpHoldTime: 0,
    isHoldingJump: false,
    doubleJumpUsed: false,
    tripleJumpUsed: false,
    damageResistance: 0,
    facingDirection: 1,
    wasUpPressed: false,
    wasSpacePressed: false,
    
    // NEW: Attack speed tracking
    lastShotTime: 0,
    shootCooldown: 0
};

export function resetPlayer() {
    player.x = 120;
    player.y = 73;
    player.velocityY = 0;
    player.velocityX = 0;
    player.jumping = false;
    player.grounded = true;
    player.jumpHoldTime = 0;
    player.isHoldingJump = false;
    player.doubleJumpUsed = false;
    player.tripleJumpUsed = false;
    player.damageResistance = 0;
    player.facingDirection = 1;
    player.wasUpPressed = false;
    player.wasSpacePressed = false;
    player.lastShotTime = 0;
    player.shootCooldown = 0;
}

export function updatePlayer(keys, gameState) {
    // NEW: Calculate final movement speed with stats
    const baseMoveSpeed = GAME_CONSTANTS.PLAYER_MOVE_SPEED;
    const speedBoostMultiplier = activeDropBuffs.speedBoost > 0 ? 1.25 : 1;
    const statSpeedMultiplier = 1 + (gameState.stats.moveSpeed / 100);
    const achievementSpeedMultiplier = gameState.speedMultiplier;
    
    const finalMoveSpeed = baseMoveSpeed * speedBoostMultiplier * statSpeedMultiplier * achievementSpeedMultiplier;
    
    // ENHANCED CORRUPTION CHECKS
    const isCorrupted = gameState.isCorrupted || false;
    
    const canJump = !isCorrupted && 
                   (player.grounded || (!player.doubleJumpUsed && gameState.activeBuffs.shadowLeap > 0) || 
                    (activeDropBuffs.jumpBoost > 0 && !player.tripleJumpUsed));
    
    const canShoot = !isCorrupted && 
                    (gameState.bullets > 0 || gameState.isBerserker) &&
                    player.shootCooldown <= 0;
    
    // CORRUPTION MOVEMENT PENALTY
    const corruptionSlowdown = isCorrupted ? 0.6 : 1.0;
    const effectiveMoveSpeed = finalMoveSpeed * corruptionSlowdown;
    
    // Update corruption timer
    if (gameState.corruptionTimer > 0) {
        gameState.corruptionTimer -= gameState.deltaTime || 1;
        if (gameState.corruptionTimer <= 0) {
            gameState.isCorrupted = false;
            gameState.corruptionTimer = 0;
            console.log("🩸 Corruption ended - player can move/jump/shoot again!");
        }
    }
    
    // Update shooting cooldown
    if (player.shootCooldown > 0) {
        player.shootCooldown -= gameState.deltaTime || 1;
    }
    
    // Horizontal movement with enhanced speed scaling
    if (keys.left && player.x > gameState.camera.x) {
        player.velocityX = -effectiveMoveSpeed;
        player.facingDirection = -1;
    } else if (keys.right) {
        player.velocityX = effectiveMoveSpeed;
        player.facingDirection = 1;
    } else {
        player.velocityX *= 0.8;
    }
    
    player.x += player.velocityX;
    player.x = Math.max(gameState.camera.x, player.x);
    
    updateCamera(player);
    
    // CORRUPTION FEEDBACK when trying to act
    if (isCorrupted) {
        if (keys.Space && !player.wasSpacePressed) {
            createScorePopup(player.x + player.width/2, player.y - 30, 'WEAKENED!');
            console.log("🚫 Shooting blocked - player is corrupted!");
            return;
        }
        
        if (keys.ArrowUp && !player.wasUpPressed) {
            createScorePopup(player.x + player.width/2, player.y - 30, 'CAN\'T JUMP!');
            console.log("🚫 Jumping blocked - player is corrupted!");
        }
    }
    
    // NEW: Enhanced shooting with attack speed and weapon types
    if (canShoot && keys.Space && !player.wasSpacePressed && !isCorrupted) {
        console.log("✅ Shooting allowed - player not corrupted");
        
        // Get fire rate based on attack speed stat
        const fireRate = window.getFireRate ? window.getFireRate() : 10;
        
        window.shoot();
        player.shootCooldown = fireRate;
        player.lastShotTime = Date.now();
        gameState.playerIdleTime = 0;
    }
    
    // Jump logic - only when not corrupted
    if (canJump && keys.ArrowUp && !player.wasUpPressed && !isCorrupted) {
        console.log("✅ Jumping allowed - player not corrupted");
        startJump(gameState);
    }
    
    // Jump hold mechanics - only when not corrupted
    if (!isCorrupted && player.isHoldingJump && 
        player.jumpHoldTime < GAME_CONSTANTS.MAX_JUMP_HOLD_TIME && player.velocityY < 0) {
        const holdStrength = 1 - (player.jumpHoldTime / GAME_CONSTANTS.MAX_JUMP_HOLD_TIME);
        player.velocityY -= 0.3 * holdStrength;
        player.jumpHoldTime++;
    }
    
    // Apply gravity
    const gravity = player.velocityY < 0 ? GAME_CONSTANTS.LIGHT_GRAVITY : GAME_CONSTANTS.GRAVITY;
    player.velocityY += gravity;
    player.y += player.velocityY;
    
    // Ground collision
    if (player.y >= CANVAS.groundY - player.height) {
        player.y = CANVAS.groundY - player.height;
        player.velocityY = 0;
        player.jumping = false;
        player.grounded = true;
        player.isHoldingJump = false;
        player.jumpHoldTime = 0;
        player.doubleJumpUsed = false;
        player.tripleJumpUsed = false;
    }
    
    // Update invulnerability timers
    if (player.damageResistance > 0) {
        player.damageResistance--;
    }
    if (gameState.postBuffInvulnerability > 0) {
        gameState.postBuffInvulnerability--;
    }
    if (gameState.postDamageInvulnerability > 0) {
        gameState.postDamageInvulnerability--;
    }
    
    // Store previous key states
    player.wasUpPressed = keys.ArrowUp;
    player.wasSpacePressed = keys.Space;
}

export function startJump(gameState) {
    // Enhanced jump with potential stat modifications
    const jumpBoostMultiplier = activeDropBuffs.jumpBoost > 0 ? 1.2 : 1;
    
    if (player.grounded) {
        player.velocityY = GAME_CONSTANTS.JUMP_STRENGTH * jumpBoostMultiplier;
        player.jumping = true;
        player.grounded = false;
        player.isHoldingJump = true;
        player.jumpHoldTime = 0;
        player.doubleJumpUsed = false;
        player.tripleJumpUsed = false;
        soundManager.jump();
    } else if (!player.doubleJumpUsed && gameState.activeBuffs.shadowLeap > 0) {
        player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH * jumpBoostMultiplier;
        player.doubleJumpUsed = true;
        player.isHoldingJump = true;
        player.jumpHoldTime = 0;
        createDoubleJumpParticles(player.x, player.y);
        soundManager.jump();
    } else if (activeDropBuffs.jumpBoost > 0 && !player.tripleJumpUsed) {
        player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH * jumpBoostMultiplier;
        player.tripleJumpUsed = true;
        player.isHoldingJump = true;
        player.jumpHoldTime = 0;
        createDoubleJumpParticles(player.x, player.y);
        soundManager.jump();
    }
}

export function stopJump() {
    player.isHoldingJump = false;
}

// NEW: Get effective movement speed for external systems
export function getEffectiveMovementSpeed(gameState) {
    const baseMoveSpeed = GAME_CONSTANTS.PLAYER_MOVE_SPEED;
    const speedBoostMultiplier = activeDropBuffs.speedBoost > 0 ? 1.25 : 1;
    const statSpeedMultiplier = 1 + (gameState.stats.moveSpeed / 100);
    const achievementSpeedMultiplier = gameState.speedMultiplier;
    const corruptionSlowdown = gameState.isCorrupted ? 0.6 : 1.0;
    
    return baseMoveSpeed * speedBoostMultiplier * statSpeedMultiplier * achievementSpeedMultiplier * corruptionSlowdown;
}

// NEW: Check if player can shoot (for external systems)
export function canPlayerShoot(gameState) {
    return !gameState.isCorrupted && 
           (gameState.bullets > 0 || gameState.isBerserker) && 
           player.shootCooldown <= 0;
}

// NEW: Get shooting cooldown remaining
export function getShootCooldownRemaining() {
    return Math.max(0, player.shootCooldown);
}