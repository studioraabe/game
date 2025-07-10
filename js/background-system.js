// js/background-system.js - IMPROVED VERSION (Independent Speed Control)

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
            x1: 0,
            x2: 0,
            width: 0,
            height: 0,
            y: 0,
            scrollSpeed: 0.3,     // Absolute speed (pixels per frame when camera moves 1 pixel)
            renderMode: 'parallax'
        };
        
        this.lastCameraX = 0;
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
                
                // Initialize parallax positions
                this.backgroundLayer.x1 = 0;
                this.backgroundLayer.x2 = bgImg.width;
                
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
            this.lastCameraX = camera.x;
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
        if (!this.initialized) return;
        
        // For simple formula approach, we don't need complex position tracking
        this.lastCameraX = camera.x;
        
        // The rendering handles everything with the simple formula
    }
    
    updateBackgroundLayer(cameraMovement) {
        // TRUE PARALLAX CALCULATION:
        // For parallax effect, background should move LESS than camera
        // scrollSpeed = 0: background static (no movement)
        // scrollSpeed = 0.5: background moves 50% as much as camera (slower)
        // scrollSpeed = 1.0: background moves same as camera (no parallax)
        // scrollSpeed > 1.0: background moves faster than camera
        
        // Calculate how much the background should move relative to camera
        const backgroundMovement = cameraMovement * this.backgroundLayer.scrollSpeed;
        
        // The background world position should lag behind camera movement
        // We subtract the difference between camera movement and background movement
        const parallaxOffset = cameraMovement - backgroundMovement;
        
        this.backgroundLayer.x1 -= parallaxOffset;
        this.backgroundLayer.x2 -= parallaxOffset;
        
        // Wrap-around logic
        const viewLeft = camera.x - 200;
        const viewRight = camera.x + CANVAS.width + 200;
        
        if (this.backgroundLayer.x1 + this.backgroundLayer.width < viewLeft) {
            this.backgroundLayer.x1 = this.backgroundLayer.x2 + this.backgroundLayer.width;
        }
        
        if (this.backgroundLayer.x2 + this.backgroundLayer.width < viewLeft) {
            this.backgroundLayer.x2 = this.backgroundLayer.x1 + this.backgroundLayer.width;
        }
        
        if (this.backgroundLayer.x1 > viewRight) {
            this.backgroundLayer.x1 = this.backgroundLayer.x2 - this.backgroundLayer.width;
        }
        if (this.backgroundLayer.x2 > viewRight) {
            this.backgroundLayer.x2 = this.backgroundLayer.x1 - this.backgroundLayer.width;
        }
        
        if (this.backgroundLayer.x1 > this.backgroundLayer.x2) {
            const temp = this.backgroundLayer.x1;
            this.backgroundLayer.x1 = this.backgroundLayer.x2;
            this.backgroundLayer.x2 = temp;
        }
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
        // EXPERIMENTAL: Simple reverse parallax formula
        // screenX = -camera.x / 2
        
        const layerY = Math.round(layer.y);
        const layerWidth = Math.round(layer.width);
        const layerHeight = Math.round(layer.height);
        
        // Test the simple formula
        const baseScreenX = Math.round(-camera.x / 2);
        
        // Draw multiple tiles to ensure coverage
        const tilesNeeded = Math.ceil(CANVAS.width / layerWidth) + 4;
        const startTile = Math.floor(baseScreenX / layerWidth) - 2;
        
        for (let i = 0; i < tilesNeeded; i++) {
            const screenX = baseScreenX + (i + startTile) * layerWidth;
            
            // Only draw if visible on screen
            if (screenX > -layerWidth && screenX < CANVAS.width + layerWidth) {
                ctx.drawImage(layer.image, screenX, layerY, layerWidth, layerHeight);
            }
        }
        
        // Debug info
        if (window.debugBackgroundRendering) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(baseScreenX, layerY, 10, 10);
            ctx.fillStyle = 'white';
            ctx.font = '12px monospace';
            ctx.fillText(`camera: ${Math.round(camera.x)}, screenX: ${baseScreenX}`, 10, 30);
        }
    }
    
    renderFallback(ctx) {
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(0, CANVAS.groundY, CANVAS.width, CANVAS.height - CANVAS.groundY);
        
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.groundY);
    }
    
    // NEW: Set background absolute scroll speed
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
    
    // DEPRECATED: Keep for compatibility but redirect to new method
    setBackgroundParallaxSpeed(ratio) {
        console.log(`⚠️ setBackgroundParallaxSpeed() is deprecated. Use setBackgroundScrollSpeed() instead.`);
        this.setBackgroundScrollSpeed(ratio);
    }
    
    // Ground speed is ignored (always static)
    setGroundSpeed(speed) {
        console.log(`⚠️ Ground speed ignored - ground is always static (like original environment)`);
        console.log(`💡 Use setBackgroundScrollSpeed() to control background movement`);
    }
    
    // NEW: Preset speed configurations
    setBackgroundPreset(preset) {
        switch (preset) {
            case 'static':
                this.setBackgroundScrollSpeed(0);
                console.log('🔧 Background preset: STATIC (no movement)');
                break;
            case 'slow':
                this.setBackgroundScrollSpeed(0.2);
                console.log('🔧 Background preset: SLOW (20% camera speed)');
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
            backgroundX1: Math.round(this.backgroundLayer.x1),
            backgroundX2: Math.round(this.backgroundLayer.x2)
        };
    }
}

export const backgroundSystem = new BackgroundSystem();

export function initBackgroundSystem(groundImagePath = 'assets/ground.png', backgroundImagePath = 'assets/background.png') {
    console.log('🌄 Initializing IMPROVED background system');
    console.log('📐 Ground: STATIC (like original environment)');
    console.log('📐 Background: PARALLAX (absolute speed control)');
    backgroundSystem.loadImages(groundImagePath, backgroundImagePath);
}

export function configureBackground(backgroundScrollSpeed = 0.5) {
    console.log(`🔧 Configuring background scroll speed: ${backgroundScrollSpeed}`);
    backgroundSystem.configure(backgroundScrollSpeed);
}

// LEGACY SUPPORT: Keep configureBackground working with new system
export function configureBackgroundSpeed(speed) {
    console.log(`🔧 Configuring background scroll speed: ${speed}`);
    backgroundSystem.setBackgroundScrollSpeed(speed);
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

// NEW: Improved background speed control
export function setBackgroundScrollSpeed(speed) {
    backgroundSystem.setBackgroundScrollSpeed(speed);
}

// NEW: Preset configurations
export function setBackgroundPreset(preset) {
    backgroundSystem.setBackgroundPreset(preset);
}

// DEPRECATED: Keep for compatibility
export function setBackgroundParallaxSpeed(ratio) {
    backgroundSystem.setBackgroundParallaxSpeed(ratio);
}

// Ground speed is ignored (always static)
export function setGroundSpeed(speed) {
    backgroundSystem.setGroundSpeed(speed);
}

export function debugBackground() {
    console.log('=== IMPROVED BACKGROUND DEBUG ===');
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
window.setBackgroundParallaxSpeed = setBackgroundParallaxSpeed;
window.setGroundSpeed = setGroundSpeed;
window.debugBackground = debugBackground;