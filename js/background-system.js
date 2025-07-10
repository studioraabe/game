// js/background-system.js - Complete 2-Layer Endless Parallax Background System

import { CANVAS } from './core/constants.js';
import { camera } from './core/camera.js';
import { gameState } from './core/gameState.js';

// ========================================
// BACKGROUND SYSTEM CLASS
// ========================================

class BackgroundSystem {
    constructor() {
        this.groundLayer = {
            image: null,
            loaded: false,
            x1: 0,
            x2: 0,
            speed: 1.0,        // Moves at same speed as camera
            width: 0,
            height: 0,
            y: 0
        };
        
        this.backgroundLayer = {
            image: null,
            loaded: false,
            x1: 0,
            x2: 0,
            speed: 0.3,        // Moves slower than camera (parallax effect)
            width: 0,
            height: 0,
            y: 0
        };
        
        this.lastCameraX = 0;
        this.initialized = false;
    }
    
    // Load background images
    async loadImages(groundImagePath, backgroundImagePath) {
        console.log('🖼️ Loading background images...');
        
        try {
            // Load ground layer
            const groundImg = new Image();
            groundImg.onload = () => {
                this.groundLayer.image = groundImg;
                this.groundLayer.loaded = true;
                this.groundLayer.width = groundImg.width;
                this.groundLayer.height = groundImg.height;
                this.groundLayer.y = CANVAS.groundY;
                
                // Initialize positions
                this.groundLayer.x1 = 0;
                this.groundLayer.x2 = groundImg.width;
                
                console.log(`✅ Ground layer loaded: ${groundImg.width}x${groundImg.height}`);
                this.checkInitialization();
            };
            groundImg.onerror = () => {
                console.warn('⚠️ Ground image failed to load, using fallback');
                this.groundLayer.loaded = false;
            };
            groundImg.src = groundImagePath;
            
            // Load background layer
            const bgImg = new Image();
            bgImg.onload = () => {
                this.backgroundLayer.image = bgImg;
                this.backgroundLayer.loaded = true;
                this.backgroundLayer.width = bgImg.width;
                this.backgroundLayer.height = bgImg.height;
                this.backgroundLayer.y = 0;
                
                // Initialize positions
                this.backgroundLayer.x1 = 0;
                this.backgroundLayer.x2 = bgImg.width;
                
                console.log(`✅ Background layer loaded: ${bgImg.width}x${bgImg.height}`);
                this.checkInitialization();
            };
            bgImg.onerror = () => {
                console.warn('⚠️ Background image failed to load, using fallback');
                this.backgroundLayer.loaded = false;
            };
            bgImg.src = backgroundImagePath;
            
        } catch (error) {
            console.error('❌ Error loading background images:', error);
        }
    }
    
    checkInitialization() {
        if (!this.initialized && (this.groundLayer.loaded || this.backgroundLayer.loaded)) {
            this.initialized = true;
            console.log('🎨 Background system initialized');
        }
    }
    
    // Update background positions based on camera movement
    update() {
        if (!this.initialized) return;
        
        const cameraMovement = camera.x - this.lastCameraX;
        this.lastCameraX = camera.x;
        
        // Update ground layer (moves with camera)
        if (this.groundLayer.loaded) {
            this.updateLayer(this.groundLayer, cameraMovement);
        }
        
        // Update background layer (parallax effect)
        if (this.backgroundLayer.loaded) {
            this.updateLayer(this.backgroundLayer, cameraMovement);
        }
    }
    
    updateLayer(layer, cameraMovement) {
        // Move the layer based on its speed multiplier
        const layerMovement = cameraMovement * layer.speed;
        
        layer.x1 -= layerMovement;
        layer.x2 -= layerMovement;
        
        // Wrap around when images move off screen
        if (layer.x1 + layer.width <= -camera.x) {
            layer.x1 = layer.x2 + layer.width;
        }
        if (layer.x2 + layer.width <= -camera.x) {
            layer.x2 = layer.x1 + layer.width;
        }
        
        // Handle reverse scrolling (if camera moves backward)
        if (layer.x1 > camera.x + CANVAS.width) {
            layer.x1 = layer.x2 - layer.width;
        }
        if (layer.x2 > camera.x + CANVAS.width) {
            layer.x2 = layer.x1 - layer.width;
        }
    }
    
    // Render both layers
    render(ctx) {
        if (!this.initialized || !ctx) return;
        
        // Render background layer first (behind everything)
        if (this.backgroundLayer.loaded) {
            this.renderLayer(ctx, this.backgroundLayer);
        }
        
        // Render ground layer second (in front of background)
        if (this.groundLayer.loaded) {
            this.renderLayer(ctx, this.groundLayer);
        }
    }
    
    renderLayer(ctx, layer) {
        const screenX1 = layer.x1 - camera.x;
        const screenX2 = layer.x2 - camera.x;
        
        // Draw both image segments
        if (screenX1 + layer.width > 0 && screenX1 < CANVAS.width) {
            ctx.drawImage(
                layer.image,
                screenX1,
                layer.y,
                layer.width,
                layer.height
            );
        }
        
        if (screenX2 + layer.width > 0 && screenX2 < CANVAS.width) {
            ctx.drawImage(
                layer.image,
                screenX2,
                layer.y,
                layer.width,
                layer.height
            );
        }
    }
    
    // Render fallback backgrounds when images aren't loaded
    renderFallback(ctx) {
        // Fallback ground
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(0, CANVAS.groundY, CANVAS.width, CANVAS.height - CANVAS.groundY);
        
        // Fallback background
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.groundY);
    }
    
    // Set parallax speed for background layer
    setParallaxSpeed(speed) {
        this.backgroundLayer.speed = Math.max(0, Math.min(1, speed));
        console.log(`🎨 Background parallax speed set to: ${this.backgroundLayer.speed}`);
    }
    
    // Set ground layer speed (normally 1.0)
    setGroundSpeed(speed) {
        this.groundLayer.speed = Math.max(0, Math.min(2, speed));
        console.log(`🎨 Ground layer speed set to: ${this.groundLayer.speed}`);
    }
    
    // Debug info
    getDebugInfo() {
        return {
            initialized: this.initialized,
            groundLoaded: this.groundLayer.loaded,
            backgroundLoaded: this.backgroundLayer.loaded,
            groundSpeed: this.groundLayer.speed,
            backgroundSpeed: this.backgroundLayer.speed,
            cameraX: camera.x,
            groundX1: this.groundLayer.x1,
            groundX2: this.groundLayer.x2,
            backgroundX1: this.backgroundLayer.x1,
            backgroundX2: this.backgroundLayer.x2
        };
    }
}

// ========================================
// EXPORTED FUNCTIONS
// ========================================

// Create global background system instance
export const backgroundSystem = new BackgroundSystem();

// Initialize background system with your image paths
export function initBackgroundSystem(groundImagePath = 'assets/ground.png', backgroundImagePath = 'assets/background.png') {
    backgroundSystem.loadImages(groundImagePath, backgroundImagePath);
}

// Update function to be called in main game loop
export function updateBackground() {
    backgroundSystem.update();
}

// Render function to be called in main render loop
export function renderBackground(ctx) {
    if (backgroundSystem.initialized) {
        backgroundSystem.render(ctx);
    } else {
        // Render fallback until images load
        backgroundSystem.renderFallback(ctx);
    }
}

// Adjust parallax speed (0.0 = static, 1.0 = moves with camera)
export function setBackgroundParallaxSpeed(speed) {
    backgroundSystem.setParallaxSpeed(speed);
}

// Adjust ground speed (normally 1.0 to match camera movement)
export function setGroundSpeed(speed) {
    backgroundSystem.setGroundSpeed(speed);
}

// Debug function
export function debugBackground() {
    console.log('=== BACKGROUND SYSTEM DEBUG ===');
    const info = backgroundSystem.getDebugInfo();
    console.log('Initialized:', info.initialized);
    console.log('Ground loaded:', info.groundLoaded);
    console.log('Background loaded:', info.backgroundLoaded);
    console.log('Ground speed:', info.groundSpeed);
    console.log('Background speed:', info.backgroundSpeed);
    console.log('Camera X:', info.cameraX);
    console.log('Ground positions:', info.groundX1, info.groundX2);
    console.log('Background positions:', info.backgroundX1, info.backgroundX2);
    console.log('==============================');
}

// Make functions available globally
window.backgroundSystem = backgroundSystem;
window.initBackgroundSystem = initBackgroundSystem;
window.setBackgroundParallaxSpeed = setBackgroundParallaxSpeed;
window.setGroundSpeed = setGroundSpeed;
window.debugBackground = debugBackground;