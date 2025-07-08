// core/player.js - KORRIGIERTE CORRUPTION BLOCKIERUNG

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
    wasSpacePressed: false
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
}

export function updatePlayer(keys, gameState) {
    const moveSpeed = GAME_CONSTANTS.PLAYER_MOVE_SPEED * gameState.speedMultiplier;
    
    // VERSTÄRKTE CORRUPTION CHECKS - WICHTIG!
    const isCorrupted = gameState.isCorrupted || false;
    
    const canJump = !isCorrupted && 
                   (player.grounded || (!player.doubleJumpUsed && gameState.activeBuffs.shadowLeap > 0) || 
                    (activeDropBuffs.jumpBoost > 0 && !player.tripleJumpUsed));
    
    const canShoot = !isCorrupted && 
                    (gameState.bullets > 0 || gameState.isBerserker);
    
    // CORRUPTION BEWEGUNGS-VERLANGSAMUNG
    const corruptionSlowdown = isCorrupted ? 0.6 : 1.0; // 40% langsamer
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
    
    // Horizontal movement mit Corruption-Verlangsamung
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
    
    // CORRUPTION FEEDBACK beim Versuch zu handeln
    if (isCorrupted) {
        if (keys.Space && !player.wasSpacePressed) {
            // BLOCKIERE SCHUSS + Feedback
            createScorePopup(player.x + player.width/2, player.y - 30, 'WEAKENED!');
            console.log("🚫 Shooting blocked - player is corrupted!");
            // WICHTIG: Kein window.shoot() Call!
            return; // Früh beenden um sicherzustellen dass nicht geschossen wird
        }
        
        if (keys.ArrowUp && !player.wasUpPressed) {
            // BLOCKIERE SPRUNG + Feedback
            createScorePopup(player.x + player.width/2, player.y - 30, 'CAN\'T JUMP!');
            console.log("🚫 Jumping blocked - player is corrupted!");
        }
    }
    
    // Shooting - NUR wenn nicht corrupted UND keys gedrückt
    if (canShoot && keys.Space && !player.wasSpacePressed && !isCorrupted) {
        console.log("✅ Shooting allowed - player not corrupted");
        window.shoot();
        gameState.playerIdleTime = 0;
    }
    
    // Jump logic - NUR wenn nicht corrupted
    if (canJump && keys.ArrowUp && !player.wasUpPressed && !isCorrupted) {
        console.log("✅ Jumping allowed - player not corrupted");
        startJump(gameState);
    }
    
    // Jump hold mechanics - NUR wenn nicht corrupted
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
    // Diese Funktion wird nur aufgerufen wenn canJump = true (nicht corrupted)
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