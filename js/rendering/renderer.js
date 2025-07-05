// rendering/renderer.js - Main Render Loop

import { gameState } from '../core/gameState.js';
import { getScreenX } from '../core/camera.js';
import { player } from '../core/player.js';
import { obstacles, bulletsFired, drops } from '../entities.js';
import { CANVAS } from '../core/constants.js';

import { drawEnvironment } from './environment.js';
import { drawPlayer } from './player.js';
import { drawEnemy } from './enemies.js';
import { drawEffects, drawBullet, drawDrop } from './effects.js';

export function render(ctx) {
    if (!gameState.needsRedraw && gameState.currentState === 'playing') return;
    
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    
    // Time slow effect overlay
    if (gameState.timeSlowFactor < 1) {
        ctx.fillStyle = 'rgba(0, 206, 209, 0.01)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    }
    
    // 1. Draw environment (background, ground, torches)
    drawEnvironment(ctx, gameState.camera);
    
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
        drawEnemy(item.object, ctx);
    }

    // 2. Dynamic Objects (Player + alle Enemies inkl. Skelette) - Y-SORTING
    for (const item of dynamicObjects) {
        if (item.type === 'obstacle') {
            drawEnemy(item.object, ctx);
        } else if (item.type === 'player') {
            drawPlayer(ctx, item.screenX, item.object.y, item.object, gameState);
        }
    }

    // 3. Foreground Obstacles (Tesla, Frankenstein) - IMMER VORNE
    for (const item of foregroundObjects) {
        drawEnemy(item.object, ctx);
    }
    
    // 4. Draw bullets (appear in front of everything)
    for (const bullet of bulletsFired) {
        const screenX = getScreenX(bullet.x);
        if (screenX > -20 && screenX < CANVAS.width + 20) {
            drawBullet(ctx, screenX, bullet.y, bullet.enhanced, gameState.hasPiercingBullets);
        }
    }
    
    // 5. Draw all effects (particles, explosions, etc.)
    drawEffects(ctx, {
        bloodParticles: window.bloodParticles || [],
        lightningEffects: window.lightningEffects || [],
        scorePopups: window.scorePopups || [],
        doubleJumpParticles: window.doubleJumpParticles || [],
        dropParticles: window.dropParticles || [],
        explosions: window.explosions || []
    });
    
    gameState.needsRedraw = false;
}