// js/background-system.js - FIXED VERSION (Proper Parallax Tile Wrapping)

import { CANVAS } from './core/constants.js';
import { camera } from './core/camera.js';
import { gameState } from './core/gameState.js';

class BackgroundSystem {
    constructor() {
        this.groundLayer = {
            image: null,
            loaded: false,
            width: 0,
            height: 0,
            y: 0,
            renderMode: 'static'  // Ground always renders like original environment
        };
        
        this.backgroundLayer = {
            image: null,
            loaded: false,
            width: 0,
            height: 0,
            y: 0,
            scrollSpeed: 0.5,     // Default parallax speed (50% of camera speed)
            renderMode: 'parallax'
        };
        
        this.initialized = false;
    }
    
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
                
                console.log(`✅ Ground layer loaded: ${groundImg.width}x${groundImg.height} (STATIC mode)`);
                this.checkInitialization();
            };
            groundImg.onerror = () => {
                console.error('❌ Ground image failed to load:', groundImagePath);
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
                
                console.log(`✅ Background layer loaded: ${bgImg.width}x${bgImg.height} (PARALLAX mode)`);
                this.checkInitialization();
            };
            bgImg.onerror = () => {
                console.error('❌ Background image failed to load:', backgroundImagePath);
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
            console.log(`📐 Ground: STATIC (like original environment)`);
            console.log(`📐 Background: PARALLAX (speed ${this.backgroundLayer.scrollSpeed})`);
        }
    }
    
    configure(backgroundScrollSpeed) {
        this.backgroundLayer.scrollSpeed = Math.max(0, backgroundScrollSpeed);
        
        console.log(`🔧 Background configured:`);
        console.log(`   Ground: STATIC (stays with world objects)`);
        console.log(`   Background: PARALLAX speed ${this.backgroundLayer.scrollSpeed}`);
        console.log(`📐 Example: Camera moves 100px → Background moves ${this.backgroundLayer.scrollSpeed * 100}px`);
        
        // Show speed comparison
        if (backgroundScrollSpeed < 1) {
            console.log(`🐌 Background moves SLOWER than camera (${(backgroundScrollSpeed * 100).toFixed(1)}% speed)`);
        } else if (backgroundScrollSpeed === 1) {
            console.log(`🏃 Background moves SAME speed as camera (100% speed)`);
        } else {
            console.log(`🚀 Background moves FASTER than camera (${(backgroundScrollSpeed * 100).toFixed(1)}% speed)`);
        }
    }
    
    update() {
        // No complex update needed for simple parallax
    }
    
    render(ctx) {
        if (!this.initialized || !ctx) return;
        
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        // Render background first (parallax)
        if (this.backgroundLayer.loaded) {
            this.renderParallaxLayer(ctx, this.backgroundLayer);
        }
        
        // Render ground second (static like original environment)
        if (this.groundLayer.loaded) {
            this.renderStaticLayer(ctx, this.groundLayer);
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.webkitImageSmoothingEnabled = true;
        ctx.mozImageSmoothingEnabled = true;
        ctx.msImageSmoothingEnabled = true;
    }
    
    renderStaticLayer(ctx, layer) {
        // STATIC RENDERING: Like original environment system
        // Ground tiles based on camera position, stays with world objects
        
        const layerWidth = Math.round(layer.width);
        const layerHeight = Math.round(layer.height);
        const layerY = Math.round(layer.y);
        
        // Calculate how many tiles we need to cover the screen
        const tilesNeeded = Math.ceil(CANVAS.width / layerWidth) + 2;
        
        // Start position based on camera (like original environment)
        const startX = Math.floor(camera.x / layerWidth) * layerWidth;
        
        // Draw tiles to cover the screen
        for (let i = 0; i < tilesNeeded; i++) {
            const worldX = startX + (i * layerWidth);
            const screenX = Math.round(worldX - camera.x);
            
            if (screenX > -layerWidth && screenX < CANVAS.width + layerWidth) {
                ctx.drawImage(layer.image, screenX, layerY, layerWidth, layerHeight);
            }
        }
    }
    
    renderParallaxLayer(ctx, layer) {
        // FIXED PARALLAX RENDERING with proper tile wrapping
        const layerY = Math.round(layer.y);
        const layerWidth = Math.round(layer.width);
        const layerHeight = Math.round(layer.height);
        
        // Calculate parallax offset
        // For scrollSpeed < 1: background moves slower than camera (parallax effect)
        // For scrollSpeed = 1: background moves with camera (no parallax)
        // For scrollSpeed > 1: background moves faster than camera
        const parallaxOffset = camera.x * layer.scrollSpeed;
        
        // Calculate the starting tile position
        // We need to find which tile should be drawn first based on the parallax offset
        const firstTileIndex = Math.floor(parallaxOffset / layerWidth);
        const firstTileOffset = parallaxOffset % layerWidth;
        
        // Calculate how many tiles we need to draw to cover the screen
        // Add extra tiles on both sides to ensure smooth scrolling
        const tilesNeeded = Math.ceil(CANVAS.width / layerWidth) + 3;
        
        // Draw tiles starting from the calculated position
        for (let i = -1; i < tilesNeeded; i++) {
            const tileX = -firstTileOffset + (i * layerWidth);
            
            // Only draw if the tile is visible on screen
            if (tileX > -layerWidth && tileX < CANVAS.width + layerWidth) {
                ctx.drawImage(layer.image, Math.round(tileX), layerY, layerWidth, layerHeight);
            }
        }
        
        // Debug rendering (optional)
        if (window.debugBackgroundRendering) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.font = '12px monospace';
            ctx.fillText(`Camera: ${Math.round(camera.x)}, Parallax: ${Math.round(parallaxOffset)}, Speed: ${layer.scrollSpeed}`, 10, 30);
            ctx.fillText(`First tile: ${firstTileIndex}, Offset: ${Math.round(firstTileOffset)}`, 10, 45);
        }
    }
    
    renderFallback(ctx) {
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(0, CANVAS.groundY, CANVAS.width, CANVAS.height - CANVAS.groundY);
        
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.groundY);
    }
    
    // Set background scroll speed
    setBackgroundScrollSpeed(speed) {
        this.backgroundLayer.scrollSpeed = Math.max(0, speed);
        console.log(`🔧 Background scroll speed: ${this.backgroundLayer.scrollSpeed}`);
        
        if (speed < 1) {
            console.log(`🐌 Background moves SLOWER than camera (${(speed * 100).toFixed(1)}% speed)`);
        } else if (speed === 1) {
            console.log(`🏃 Background moves SAME speed as camera (100% speed)`);
        } else {
            console.log(`🚀 Background moves FASTER than camera (${(speed * 100).toFixed(1)}% speed)`);
        }
        
        console.log(`📐 Camera moves 100px → Background moves ${this.backgroundLayer.scrollSpeed * 100}px`);
    }
    
    // Preset speed configurations
    setBackgroundPreset(preset) {
        switch (preset) {
            case 'static':
                this.setBackgroundScrollSpeed(0);
                console.log('🔧 Background preset: STATIC (no movement)');
                break;
            case 'slow':
                this.setBackgroundScrollSpeed(0.3);
                console.log('🔧 Background preset: SLOW (30% camera speed)');
                break;
            case 'medium':
                this.setBackgroundScrollSpeed(0.5);
                console.log('🔧 Background preset: MEDIUM (50% camera speed)');
                break;
            case 'normal':
                this.setBackgroundScrollSpeed(1.0);
                console.log('🔧 Background preset: NORMAL (same as camera)');
                break;
            case 'fast':
                this.setBackgroundScrollSpeed(1.5);
                console.log('🔧 Background preset: FAST (150% camera speed)');
                break;
            case 'very-fast':
                this.setBackgroundScrollSpeed(2.0);
                console.log('🔧 Background preset: VERY FAST (200% camera speed)');
                break;
            default:
                console.warn(`❌ Unknown preset: ${preset}. Available: static, slow, medium, normal, fast, very-fast`);
        }
    }
    
    getDebugInfo() {
        return {
            initialized: this.initialized,
            groundLoaded: this.groundLayer.loaded,
            backgroundLoaded: this.backgroundLayer.loaded,
            cameraX: camera.x,
            groundRenderMode: this.groundLayer.renderMode,
            backgroundRenderMode: this.backgroundLayer.renderMode,
            backgroundScrollSpeed: this.backgroundLayer.scrollSpeed,
            parallaxOffset: camera.x * this.backgroundLayer.scrollSpeed
        };
    }
}

export const backgroundSystem = new BackgroundSystem();

export function initBackgroundSystem(groundImagePath = 'assets/ground.png', backgroundImagePath = 'assets/background.png') {
    console.log('🌄 Initializing background system with proper parallax');
    backgroundSystem.loadImages(groundImagePath, backgroundImagePath);
}

export function configureBackground(backgroundScrollSpeed = 0.5) {
    console.log(`🔧 Configuring background scroll speed: ${backgroundScrollSpeed}`);
    backgroundSystem.configure(backgroundScrollSpeed);
}

export function setBackgroundScrollSpeed(speed) {
    backgroundSystem.setBackgroundScrollSpeed(speed);
}

export function setBackgroundPreset(preset) {
    backgroundSystem.setBackgroundPreset(preset);
}

export function updateBackground() {
    backgroundSystem.update();
}

export function renderBackground(ctx) {
    if (backgroundSystem.initialized) {
        backgroundSystem.render(ctx);
    } else {
        backgroundSystem.renderFallback(ctx);
    }
}

export function debugBackground() {
    console.log('=== BACKGROUND SYSTEM DEBUG ===');
    const info = backgroundSystem.getDebugInfo();
    console.table(info);
    console.log('================================');
}

// Make globally available
window.backgroundSystem = backgroundSystem;
window.initBackgroundSystem = initBackgroundSystem;
window.configureBackground = configureBackground;
window.setBackgroundScrollSpeed = setBackgroundScrollSpeed;
window.setBackgroundPreset = setBackgroundPreset;
window.debugBackground = debugBackground;