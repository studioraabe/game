// FIXED: Enhanced jump system with proper buff integration

import { GAME_CONSTANTS, CANVAS } from './constants.js';
import { updateCamera } from './camera.js';
import { soundManager, activeDropBuffs } from '../systems.js';
import { createDoubleJumpParticles, createScorePopup, shoot } from '../entities.js';

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

// FIXED: Enhanced player update function with corrected jump logic
export function updatePlayer(keys, gameState) {
    // Apply movement speed bonus from playerStats
    const statSpeedBonus = 1 + ((gameState.playerStats?.moveSpeed || 0) / 100);
    const moveSpeed = GAME_CONSTANTS.PLAYER_MOVE_SPEED * gameState.speedMultiplier * statSpeedBonus;
    
    // Corruption checks
    const isCorrupted = gameState.isCorrupted || false;
    
    // FIXED: Jump availability logic - check both gameState.activeBuffs AND activeDropBuffs
    const hasDoubleJump = (gameState.activeBuffs && gameState.activeBuffs.shadowLeap > 0) || false;
    const hasTripleJump = (activeDropBuffs && activeDropBuffs.jumpBoost > 0) || false;
    
    const canNormalJump = !isCorrupted && player.grounded;
    const canDoubleJump = !isCorrupted && !player.grounded && !player.doubleJumpUsed && hasDoubleJump;
    const canTripleJump = !isCorrupted && !player.grounded && player.doubleJumpUsed && 
                         !player.tripleJumpUsed && hasTripleJump;
    
    const canJump = canNormalJump || canDoubleJump || canTripleJump;
    const canShoot = !isCorrupted && (gameState.bullets > 0 || gameState.isBerserker);
    
    // Corruption movement slowdown
    const corruptionSlowdown = isCorrupted ? 0.6 : 1.0;
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
    
    // Horizontal movement with corruption slowdown
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
    
    // Corruption feedback when trying to act
    if (isCorrupted) {
        if (keys.s && !player.wasSpacePressed) {
            createScorePopup(player.x + player.width/2, player.y - 30, 'WEAKENED!');
            console.log("🚫 Shooting blocked - player is corrupted!");
            return;
        }
        
        if (keys.space && !player.wasUpPressed) {
            createScorePopup(player.x + player.width/2, player.y - 30, 'CAN\'T JUMP!');
            console.log("🚫 Jumping blocked - player is corrupted!");
        }
    }
    
    // Shooting logic
    if (canShoot && (keys.s || keys.Space) && !player.wasSpacePressed && !isCorrupted) {
        console.log("✅ Shooting allowed - player not corrupted");
        
        if (!gameState.shootCooldown) gameState.shootCooldown = 0;
        
        const attackSpeedBonus = gameState.playerStats?.attackSpeed || 0;
        const shootCooldown = gameState.shootCooldown || 0;
        
        if (shootCooldown <= 0) {
            window.shoot(gameState);
            const baseCooldown = 15;
            gameState.shootCooldown = baseCooldown / (1 + attackSpeedBonus / 100);
        }
        
        gameState.playerIdleTime = 0;
    }
    
    // Update shoot cooldown
    if (gameState.shootCooldown > 0) {
        gameState.shootCooldown -= gameState.deltaTime || 1;
    }
    
    // FIXED: Jump logic - handle jump button press with clearer conditions
    if (canJump && (keys.space || keys.ArrowUp) && !player.wasUpPressed && !isCorrupted) {
        console.log("✅ Jumping allowed - player not corrupted");
        console.log(`🦘 Jump types available: Double=${hasDoubleJump}, Triple=${hasTripleJump}`);
        startJump(gameState);
    }
    
    // FIXED: Jump hold mechanics - only for initial jump, not affecting double/triple jumps
    if (!isCorrupted && player.isHoldingJump && 
        player.jumpHoldTime < GAME_CONSTANTS.MAX_JUMP_HOLD_TIME && 
        player.velocityY < 0 && !player.grounded) {
        
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
        // FIXED: Reset jump states properly when landing
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
    player.wasUpPressed = keys.space || keys.ArrowUp;
    player.wasSpacePressed = keys.s || keys.Space;
}

// FIXED: Enhanced jump function with proper jump boost logic
export function startJump(gameState) {
    // Check both gameState.activeBuffs AND activeDropBuffs
    const hasDoubleJump = (gameState.activeBuffs && gameState.activeBuffs.shadowLeap > 0) || false;
    const hasTripleJump = (activeDropBuffs && activeDropBuffs.jumpBoost > 0) || false;
    
    console.log(`🦘 Jump Status: ground=${player.grounded}, doubleJump=${hasDoubleJump}, tripleJump=${hasTripleJump}`);
    console.log(`🦘 Jump States: doubleJumpUsed=${player.doubleJumpUsed}, tripleJumpUsed=${player.tripleJumpUsed}`);
    console.log(`🦘 Active Drop Buffs:`, activeDropBuffs);
    console.log(`🦘 Game State Buffs:`, gameState.activeBuffs);
    
    if (player.grounded) {
        // NORMAL JUMP - Always use full strength
        player.velocityY = GAME_CONSTANTS.JUMP_STRENGTH;
        player.jumping = true;
        player.grounded = false;
        player.isHoldingJump = true;
        player.jumpHoldTime = 0;
        player.doubleJumpUsed = false;
        player.tripleJumpUsed = false;
        soundManager.jump();
        
        console.log("🦘 Normal jump executed");
        
    } else if (!player.grounded) {
        // AIR JUMPS - Check what's available
        let jumpExecuted = false;
        
        // If we have both double jump and triple jump available
        if (hasDoubleJump && hasTripleJump) {
            // Player has both buffs - allow up to 3 jumps total
            if (!player.doubleJumpUsed) {
                // Use double jump first
                player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH;
                player.doubleJumpUsed = true;
                player.isHoldingJump = false;
                player.jumpHoldTime = 0;
                createDoubleJumpParticles(player.x, player.y);
                soundManager.jump();
                jumpExecuted = true;
                console.log("🌙 Shadow Leap double jump executed (2nd jump)");
            } else if (!player.tripleJumpUsed) {
                // Then use triple jump
                player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH;
                player.tripleJumpUsed = true;
                player.isHoldingJump = false;
                player.jumpHoldTime = 0;
                createDoubleJumpParticles(player.x, player.y);
                soundManager.jump();
                jumpExecuted = true;
                console.log("🚀 Jump Boost triple jump executed (3rd jump)");
                createScorePopup(player.x + player.width/2, player.y - 20, 'TRIPLE JUMP!');
            }
        }
        // Only double jump available
        else if (hasDoubleJump && !player.doubleJumpUsed) {
            player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH;
            player.doubleJumpUsed = true;
            player.isHoldingJump = false;
            player.jumpHoldTime = 0;
            createDoubleJumpParticles(player.x, player.y);
            soundManager.jump();
            jumpExecuted = true;
            console.log("🌙 Shadow Leap double jump executed");
        }
        // Only triple jump available (jump boost without shadow leap)
        else if (hasTripleJump && !player.tripleJumpUsed) {
            player.velocityY = GAME_CONSTANTS.DOUBLE_JUMP_STRENGTH;
            player.tripleJumpUsed = true;
            player.isHoldingJump = false;
            player.jumpHoldTime = 0;
            createDoubleJumpParticles(player.x, player.y);
            soundManager.jump();
            jumpExecuted = true;
            console.log("🚀 Jump Boost jump executed (2nd jump)");
            createScorePopup(player.x + player.width/2, player.y - 20, 'JUMP BOOST!');
        }
        
        if (!jumpExecuted) {
            console.log("❌ No jump available: all air jumps used");
            console.log(`   Details: hasDoubleJump=${hasDoubleJump}, hasTripleJump=${hasTripleJump}`);
            console.log(`   States: doubleJumpUsed=${player.doubleJumpUsed}, tripleJumpUsed=${player.tripleJumpUsed}`);
        }
    }
}

export function stopJump() {
    player.isHoldingJump = false;
    console.log("🛑 Jump hold stopped");
}