// js/background-system.js - FINAL FIX (Ground as Static, Background as Parallax)

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
            cameraRatio: 0.5,     // Background moves slower than camera
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
            console.log(`📐 Background: PARALLAX (ratio ${this.backgroundLayer.cameraRatio})`);
        }
    }
    
    configure(backgroundCameraRatio) {
        this.backgroundLayer.cameraRatio = Math.max(0, Math.min(1, backgroundCameraRatio));
        
        console.log(`🔧 Background configured:`);
        console.log(`   Ground: STATIC (stays with world objects)`);
        console.log(`   Background: PARALLAX ratio ${this.backgroundLayer.cameraRatio}`);
        console.log(`📐 Example: Camera moves 100px → Background moves ${this.backgroundLayer.cameraRatio * 100}px`);
    }
    
    update() {
        if (!this.initialized) return;
        
        const cameraMovement = camera.x - this.lastCameraX;
        this.lastCameraX = camera.x;
        
        if (Math.abs(cameraMovement) < 0.1) return;
        
        // Ground layer doesn't need updates (static rendering)
        
        // Update background layer (parallax)
        if (this.backgroundLayer.loaded) {
            this.updateBackgroundLayer(cameraMovement);
        }
    }
    
    updateBackgroundLayer(cameraMovement) {
        const parallaxMovement = cameraMovement * this.backgroundLayer.cameraRatio;
        
        this.backgroundLayer.x1 -= parallaxMovement;
        this.backgroundLayer.x2 -= parallaxMovement;
        
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
        // PARALLAX RENDERING: Moving background
        
        const screenX1 = Math.round(layer.x1 - camera.x);
        const screenX2 = Math.round(layer.x2 - camera.x);
        const layerY = Math.round(layer.y);
        const layerWidth = Math.round(layer.width);
        const layerHeight = Math.round(layer.height);
        const overlap = 1;
        
        if (screenX1 > -layerWidth - overlap && screenX1 < CANVAS.width + overlap) {
            ctx.drawImage(layer.image, screenX1, layerY, layerWidth + overlap, layerHeight);
        }
        
        if (screenX2 > -layerWidth - overlap && screenX2 < CANVAS.width + overlap) {
            ctx.drawImage(layer.image, screenX2 - overlap, layerY, layerWidth + overlap, layerHeight);
        }
    }
    
    renderFallback(ctx) {
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(0, CANVAS.groundY, CANVAS.width, CANVAS.height - CANVAS.groundY);
        
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.groundY);
    }
    
    // Set background parallax ratio (only setting that matters)
    setBackgroundParallaxSpeed(ratio) {
        this.backgroundLayer.cameraRatio = Math.max(0, Math.min(1, ratio));
        console.log(`🔧 Background parallax ratio: ${this.backgroundLayer.cameraRatio}`);
        console.log(`📐 Camera moves 100px → Background moves ${this.backgroundLayer.cameraRatio * 100}px`);
    }
    
    // REMOVED: setGroundSpeed() - ground is always static
    setGroundSpeed(speed) {
        console.log(`⚠️ Ground speed ignored - ground is always static (like original environment)`);
        console.log(`💡 Use setBackgroundParallaxSpeed() to control parallax effect`);
    }
    
    getDebugInfo() {
        return {
            initialized: this.initialized,
            groundLoaded: this.groundLayer.loaded,
            backgroundLoaded: this.backgroundLayer.loaded,
            cameraX: camera.x,
            groundRenderMode: this.groundLayer.renderMode,
            backgroundRenderMode: this.backgroundLayer.renderMode,
            backgroundCameraRatio: this.backgroundLayer.cameraRatio,
            backgroundX1: Math.round(this.backgroundLayer.x1),
            backgroundX2: Math.round(this.backgroundLayer.x2)
        };
    }
}

export const backgroundSystem = new BackgroundSystem();

export function initBackgroundSystem(groundImagePath = 'assets/ground.png', backgroundImagePath = 'assets/background.png') {
    console.log('🌄 Initializing FINAL background system');
    console.log('📐 Ground: STATIC (like original environment)');
    console.log('📐 Background: PARALLAX (configurable speed)');
    backgroundSystem.loadImages(groundImagePath, backgroundImagePath);
}

export function configureBackground(backgroundParallaxRatio = 0.5) {
    console.log(`🔧 Configuring background parallax: ${backgroundParallaxRatio}`);
    backgroundSystem.configure(backgroundParallaxRatio);
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

// Only background speed matters now
export function setBackgroundParallaxSpeed(ratio) {
    backgroundSystem.setBackgroundParallaxSpeed(ratio);
}

// Ground speed is ignored (always static)
export function setGroundSpeed(speed) {
    backgroundSystem.setGroundSpeed(speed);
}

export function debugBackground() {
    console.log('=== FINAL BACKGROUND DEBUG ===');
    const info = backgroundSystem.getDebugInfo();
    console.table(info);
    console.log('=============================');
}

window.backgroundSystem = backgroundSystem;
window.initBackgroundSystem = initBackgroundSystem;
window.configureBackground = configureBackground;
window.setBackgroundParallaxSpeed = setBackgroundParallaxSpeed;
window.setGroundSpeed = setGroundSpeed;
window.debugBackground = debugBackground;