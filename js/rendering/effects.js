// rendering/effects.js - All Effect Renderings (Particles, Explosions, Score Popups)

import { getScreenX } from '../core/camera.js';
import { DROP_INFO } from '../core/constants.js';
import { CANVAS } from '../core/constants.js';


// Draw all effects
export function drawEffects(ctx, effects) {
    drawBloodParticles(ctx, effects.bloodParticles);
    drawLightningEffects(ctx, effects.lightningEffects);
    drawScorePopups(ctx, effects.scorePopups);
    drawDoubleJumpParticles(ctx, effects.doubleJumpParticles);
    drawDropParticles(ctx, effects.dropParticles);
    drawExplosions(ctx, effects.explosions);
    drawBatProjectiles(ctx); // KORRIGIERT: Jetzt korrekt aufgerufen
}

// Blood particles
function drawBloodParticles(ctx, particles) {
    for (const particle of particles) {
        const alpha = particle.life / particle.maxLife;
        const screenX = getScreenX(particle.x);
        ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
        ctx.fillRect(screenX, particle.y, 3, 3);
    }
}

// Lightning effects
function drawLightningEffects(ctx, effects) {
    for (const effect of effects) {
        const alpha = effect.life / effect.maxLife;
        const screenX = getScreenX(effect.x);
        ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < effect.branches; i++) {
            ctx.beginPath();
            ctx.moveTo(screenX, effect.y);
            
            const endX = screenX + (Math.random() - 0.5) * 40;
            const endY = effect.y + (Math.random() - 0.5) * 40;
            
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
}

// Score popups
function drawScorePopups(ctx, popups) {
    for (const popup of popups) {
        const alpha = popup.life / popup.maxLife;
        const screenX = getScreenX(popup.x);
        const color = `rgba(255, 255, 0, ${alpha})`;
        
        ctx.fillStyle = color;
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = `${typeof popup.points === 'number' ? '+' : ''}${popup.points}`;
        ctx.fillText(text, screenX, popup.y);
    }
}

// Double jump particles
function drawDoubleJumpParticles(ctx, particles) {
    for (const particle of particles) {
        const alpha = particle.life / particle.maxLife;
        const screenX = getScreenX(particle.x);
        
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha * 0.9})`;
        ctx.fillRect(screenX, particle.y, particle.size, particle.size);
    }
}

// Drop particles
function drawDropParticles(ctx, particles) {
    for (const particle of particles) {
        const alpha = particle.life / particle.maxLife;
        const screenX = getScreenX(particle.x);
        ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.fillRect(screenX - 1, particle.y - 1, 3, 3);
    }
}

// Explosions
function drawExplosions(ctx, explosions) {
    for (const explosion of explosions) {
        const screenX = getScreenX(explosion.x);
        drawExplosion(ctx, screenX, explosion.y, explosion.frame);
    }
}

function drawExplosion(ctx, x, y, frame) {
    const colors = ['#00FFFF', '#87CEEB', '#FFFF00', '#FF4500'];
    const maxFrame = 15;
    const size = (frame / maxFrame) * 20 + 10;
    
    ctx.fillStyle = colors[Math.floor(frame / 4) % colors.length];
    
    // Create explosion particles
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const particleX = x + Math.cos(angle) * size;
        const particleY = y + Math.sin(angle) * size;
        ctx.fillRect(particleX, particleY, 4, 4);
    }
    
    // Center flash
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x - 2, y - 2, 4, 4);
}

export function drawBatProjectiles(ctx) {
    // Zugriff auf das globale batProjectiles Array
    const batProjectiles = window.batProjectiles || [];
    
    for (const projectile of batProjectiles) {
        const screenX = getScreenX(projectile.x);
        const alpha = projectile.life / projectile.maxLife;
        const pulse = 0.7 + Math.sin(Date.now() * 0.015) * 0.3;
        
        // TRAIL EFFECT - Blutspur zeichnen
        if (projectile.trailParticles) {
            for (const trail of projectile.trailParticles) {
                const trailScreenX = getScreenX(trail.x);
                ctx.fillStyle = `rgba(139, 0, 0, ${trail.alpha * 0.6})`;
                ctx.fillRect(trailScreenX - 2, trail.y - 2, 4, 4);
            }
        }
        
        // CORRUPTION AURA - größer und bedrohlicher
        const auraSize = projectile.size + 12;
        ctx.fillStyle = `rgba(139, 0, 139, ${alpha * pulse * 0.4})`;
        ctx.fillRect(screenX - auraSize/2, projectile.y - auraSize/2, auraSize, auraSize);
        
        // OUTER GLOW - Rot
        const glowSize = projectile.size + 6;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * pulse * 0.5})`;
        ctx.fillRect(screenX - glowSize/2, projectile.y - glowSize/2, glowSize, glowSize);
        
        // MAIN BLOOD DROP - Größer und sichtbarer
        ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
        ctx.fillRect(screenX - projectile.size/2, projectile.y - projectile.size/2, 
                     projectile.size, projectile.size);
        
        // BRIGHT CENTER - Weißer Kern
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * pulse})`;
        const centerSize = projectile.size - 2;
        ctx.fillRect(screenX - centerSize/2, projectile.y - centerSize/2, 
                     centerSize, centerSize);
        
        // WHITE HOT CORE - Sehr heller Kern
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pulse * 0.8})`;
        const coreSize = Math.max(2, projectile.size - 4);
        ctx.fillRect(screenX - coreSize/2, projectile.y - coreSize/2, 
                     coreSize, coreSize);
        
        // DRIPPING EFFECT - Tropfen-Form
        if (projectile.velocityY > 2) { // Nur wenn fallend
            ctx.fillStyle = `rgba(139, 0, 0, ${alpha * 0.8})`;
            // Tropfen-Schweif
            ctx.fillRect(screenX - 1, projectile.y + projectile.size/2, 2, 
                         Math.min(6, projectile.velocityY));
        }
        
        // CORRUPTION SPARKLES - Lila Funken
        if (Math.sin(Date.now() * 0.02 + projectile.x * 0.1) > 0.7) {
            for (let s = 0; s < 3; s++) {
                const sparkleX = screenX + (Math.random() - 0.5) * 16;
                const sparkleY = projectile.y + (Math.random() - 0.5) * 16;
                ctx.fillStyle = `rgba(139, 0, 139, ${pulse})`;
                ctx.fillRect(sparkleX, sparkleY, 2, 2);
            }
        }
        
        // GROUND IMPACT EFFECT
        if (projectile.hasHitGround && projectile.life < 60) {
            const impactAlpha = (60 - projectile.life) / 60;
            const impactRadius = 20 * impactAlpha;
            
            ctx.fillStyle = `rgba(139, 0, 0, ${impactAlpha * 0.3})`;
            ctx.fillRect(screenX - impactRadius, CANVAS.groundY - 5, 
                         impactRadius * 2, 10);
        }
    }
}
// Bullets
export function drawBullet(ctx, x, y, enhanced = false, hasPiercingBullets = false) {
    // Lightning bolt bullet
    ctx.fillStyle = enhanced ? '#FF4500' : '#00FFFF';
    ctx.fillRect(x, y, 8, 2);
    ctx.fillRect(x + 2, y - 1, 4, 4);
    
    // Glow effect
    const glowAlpha = 0.4 + Math.sin(Date.now() * 0.02 + x * 0.1) * 0.2;
    ctx.fillStyle = enhanced ? `rgba(255, 69, 0, ${glowAlpha})` : `rgba(0, 255, 255, ${glowAlpha})`;
    ctx.fillRect(x - 1, y - 1, 10, 4);
    
    // Piercing effect
    if (hasPiercingBullets) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(x - 3, y, 3, 2);
    }
}

// Drop items
export function drawDrop(ctx, drop) {
    const x = getScreenX(drop.x);
    const y = drop.y;
    
    // Glow aura with slower pulsing (0.002 statt 0.005)
    const glowIntensity = drop.glowIntensity || (0.5 + Math.sin(Date.now() * 0.002) * 0.3);
    const gradient = ctx.createRadialGradient(x + 12, y + 12, 0, x + 12, y + 12, 20);
    gradient.addColorStop(0, `${drop.info.color}88`);
    gradient.addColorStop(0.5, `${drop.info.color}44`);
    gradient.addColorStop(1, `${drop.info.color}00`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(x - 8, y - 8, 40, 40);
    
    // Rotating container with corrected rotation value
    ctx.save();
    ctx.translate(x + 12, y + 12);
    ctx.rotate(drop.rotation);
    
    // Container box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(-10, -10, 20, 20);
    
    ctx.strokeStyle = drop.info.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -10, 20, 20);
    
    ctx.restore();
    
    // Icon
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(drop.info.icon, x + 12, y + 12);
    
    // Sparkle effect with slower animation (0.005 statt 0.01)
    if (Math.sin(Date.now() * 0.005 + drop.x) > 0.7) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 20, y + 4, 2, 2);
        ctx.fillRect(x + 4, y + 20, 2, 2);
    }
}