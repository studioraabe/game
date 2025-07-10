// js/enhanced-player.js - Enhanced Player Movement with Speed Scaling

import { GAME_CONSTANTS, CANVAS } from './core/constants.js';
import { updateCamera } from './core/camera.js';
import { soundManager, activeDropBuffs } from './systems.js';
import { createDoubleJumpParticles, createScorePopup } from './entities.js';
import { playerStats } from './roguelike-stats.js';

// Enhanced player update function with movement speed scaling
export function enhancedUpdatePlayer(keys, gameState) {
    // Calculate movement speed with stats bonus
    const statSpeedBonus = 1 + (playerStats.moveSpeed / 100);
    const baseSpeed = GAME_CONSTANTS.PLAYER_MOVE_SPEED * gameState.speedMultiplier;
    const moveSpeed = baseSpeed * statSpeedBonus;
    
    // CORRUPTION CHECKS
    const isCorrupted = gameState.isCorrupted || false;
    
    const canJump = !isCorrupted && 
                   (player.grounded || (!player.doubleJumpUsed && gameState.activeBuffs.shadowLeap > 0) || 
                    (activeDropBuffs.jumpBoost > 0 && !player.tripleJumpUsed));
    
    const canShoot = !isCorrupted && 
                    (gameState.bullets > 0 || gameState.isBerserker);
    
    // CORRUPTION MOVEMENT SLOWDOWN
    const corruptionSlowdown = isCorrupted ? 0.6 : 1.0; // 40% slower
    const effectiveMoveSpeed = moveSpeed * corruptionSlowdown;
    
    // Update corruption timer
    if (gameState.corruptionTimer > 0) {
        gameState.corruptionTimer -= gameState.deltaTime || 1;
        if (gameState.corruptionTimer <= 0) {
            gameState.isCorrupted = false;
            gameState.corruptionTimer = 0;
            console.log("🩸 Corruption ended - player can move/jump/shoot again!");
        }
    }
    
    // Horizontal movement with enhanced speed
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
            // BLOCK SHOOTING + feedback
            createScorePopup(player.x + player.width/2, player.y - 30, 'WEAKENED!');
            console.log("🚫 Shooting blocked - player is corrupted!");
            return; // End early to ensure no shooting
        }
        
        if (keys.ArrowUp && !player.wasUpPressed) {
            // BLOCK JUMPING + feedback
            createScorePopup(player.x + player.width/2, player.y - 30, 'CAN\'T JUMP!');
            console.log("🚫 Jumping blocked - player is corrupted!");
        }
    }
    
    // Shooting - only if not corrupted AND keys pressed
    if (canShoot && keys.Space && !player.wasSpacePressed && !isCorrupted) {
        console.log("✅ Shooting allowed - player not corrupted");
        // Use enhanced shoot with stats
        window.enhancedShoot();
        gameState.playerIdleTime = 0;
    }
    
    // Jump logic - only if not corrupted
    if (canJump && keys.ArrowUp && !player.wasUpPressed && !isCorrupted) {
        console.log("✅ Jumping allowed - player not corrupted");
        startJump(gameState);
    }
    
    // Jump hold mechanics - only if not corrupted
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
    if (player.y >= CANVAS.groundY - player.height - 18) {
        player.y = CANVAS.groundY - player.height - 18;
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

// Jump function (unchanged, kept for completeness)
export function startJump(gameState) {
    // This function is only called when canJump = true (not corrupted)
    if (player.grounded) {
        player.velocityY = GAME_CONSTANTS.JUMP_STRENGTH;
        player.jumping = true;
        player.grounded = false;
        player.isHoldingJump = true;
        player.jumpHoldTime = 0;
        player.doubleJumpUsed = false;
        player.tripleJumpUsed = false;
        soundManager.jump();
    } else if (!player.doubleJumpUsed && gameState.activeBuffs.shadowLeap > 0) {
        player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH;
        player.doubleJumpUsed = true;
        player.isHoldingJump = true;
        player.jumpHoldTime = 0;
        createDoubleJumpParticles(player.x, player.y);
        soundManager.jump();
    } else if (activeDropBuffs.jumpBoost > 0 && !player.tripleJumpUsed) {
        player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH;
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