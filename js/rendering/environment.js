// rendering/environment.js - Environment & Background Rendering

import { getScreenX } from '../core/camera.js';
import { CANVAS } from '../core/constants.js';

export function drawEnvironment(ctx, camera) {
    drawDungeonGround(ctx, camera);
}

function drawDungeonGround(ctx, camera) {
    const startX = Math.floor(camera.x / 20) * 20 - 20;
    const endX = camera.x + CANVAS.width + 20;
    
    // Dark sky
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, CANVAS.width, CANVAS.groundY);
    
    // Stone wall platform
    const wallY = CANVAS.groundY - 8;
    const wallHeight = 8;
    const brickWidth = 20;
    const brickHeight = 8;
    
    ctx.fillStyle = '#18181f';
    ctx.fillRect(0, wallY, CANVAS.width, wallHeight);
    
    // Draw upper bricks
    for (let worldX = startX; worldX < endX; worldX += brickWidth) {
        const screenX = getScreenX(worldX);
        
        if (screenX > -brickWidth && screenX < CANVAS.width) {
            const colorIndex = Math.floor((worldX / brickWidth)) % 3;
            const stoneColors = ['#2a2a35', '#22222c', '#1a1a22'];
            const baseColor = stoneColors[colorIndex];
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(screenX + 1, wallY + 1, brickWidth - 2, brickHeight - 2);
            
            ctx.fillStyle = '#32323c';
            ctx.fillRect(screenX + 1, wallY + 1, brickWidth - 2, 1);
            
            ctx.fillStyle = '#0f0f15';
            ctx.fillRect(screenX + brickWidth - 2, wallY + 1, 1, brickHeight - 1);
            ctx.fillRect(screenX + 1, wallY + brickHeight - 2, brickWidth - 1, 1);
        }
    }
    
    // Animated torches
    drawTorches(ctx, camera);
    
    // Volcanic underground
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, CANVAS.groundY, CANVAS.width, CANVAS.height - CANVAS.groundY);
    
    // Lava cracks
    drawLavaCracks(ctx, camera);
    
    // Rock layers
    drawRockLayers(ctx, camera);
    
    // Bottom walkway drawBottomWalkway(ctx, camera, startX, endX);
}

function drawTorches(ctx, camera) {
    const minTorchSpacing = 150; // Mindestabstand zwischen Fackeln
    const maxTorchSpacing = 250; // Maximaler Abstand
    
    // Berechne Fackeln basierend auf akkumulierter Position
    let currentWorldX = 0;
    const torches = [];
    
    // Generiere Fackel-Positionen innerhalb des sichtbaren Bereichs + Buffer
    const viewStart = camera.x - 200;
    const viewEnd = camera.x + CANVAS.width + 200;
    
    // Starte vor dem sichtbaren Bereich
    while (currentWorldX < viewStart) {
        const seed = Math.floor(currentWorldX / 50); // Konsistenter Seed basierend auf Position
        const randomFactor = ((seed * 73 + 17) % 100) / 100; // 0-1
        const spacing = minTorchSpacing + randomFactor * (maxTorchSpacing - minTorchSpacing);
        currentWorldX += spacing;
    }
    
    // Sammle alle Fackeln im sichtbaren Bereich
    while (currentWorldX < viewEnd) {
        torches.push(currentWorldX);
        
        const seed = Math.floor(currentWorldX / 50);
        const randomFactor = ((seed * 73 + 17) % 100) / 100;
        const spacing = minTorchSpacing + randomFactor * (maxTorchSpacing - minTorchSpacing);
        currentWorldX += spacing;
    }
    
    // Zeichne alle Fackeln
    for (let i = 0; i < torches.length; i++) {
        const worldX = torches[i];
        const screenX = getScreenX(worldX);
        
        if (screenX > -50 && screenX < CANVAS.width + 50) {
            const torchY = 50 + Math.sin(worldX * 0.01) * 15; // Basierend auf Weltposition
            const flicker = Date.now() * 0.01 + worldX * 0.02;
            
            // Torch holder
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, torchY + 15, 4, 25);
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(screenX - 2, torchY + 10, 8, 8);
            
            // Animated flame
            const flameHeight = 12 + Math.sin(flicker) * 3;
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(screenX, torchY + 2, 4, flameHeight);
            
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(screenX + 1, torchY + 4, 2, flameHeight - 4);
            
            // Light glow
            const glowAlpha = 0.3 + Math.sin(flicker) * 0.1;
            const gradient = ctx.createRadialGradient(
                screenX + 2, torchY + 8, 0,
                screenX + 2, torchY + 8, 25
            );
            gradient.addColorStop(0, `rgba(255, 165, 0, ${glowAlpha})`);
            gradient.addColorStop(0.5, `rgba(255, 69, 0, ${glowAlpha * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX - 23, torchY - 17, 50, 50);
        }
    }
}
function drawLavaCracks(ctx, camera) {
    const crackSpacing = 120;
    const startCrackIndex = Math.floor(camera.x / crackSpacing);
    const endCrackIndex = Math.ceil((camera.x + CANVAS.width) / crackSpacing) + 1;
    
    for (let i = startCrackIndex; i <= endCrackIndex; i++) {
        const worldX = i * crackSpacing + (i % 3) * 20;
        const screenX = getScreenX(worldX);
        
        if (screenX > -20 && screenX < CANVAS.width + 20) {
            const crackY = CANVAS.groundY + 15 + (i % 4) * 8;
            const crackW = 3 + (i % 3);
            const crackH = 2 + (i % 2);
            
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(screenX, crackY, crackW, crackH);
            
            // Glow
            const gradient = ctx.createRadialGradient(
                screenX + crackW/2, crackY + crackH/2, 0,
                screenX + crackW/2, crackY + crackH/2, 8
            );
            gradient.addColorStop(0, 'rgba(139, 0, 0, 0.6)');
            gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(screenX - 8, crackY - 8, crackW + 16, crackH + 16);
        }
    }
}

function drawRockLayers(ctx, camera) {
    const rockSpacing = 15;
    const startRockIndex = Math.floor(camera.x / rockSpacing);
    const endRockIndex = Math.ceil((camera.x + CANVAS.width) / rockSpacing) + 3;
    
    for (let i = startRockIndex; i <= endRockIndex; i++) {
        const baseWorldX = i * rockSpacing;
        const screenX = getScreenX(baseWorldX);
        
        if (screenX > -50 && screenX < CANVAS.width + 50) {
            // MASSIV ERWEITERT: 10 rock layers für die neue Höhe von 160 Pixeln
            for (let layer = 0; layer < 10; layer++) {
                const layerOffsets = [
                    (i % 2) * 5,
                    (i % 3) * 4 + 2,
                    (i % 4) * 3 + 1,
                    (i % 3) * 5 + 3,
                    (i % 4) * 3,
                    (i % 2) * 6 + 4,
                    (i % 3) * 4 + 6,
                    (i % 4) * 3 + 8,
                    (i % 2) * 5 + 10,  // 9. Schicht
                    (i % 3) * 3 + 12   // 10. Schicht
                ];
                
                const worldX = baseWorldX + layerOffsets[layer];
                const layerScreenX = getScreenX(worldX);
                
                // Mehr vertikaler Platz mit 160 Pixeln Bodenhöhe
                const rockY = CANVAS.groundY + 5 + layer * 15 + (i % 2) * 3; // 15 Pixel pro Schicht
                const rockSize = 16 + (i % 2) * 3 + layer * 1.2;
                
                // 10 verschiedene Grauschattierungen - wird immer dunkler
                const grayShades = [
                    '#2a2a35', '#22222c', '#1a1a22', '#15151c', '#12121a',
                    '#0f0f18', '#0d0d16', '#0b0b14', '#090912', '#070710'
                ];
                
                // NEUE: Zusätzliche Abdunkelung basierend auf Tiefe (Y-Position)
                let baseColor = grayShades[layer % grayShades.length];
                const depthFactor = Math.min(1, (rockY - CANVAS.groundY) / 160); // 0 = oben, 1 = unten
                const darkeningFactor = 1 - (depthFactor * 0.6); // Bis zu 60% dunkler
                
                // Farbe basierend auf Tiefe anpassen
                const rgb = parseInt(baseColor.slice(1), 16);
                const r = Math.floor(((rgb >> 16) & 255) * darkeningFactor);
                const g = Math.floor(((rgb >> 8) & 255) * darkeningFactor);
                const b = Math.floor((rgb & 255) * darkeningFactor);
                const darkenedColor = `rgb(${r}, ${g}, ${b})`;
                
                ctx.fillStyle = darkenedColor;
                
                const expandedSize = rockSize + layer * 2 + 4;
                ctx.fillRect(layerScreenX - layer * 1, rockY, expandedSize, expandedSize * 0.85);
                
                // Shadow - auch dunkler machen
                const shadowDarkeningFactor = darkeningFactor * 0.5; // Schatten noch dunkler
                ctx.fillStyle = `rgb(${Math.floor(10 * shadowDarkeningFactor)}, ${Math.floor(10 * shadowDarkeningFactor)}, ${Math.floor(15 * shadowDarkeningFactor)})`;
                ctx.fillRect(layerScreenX + expandedSize * 0.65 - layer * 1, rockY + expandedSize * 0.35, 
                           expandedSize * 0.35, expandedSize * 0.5);
                
                // Cracks - mehr Schichten haben Risse
                if (layer < 7 && (i + layer) % 4 === 0) {
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(layerScreenX + expandedSize * 0.3, rockY + expandedSize * 0.2, 
                               1, expandedSize * 0.6);
                }
                
                // Fill stones - bis zur 8. Schicht
                if (layer < 8) {
                    const fillX = layerScreenX + expandedSize * 0.7;
                    const fillSize = expandedSize * 0.4;
                    
                    // Auch Fill-Steine dunkler machen
                    let fillBaseColor = grayShades[(layer + 1) % grayShades.length];
                    const fillRgb = parseInt(fillBaseColor.slice(1), 16);
                    const fillR = Math.floor(((fillRgb >> 16) & 255) * darkeningFactor);
                    const fillG = Math.floor(((fillRgb >> 8) & 255) * darkeningFactor);
                    const fillB = Math.floor((fillRgb & 255) * darkeningFactor);
                    ctx.fillStyle = `rgb(${fillR}, ${fillG}, ${fillB})`;
                    
                    ctx.fillRect(fillX, rockY + expandedSize * 0.2, fillSize, fillSize);
                }
            }
            
            // MASSIV ERWEITERT: 12 kleine Steine-Reihen
            for (let j = 0; j < 12; j++) {
                const smallOffset = (i + j) % 4 * 2;
                const smallX = screenX + j * 5 + smallOffset; // Dichter gepackt
                const smallY = CANVAS.groundY + 8 + j * 12 + (i % 2) * 2; // Über die gesamte Höhe verteilt
                const smallSize = 4 + (j % 4) * 1.5;
                
                const smallStoneColors = [
                    '#1f1f28', '#181820', '#161619', '#141417', '#121215', '#101013',
                    '#0e0e11', '#0c0c0f', '#0a0a0d', '#08080b', '#060609', '#040407'
                ];
                
                // NEUE: Auch kleine Steine nach Tiefe abdunkeln
                const smallDepthFactor = Math.min(1, (smallY - CANVAS.groundY) / 160);
                const smallDarkeningFactor = 1 - (smallDepthFactor * 0.7); // Kleine Steine noch stärker abdunkeln
                
                let smallBaseColor = smallStoneColors[j % smallStoneColors.length];
                const smallRgb = parseInt(smallBaseColor.slice(1), 16);
                const smallR = Math.floor(((smallRgb >> 16) & 255) * smallDarkeningFactor);
                const smallG = Math.floor(((smallRgb >> 8) & 255) * smallDarkeningFactor);
                const smallB = Math.floor((smallRgb & 255) * smallDarkeningFactor);
                
                ctx.fillStyle = `rgb(${smallR}, ${smallG}, ${smallB})`;
                ctx.fillRect(smallX, smallY, smallSize, smallSize * 0.8);
            }
        }
    }
    
    // Final dark layer - ganz unten - NOCH DUNKLER
    for (let i = startRockIndex; i <= endRockIndex; i++) {
        const baseWorldX = i * rockSpacing;
        const screenX = getScreenX(baseWorldX);
        
        if (screenX > -50 && screenX < CANVAS.width + 50) {
            const worldX = baseWorldX + (i % 3) * 4;
            const layerScreenX = getScreenX(worldX);
            const rockY = CANVAS.groundY + 140; // Nutzt fast die gesamte Bodenhöhe
            const rockSize = 22 + (i % 2) * 4;
            
            // Fast komplett schwarz für unterste Schicht
            ctx.fillStyle = '#020204';
            ctx.fillRect(layerScreenX, rockY, rockSize + 8, rockSize * 0.9);
            
            // Schatten noch dunkler
            ctx.fillStyle = '#000000';
            ctx.fillRect(layerScreenX + rockSize * 0.7, rockY + rockSize * 0.4, 
                       (rockSize + 8) * 0.3, rockSize * 0.5);
        }
    }
    
    // NEUE: Zusätzlicher Gradient-Overlay für smooth transition zum Bildschirmrand
    const gradientOverlay = ctx.createLinearGradient(0, CANVAS.groundY, 0, CANVAS.height);
    gradientOverlay.addColorStop(0, 'rgba(0, 0, 0, 0)');      // Transparent oben
    gradientOverlay.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)');   // Leicht dunkel
    gradientOverlay.addColorStop(0.7, 'rgba(0, 0, 0, 0.3)');   // Mittlere Dunkelheit
    gradientOverlay.addColorStop(1, 'rgba(0, 0, 0, 0.6)');     // Sehr dunkel unten
    
    ctx.fillStyle = gradientOverlay;
    ctx.fillRect(0, CANVAS.groundY, CANVAS.width, CANVAS.height - CANVAS.groundY);
}
function drawBottomWalkway(ctx, camera, startX, endX) {
    const bottomWallY = CANVAS.height - 8;
    const bottomWallHeight = 8;
    const bottomBrickWidth = 20;
    const bottomBrickHeight = 8;
    
    // Dark mortar background
    ctx.fillStyle = '#080809';
    ctx.fillRect(0, bottomWallY, CANVAS.width, bottomWallHeight);
    
    for (let worldX = startX; worldX < endX; worldX += bottomBrickWidth) {
        const screenX = getScreenX(worldX);
        
        if (screenX > -bottomBrickWidth && screenX < CANVAS.width) {
            const colorIndex = Math.floor((worldX / bottomBrickWidth)) % 3;
            const darkStoneColors = ['#0f0f15', '#0c0c12', '#0a0a10'];
            const baseColor = darkStoneColors[colorIndex];
            
            ctx.fillStyle = baseColor;
            ctx.fillRect(screenX + 1, bottomWallY + 1, bottomBrickWidth - 2, bottomBrickHeight - 2);
            
            ctx.fillStyle = '#15151a';
            ctx.fillRect(screenX + 1, bottomWallY + 1, bottomBrickWidth - 2, 1);
            
            ctx.fillStyle = '#000000';
            ctx.fillRect(screenX + bottomBrickWidth - 2, bottomWallY + 1, 1, bottomBrickHeight - 1);
            ctx.fillRect(screenX + 1, bottomWallY + bottomBrickHeight - 2, bottomBrickWidth - 1, 1);
        }
    }
}