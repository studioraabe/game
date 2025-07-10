// rendering/renderer.js - Main Render Loop - FIXED for Sprite System

import { gameState } from '../core/gameState.js';
import { getScreenX } from '../core/camera.js';
import { player } from '../core/player.js';
import { obstacles, bulletsFired, drops } from '../entities.js';
import { CANVAS } from '../core/constants.js';

// UPDATED: Import background system instead of environment
import { renderBackground } from '../background-system.js';
import { drawPlayer } from './player.js';
import { drawEnemy } from './enemies.js';
import { drawEffects, drawBullet, drawDrop } from './effects.js';
import { createDamageNumber } from '../ui-enhancements.js';
import { renderEnhancedProjectiles } from '../enhanced-projectile-system.js';





export function render(ctx) {
    if (!gameState.needsRedraw && gameState.currentState === 'playing') return;
    
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    
    // Time slow effect overlay
    if (gameState.timeSlowFactor < 1) {
        ctx.fillStyle = 'rgba(0, 206, 209, 0.01)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    }
    
    // 1. UPDATED: Draw background system instead of environment
    renderBackground(ctx);
    
    // 2. Draw drops
    for (const drop of drops) {
        const screenX = getScreenX(drop.x);
        if (screenX > -50 && screenX < CANVAS.width + 50) {
            drawDrop(ctx, drop);
        }
    }
    
    // 3. Draw obstacles/enemies with proper depth sorting
    const backgroundObjects = [];  // Nur Rocks + BoltBoxes - immer hinten
    const dynamicObjects = [];     // Player + alle Enemies (inkl. Skelette) - Y-Sorting
    const foregroundObjects = [];  // Tesla/Frankenstein - immer vorne

    // Sammle alle Objekte und kategorisiere sie
    for (const obstacle of obstacles) {
        const screenX = getScreenX(obstacle.x);
        if (screenX > -200 && screenX < CANVAS.width + 200) {
            // Spezielle Objekte, die VOR allem erscheinen sollen
            if (obstacle.type === 'frankensteinTable' || obstacle.type === 'teslaCoil') {
                foregroundObjects.push({
                    type: 'obstacle',
                    object: obstacle,
                    y: obstacle.y + obstacle.height,
                    screenX: screenX
                });
            }
            // NUR Rocks + BoltBoxes + sarcophagus - immer im Hintergrund
            else if (obstacle.type === 'boltBox' || obstacle.type === 'rock'  || obstacle.type === 'sarcophagus') {
                backgroundObjects.push({
                    type: 'obstacle',
                    object: obstacle,
                    y: obstacle.y + obstacle.height,
                    screenX: screenX
                });
            }
            // ALLE anderen Enemies (inkl. Skelette) - Y-Sorting mit Player
            else {
                dynamicObjects.push({
                    type: 'obstacle',
                    object: obstacle,
                    y: obstacle.y + obstacle.height,
                    screenX: screenX
                });
            }
        }
    }

    // Füge Player zu den dynamischen Objekten hinzu
    const playerScreenX = getScreenX(player.x);
    dynamicObjects.push({
        type: 'player',
        object: player,
        y: player.y + player.height,
        screenX: playerScreenX
    });

    // Sortiere jede Kategorie nach Y-Position
    backgroundObjects.sort((a, b) => a.y - b.y);
    dynamicObjects.sort((a, b) => a.y - b.y);     // Player + bewegliche Enemies
    foregroundObjects.sort((a, b) => a.y - b.y);

    // Rendere in der korrekten Reihenfolge:
    // 1. Background Obstacles (Rocks, BoltBoxes) - IMMER HINTEN
    for (const item of backgroundObjects) {
        drawEnemy(item.object, ctx, gameState);
    }

    // 2. Dynamic Objects (Player + alle Enemies inkl. Skelette) - Y-SORTING
    for (const item of dynamicObjects) {
        if (item.type === 'obstacle') {
            drawEnemy(item.object, ctx, gameState);
        } else if (item.type === 'player') {
            drawPlayer(ctx, item.screenX, item.object.y, item.object, gameState);
        }
    }

    // 3. Foreground Obstacles (Tesla, Frankenstein) - IMMER VORNE
    for (const item of foregroundObjects) {
        drawEnemy(item.object, ctx, gameState);
    }
    
    // 4. Draw bullets (appear in front of everything)
    for (const bullet of bulletsFired) {
        const screenX = getScreenX(bullet.x);
        if (screenX > -20 && screenX < CANVAS.width + 20) {
            drawBullet(ctx, screenX, bullet.y, bullet.enhanced, gameState.hasPiercingBullets, bullet);
        }
    }
    
    // 5. Draw enhanced projectiles
    renderEnhancedProjectiles(ctx);
    
    // 6. Draw all effects (particles, explosions, etc.)
    drawEffects(ctx, {
        bloodParticles: window.bloodParticles || [],
        lightningEffects: window.lightningEffects || [],
        scorePopups: window.scorePopups || [],
        doubleJumpParticles: window.doubleJumpParticles || [],
        dropParticles: window.dropParticles || [],
        explosions: window.explosions || []
    });
	
	
	function renderHitboxes(ctx) {
    if (!window.showHitboxes) return;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';  // Red for regular hitboxes
    ctx.lineWidth = 2;
    
    // PLAYER HITBOX (GREEN)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
    ctx.strokeRect(
        player.x - camera.x, 
        player.y, 
        player.width, 
        player.height
    );
    
    // Add center cross for player
    const playerCenterX = player.x - camera.x + player.width / 2;
    const playerCenterY = player.y + player.height / 2;
    ctx.beginPath();
    ctx.moveTo(playerCenterX - 5, playerCenterY);
    ctx.lineTo(playerCenterX + 5, playerCenterY);
    ctx.moveTo(playerCenterX, playerCenterY - 5);
    ctx.lineTo(playerCenterX, playerCenterY + 5);
    ctx.stroke();
    
    // ENEMY HITBOXES (RED)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    obstacles.forEach(obstacle => {
        const screenX = obstacle.x - camera.x;
        
        // Only draw if on screen
        if (screenX > -200 && screenX < CANVAS.width + 200) {
            // Get hitbox (uses your existing getObstacleHitbox function if available)
            let hitbox;
            if (window.getObstacleHitbox) {
                hitbox = window.getObstacleHitbox(obstacle);
                hitbox.x = hitbox.x - camera.x; // Convert to screen coords
            } else {
                // Fallback to full rectangle
                hitbox = {
                    x: screenX,
                    y: obstacle.y,
                    width: obstacle.width,
                    height: obstacle.height
                };
            }
            
            // Draw hitbox
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            
            // Add center cross
            const centerX = hitbox.x + hitbox.width / 2;
            const centerY = hitbox.y + hitbox.height / 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 3, centerY);
            ctx.lineTo(centerX + 3, centerY);
            ctx.moveTo(centerX, centerY - 3);
            ctx.lineTo(centerX, centerY + 3);
            ctx.stroke();
            
            // Add label
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = '12px monospace';
            ctx.fillText(obstacle.type, hitbox.x, hitbox.y - 5);
        }
    });
    
    // BULLET HITBOXES (YELLOW)
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
    bulletsFired.forEach(bullet => {
        const screenX = bullet.x - camera.x;
        if (screenX > -50 && screenX < CANVAS.width + 50) {
            ctx.strokeRect(screenX, bullet.y, 8, 4); // Bullet dimensions
        }
    });
    
    // BAT PROJECTILES (PURPLE)
    if (window.batProjectiles) {
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
        window.batProjectiles.forEach(projectile => {
            const screenX = projectile.x - camera.x;
            if (screenX > -50 && screenX < CANVAS.width + 50) {
                ctx.strokeRect(screenX, projectile.y, projectile.size, projectile.size);
            }
        });
    }
    
    ctx.restore();

}
    
	window.debugPlayerHitbox = function(ctx) {
    if (!window.showHitboxes) return;
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - camera.x, player.y, player.width, player.height);
};
	
    gameState.needsRedraw = false;
	renderHitboxes(ctx);
}

