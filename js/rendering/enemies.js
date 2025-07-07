// rendering/enemies.js - Alle Enemy Render-Funktionen für Dungeon Theme - FPS KORRIGIERT

import { getScreenX } from '../core/camera.js';
import { gameState } from '../core/gameState.js';
import { CANVAS } from '../core/constants.js';
import { spriteManager, drawSkeletonSprite } from './sprite-system.js';




// rendering/enemies.js - VERBESSERTE BAT MIT RICHTUNGS-ANZEIGE

function drawBat(ctx, x, y, bat) {
    // FPS-normalisiert: Verwende konsistente Zeit für Animation
    const currentTime = Date.now() * 0.001;
    const wingFlap = Math.sin(currentTime * 12) * 8;
    const hover = Math.sin(currentTime * 4) * 3;
    const bloodPulse = 0.7 + Math.sin(currentTime * 8) * 0.3;
    
    // Vergrößerungsfaktor
    const scale = 1.2;
    
    // NEUE: Bat dreht sich zum Spieler wenn sie ihn verfolgt
    const facingLeft = bat && bat.facingPlayer === -1;
    
    ctx.save();
    
    // Horizontales Flippen wenn die Bat nach links schaut
    if (facingLeft) {
        ctx.scale(-1, 1);
        x = -x - (56 * scale); // Breite der Bat kompensieren (mit scale)
    }
    
    // DUNKLE BEDROHLICHE AURA - rote Spinnen-Farbwelt
    const auraAlpha = 0.3 + Math.sin(currentTime * 6) * 0.2;
    const gradient = ctx.createRadialGradient(
        x + (28 * scale), y + (12 * scale) + hover, 0,
        x + (28 * scale), y + (12 * scale) + hover, 35 * scale
    );
    gradient.addColorStop(0, `rgba(139, 0, 0, ${auraAlpha * 0.6})`);
    gradient.addColorStop(0.5, `rgba(75, 0, 0, ${auraAlpha * 0.4})`);
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - (12 * scale), y - (12 * scale) + hover, 80 * scale, 52 * scale);
    
    // FLÜGEL - Rote Farbabstufungen wie Spinne
    // Linker Flügel - Hauptstruktur (dunkelstes Rot)
    ctx.fillStyle = '#1A0000'; // Sehr dunkles Rot wie Spinnen-Hauptkörper
    ctx.fillRect(x + (-2 * scale) + wingFlap, y + (8 * scale) + hover, 22 * scale, 10 * scale);
    ctx.fillRect(x + (1 * scale) + wingFlap, y + (6 * scale) + hover, 18 * scale, 14 * scale);
    ctx.fillRect(x + (4 * scale) + wingFlap, y + (4 * scale) + hover, 12 * scale, 18 * scale);
    
    // Flügel-Highlights (mittleres Rot für 3D)
    ctx.fillStyle = '#2F0000'; // Etwas heller für 3D
    ctx.fillRect(x + (0 * scale) + wingFlap, y + (9 * scale) + hover, 18 * scale, 8 * scale);
    ctx.fillRect(x + (3 * scale) + wingFlap, y + (7 * scale) + hover, 14 * scale, 12 * scale);
    ctx.fillRect(x + (6 * scale) + wingFlap, y + (5 * scale) + hover, 8 * scale, 16 * scale);
    
    // Flügel-Schatten (fast schwarz für Tiefe)
    ctx.fillStyle = '#0A0000';
    ctx.fillRect(x + (16 * scale) + wingFlap, y + (12 * scale) + hover, 6 * scale, 8 * scale);
    ctx.fillRect(x + (12 * scale) + wingFlap, y + (16 * scale) + hover, 8 * scale, 4 * scale);
    
    // Gezackte Flügelspitzen (detaillierter in Rotabstufungen)
    ctx.fillStyle = '#1A0000';
    for (let i = 0; i < 4; i++) {
        const tipX = x + (-4 + i * 2) * scale + wingFlap;
        const tipY = y + (10 + i * 3) * scale + hover;
        const tipSize = 4 - i;
        ctx.fillRect(tipX, tipY, tipSize * scale, 3 * scale);
        
        // Spitzen-Highlights
        ctx.fillStyle = '#4A0000';
        ctx.fillRect(tipX + 1, tipY + 1, Math.max(1, tipSize - 1) * scale, 1 * scale);
        ctx.fillStyle = '#1A0000';
    }
    
    // Rechter Flügel - Hauptstruktur
    ctx.fillStyle = '#1A0000';
    ctx.fillRect(x + (36 * scale) - wingFlap, y + (8 * scale) + hover, 22 * scale, 10 * scale);
    ctx.fillRect(x + (37 * scale) - wingFlap, y + (6 * scale) + hover, 18 * scale, 14 * scale);
    ctx.fillRect(x + (40 * scale) - wingFlap, y + (4 * scale) + hover, 12 * scale, 18 * scale);
    
    // Rechter Flügel-Highlights
    ctx.fillStyle = '#2F0000';
    ctx.fillRect(x + (38 * scale) - wingFlap, y + (9 * scale) + hover, 18 * scale, 8 * scale);
    ctx.fillRect(x + (39 * scale) - wingFlap, y + (7 * scale) + hover, 14 * scale, 12 * scale);
    ctx.fillRect(x + (42 * scale) - wingFlap, y + (5 * scale) + hover, 8 * scale, 16 * scale);
    
    // Rechter Flügel-Schatten
    ctx.fillStyle = '#0A0000';
    ctx.fillRect(x + (34 * scale) - wingFlap, y + (12 * scale) + hover, 6 * scale, 8 * scale);
    ctx.fillRect(x + (36 * scale) - wingFlap, y + (16 * scale) + hover, 8 * scale, 4 * scale);
    
    // Rechte Flügelspitzen mit Highlights
    ctx.fillStyle = '#1A0000';
    for (let i = 0; i < 4; i++) {
        const tipX = x + (54 + i * 2) * scale - wingFlap;
        const tipY = y + (10 + i * 3) * scale + hover;
        const tipSize = 4 - i;
        ctx.fillRect(tipX, tipY, tipSize * scale, 3 * scale);
        
        // Spitzen-Highlights
        ctx.fillStyle = '#4A0000';
        ctx.fillRect(tipX + 1, tipY + 1, Math.max(1, tipSize - 1) * scale, 1 * scale);
        ctx.fillStyle = '#1A0000';
    }
    
    // KÖRPER - Rote Abstufungen wie Spinne
    ctx.fillStyle = '#0A0000'; // Sehr dunkles Rot (wie Spinne dunkel)
    ctx.fillRect(x + (20 * scale), y + (8 * scale) + hover, 18 * scale, 16 * scale);
    
    // Körper-Highlight (mittleres Rot für 3D)
    ctx.fillStyle = '#1A0000';
    ctx.fillRect(x + (22 * scale), y + (8 * scale) + hover, 14 * scale, 16 * scale);
    
    // Körper-Details (helles Rot für Markierungen wie Spinne)
    ctx.fillStyle = '#4A0000';
    ctx.fillRect(x + (24 * scale), y + (10 * scale) + hover, 10 * scale, 2 * scale);
    ctx.fillRect(x + (25 * scale), y + (14 * scale) + hover, 8 * scale, 2 * scale);
    ctx.fillRect(x + (24 * scale), y + (18 * scale) + hover, 10 * scale, 2 * scale);
    
    // KOPF - Rote Abstufungen
    ctx.fillStyle = '#0A0000'; // Dunkelstes Rot
    ctx.fillRect(x + (24 * scale), y + (6 * scale) + hover, 10 * scale, 8 * scale);
    
    // Kopf-Highlight
    ctx.fillStyle = '#1A0000';
    ctx.fillRect(x + (25 * scale), y + (7 * scale) + hover, 8 * scale, 6 * scale);
    
    // GLÜHENDE RAUBTIERAUGEN - wie Spinne
    const eyeGlow = 0.8 + Math.sin(currentTime * 7) * 0.2;
    
    // Augenhöhlen (sehr dunkel)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + (25 * scale), y + (8 * scale) + hover, 3 * scale, 3 * scale);
    ctx.fillRect(x + (30 * scale), y + (8 * scale) + hover, 3 * scale, 3 * scale);
    
    // Leuchtende Augen (helles Rot)
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
    ctx.fillRect(x + (25 * scale), y + (8 * scale) + hover, 3 * scale, 3 * scale);
    ctx.fillRect(x + (30 * scale), y + (8 * scale) + hover, 3 * scale, 3 * scale);
    
    // Pupillen (schwarz für Kontrast)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + (26 * scale), y + (8 * scale) + hover, 1 * scale, 3 * scale);
    ctx.fillRect(x + (31 * scale), y + (8 * scale) + hover, 1 * scale, 3 * scale);
    
    // Helle Augenpunkte (leuchtend rot)
    ctx.fillStyle = `rgba(255, 100, 100, ${eyeGlow})`;
    ctx.fillRect(x + (26 * scale), y + (9 * scale) + hover, 1 * scale, 1 * scale);
    ctx.fillRect(x + (31 * scale), y + (9 * scale) + hover, 1 * scale, 1 * scale);
    
    // MAUL - Rote Abstufungen
    const mouthOpen = (bat && bat.isSpitting) ? 6 : 2;
    ctx.fillStyle = '#8B0000'; // Mittleres Rot für Maul-Inneres
    ctx.fillRect(x + (26 * scale), y + (12 * scale) + hover, 6 * scale, mouthOpen * scale);
    
    // Maul-Schatten (dunkles Rot)
    ctx.fillStyle = '#2F0000';
    ctx.fillRect(x + (27 * scale), y + (13 * scale) + hover, 4 * scale, (mouthOpen - 1) * scale);
    
    // Maul-Tiefe (sehr dunkel)
    ctx.fillStyle = '#0A0000';
    ctx.fillRect(x + (28 * scale), y + (13 * scale) + hover, 2 * scale, (mouthOpen - 1) * scale);
    
    // REISSZÄHNE - Weiß mit rötlichen Schatten
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + (27 * scale), y + (12 * scale) + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + (30 * scale), y + (12 * scale) + hover, 1 * scale, 4 * scale);
    
    // Zahn-Highlights
    ctx.fillStyle = '#F0F0F0';
    ctx.fillRect(x + (27 * scale), y + (12 * scale) + hover, 1 * scale, 1 * scale);
    ctx.fillRect(x + (30 * scale), y + (12 * scale) + hover, 1 * scale, 1 * scale);
    
    // Blut an den Zähnen (dunkelrot)
    ctx.fillStyle = '#4A0000';
    ctx.fillRect(x + (27 * scale), y + (15 * scale) + hover, 1 * scale, 1 * scale);
    ctx.fillRect(x + (30 * scale), y + (15 * scale) + hover, 1 * scale, 1 * scale);
    
    // RICHTUNGS-INDIKATOR - Nur wenn spuckend
    if (bat && bat.isSpitting && bat.hasTargeted) {
        ctx.fillStyle = `rgba(255, 0, 0, ${bloodPulse})`;
        const arrowDirection = bat.facingPlayer || 1;
        
        // Bedrohlicherer Richtungspfeil
        ctx.fillRect(x + (28 * scale) + (arrowDirection * 8 * scale), y + (2 * scale) + hover, 4 * scale, 2 * scale);
        ctx.fillRect(x + (30 * scale) + (arrowDirection * 10 * scale), y + (1 * scale) + hover, 2 * scale, 4 * scale);
        
        // Zusätzliche Warnung (helles Rot)
        ctx.fillStyle = `rgba(255, 100, 100, ${bloodPulse * 0.8})`;
        ctx.fillRect(x + (29 * scale) + (arrowDirection * 9 * scale), y + (2 * scale) + hover, 2 * scale, 2 * scale);
    }
    
    // SPUCKEN LOGIC - Rote Lade-Effekte
    if (bat && bat.isSpitting) {
        const chargeProgress = (60 - bat.spitChargeTime) / 60;
        const intensity = Math.sin(currentTime * 20) * 0.5 + 0.5;
        
        // Rote Lade-Aura mit Gradient
        const centerX = x + (28 * scale);
        const centerY = y + (12 * scale) + hover;
        const maxRadius = (20 + chargeProgress * 25) * scale;
        const auraAlpha = chargeProgress * 0.8 * intensity;
        
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxRadius
        );
        gradient.addColorStop(0, `rgba(255, 0, 0, ${auraAlpha})`);
        gradient.addColorStop(0.3, `rgba(200, 0, 0, ${auraAlpha * 0.8})`);
        gradient.addColorStop(0.6, `rgba(139, 0, 0, ${auraAlpha * 0.5})`);
        gradient.addColorStop(0.8, `rgba(75, 0, 0, ${auraAlpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore(); // Restore transformation
}
function drawTeslaCoil(ctx, x, y, width, height, obstacle) {
    const scale = 1.5; // GRÖSSER!
    const timeScale = Date.now() * 0.001;
    
    // HÄNGT VON DECKE - aber jetzt VIEL LÄNGER
    const ceilingY = 0; // Decke des Spielfelds
    const actualY = ceilingY; // Tesla Coil hängt direkt an der Decke
    const extendedHeight = height * 2; // DOPPELTE HÖHE für bessere Sichtbarkeit
    
    // Ceiling mount/attachment - GRÖSSER
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + 4, actualY, width - 8, 12); // Dickere Befestigung
    
    // Main coil body (hängend) - VERLÄNGERT
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x + 3, actualY + 12, width - 6, extendedHeight - 20);
    
    // Metallische Details
    ctx.fillStyle = '#5A5A5A';
    ctx.fillRect(x + 5, actualY + 14, width - 10, extendedHeight - 24);
    
    // Copper coils (von oben nach unten) - MEHR SPULEN
    ctx.fillStyle = '#B87333';
    for (let i = 0; i < 16; i++) { // Doppelt so viele Spulen
        const coilY = actualY + 16 + i * 6;
        ctx.fillRect(x + 2, coilY, width - 4, 3);
        
        // Spulen-Highlights
        ctx.fillStyle = '#D4A574';
        ctx.fillRect(x + 2, coilY, width - 4, 1);
        ctx.fillStyle = '#B87333';
    }
    
    // Bottom electrode (UNTEN) - GRÖSSER
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 6, actualY + extendedHeight - 30, width - 12, 25);
    ctx.fillRect(x + 8, actualY + extendedHeight - 15, width - 16, 15);
    
    // Elektroden-Details
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(x + 8, actualY + extendedHeight - 28, width - 16, 2);
    ctx.fillRect(x + 10, actualY + extendedHeight - 13, width - 20, 2);
    
    // IDLE ELECTRIC EFFECTS - Immer aktive kleine Blitze
    if (obstacle.state === 'idle' || obstacle.state === 'cooldown') {
        // Konstante elektrische Aktivität
        const idleIntensity = 0.3 + Math.sin(timeScale * 10) * 0.2;
        
        // Elektrische Aura um die Spule
        const auraGradient = ctx.createRadialGradient(
            x + width/2, actualY + extendedHeight/2, 0,
            x + width/2, actualY + extendedHeight/2, width * 1.5
        );
        auraGradient.addColorStop(0, `rgba(0, 200, 255, ${idleIntensity * 0.3})`);
        auraGradient.addColorStop(0.5, `rgba(0, 150, 255, ${idleIntensity * 0.2})`);
        auraGradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
        ctx.fillStyle = auraGradient;
        ctx.fillRect(x - width, actualY, width * 3, extendedHeight);
        
        // Kleine Blitze die um die Spule zucken
        ctx.strokeStyle = `rgba(0, 200, 255, ${idleIntensity})`;
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 4; i++) {
            if (Math.random() > 0.3) {
                ctx.beginPath();
                const startY = actualY + 20 + Math.random() * (extendedHeight - 40);
                const startX = x + width/2;
                const endX = startX + (Math.random() - 0.5) * 30;
                const endY = startY + (Math.random() - 0.5) * 20;
                
                ctx.moveTo(startX, startY);
                // Zick-Zack Blitz
                const midX = (startX + endX) / 2 + (Math.random() - 0.5) * 10;
                const midY = (startY + endY) / 2 + (Math.random() - 0.5) * 10;
                ctx.lineTo(midX, midY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            }
        }
        
        // Funken an den Spulen
        ctx.fillStyle = `rgba(0, 255, 255, ${idleIntensity})`;
        for (let i = 0; i < 6; i++) {
            if (Math.random() > 0.5) {
                const sparkX = x + 4 + Math.random() * (width - 8);
                const sparkY = actualY + 20 + Math.random() * (extendedHeight - 40);
                ctx.fillRect(sparkX, sparkY, 2, 2);
            }
        }
    }
    
    // State-based effects
    if (obstacle.state === 'charging') {
        // VERSTÄRKTE Charging glow für bessere Warnung
        const chargeIntensity = (obstacle.chargeTime - obstacle.stateTimer) / obstacle.chargeTime;
        const glowAlpha = Math.min(chargeIntensity * 1.5, 1.0);
        
        // Hauptglow - GRÖSSER
        ctx.fillStyle = `rgba(0, 255, 255, ${glowAlpha})`;
        const glowSize = chargeIntensity * 25; // Größerer Glow
        ctx.fillRect(x + 6 - glowSize/2, actualY + extendedHeight - 30 - glowSize/2, 
                     width - 12 + glowSize, 25 + glowSize);
        
        // Zusätzlicher Warnglow um die GESAMTE verlängerte Spule
        ctx.fillStyle = `rgba(255, 100, 0, ${glowAlpha * 0.6})`; // Orange Warnung
        const warningGlow = chargeIntensity * 30;
        ctx.fillRect(x - warningGlow/2, actualY - warningGlow/2, 
                     width + warningGlow, extendedHeight + warningGlow);
        
        // Verstärkte Sparks entlang der ganzen Spule
        if (Math.random() > 0.3) {
            ctx.fillStyle = '#FFFF00';
            for (let s = 0; s < 6; s++) {
                const sparkX = x + 4 + Math.random() * (width - 8);
                const sparkY = actualY + 20 + Math.random() * (extendedHeight - 40);
                ctx.fillRect(sparkX, sparkY, 4, 4); // Größere Funken
            }
        }
        
        // Elektrische Bögen zwischen den Spulen
        ctx.strokeStyle = `rgba(0, 255, 255, ${glowAlpha})`;
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            if (Math.random() > 0.4) {
                ctx.beginPath();
                const arcY = actualY + 30 + i * 30;
                ctx.moveTo(x + 2, arcY);
                ctx.quadraticCurveTo(x + width/2, arcY - 10, x + width - 2, arcY);
                ctx.stroke();
            }
        }
        
        // Pulsierende Warnung bei fast vollständiger Ladung
        if (chargeIntensity > 0.8) {
            const pulse = Math.sin(Date.now() * 0.02) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.8})`; // Rote Warnung
            ctx.fillRect(x - 10, actualY - 10, width + 20, extendedHeight + 20);
            
            // Warnung am Boden wo der Strahl auftreffen wird
            const beamX = x + width/2 - 8;
            ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.6})`;
            ctx.fillRect(beamX - 10, CANVAS.height - 20, 36, 20);
        }
    }
    
    if (obstacle.state === 'zapping' && obstacle.zapActive) {
        // Active energy beam (VON DECKE BIS ZUM BODEN) - BREITER
        const beamX = x + width/2 - 10; // Breiterer Strahl
        const beamY = actualY + extendedHeight; // Startet am unteren Ende der verlängerten Spule
        const beamWidth = 20; // Breiter
        const beamHeight = CANVAS.height - beamY;
        
        // VERSTÄRKTER Main beam
        ctx.fillStyle = 'rgba(0, 255, 255, 1.0)';
        ctx.fillRect(beamX, beamY, beamWidth, beamHeight);
        
        // HELLERER Beam core
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillRect(beamX + 4, beamY, beamWidth - 8, beamHeight);
        
        // Zusätzliche äußere Glow-Schichten
        ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
        ctx.fillRect(beamX - 6, beamY, beamWidth + 12, beamHeight);
        
        ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.fillRect(beamX - 12, beamY, beamWidth + 24, beamHeight);
        
        // MEHR Lightning arcs
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            ctx.moveTo(beamX + Math.random() * beamWidth, beamY);
            ctx.lineTo(beamX + Math.random() * beamWidth, beamY + beamHeight);
            ctx.stroke();
        }
        
        // VERSTÄRKTER Ground impact
        ctx.fillStyle = 'rgba(255, 255, 0, 1.0)';
        const impactSize = 40;
        ctx.fillRect(beamX - impactSize/2 + beamWidth/2, CANVAS.height - 12, impactSize, 12);
        
        // Boden-Explosion
        const explosionRadius = 30 + Math.sin(Date.now() * 0.05) * 10;
        const explosionGradient = ctx.createRadialGradient(
            beamX + beamWidth/2, CANVAS.height - 6, 0,
            beamX + beamWidth/2, CANVAS.height - 6, explosionRadius
        );
        explosionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        explosionGradient.addColorStop(0.3, 'rgba(255, 255, 0, 0.6)');
        explosionGradient.addColorStop(0.6, 'rgba(255, 150, 0, 0.4)');
        explosionGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        ctx.fillStyle = explosionGradient;
        ctx.fillRect(beamX - explosionRadius + beamWidth/2, CANVAS.height - explosionRadius - 6, 
                     explosionRadius * 2, explosionRadius);
        
        // Screen flash effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    }
    
    // Energie-Indikator Ringe um die Spule
    const energyLevel = obstacle.state === 'charging' ? 
        (obstacle.chargeTime - obstacle.stateTimer) / obstacle.chargeTime : 0;
    
    if (energyLevel > 0) {
        ctx.strokeStyle = `rgba(0, 255, 255, ${energyLevel * 0.5})`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const ringY = actualY + extendedHeight - 40 - i * 20;
            const ringRadius = 20 + i * 5;
            ctx.beginPath();
            ctx.ellipse(x + width/2, ringY, ringRadius * (1 + energyLevel * 0.3), 
                       ringRadius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
function drawFrankensteinTable(ctx, x, y, width, height, obstacle) {
    const scale = 1.1;
    const timeScale = Date.now() * 0.001;
    
    // Tisch steht auf dem Boden
    const tableY = y; // Y-Position am Boden
    
    // Tisch-Basis (schwerer Stein/Metall)
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + 4, tableY + height - 12, width - 8, 12); // Basis
    
    // Tisch-Beine (eiserne Säulen)
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + 2, tableY + height - 20, 6, 8); // Linkes Bein
    ctx.fillRect(x + width - 8, tableY + height - 20, 6, 8); // Rechtes Bein
    
    // Haupt-Tischplatte
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(x, tableY + height - 25, width, 8);
    
    // Metallrahmen
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x + 2, tableY + height - 27, width - 4, 2);
    ctx.fillRect(x + 2, tableY + height - 18, width - 4, 2);
    
    // VERBESSERT: Frankenstein-Körper auf dem Tisch - jetzt besser sichtbar
    const bodyY = tableY + 5; // Körper liegt DEUTLICH ÜBER dem Tisch
    
    // Größerer, besser sichtbarer Körper
    ctx.fillStyle = '#8FBC8F'; // Grünliche Haut
    ctx.fillRect(x + 4, bodyY, width - 8, 24); // Torso - größer und höher
    ctx.fillRect(x + 12, bodyY - 10, width - 24, 10); // Kopf - höher positioniert
    
    // Körper-Details
    ctx.fillStyle = '#556B2F'; // Dunklere Haut-Schatten
    ctx.fillRect(x + 7, bodyY + 3, 2, 18); // Bauch-Naht
    ctx.fillRect(x + width - 9, bodyY + 3, 2, 18); // Seiten-Naht
    ctx.fillRect(x + width/2 - 1, bodyY - 8, 2, 8); // Hals-Naht
    
    // Arme - seitlich ausgestreckt für bessere Sichtbarkeit
    ctx.fillStyle = '#8FBC8F';
    ctx.fillRect(x - 4, bodyY + 5, 8, 4); // Linker Arm
    ctx.fillRect(x + width - 4, bodyY + 5, 8, 4); // Rechter Arm
    
    // Hände
    ctx.fillRect(x - 6, bodyY + 4, 4, 6); // Linke Hand
    ctx.fillRect(x + width + 2, bodyY + 4, 4, 6); // Rechte Hand
    
    // Beine
    ctx.fillRect(x + 10, bodyY + 24, 6, 10); // Linkes Bein
    ctx.fillRect(x + width - 16, bodyY + 24, 6, 10); // Rechtes Bein
    
    // Füße
    ctx.fillRect(x + 9, bodyY + 34, 8, 4); // Linker Fuß
    ctx.fillRect(x + width - 17, bodyY + 34, 8, 4); // Rechter Fuß
    
    // Metall-Bolzen im Hals (klassisches Frankenstein-Detail)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 8, bodyY - 3, 4, 4); // Linker Bolzen
    ctx.fillRect(x + width - 12, bodyY - 3, 4, 4); // Rechter Bolzen
    
    // Gesichtsdetails
    ctx.fillStyle = '#000000';
    // Augen
    ctx.fillRect(x + 16, bodyY - 6, 3, 3); // Linkes Auge
    ctx.fillRect(x + width - 19, bodyY - 6, 3, 3); // Rechtes Auge
    // Mund (genähte Linie)
    ctx.fillRect(x + 18, bodyY - 2, width - 36, 1);
    
    // Nähte am Körper
    ctx.fillStyle = '#556B2F';
    // Horizontale Nähte
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 10, bodyY + 5 + i * 6, 1, 3);
        ctx.fillRect(x + 14, bodyY + 5 + i * 6, 1, 3);
        ctx.fillRect(x + width - 15, bodyY + 5 + i * 6, 1, 3);
        ctx.fillRect(x + width - 11, bodyY + 5 + i * 6, 1, 3);
    }
    
    // Labor-Ausrüstung um den Tisch
    const equipmentFloat = Math.sin(timeScale * 3) * 1;
    
    // Tesla-Spulen an den Seiten
    ctx.fillStyle = '#B87333'; // Kupfer
    ctx.fillRect(x - 8, tableY + height - 35 + equipmentFloat, 4, 15); // Linke Spule
    ctx.fillRect(x + width + 4, tableY + height - 35 + equipmentFloat, 4, 15); // Rechte Spule
    
    // Spulen-Details
    for (let i = 0; i < 5; i++) {
        const coilY = tableY + height - 32 + i * 2 + equipmentFloat;
        ctx.fillRect(x - 9, coilY, 6, 1); // Linke Spulen-Windungen
        ctx.fillRect(x + width + 3, coilY, 6, 1); // Rechte Spulen-Windungen
    }
    
    // Elektroden über dem Körper - angepasst an neue Körperposition
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 4, bodyY - 20, 3, 12); // Linke Elektrode
    ctx.fillRect(x + width - 7, bodyY - 20, 3, 12); // Rechte Elektrode
    
    // Verkabelung - angepasst
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 5, bodyY - 8); // Von linker Elektrode
    ctx.lineTo(x - 6, tableY + height - 30 + equipmentFloat); // Zur linken Spule
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + width - 5, bodyY - 8); // Von rechter Elektrode
    ctx.lineTo(x + width + 6, tableY + height - 30 + equipmentFloat); // Zur rechten Spule
    ctx.stroke();
    
    // State-based effects
    if (obstacle.state === 'charging') {
        // VERSTÄRKTE Charging glow für bessere Warnung
        const chargeIntensity = (obstacle.chargeTime - obstacle.stateTimer) / obstacle.chargeTime;
        const glowAlpha = Math.min(chargeIntensity * 1.2, 1.0);
        
        // Elektroden-Glow
        ctx.fillStyle = `rgba(0, 255, 255, ${glowAlpha})`;
        const glowSize = chargeIntensity * 10;
        ctx.fillRect(x + 4 - glowSize/2, bodyY - 20 - glowSize/2, 3 + glowSize, 12 + glowSize);
        ctx.fillRect(x + width - 7 - glowSize/2, bodyY - 20 - glowSize/2, 3 + glowSize, 12 + glowSize);
        
        // Körper-Glow (Monster wird belebt)
        ctx.fillStyle = `rgba(255, 255, 0, ${glowAlpha * 0.4})`;
        ctx.fillRect(x + 4 - 4, bodyY - 10 - 4, width - 8 + 8, 48 + 8);
        
        // Spulen-Funken
        if (Math.random() > 0.4) {
            ctx.fillStyle = '#FFFF00';
            for (let s = 0; s < 4; s++) {
                const sparkX = x - 8 + Math.random() * 6;
                const sparkY = tableY + height - 35 + Math.random() * 15 + equipmentFloat;
                ctx.fillRect(sparkX, sparkY, 2, 2);
                
                const sparkX2 = x + width + 4 + Math.random() * 6;
                const sparkY2 = tableY + height - 35 + Math.random() * 15 + equipmentFloat;
                ctx.fillRect(sparkX2, sparkY2, 2, 2);
            }
        }
        
        // Monster-Zuckungen bei fast vollständiger Ladung
        if (chargeIntensity > 0.8) {
            const twitch = Math.sin(Date.now() * 0.05) * 2;
            ctx.fillStyle = '#90EE90'; // Heller grün
            ctx.fillRect(x + 4 + twitch, bodyY, width - 8, 24);
            
            // Augen leuchten auf
            ctx.fillStyle = `rgba(255, 0, 0, ${Math.sin(Date.now() * 0.03)})`;
            ctx.fillRect(x + 16, bodyY - 6, 3, 3); // Linkes Auge
            ctx.fillRect(x + width - 19, bodyY - 6, 3, 3); // Rechtes Auge
        }
        
        // Pulsierende Warnung bei fast vollständiger Ladung
        if (chargeIntensity > 0.9) {
            const pulse = Math.sin(Date.now() * 0.04) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 100, 0, ${pulse * 0.6})`;
            ctx.fillRect(x - 10, bodyY - 30, width + 20, 80);
        }
    }
    
    if (obstacle.state === 'zapping' && obstacle.zapActive) {
        // FRANKENSTEIN-BLITZ: VON TISCH NACH OBEN ZUR DECKE
        const beamX = x + width/2 - 12; // Zentriert über dem Tisch
        const beamY = 0; // Startet an der Decke
        const beamWidth = 24; // Breiter Blitz
        const beamHeight = bodyY - 20; // Bis zu den Elektroden
        
        // VERSTÄRKTER Haupt-Blitz
        ctx.fillStyle = 'rgba(255, 255, 0, 1.0)'; // Gelber Frankenstein-Blitz
        ctx.fillRect(beamX, beamY, beamWidth, beamHeight);
        
        // HELLERER Blitz-Kern
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.fillRect(beamX + 6, beamY, beamWidth - 12, beamHeight);
        
        // Zusätzliche äußere Glow-Schichten
        ctx.fillStyle = 'rgba(255, 255, 0, 0.7)';
        ctx.fillRect(beamX - 6, beamY, beamWidth + 12, beamHeight);
        
        ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
        ctx.fillRect(beamX - 12, beamY, beamWidth + 24, beamHeight);
        
        // MEHR Zick-Zack Lightning-Effekte
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
            ctx.beginPath();
            const startX = beamX + Math.random() * beamWidth;
            ctx.moveTo(startX, beamY);
            
            // Zick-Zack-Linie nach unten
            for (let h = 0; h < beamHeight; h += 15) {
                const zigX = startX + (Math.random() - 0.5) * 20;
                ctx.lineTo(zigX, beamY + h);
            }
            ctx.stroke();
        }
        
        // VERSTÄRKTER Decken-Impact
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        const ceilingImpactSize = 40;
        ctx.fillRect(beamX - ceilingImpactSize/2 + beamWidth/2, 0, ceilingImpactSize, 12);
        
        // Monster wird "lebendig" während des Blitzes
        const monsterTwitch = Math.sin(Date.now() * 0.1) * 3;
        ctx.fillStyle = '#90EE90'; // Sehr helle grüne Haut
        ctx.fillRect(x + 4 + monsterTwitch, bodyY, width - 8, 24);
        
        // Augen leuchten hell auf
        ctx.fillStyle = 'rgba(255, 0, 0, 1.0)';
        ctx.fillRect(x + 16, bodyY - 6, 3, 3);
        ctx.fillRect(x + width - 19, bodyY - 6, 3, 3);
        
        // Zusätzliche Impact-Partikel an der Decke
        ctx.fillStyle = 'rgba(255, 200, 0, 0.8)';
        for (let p = 0; p < 12; p++) {
            const particleX = beamX + beamWidth/2 + (Math.random() - 0.5) * 60;
            const particleY = Math.random() * 25;
            ctx.fillRect(particleX, particleY, 3, 3);
        }
        
        // VERSTÄRKTER Screen flash effect
        ctx.fillStyle = 'rgba(255, 255, 200, 0.02)';
        ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
    }
    
    // Idle electric arcs zwischen Spulen
    if (obstacle.state === 'idle' && Math.sin(timeScale * 6) > 0.7) {
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 6, tableY + height - 25 + equipmentFloat);
        ctx.lineTo(x + width + 6, tableY + height - 25 + equipmentFloat);
        ctx.stroke();
        
        // Kleine Funken auf dem Körper
        ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
        const sparkX = x + 8 + Math.random() * (width - 16);
        const sparkY = bodyY + Math.random() * 24;
        ctx.fillRect(sparkX, sparkY, 1, 1);
    }
    
    // Labor-Details: Reagenzgläser und Instrumente
    const glassGlow = 0.6 + Math.sin(timeScale * 4) * 0.3;
    
    // Reagenzglas links
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; // Grüne Flüssigkeit
    ctx.fillRect(x - 12, tableY + height - 20, 3, 8);
    ctx.fillStyle = '#808080'; // Glas
    ctx.fillRect(x - 13, tableY + height - 21, 5, 1); // Glasrand
    
    // Reagenzglas rechts  
    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)'; // Lila Flüssigkeit
    ctx.fillRect(x + width + 9, tableY + height - 18, 3, 6);
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + width + 8, tableY + height - 19, 5, 1);
    
    // Blubbernde Effekte in den Gläsern
    if (Math.random() > 0.8) {
        ctx.fillStyle = `rgba(255, 255, 255, ${glassGlow})`;
        ctx.fillRect(x - 11, tableY + height - 18, 1, 1); // Bubble links
        ctx.fillRect(x + width + 10, tableY + height - 16, 1, 1); // Bubble rechts
    }
}


export function drawEnemy(obstacle, ctx, gameState) {
    const scale = 5;
    const screenX = getScreenX(obstacle.x);
    const animTime = obstacle.animationTime || 0;
    
    // TRY SPRITE RENDERING FIRST FOR SKELETON
    if (obstacle.type === 'skeleton') {
        if (spriteManager.loaded) {
            const success = drawSkeletonSprite(ctx, obstacle, gameState, screenX);
            if (success) {
                // Successfully rendered with sprites, draw health bar if needed
                if (obstacle.maxHealth > 1) {
                    drawHealthBar(ctx, screenX, obstacle.y - 8, obstacle.width, obstacle.health, obstacle.maxHealth, obstacle.type);
                }
                return; // Skip canvas rendering
            }
        }
        // Fallback to canvas rendering
        drawSkeleton(ctx, screenX, obstacle.y, animTime);
    }
    else {
        // Handle other enemy types as before
        switch(obstacle.type) {
            case 'bat': 
                drawBat(ctx, screenX, obstacle.y, obstacle); 
                break;
            case 'vampire': 
                drawVampire(ctx, screenX, obstacle.y, animTime); 
                break;
            case 'spider': 
                drawSpider(ctx, screenX, obstacle.y, false, animTime); 
                break;
            case 'wolf': 
                drawWolf(ctx, screenX, obstacle.y, false, animTime, obstacle);
                break;
            case 'alphaWolf': 
                drawWolf(ctx, screenX, obstacle.y, true, animTime, obstacle);
                break;
            case 'rock': 
                drawRock(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, animTime); 
                break;
            case 'sarcophagus': 
                drawSarcophagus(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, animTime); 
                break;
            case 'boltBox': 
                drawBoltBox(ctx, screenX, obstacle.y, animTime); 
                break;
            case 'teslaCoil': 
                drawTeslaCoil(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle); 
                break;
            case 'frankensteinTable': 
                drawFrankensteinTable(ctx, screenX, obstacle.y, obstacle.width, obstacle.height, obstacle); 
                break;
        }
    }
    
    // Health Bar for multi-health enemies (except skeleton which is handled above)
    if (obstacle.type === 'skeleton' ||  
        (obstacle.type === 'vampire' || 
         obstacle.type === 'spider' || 
         obstacle.type === 'wolf' || 
         obstacle.type === 'alphaWolf')) {
        drawHealthBar(ctx, screenX, obstacle.y - 8, obstacle.width, obstacle.health, obstacle.maxHealth, obstacle.type);
    }
}



function drawHealthBar(ctx, x, y, width, health, maxHealth, type) {
    // Safety checks
    if (maxHealth <= 1 || type === 'boltBox' || type === 'bat') {
        return; // Don't draw health bars for these types
    }
    
    const barHeight = 8;
    const segmentWidth = width / maxHealth;
    
    // Dark background
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x, y, width, barHeight);
    
    // Draw each health segment
    for (let i = 0; i < maxHealth; i++) {
        const segmentX = x + i * segmentWidth;
        
        // Segment background (lost HP) - dark gray
        ctx.fillStyle = '#2F2F2F';
        ctx.fillRect(segmentX + 1, y + 1, segmentWidth - 2, barHeight - 2);
        
        // Current health (if this segment has health)
        if (i < health) {
            let healthColor;
            if (type === 'alphaWolf') {
                healthColor = '#FF6B00'; // Bright orange for alpha wolf
            } else {
                healthColor = '#CC0000'; // Brighter red for other enemies
            }
            
            ctx.fillStyle = healthColor;
            ctx.fillRect(segmentX + 1, y + 1, segmentWidth - 2, barHeight - 2);
            
            // Add a bright highlight to make it more visible
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fillRect(segmentX + 1, y + 1, segmentWidth - 2, 2);
        }
    }
    
    // Strong black border for contrast
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, barHeight);
    
    // Segment dividers
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    for (let i = 1; i < maxHealth; i++) {
        const lineX = x + i * segmentWidth;
        ctx.beginPath();
        ctx.moveTo(lineX, y + 1);
        ctx.lineTo(lineX, y + barHeight - 1);
        ctx.stroke();
    }
}



function drawSkeleton(ctx, x, y, animTime = 0) {
    const scale = 1.3;
    const timeScale = animTime * 0.001;
    
    // Subtile Bewegungen - reduziert für weniger Ablenkung
    const rattle = Math.sin(timeScale * 12) * 0.4 * scale; // reduziert von 0.8
    const sway = Math.sin(timeScale * 2.5) * 0.6 * scale; // reduziert von 1.2
    const jointLoose = Math.sin(timeScale * 15) * 0.3 * scale; // reduziert von 0.5
    
    // SCHÄDEL - Anatomisch korrekt
    // Schädelkalotte
    ctx.fillStyle = '#F5DEB3'; // Vergilbtes Weiß
    ctx.fillRect(x + 10 * scale + sway, y + 6 * scale + jointLoose, 20 * scale, 14 * scale);
    
    // Schädel-Rundungen
    ctx.fillRect(x + 12 * scale + sway, y + 4 * scale + jointLoose, 16 * scale, 2 * scale);
    ctx.fillRect(x + 8 * scale + sway, y + 8 * scale + jointLoose, 24 * scale, 10 * scale);
    
    // Schatten für Tiefe
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x + 8 * scale + sway, y + 16 * scale + jointLoose, 24 * scale, 2 * scale);
    ctx.fillRect(x + 28 * scale + sway, y + 8 * scale + jointLoose, 4 * scale, 8 * scale);
    
    // Augenhöhlen - Tief und dunkel
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(x + 13 * scale + sway, y + 9 * scale + jointLoose, 5 * scale, 6 * scale);
    ctx.fillRect(x + 22 * scale + sway, y + 9 * scale + jointLoose, 5 * scale, 6 * scale);
    
    // Seelenfeuer in den Augen (dezent)
    const eyeFlicker = 0.4 + Math.sin(timeScale * 8) * 0.3;
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeFlicker})`;
    ctx.fillRect(x + 15 * scale + sway, y + 11 * scale + jointLoose, 2 * scale, 2 * scale);
    ctx.fillRect(x + 24 * scale + sway, y + 11 * scale + jointLoose, 2 * scale, 2 * scale);
    
    // Nasenhöhle
    ctx.fillStyle = '#2F4F4F';
    ctx.beginPath();
    ctx.moveTo(x + 19 * scale + sway, y + 14 * scale + jointLoose);
    ctx.lineTo(x + 17 * scale + sway, y + 17 * scale + jointLoose);
    ctx.lineTo(x + 21 * scale + sway, y + 17 * scale + jointLoose);
    ctx.closePath();
    ctx.fill();
    
    // KIEFER - Klappert beim Laufen
    const jawChatter = Math.sin(timeScale * 20) > 0.3 ? 2 * scale : 0;
    
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + 12 * scale + sway, y + 19 * scale + jointLoose + jawChatter, 16 * scale, 5 * scale);
    
    // Zähne
    ctx.fillStyle = '#E8DCC6';
    for (let i = 0; i < 6; i++) {
        const toothX = x + (13 + i * 2.5) * scale + sway;
        const toothY = y + 19 * scale + jointLoose;
        ctx.fillRect(toothX, toothY, 2 * scale, 3 * scale);
    }
    
    // WIRBELSÄULE - Gebogen und instabil
    const spineWave = Math.sin(timeScale * 3) * 0.5;
    
    for (let i = 0; i < 8; i++) {
        const vertebraX = x + 18 * scale + sway + Math.sin(timeScale * 4 + i) * rattle;
        const vertebraY = y + (24 + i * 3) * scale + spineWave * i * 0.5;
        
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(vertebraX, vertebraY, 4 * scale, 3 * scale);
        
        // Schatten
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(vertebraX + 3 * scale, vertebraY + 1 * scale, 1 * scale, 2 * scale);
    }
    
    // BRUSTKORB - Einzelne Rippen
    for (let side = 0; side < 2; side++) {
        for (let rib = 0; rib < 5; rib++) {
            const ribRattle = Math.sin(timeScale * 10 + rib * 0.8) * 0.5 * scale;
            const ribY = y + (27 + rib * 3) * scale;
            
            ctx.fillStyle = '#F5DEB3';
            
            if (side === 0) { // Linke Rippen
                ctx.beginPath();
                ctx.moveTo(x + 18 * scale + sway + rattle, ribY);
                ctx.quadraticCurveTo(
                    x + (12 - rib) * scale + sway + ribRattle, 
                    ribY + 2 * scale,
                    x + (10 - rib) * scale + sway + ribRattle, 
                    ribY + 4 * scale
                );
                ctx.lineTo(x + (11 - rib) * scale + sway + ribRattle, ribY + 5 * scale);
                ctx.quadraticCurveTo(
                    x + (13 - rib) * scale + sway + ribRattle,
                    ribY + 3 * scale,
                    x + 19 * scale + sway + rattle,
                    ribY + 1 * scale
                );
                ctx.closePath();
                ctx.fill();
            } else { // Rechte Rippen
                ctx.beginPath();
                ctx.moveTo(x + 22 * scale + sway + rattle, ribY);
                ctx.quadraticCurveTo(
                    x + (28 + rib) * scale + sway - ribRattle, 
                    ribY + 2 * scale,
                    x + (30 + rib) * scale + sway - ribRattle, 
                    ribY + 4 * scale
                );
                ctx.lineTo(x + (29 + rib) * scale + sway - ribRattle, ribY + 5 * scale);
                ctx.quadraticCurveTo(
                    x + (27 + rib) * scale + sway - ribRattle,
                    ribY + 3 * scale,
                    x + 21 * scale + sway + rattle,
                    ribY + 1 * scale
                );
                ctx.closePath();
                ctx.fill();
            }
        }
    }
    
    // Fehlende Rippe (für Realismus)
    if (Math.sin(timeScale * 5) > 0.8) {
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(x + 14 * scale + sway, y + 33 * scale, 1 * scale, 1 * scale);
    }
    
    // ARME - Lose und klappernd
    const leftArmRattle = Math.sin(timeScale * 14) * 1.2 * scale;
    const rightArmRattle = Math.sin(timeScale * 16 + 1) * 1.2 * scale;
    
    // Oberarmknochen
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + (8 + leftArmRattle) * scale, y + 28 * scale, 4 * scale, 10 * scale);
    ctx.fillRect(x + (28 + rightArmRattle) * scale, y + 28 * scale, 4 * scale, 10 * scale);
    
    // Ellenbogengelenke (dunkel für Tiefe)
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x + (9 + leftArmRattle) * scale, y + 37 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(x + (29 + rightArmRattle) * scale, y + 37 * scale, 2 * scale, 2 * scale);
    
    // Unterarmknochen
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + (7 + leftArmRattle * 1.5) * scale, y + 38 * scale, 3 * scale, 8 * scale);
    ctx.fillRect(x + (30 + rightArmRattle * 1.5) * scale, y + 38 * scale, 3 * scale, 8 * scale);
    
    // Hände (einige Finger fehlen)
    ctx.fillRect(x + (6 + leftArmRattle * 1.5) * scale, y + 45 * scale, 5 * scale, 3 * scale);
    ctx.fillRect(x + (29 + rightArmRattle * 1.5) * scale, y + 45 * scale, 5 * scale, 3 * scale);
    
    // Finger (unvollständig)
    ctx.fillRect(x + (6 + leftArmRattle * 1.5) * scale, y + 47 * scale, 1 * scale, 3 * scale);
    ctx.fillRect(x + (8 + leftArmRattle * 1.5) * scale, y + 47 * scale, 1 * scale, 2 * scale);
    ctx.fillRect(x + (31 + rightArmRattle * 1.5) * scale, y + 47 * scale, 1 * scale, 3 * scale);
    
    // BECKEN
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + 14 * scale + sway, y + 44 * scale, 12 * scale, 6 * scale);
    
    // Beckenschatten
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x + 14 * scale + sway, y + 48 * scale, 12 * scale, 2 * scale);
    
    // BEINE - Wackelig
    const leftLegRattle = Math.sin(timeScale * 13) * 0.6 * scale;
    const rightLegRattle = Math.sin(timeScale * 17) * 0.6 * scale;
    
    // Oberschenkelknochen
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + (16 + leftLegRattle) * scale + sway, y + 50 * scale, 4 * scale, 12 * scale);
    ctx.fillRect(x + (20 + rightLegRattle) * scale + sway, y + 50 * scale, 4 * scale, 12 * scale);
    
    // Kniegelenke
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(x + (17 + leftLegRattle) * scale + sway, y + 61 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(x + (21 + rightLegRattle) * scale + sway, y + 61 * scale, 2 * scale, 2 * scale);
    
    // Unterschenkelknochen
    ctx.fillStyle = '#F5DEB3';
    ctx.fillRect(x + (16 + leftLegRattle * 0.8) * scale + sway, y + 62 * scale, 3 * scale, 10 * scale);
    ctx.fillRect(x + (21 + rightLegRattle * 0.8) * scale + sway, y + 62 * scale, 3 * scale, 10 * scale);
    
    // Füße
    ctx.fillRect(x + (15 + leftLegRattle * 0.8) * scale + sway, y + 71 * scale, 6 * scale, 3 * scale);
    ctx.fillRect(x + (20 + rightLegRattle * 0.8) * scale + sway, y + 71 * scale, 6 * scale, 3 * scale);
    
    // DETAILS
    // Risse in den Knochen
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(x + 15 * scale + sway, y + 32 * scale, 1 * scale, 4 * scale);
    ctx.fillRect(x + 24 * scale + sway, y + 54 * scale, 1 * scale, 3 * scale);
    
    // Knochenstaub-Effekt (dezent)
    if (Math.sin(timeScale * 7) > 0.85) {
        ctx.fillStyle = 'rgba(245, 222, 179, 0.4)';
        const dustX = x + 20 * scale + sway + Math.random() * 10 * scale - 5 * scale;
        const dustY = y + 40 * scale + Math.random() * 20 * scale;
        ctx.fillRect(dustX, dustY, 2 * scale, 2 * scale);
    }
    
    // Sehr dezente Aura (nur bei bestimmten Winkeln sichtbar)
    if (Math.sin(timeScale * 2) > 0.9) {
        const auraAlpha = 0.1;
        ctx.fillStyle = `rgba(147, 112, 219, ${auraAlpha})`;
        ctx.fillRect(x + 5 * scale + sway, y + 20 * scale, 30 * scale, 40 * scale);
    }
}

// In enemies.js - neue Funktion hinzufügen:
function drawSarcophagus(ctx, x, y, width, height, animTime = 0) {
    const scale = 1;
    const timeScale = animTime * 0.001;
    const eyeGlow = 0.6 + Math.sin(timeScale * 3) * 0.4;
    
    // 3/4 Perspektive - liegt auf der Seite
    const baseY = y + height - 8;
    
    // Schatten unter dem Sarkophag
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - 2, baseY + 6, width + 4, 6);
    
    // UNTERE SARKOPHAG-HÄLFTE (3D Basis)
    ctx.fillStyle = '#2F2F2F'; // Dunkler Stein
    ctx.fillRect(x, baseY, width, 8);
    
    // Seitenwand (3D Effekt)
    ctx.fillStyle = '#1A1A1A'; // Noch dunkler für Tiefe
    ctx.fillRect(x + width - 3, baseY - 2, 3, 10);
    
    // OBERE SARKOPHAG-HÄLFTE (Hauptkörper) - ANGEPASST
    ctx.fillStyle = '#4A4A4A'; // Heller Stein
    ctx.fillRect(x + 2, baseY - 8, width - 4, 8); // Reduziert von -12 auf -8
    
    // Obere Seitenwand (3D) - ANGEPASST
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + width - 3, baseY - 10, 3, 10); // Reduziert von -14 auf -10
    
    // DECKEL (zur Seite geneigt, Spalt offen) - ANGEPASST
    ctx.fillStyle = '#5A5A5A'; // Hellster Stein
    ctx.fillRect(x + 3, baseY - 12, width - 8, 4); // Reduziert von -16 auf -12
    
    // Deckel-Kante (3D) - ANGEPASST
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(x + width - 6, baseY - 13, 3, 5); // Reduziert von -17 auf -13
    
    // SPALT (schwarze Öffnung) - ANGEPASST
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 4, baseY - 9, width - 10, 2); // Reduziert von -13 auf -9
    
    // Spalt-Tiefe (3D Effekt) - ANGEPASST
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(x + width - 8, baseY - 10, 2, 3); // Reduziert von -14 auf -10
    
    // STEINMETZARBEIT/VERZIERUNGEN - ANGEPASST
    // Horizontale Linien
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + 4, baseY - 6, width - 8, 1); // Reduziert von -8 auf -6
    ctx.fillRect(x + 6, baseY - 4, width - 12, 1);
    
    // Vertikale Unterteilungen - ANGEPASST
    ctx.fillRect(x + width/3, baseY - 8, 1, 6); // Reduziert von -10 auf -8
    ctx.fillRect(x + (width*2)/3, baseY - 8, 1, 6); // Reduziert von -10 auf -8
    
    // Kreuz-Gravur auf dem Deckel - ANGEPASST
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + width/2 - 1, baseY - 11, 2, 3); // Reduziert von -15 auf -11
    ctx.fillRect(x + width/2 - 2, baseY - 10, 4, 1); // Reduziert von -14 auf -10
    
    // MYSTISCHE RISSE mit schwachem Licht - ANGEPASST
    ctx.fillStyle = 'rgba(139, 69, 19, 0.3)';
    ctx.fillRect(x + 8, baseY - 7, 1, 4); // Reduziert von -9 auf -7 und height von 6 auf 4
    ctx.fillRect(x + width - 12, baseY - 5, 1, 3); // Reduziert von -7 auf -5 und height von 4 auf 3
    
    // ROTE AUGEN IM SPALT - ANGEPASST
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
    
    // Linkes Auge
    ctx.fillRect(x + width/3 - 1, baseY - 8, 2, 1); // Reduziert von -12 auf -8
    
    // Rechtes Auge  
    ctx.fillRect(x + (width*2)/3 - 1, baseY - 8, 2, 1); // Reduziert von -12 auf -8
    
    // Augen-Glühen (Aura) - ANGEPASST
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow * 0.3})`;
    ctx.fillRect(x + width/3 - 2, baseY - 9, 4, 3); // Reduziert von -13 auf -9
    ctx.fillRect(x + (width*2)/3 - 2, baseY - 9, 4, 3); // Reduziert von -13 auf -9
    
    // Gelegentliches intensiveres Glühen - ANGEPASST
    if (Math.sin(timeScale * 2) > 0.8) {
        ctx.fillStyle = `rgba(255, 100, 100, ${eyeGlow * 0.5})`;
        ctx.fillRect(x + width/3 - 3, baseY - 10, 6, 4); // Reduziert von -14 auf -10
        ctx.fillRect(x + (width*2)/3 - 3, baseY - 10, 6, 4); // Reduziert von -14 auf -10
    }
    
    // VERWITTERUNG UND MOOS
    ctx.fillStyle = '#556B2F'; // Moos
    ctx.fillRect(x + 2, baseY - 2, 4, 3);
    ctx.fillRect(x + width - 8, baseY + 2, 6, 2);
    
    // Verwitterte Stellen - ANGEPASST
    ctx.fillStyle = '#3A3A3A';
    ctx.fillRect(x + 12, baseY - 3, 2, 2); // Reduziert von -5 auf -3
    ctx.fillRect(x + width - 15, baseY - 6, 3, 1); // Reduziert von -8 auf -6
    
    // ANTIKE INSCHRIFT (unleserlich) - ANGEPASST
    ctx.fillStyle = '#1A1A1A';
    for (let i = 0; i < 3; i++) {
        const inscriptX = x + 8 + i * 8;
        ctx.fillRect(inscriptX, baseY - 4, 4, 1); // Reduziert von -6 auf -4
        ctx.fillRect(inscriptX + 1, baseY - 3, 2, 1); // Reduziert von -5 auf -3
    }
    
    // HIGHLIGHTS für 3D-Effekt - ANGEPASST
    ctx.fillStyle = '#6A6A6A';
    ctx.fillRect(x + 2, baseY - 12, width - 8, 1); // Reduziert von -16 auf -12
    ctx.fillRect(x + 2, baseY - 8, 1, 8); // Reduziert von -12 auf -8
    ctx.fillRect(x + 2, baseY - 1, width - 2, 1);
    
    // Schwacher Dungeon-Nebel um den Sarkophag
    if (Math.random() > 0.7) {
        ctx.fillStyle = 'rgba(138, 43, 226, 0.1)';
        const mistX = x + Math.random() * width;
        const mistY = baseY - 6 + Math.random() * 4; // Reduziert von -8 auf -6
        ctx.fillRect(mistX, mistY, 3, 2);
    }
}

function drawVampire(ctx, x, y, animTime = 0) {
    const scale = 1.5; // 30% größer
    const timeScale = animTime * 0.001;
    const hover = Math.sin(timeScale * 2) * 3 * scale; // Schwebt bedrohlich
    const capeFlow = Math.sin(timeScale * 3) * 4 * scale;
    
    // Bedrohlicher Schatten
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x + 5 * scale, y + 58 * scale + hover, 30 * scale, 6 * scale);
    
    // Nebel-Effekt unter dem Vampir - rote Farbwelt
    const mistAlpha = 0.3 + Math.sin(timeScale * 4) * 0.2;
    ctx.fillStyle = `rgba(139, 0, 0, ${mistAlpha})`;
    for (let i = 0; i < 3; i++) {
        const mistX = x + 10 * scale + Math.sin(timeScale * 2 + i) * 10 * scale;
        const mistY = y + 55 * scale + hover + i * 3 * scale;
        ctx.beginPath();
        ctx.arc(mistX, mistY, (8 - i * 2) * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // GROSSER DRAMATISCHER UMHANG - rote Farbabstufungen
    // Äußerer Umhang - wellend (dunkelstes Rot)
    ctx.fillStyle = '#0A0000'; // Sehr dunkles Rot statt Lila
    const capePoints = [];
    for (let i = 0; i <= 8; i++) {
        const baseX = x - 5 * scale + i * 6 * scale;
        const waveOffset = Math.sin(timeScale * 4 + i * 0.5) * (8 - i/2) * scale;
        capePoints.push({
            x: baseX + waveOffset,
            y: y + 20 * scale + hover + Math.abs(4 - i) * 2 * scale
        });
    }
    
    ctx.beginPath();
    ctx.moveTo(x + 10 * scale, y + 15 * scale + hover);
    capePoints.forEach(point => ctx.lineTo(point.x, point.y));
    ctx.lineTo(x + 35 * scale + capeFlow, y + 55 * scale + hover);
    ctx.lineTo(x + 5 * scale - capeFlow, y + 55 * scale + hover);
    ctx.closePath();
    ctx.fill();
    
    // Innerer Umhang mit rotem Futter (mittleres Rot)
    ctx.fillStyle = '#2F0000';
    ctx.beginPath();
    ctx.moveTo(x + 12 * scale, y + 20 * scale + hover);
    ctx.lineTo(x + 28 * scale, y + 20 * scale + hover);
    ctx.lineTo(x + 32 * scale + capeFlow/2, y + 50 * scale + hover);
    ctx.lineTo(x + 8 * scale - capeFlow/2, y + 50 * scale + hover);
    ctx.closePath();
    ctx.fill();
    
    // Umhang-Details - Fledermaus-Muster (helles Rot)
    ctx.fillStyle = '#4A0000';
    ctx.fillRect(x + 15 * scale, y + 30 * scale + hover, 2 * scale, 8 * scale);
    ctx.fillRect(x + 23 * scale, y + 30 * scale + hover, 2 * scale, 8 * scale);
    ctx.fillRect(x + 19 * scale, y + 35 * scale + hover, 2 * scale, 6 * scale);
    
    // ARISTOKRATISCHER KÖRPER - dunkle Rottöne
    // Eleganter Anzug (sehr dunkel)
    ctx.fillStyle = '#0A0000'; // Dunkelstes Rot statt schwarz
    ctx.fillRect(x + 12 * scale, y + 24 * scale + hover, 16 * scale, 20 * scale);
    
    // Weste mit Details (mittleres Rot)
    ctx.fillStyle = '#1A0000'; // Dunkles Rot für Weste
    ctx.fillRect(x + 14 * scale, y + 26 * scale + hover, 12 * scale, 16 * scale);
    
    // Goldene Knöpfe (bleiben gold für Kontrast)
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(x + 19 * scale, y + (28 + i * 4) * scale + hover, 2 * scale, 2 * scale);
    }
    
    // Kragen (helles Grau für Kontrast)
    ctx.fillStyle = '#E8E8E8';
    ctx.fillRect(x + 13 * scale, y + 24 * scale + hover, 14 * scale, 3 * scale);
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 18 * scale, y + 25 * scale + hover, 4 * scale, 2 * scale); // Fliege
    
    // BEDROHLICHES GESICHT
    // Blasse Haut mit grünlichem Unterton (bleibt bleich für Vampir-Look)
    ctx.fillStyle = '#E8E8D0';
    ctx.fillRect(x + 12 * scale, y + 8 * scale + hover, 16 * scale, 16 * scale);
    
    // Wangenknochen-Schatten (rötlicher Unterton)
    ctx.fillStyle = '#D0C0A0';
    ctx.fillRect(x + 12 * scale, y + 18 * scale + hover, 4 * scale, 4 * scale);
    ctx.fillRect(x + 24 * scale, y + 18 * scale + hover, 4 * scale, 4 * scale);
    
    // Haare - zurückgekämmt, spitz (dunkles Rot statt schwarz)
    ctx.fillStyle = '#1A0000';
    ctx.fillRect(x + 10 * scale, y + 4 * scale + hover, 20 * scale, 8 * scale);
    // Widow's Peak
    ctx.fillRect(x + 18 * scale, y + 12 * scale + hover, 4 * scale, 2 * scale);
    // Seitliche Spitzen
    ctx.fillRect(x + 8 * scale, y + 6 * scale + hover, 4 * scale, 4 * scale);
    ctx.fillRect(x + 28 * scale, y + 6 * scale + hover, 4 * scale, 4 * scale);
    
    // HYPNOTISCHE AUGEN
    const eyeGlow = 0.6 + Math.sin(timeScale * 6) * 0.4;
    
    // Augenbrauen - bedrohlich (dunkles Rot)
    ctx.fillStyle = '#1A0000';
    ctx.fillRect(x + 13 * scale, y + 10 * scale + hover, 5 * scale, 1 * scale);
    ctx.fillRect(x + 22 * scale, y + 10 * scale + hover, 5 * scale, 1 * scale);
    ctx.fillRect(x + 14 * scale, y + 9 * scale + hover, 3 * scale, 1 * scale);
    ctx.fillRect(x + 23 * scale, y + 9 * scale + hover, 3 * scale, 1 * scale);
    
    // Leuchtende Augen (intensives Rot)
    ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
    ctx.fillRect(x + 14 * scale, y + 12 * scale + hover, 4 * scale, 4 * scale);
    ctx.fillRect(x + 22 * scale, y + 12 * scale + hover, 4 * scale, 4 * scale);
    
    // Pupillen (schwarz für Kontrast)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 15 * scale, y + 13 * scale + hover, 2 * scale, 2 * scale);
    ctx.fillRect(x + 23 * scale, y + 13 * scale + hover, 2 * scale, 2 * scale);
    
    // Hypnose-Ringe (helles Rot)
    if (Math.sin(timeScale * 3) > 0.5) {
        ctx.strokeStyle = `rgba(255, 100, 100, ${eyeGlow * 0.5})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + 16 * scale, y + 14 * scale + hover, 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + 24 * scale, y + 14 * scale + hover, 6 * scale, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // GEFÄHRLICHE REISSZÄHNE
    ctx.fillStyle = '#FFFFFF';
    // Obere Reißzähne - lang und spitz
    ctx.fillRect(x + 16 * scale, y + 18 * scale + hover, 2 * scale, 5 * scale);
    ctx.fillRect(x + 22 * scale, y + 18 * scale + hover, 2 * scale, 5 * scale);
    
    // Untere kleine Zähne
    ctx.fillRect(x + 18 * scale, y + 19 * scale + hover, 1 * scale, 2 * scale);
    ctx.fillRect(x + 20 * scale, y + 19 * scale + hover, 1 * scale, 2 * scale);
    
    // Blut an den Zähnen (dunkles Rot)
    const bloodDrip = Math.sin(timeScale * 8) * 2 * scale;
    ctx.fillStyle = '#4A0000';
    ctx.fillRect(x + 16 * scale, y + 21 * scale + hover + bloodDrip, 1 * scale, 2 * scale);
    ctx.fillRect(x + 23 * scale, y + 21 * scale + hover + bloodDrip, 1 * scale, 2 * scale);
    
    // KLAUENARTIGE HÄNDE
    // Arme (dunkles Rot)
    ctx.fillStyle = '#0A0000';
    ctx.fillRect(x + 8 * scale, y + 26 * scale + hover, 6 * scale, 12 * scale);
    ctx.fillRect(x + 26 * scale, y + 26 * scale + hover, 6 * scale, 12 * scale);
    
    // Hände mit Klauen (blasse Haut bleibt)
    ctx.fillStyle = '#E8E8D0'; // Blasse Haut
    ctx.fillRect(x + 6 * scale, y + 36 * scale + hover, 6 * scale, 6 * scale);
    ctx.fillRect(x + 28 * scale, y + 36 * scale + hover, 6 * scale, 6 * scale);
    
    // Lange Klauen (dunkles Rot statt schwarz)
    ctx.fillStyle = '#1A0000';
    // Linke Hand
    ctx.fillRect(x + 5 * scale, y + 40 * scale + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + 7 * scale, y + 41 * scale + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + 9 * scale, y + 41 * scale + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + 11 * scale, y + 40 * scale + hover, 1 * scale, 4 * scale);
    // Rechte Hand
    ctx.fillRect(x + 28 * scale, y + 40 * scale + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + 30 * scale, y + 41 * scale + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + 32 * scale, y + 41 * scale + hover, 1 * scale, 4 * scale);
    ctx.fillRect(x + 34 * scale, y + 40 * scale + hover, 1 * scale, 4 * scale);
    
    // BEINE mit elegantem Gang
    const walkCycle = Math.sin(timeScale * 4) * 2 * scale;
    
    ctx.fillStyle = '#0A0000'; // Dunkles Rot für Beine
    ctx.fillRect(x + (14 * scale + walkCycle), y + 44 * scale + hover, 6 * scale, 14 * scale);
    ctx.fillRect(x + (20 * scale - walkCycle), y + 44 * scale + hover, 6 * scale, 14 * scale);
    
    // Schuhe (sehr dunkel)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + (13 * scale + walkCycle), y + 56 * scale + hover, 8 * scale, 6 * scale);
    ctx.fillRect(x + (19 * scale - walkCycle), y + 56 * scale + hover, 8 * scale, 6 * scale);
    
    // VAMPIR-AURA - rote Energie
    // Dunkle Energie (rote Farbwelt)
    const auraAlpha = 0.2 + Math.sin(timeScale * 5) * 0.1;
    const gradient = ctx.createRadialGradient(
        x + 20 * scale, y + 30 * scale + hover, 0,
        x + 20 * scale, y + 30 * scale + hover, 35 * scale
    );
    gradient.addColorStop(0, `rgba(139, 0, 0, ${auraAlpha})`);
    gradient.addColorStop(0.5, `rgba(75, 0, 0, ${auraAlpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 15 * scale, y - 5 * scale + hover, 70 * scale, 70 * scale);
    
    // Fledermäuse die um ihn kreisen (dunkles Rot)
    if (Math.sin(timeScale * 2) > 0) {
        for (let i = 0; i < 2; i++) {
            const batAngle = timeScale * 3 + i * Math.PI;
            const batX = x + 20 * scale + Math.cos(batAngle) * 25 * scale;
            const batY = y + 20 * scale + hover + Math.sin(batAngle) * 15 * scale;
            
            // Mini-Fledermaus (dunkles Rot)
            ctx.fillStyle = '#1A0000';
            ctx.fillRect(batX - 4 * scale, batY, 8 * scale, 3 * scale);
            ctx.fillRect(batX - 6 * scale, batY + 1 * scale, 3 * scale, 1 * scale);
            ctx.fillRect(batX + 3 * scale, batY + 1 * scale, 3 * scale, 1 * scale);
        }
    }
    
    // Blut-Partikel Effekt (verschiedene Rottöne)
    if (Math.random() > 0.9) {
        const bloodColors = ['rgba(139, 0, 0, 0.6)', 'rgba(75, 0, 0, 0.6)', 'rgba(26, 0, 0, 0.6)'];
        ctx.fillStyle = bloodColors[Math.floor(Math.random() * bloodColors.length)];
        const particleX = x + 15 * scale + Math.random() * 10 * scale;
        const particleY = y + 50 * scale + hover + Math.random() * 10 * scale;
        ctx.fillRect(particleX, particleY, 2 * scale, 2 * scale);
    }
}

function drawSpider(ctx, x, y, isBoss = false, animTime = 0) {
    const scale = isBoss ? 2.2 : 1.85;
    const scaledWidth = 42 * scale;
    const scaledHeight = 28 * scale;
    
    const timeScale = animTime * 0.001;
    const scuttle = Math.sin(timeScale * 8) * 0.8; // reduziert von 1.2
    const bodyBob = Math.sin(timeScale * 6) * 0.2; // reduziert von 0.4
    
    // Boss glow
    if (isBoss) {
        const gradient = ctx.createRadialGradient(
            x + scaledWidth/2, y + scaledHeight/2, 0,
            x + scaledWidth/2, y + scaledHeight/2, scaledWidth * 0.8
        );
        gradient.addColorStop(0, 'rgba(139, 0, 139, 0.6)');
        gradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.3)');
        gradient.addColorStop(1, 'rgba(75, 0, 130, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 15, y - 15, scaledWidth + 30, scaledHeight + 30);
    }
    
    // Main body
    ctx.fillStyle = isBoss ? '#4B0082' : '#1A1A1A';
    ctx.fillRect(x + 20 * scale, y + 8 * scale + bodyBob, 18 * scale, 14 * scale);
    ctx.fillRect(x + 22 * scale, y + 6 * scale + bodyBob, 14 * scale, 18 * scale);
    
    // Markings
    ctx.fillStyle = isBoss ? '#8B008B' : '#8B0000';
    ctx.fillRect(x + 24 * scale, y + 10 * scale + bodyBob, 10 * scale, 2 * scale);
    ctx.fillRect(x + 26 * scale, y + 14 * scale + bodyBob, 6 * scale, 2 * scale);
    ctx.fillRect(x + 25 * scale, y + 18 * scale + bodyBob, 8 * scale, 2 * scale);
    
    // Head segment
    ctx.fillStyle = isBoss ? '#4B0082' : '#2F2F2F';
    ctx.fillRect(x + 12 * scale, y + 12 * scale + bodyBob, 12 * scale, 10 * scale);
    
    // Eyes
    const eyeGlow = isBoss ? 1 : 0.8 + Math.sin(timeScale * 7) * 0.2;
    ctx.fillStyle = isBoss ? `rgba(138, 43, 226, ${eyeGlow})` : `rgba(255, 0, 0, ${eyeGlow})`;
    
    // Main eyes
    ctx.fillRect(x + 14 * scale, y + 14 * scale + bodyBob, 2 * scale, 2 * scale);
    ctx.fillRect(x + 18 * scale, y + 14 * scale + bodyBob, 2 * scale, 2 * scale);
    
    // Additional eyes
    ctx.fillRect(x + 13 * scale, y + 12 * scale + bodyBob, 1 * scale, 1 * scale);
    ctx.fillRect(x + 20 * scale, y + 12 * scale + bodyBob, 1 * scale, 1 * scale);
    ctx.fillRect(x + 12 * scale, y + 16 * scale + bodyBob, 1 * scale, 1 * scale);
    ctx.fillRect(x + 21 * scale, y + 16 * scale + bodyBob, 1 * scale, 1 * scale);
    ctx.fillRect(x + 15 * scale, y + 12 * scale + bodyBob, 1 * scale, 1 * scale);
    ctx.fillRect(x + 18 * scale, y + 12 * scale + bodyBob, 1 * scale, 1 * scale);
    
    // Fangs
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 15 * scale, y + 17 * scale + bodyBob, 1 * scale, 3 * scale);
    ctx.fillRect(x + 18 * scale, y + 17 * scale + bodyBob, 1 * scale, 3 * scale);
    
    // Legs
    const legColors = isBoss ? '#4B0082' : '#1A1A1A';
    ctx.fillStyle = legColors;
    
    // Left legs
    for (let i = 0; i < 4; i++) {
        const legMovement = Math.sin(timeScale * 10 + i * 0.5) * 1.5;
        const legY = y + 10 * scale + i * 3 * scale + bodyBob;
        
        ctx.fillRect(x + (2 + legMovement) * scale, legY, 6 * scale, 2 * scale);
        ctx.fillRect(x + (1 + legMovement) * scale, legY + 2 * scale, 4 * scale, 2 * scale);
        ctx.fillRect(x + legMovement * scale, legY + 4 * scale, 3 * scale, 1 * scale);
    }
    
    // Right legs
    for (let i = 0; i < 4; i++) {
        const legMovement = Math.sin(timeScale * 10 + i * 0.5 + Math.PI) * 1.5;
        const legY = y + 10 * scale + i * 3 * scale + bodyBob;
        
        ctx.fillRect(x + (34 - legMovement) * scale, legY, 6 * scale, 2 * scale);
        ctx.fillRect(x + (37 - legMovement) * scale, legY + 2 * scale, 4 * scale, 2 * scale);
        ctx.fillRect(x + (39 - legMovement) * scale, legY + 4 * scale, 3 * scale, 1 * scale);
    }
    
    // Pedipalps
    const palpMovement = Math.sin(timeScale * 12) * 0.3;
    ctx.fillStyle = isBoss ? '#663399' : '#404040';
    ctx.fillRect(x + (10 + palpMovement) * scale, y + 15 * scale + bodyBob, 3 * scale, 1 * scale);
    ctx.fillRect(x + (21 - palpMovement) * scale, y + 15 * scale + bodyBob, 3 * scale, 1 * scale);
    
    // Web strand
    if (Math.sin(timeScale * 5) > 0.7) {
        ctx.beginPath();
        ctx.moveTo(x + 18 * scale, y);
        ctx.lineTo(x + 18 * scale, y + 8 * scale + bodyBob);
        ctx.stroke();
    }
    
    // Boss-specific features
    if (isBoss) {
        // Venom drip
        const venomDrip = Math.sin(timeScale * 9) * 2;
        ctx.fillStyle = '#32CD32';
        ctx.fillRect(x + 15 * scale, y + 20 * scale + bodyBob + venomDrip, 1 * scale, 2 * scale);
        ctx.fillRect(x + 18 * scale, y + 20 * scale + bodyBob + venomDrip, 1 * scale, 2 * scale);
        
        // Glowing markings
        const markingGlow = 0.6 + Math.sin(timeScale * 8) * 0.4;
        ctx.fillStyle = `rgba(138, 43, 226, ${markingGlow})`;
        ctx.fillRect(x + 27 * scale, y + 12 * scale + bodyBob, 4 * scale, 2 * scale);
        ctx.fillRect(x + 28 * scale, y + 14 * scale + bodyBob, 2 * scale, 2 * scale);
        ctx.fillRect(x + 27 * scale, y + 16 * scale + bodyBob, 4 * scale, 2 * scale);
    }
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 10 * scale, y + 22 * scale + bodyBob, 24 * scale, 2 * scale);
}



function drawWolf(ctx, x, y, isAlpha = false, animTime = 0, obstacle = null) {
    // PERFORMANCE: Skip rendering every other frame for regular wolves
    if (!isAlpha && obstacle && obstacle._skipFrame === true) {
        obstacle._skipFrame = false;
        return;
    }
    if (!isAlpha && obstacle) {
        obstacle._skipFrame = true;
    }
    
    const scale = isAlpha ? 2.4 : 1.8; // Alpha deutlich größer
    const timeScale = animTime * 0.001;
    const prowl = Math.sin(timeScale * 3) * 1.5; // Raubtierbewegung
    const breathe = Math.sin(timeScale * 4) * 1; // Schweres Atmen
    const snarl = Math.sin(timeScale * 8) > 0.5; // Zähne fletschen
    
    // FIXED: Initialize shouldFlip first, then derive facingLeft
    let shouldFlip = false;

    if (obstacle && obstacle.type === 'alphaWolf') {
        if (obstacle.isFuryCharging || obstacle.isLeaping) {
            // Im Fury Mode: Zum Spieler schauen - richtige Richtungsbestimmung
            const playerCenterX = player.x + player.width/2;
            const wolfCenterX = obstacle.x + obstacle.width/2;
            
            // Wenn Spieler LINKS vom Wolf ist -> Wolf muss nach LINKS schauen (spiegeln)
            shouldFlip = playerCenterX < wolfCenterX;
        } else {
            // Normale Bewegung: Standard-Spiegelungslogik
            shouldFlip = obstacle.facingDirection === -1;
        }
    }

    // FIXED: facingLeft is now properly initialized after shouldFlip
    const facingLeft = shouldFlip;
    
    // FIXED: Ensure full opacity and proper canvas state
    ctx.globalAlpha = 1.0;
    
    // FIXED: Only save/flip if needed
    if (facingLeft) {
        ctx.save();
        ctx.scale(-1, 1);
        x = -x - (52 * scale); // Adjust for wolf width
    }
    
    // Bedrohlicher Schatten
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(x + 5 * scale, y + 30 * scale + prowl, 40 * scale, 6 * scale);
    
    // MUSKULÖSER 3D KÖRPER
    // Hinterteil (für Tiefenwirkung zuerst)
    ctx.fillStyle = isAlpha ? '#1A1A1A' : '#3A3A3A';
    ctx.fillRect(x + 24 * scale, y + 10 * scale + prowl + breathe, 20 * scale, 18 * scale);
    
    // Hauptkörper mit Muskel-Definition
    ctx.fillStyle = isAlpha ? '#2F2F2F' : '#4A4A4A';
    ctx.fillRect(x + 12 * scale, y + 8 * scale + prowl + breathe, 24 * scale, 20 * scale);
    
    // Bauch (heller für 3D-Effekt)
    ctx.fillStyle = isAlpha ? '#3A3A3A' : '#5A5A5A';
    ctx.fillRect(x + 14 * scale, y + 18 * scale + prowl + breathe, 20 * scale, 8 * scale);
    
    // Muskel-Konturen
    ctx.fillStyle = isAlpha ? '#1A1A1A' : '#2A2A2A';
    // Schultermuskel
    ctx.fillRect(x + 12 * scale, y + 10 * scale + prowl + breathe, 8 * scale, 2 * scale);
    ctx.fillRect(x + 13 * scale, y + 12 * scale + prowl + breathe, 6 * scale, 1 * scale);
    // Hinterbein-Muskel
    ctx.fillRect(x + 26 * scale, y + 12 * scale + prowl + breathe, 10 * scale, 2 * scale);
    ctx.fillRect(x + 28 * scale, y + 14 * scale + prowl + breathe, 8 * scale, 1 * scale);
    
    // Fell-Textur mit Strähnen
    ctx.fillStyle = isAlpha ? '#404040' : '#606060';
    for (let i = 0; i < 8; i++) {
        const furX = x + (15 + i * 2) * scale;
        const furY = y + (10 + (i % 3) * 3) * scale + prowl + breathe;
        ctx.fillRect(furX, furY, 1 * scale, 3 * scale);
    }
    
    // GEFÄHRLICHER KOPF
    const headTilt = snarl ? -2 : 0; // Kopf senkt sich beim Knurren
    
    // Schnauze (3D-Effekt durch Schichtung)
    ctx.fillStyle = isAlpha ? '#3A3A3A' : '#5A5A5A';
    ctx.fillRect(x + 2 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                 12 * scale, 8 * scale);
    
    // Obere Schnauze
    ctx.fillStyle = isAlpha ? '#2F2F2F' : '#4A4A4A';
    ctx.fillRect(x + 2 * scale, y + (8 + headTilt) * scale + prowl + breathe, 
                 14 * scale, 6 * scale);
    
    // Kopf
    ctx.fillStyle = isAlpha ? '#4A4A4A' : '#696969';
    ctx.fillRect(x + 6 * scale, y + (6 + headTilt) * scale + prowl + breathe, 
                 14 * scale, 12 * scale);
    
    // WILDE OHREN
    const earTwitch = Math.sin(timeScale * 10) * 1;
    
    // Linkes Ohr
    ctx.fillStyle = isAlpha ? '#2F2F2F' : '#4A4A4A';
    ctx.beginPath();
    ctx.moveTo(x + 8 * scale, y + (8 + headTilt) * scale + prowl + earTwitch);
    ctx.lineTo(x + 6 * scale, y + (2 + headTilt) * scale + prowl + earTwitch);
    ctx.lineTo(x + 10 * scale, y + (4 + headTilt) * scale + prowl + earTwitch);
    ctx.closePath();
    ctx.fill();
    
    // Rechtes Ohr
    ctx.beginPath();
    ctx.moveTo(x + 16 * scale, y + (8 + headTilt) * scale + prowl - earTwitch);
    ctx.lineTo(x + 18 * scale, y + (2 + headTilt) * scale + prowl - earTwitch);
    ctx.lineTo(x + 14 * scale, y + (4 + headTilt) * scale + prowl - earTwitch);
    ctx.closePath();
    ctx.fill();
    
    // Ohr-Inneres (rosa)
    ctx.fillStyle = '#8B4444';
    ctx.fillRect(x + 7 * scale, y + (5 + headTilt) * scale + prowl + earTwitch, 
                 2 * scale, 3 * scale);
    ctx.fillRect(x + 15 * scale, y + (5 + headTilt) * scale + prowl - earTwitch, 
                 2 * scale, 3 * scale);
    
    // GLÜHENDE RAUBTIERAUGEN
    const eyeGlow = 0.7 + Math.sin(timeScale * 5) * 0.3;
    
    // Augenbrauen für wilden Blick
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 8 * scale, y + (9 + headTilt) * scale + prowl, 4 * scale, 1 * scale);
    ctx.fillRect(x + 14 * scale, y + (9 + headTilt) * scale + prowl, 4 * scale, 1 * scale);
    
    // Leuchtende Augen
    ctx.fillStyle = isAlpha ? `rgba(255, 215, 0, ${eyeGlow})` : `rgba(255, 0, 0, ${eyeGlow})`;
    ctx.fillRect(x + 8 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                 3 * scale, 3 * scale);
    ctx.fillRect(x + 14 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                 3 * scale, 3 * scale);
    
    // Pupillen (vertikal wie bei echten Wölfen)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 9 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                 1 * scale, 3 * scale);
    ctx.fillRect(x + 15 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                 1 * scale, 3 * scale);
    
    // GEFÄHRLICHES MAUL
    // Schnauze-Details
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 1 * scale, y + (12 + headTilt) * scale + prowl + breathe, 
                 3 * scale, 2 * scale); // Nase
    
    // Maul (öffnet sich beim Knurren)
    const mouthOpen = snarl ? 4 : 2;
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(x + 2 * scale, y + (15 + headTilt) * scale + prowl + breathe, 
                 10 * scale, mouthOpen * scale);
    
    // SCHARFE REISSZÄHNE
    ctx.fillStyle = '#FFFFFF';
    // Obere Reißzähne
    ctx.beginPath();
    ctx.moveTo(x + 3 * scale, y + (15 + headTilt) * scale + prowl + breathe);
    ctx.lineTo(x + 4 * scale, y + (17 + headTilt) * scale + prowl + breathe);
    ctx.lineTo(x + 5 * scale, y + (15 + headTilt) * scale + prowl + breathe);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(x + 7 * scale, y + (15 + headTilt) * scale + prowl + breathe);
    ctx.lineTo(x + 8 * scale, y + (18 + headTilt) * scale + prowl + breathe);
    ctx.lineTo(x + 9 * scale, y + (15 + headTilt) * scale + prowl + breathe);
    ctx.closePath();
    ctx.fill();
    
    // Untere Zähne (wenn Maul offen)
    if (snarl) {
        ctx.fillRect(x + 4 * scale, y + (17 + headTilt) * scale + prowl + breathe, 
                     1 * scale, 2 * scale);
        ctx.fillRect(x + 6 * scale, y + (17 + headTilt) * scale + prowl + breathe, 
                     1 * scale, 2 * scale);
        ctx.fillRect(x + 8 * scale, y + (17 + headTilt) * scale + prowl + breathe, 
                     1 * scale, 2 * scale);
    }
    
    // Speichel/Schaum
    if (snarl && Math.random() > 0.7) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const foamX = x + (4 + Math.random() * 6) * scale;
        const foamY = y + (18 + headTilt) * scale + prowl + breathe;
        ctx.fillRect(foamX, foamY, 2 * scale, 1 * scale);
    }
    
    // MUSKULÖSE BEINE
    const legMove = Math.sin(timeScale * 4) * 2;
    
    // Vorderbeine
    ctx.fillStyle = isAlpha ? '#2F2F2F' : '#4A4A4A';
    ctx.fillRect(x + (10 + legMove) * scale, y + 24 * scale + prowl, 
                 5 * scale, 8 * scale);
    ctx.fillRect(x + (18 - legMove) * scale, y + 24 * scale + prowl, 
                 5 * scale, 8 * scale);
    
    // Hinterbeine (dicker, muskulöser)
    ctx.fillRect(x + (26 + legMove) * scale, y + 22 * scale + prowl, 
                 6 * scale, 10 * scale);
    ctx.fillRect(x + (34 - legMove) * scale, y + 22 * scale + prowl, 
                 6 * scale, 10 * scale);
    
    // Pfoten mit Krallen
    ctx.fillStyle = isAlpha ? '#1A1A1A' : '#2A2A2A';
    ctx.fillRect(x + (9 + legMove) * scale, y + 30 * scale + prowl, 
                 7 * scale, 4 * scale);
    ctx.fillRect(x + (17 - legMove) * scale, y + 30 * scale + prowl, 
                 7 * scale, 4 * scale);
    ctx.fillRect(x + (25 + legMove) * scale, y + 30 * scale + prowl, 
                 8 * scale, 4 * scale);
    ctx.fillRect(x + (33 - legMove) * scale, y + 30 * scale + prowl, 
                 8 * scale, 4 * scale);
    
    // Krallen
    ctx.fillStyle = '#FFFFFF';
    for (let paw = 0; paw < 4; paw++) {
        const pawX = paw < 2 ? 
            (paw === 0 ? x + (10 + legMove) * scale : x + (18 - legMove) * scale) :
            (paw === 2 ? x + (26 + legMove) * scale : x + (34 - legMove) * scale);
        
        for (let claw = 0; claw < 3; claw++) {
            ctx.fillRect(pawX + claw * 2 * scale, y + 33 * scale + prowl, 
                         1 * scale, 2 * scale);
        }
    }
    
    // WILDER SCHWANZ
    const tailWag = Math.sin(timeScale * 5) * 4;
    const tailCurl = Math.sin(timeScale * 3) * 2;
    
    ctx.fillStyle = isAlpha ? '#3A3A3A' : '#5A5A5A';
    // Schwanzbasis
    ctx.fillRect(x + (38 + tailWag) * scale, y + (14 + tailCurl) * scale + prowl, 
                 8 * scale, 4 * scale);
    // Schwanzmitte
    ctx.fillRect(x + (44 + tailWag * 1.5) * scale, y + (12 + tailCurl * 1.5) * scale + prowl, 
                 6 * scale, 3 * scale);
    // Schwanzspitze
    ctx.fillRect(x + (48 + tailWag * 2) * scale, y + (10 + tailCurl * 2) * scale + prowl, 
                 4 * scale, 2 * scale);
    
    // ALPHA WOLF SPEZIAL-FEATURES
    if (isAlpha) {
        // Narben für Kampferfahrung
        ctx.fillStyle = '#8B4444';
        ctx.fillRect(x + 16 * scale, y + 8 * scale + prowl, 6 * scale, 1 * scale);
        ctx.fillRect(x + 17 * scale, y + 9 * scale + prowl, 4 * scale, 1 * scale);
        ctx.fillRect(x + 18 * scale, y + 10 * scale + prowl, 2 * scale, 1 * scale);
        
        // Blutige Schnauze
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(x + 2 * scale, y + 18 * scale + prowl + breathe, 8 * scale, 1 * scale);
        ctx.fillRect(x + 3 * scale, y + 19 * scale + prowl + breathe, 6 * scale, 1 * scale);
        
        // FURY CHARGING EFFEKTE - FIXED: Circular glow
        if (obstacle && obstacle.isFuryCharging && obstacle.furyChargeTime > 0) {
            const chargeProgress = (90 - obstacle.furyChargeTime) / 90;
            const intensity = Math.sin(timeScale * 25) * 0.5 + 0.5;
            
            // FIXED: Circular fury charging aura
            const centerX = x + 20 * scale;
            const centerY = y + 15 * scale + prowl;
            const maxRadius = (25 + chargeProgress * 40) * scale;
            const auraAlpha = chargeProgress * 1.0 * intensity;
            
            const furyGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, maxRadius
            );
            furyGradient.addColorStop(0, `rgba(255, 69, 0, ${auraAlpha})`);
            furyGradient.addColorStop(0.3, `rgba(255, 140, 0, ${auraAlpha * 0.8})`);
            furyGradient.addColorStop(0.6, `rgba(255, 215, 0, ${auraAlpha * 0.6})`);
            furyGradient.addColorStop(0.8, `rgba(255, 255, 0, ${auraAlpha * 0.4})`);
            furyGradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            
            ctx.fillStyle = furyGradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Energie-Funken around the circle
            if (Math.random() > 0.4) {
                ctx.fillStyle = `rgba(255, 255, 0, ${intensity})`;
                for (let s = 0; s < 8; s++) {
                    const angle = (s / 8) * Math.PI * 2;
                    const sparkRadius = maxRadius * (0.8 + Math.random() * 0.4);
                    const sparkX = centerX + Math.cos(angle) * sparkRadius;
                    const sparkY = centerY + Math.sin(angle) * sparkRadius;
                    ctx.fillRect(sparkX - 1.5, sparkY - 1.5, 3 * scale, 3 * scale);
                }
            }
            
            // Körper-Vibration während Charging
            const vibration = Math.sin(timeScale * 30) * 2 * scale;
            ctx.save();
            ctx.translate(vibration, 0);
            
            // Verstärkte rote Augen während Fury Charge
            ctx.fillStyle = `rgba(255, 0, 0, ${1.0})`;
            ctx.fillRect(x + 8 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                         4 * scale, 4 * scale);
            ctx.fillRect(x + 14 * scale, y + (10 + headTilt) * scale + prowl + breathe, 
                         4 * scale, 4 * scale);
            
            ctx.restore();
        }
        
        // Fury Leap Trail-Effekt
        if (obstacle && obstacle.isLeaping) {
            // Feuer-Trail hinter dem springenden Wolf
            for (let i = 0; i < 5; i++) {
                const trailX = x - i * 8 * scale;
                const trailY = y + 10 * scale + prowl + Math.sin(timeScale * 10 + i) * 3 * scale;
                const trailAlpha = (5 - i) / 5 * 0.8;
                
                ctx.fillStyle = `rgba(255, 69, 0, ${trailAlpha})`;
                ctx.fillRect(trailX, trailY, 6 * scale, 8 * scale);
                
                ctx.fillStyle = `rgba(255, 215, 0, ${trailAlpha * 0.7})`;
                ctx.fillRect(trailX + 1 * scale, trailY + 1 * scale, 4 * scale, 6 * scale);
            }
        }
        
        // Alpha-Aura (normale)
        const alphaGlow = 0.3 + Math.sin(timeScale * 4) * 0.2;
        const gradient = ctx.createRadialGradient(
            x + 20 * scale, y + 15 * scale + prowl, 0,
            x + 20 * scale, y + 15 * scale + prowl, 30 * scale
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${alphaGlow * 0.3})`);
        gradient.addColorStop(0.5, `rgba(255, 140, 0, ${alphaGlow * 0.2})`);
        gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 10 * scale, y - 5 * scale + prowl, 60 * scale, 40 * scale);
        
        // Dampfender Atem
        if (Math.sin(timeScale * 6) > 0.5) {
            const breathAlpha = 0.4 + Math.sin(timeScale * 8) * 0.2;
            ctx.fillStyle = `rgba(255, 255, 255, ${breathAlpha})`;
            const breathX = x + Math.sin(timeScale * 10) * 2 * scale;
            ctx.fillRect(breathX, y + 14 * scale + prowl + breathe, 4 * scale, 2 * scale);
            ctx.fillRect(breathX - 2 * scale, y + 13 * scale + prowl + breathe, 3 * scale, 1 * scale);
        }
    }
    
    // Blutspritzer-Effekt für beide Wölfe
    if (Math.random() > 0.95) {
        ctx.fillStyle = 'rgba(139, 0, 0, 0.8)';
        const bloodX = x + Math.random() * 30 * scale;
        const bloodY = y + 20 * scale + prowl + Math.random() * 10 * scale;
        ctx.fillRect(bloodX, bloodY, 2 * scale, 2 * scale);
    }
    
    // FIXED: Always restore if we flipped, and reset alpha
    if (facingLeft) {
        ctx.restore();
    }
    
    // FIXED: Ensure alpha is reset
    ctx.globalAlpha = 1.0;
}




function drawRock(ctx, x, y, width, height) {
    const scale = 1;
    
    // Shadow beneath the rock
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x - 2 * scale, y + height - 4 * scale, width + 4 * scale, 6 * scale);
    
    // Base stone layers
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x, y + height - 8 * scale, width, 8 * scale);
    ctx.fillRect(x - 2 * scale, y + height - 4 * scale, width + 4 * scale, 4 * scale);
    
    // Main rock body
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x + 5 * scale, y + 6 * scale, width - 5 * scale, height - 14 * scale);
    
    ctx.fillStyle = '#696969';
    ctx.fillRect(x + 3 * scale, y + 6 * scale, width - 6 * scale, height - 14 * scale);
    
    // Rock top shape
    ctx.fillRect(x + 5 * scale, y + 2 * scale, width - 10 * scale, 8 * scale);
    ctx.fillRect(x + 7 * scale, y, width - 14 * scale, 6 * scale);
    ctx.fillRect(x + 10 * scale, y - 2 * scale, width - 20 * scale, 4 * scale);
    
    // Highlights
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 3 * scale, y + 4 * scale, 2 * scale, height - 16 * scale);
    ctx.fillRect(x + 5 * scale, y + 2 * scale, width - 12 * scale, 2 * scale);
    
    // Cracks and details
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + 12 * scale, y + 4 * scale, 1 * scale, height - 18 * scale);
    ctx.fillRect(x + 8 * scale, y + height/2, 12 * scale, 1 * scale);
    ctx.fillRect(x + 18 * scale, y + 8 * scale, 1 * scale, 15 * scale);
    ctx.fillRect(x + 6 * scale, y + height - 10 * scale, 8 * scale, 1 * scale);
    
    // Moss patches
    ctx.fillStyle = '#556B2F';
    ctx.fillRect(x + 5 * scale, y + 10 * scale, 4 * scale, 8 * scale);
    ctx.fillRect(x + width - 7 * scale, y + height - 20 * scale, 5 * scale, 10 * scale);
    ctx.fillRect(x + 15 * scale, y + height - 12 * scale, 8 * scale, 4 * scale);
    
    // Dark center rune
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + width/2, y + 8 * scale, 2 * scale, 10 * scale);
    ctx.fillRect(x + width/2 - 4 * scale, y + 12 * scale, 10 * scale, 2 * scale);
    
    // Additional shading
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + 8 * scale, y + 20 * scale, width - 16 * scale, 1 * scale);
    ctx.fillRect(x + 10 * scale, y + 23 * scale, width - 20 * scale, 1 * scale);
    ctx.fillRect(x + 9 * scale, y + 26 * scale, width - 18 * scale, 1 * scale);
    
    // Candle on side (dungeon theme detail) - FPS-normalisiert
    const currentTime = Date.now() * 0.001;
    const flicker = Math.sin(currentTime * 8) * 2;
    
    // Candle body
    ctx.fillStyle = '#F5F5DC';
    ctx.fillRect(x + width + 2 * scale, y + height - 12 * scale, 4 * scale, 12 * scale);
    
    // Melted wax
    ctx.fillStyle = '#FFFACD';
    ctx.fillRect(x + width + 1 * scale, y + height - 10 * scale, 6 * scale, 2 * scale);
    ctx.fillRect(x + width + 2 * scale, y + height - 8 * scale, 5 * scale, 1 * scale);
    
    // Wick
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + width + 4 * scale, y + height - 14 * scale, 1 * scale, 3 * scale);
    
    // Flame
    const flameHeight = 6 + flicker;
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(x + width + 3 * scale, y + height - 18 * scale - flicker, 3 * scale, flameHeight);
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + width + 4 * scale, y + height - 17 * scale - flicker, 1 * scale, flameHeight - 2);
    
    // Flame glow
    ctx.fillStyle = 'rgba(255, 165, 0, 0.3)';
    ctx.fillRect(x + width + 1 * scale, y + height - 20 * scale - flicker, 7 * scale, 10 * scale);
    
    // Wax drips
    ctx.fillStyle = '#FFFACD';
    ctx.fillRect(x + width + 1 * scale, y + height - 7 * scale, 1 * scale, 4 * scale);
    ctx.fillRect(x + width + 6 * scale, y + height - 5 * scale, 1 * scale, 3 * scale);
}

function drawBoltBox(ctx, x, y, animTime = 0) {
    const scale = 1.20;
    const timeScale = animTime * 0.001;
    const float = Math.sin(timeScale * 4) * 2.5;
    const electricPulse = 0.5 + Math.sin(timeScale * 8) * 0.5;
    
    // Electric aura
    const centerX = x + 12 * scale;
    const centerY = y + 8 * scale + float;
    const glowRadius = 32 * scale;
    
    const gradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowRadius
    );
    
    gradient.addColorStop(0, `rgba(0, 255, 255, ${electricPulse * 0.8})`);
    gradient.addColorStop(0.2, `rgba(0, 255, 255, ${electricPulse * 0.6})`);
    gradient.addColorStop(0.4, `rgba(0, 255, 255, ${electricPulse * 0.4})`);
    gradient.addColorStop(0.6, `rgba(0, 255, 255, ${electricPulse * 0.2})`);
    gradient.addColorStop(0.8, `rgba(0, 255, 255, ${electricPulse * 0.1})`);
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(
        centerX - glowRadius,
        centerY - glowRadius,
        glowRadius * 2,
        glowRadius * 2
    );
    
    // Box with electric shake
    const electricShake = Math.sin(timeScale * 25) * 0.2;
    ctx.fillStyle = '#2F2F2F';
    ctx.fillRect(x + electricShake, y + float, 24 * scale, 16 * scale);
    
    // Box highlights
    ctx.fillStyle = '#4A4A4A';
    ctx.fillRect(x + 2 * scale + electricShake, y + 2 * scale + float, 20 * scale, 2 * scale);
    ctx.fillRect(x + 2 * scale + electricShake, y + 2 * scale + float, 2 * scale, 12 * scale);
    
    // Box shadows
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(x + 20 * scale + electricShake, y + 4 * scale + float, 4 * scale, 12 * scale);
    ctx.fillRect(x + 4 * scale + electricShake, y + 12 * scale + float, 20 * scale, 4 * scale);
    
    // Lightning bolt icon
    const boltGlow = 0.8 + Math.sin(timeScale * 10) * 0.2;
    ctx.fillStyle = `rgba(0, 255, 255, ${boltGlow})`;
    ctx.fillRect(x + 10 * scale + electricShake, y + 6 * scale + float, 2 * scale, 4 * scale);
    ctx.fillRect(x + 8 * scale + electricShake, y + 7 * scale + float, 6 * scale, 2 * scale);
    ctx.fillRect(x + 12 * scale + electricShake, y + 8 * scale + float, 4 * scale, 2 * scale);
    
    // Electric sparks
    ctx.fillStyle = `rgba(255, 255, 0, ${electricPulse})`;
    const spark1X = x + 12 * scale + Math.sin(timeScale * 20) * 4 * scale;
    const spark1Y = y + 8 * scale + float + Math.cos(timeScale * 20) * 3 * scale;
    const spark2X = x + 16 * scale + Math.sin(timeScale * 18) * 3 * scale;
    const spark2Y = y + 6 * scale + float + Math.cos(timeScale * 22) * 4 * scale;
    
    ctx.fillRect(spark1X, spark1Y, 1 * scale, 1 * scale);
    ctx.fillRect(spark2X, spark2Y, 1 * scale, 1 * scale);
    
    // Lightning arcs
    if (Math.sin(timeScale * 15) > 0.6) {
        ctx.strokeStyle = `rgba(0, 255, 255, ${electricPulse * 0.8})`;
        ctx.lineWidth = 1 * scale;
        ctx.beginPath();
        ctx.moveTo(x + 8 * scale, y + 4 * scale + float);
        ctx.lineTo(x + 18 * scale + Math.sin(timeScale * 30) * 2 * scale, y + 10 * scale + float);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 20 * scale, y + 6 * scale + float);
        ctx.lineTo(x + 14 * scale + Math.cos(timeScale * 25) * 2 * scale, y + 12 * scale + float);
        ctx.stroke();
    }
    
    // Bright center flash
    if (Math.sin(timeScale * 12) > 0.4) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x + 11 * scale + electricShake, y + 7 * scale + float, 2 * scale, 2 * scale);
    }
}