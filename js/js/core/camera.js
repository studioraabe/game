// core/camera.js - Camera System

import { CAMERA_CONSTANTS, CANVAS } from './constants.js';

export const camera = {
    x: 0,
    maxX: 0
};

export function updateCamera(player) {
    const deadZoneEnd = CANVAS.width * CAMERA_CONSTANTS.DEAD_ZONE_RATIO;
    const playerScreenX = player.x - camera.x;
    
    if (playerScreenX > deadZoneEnd) {
        const newCameraX = player.x - deadZoneEnd;
        
        if (newCameraX > camera.maxX) {
            camera.x = newCameraX;
            camera.maxX = newCameraX;
        }
    }
}

export function getScreenX(worldX) {
    return worldX - camera.x;
}

export function getScreenY(worldY) {
    return worldY;
}

export function resetCamera() {
    camera.x = 0;
    camera.maxX = 0;
}