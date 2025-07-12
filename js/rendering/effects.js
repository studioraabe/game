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
    // Access the global batProjectiles array
    const batProjectiles = window.batProjectiles || [];
    
    for (const projectile of batProjectiles) {
        // Handle magical projectiles (from Professor) - GREEN ENERGY
        if (projectile.type === 'magical') {
            const screenX = getScreenX(projectile.x);
            const alpha = projectile.life / projectile.maxLife;
            const magicalPulse = 0.8 + Math.sin(Date.now() * 0.012) * 0.2;
            
            // MAGICAL AURA - Green energy
            const auraSize = projectile.size + 8;
            ctx.fillStyle = `rgba(0, 255, 0, ${alpha * magicalPulse * 0.4})`;
            ctx.fillRect(screenX - auraSize/2, projectile.y - auraSize/2, auraSize, auraSize);
            
            // OUTER GLOW - Bright green
            const glowSize = projectile.size + 4;
            ctx.fillStyle = `rgba(0, 255, 100, ${alpha * magicalPulse * 0.6})`;
            ctx.fillRect(screenX - glowSize/2, projectile.y - glowSize/2, glowSize, glowSize);
            
            // MAIN ORB - Green magical energy
            ctx.fillStyle = `rgba(0, 200, 0, ${alpha})`;
            ctx.fillRect(screenX - projectile.size/2, projectile.y - projectile.size/2, 
                         projectile.size, projectile.size);
            
            // BRIGHT CENTER - Light green core
            ctx.fillStyle = `rgba(100, 255, 100, ${alpha * magicalPulse})`;
            const centerSize = projectile.size - 4;
            ctx.fillRect(screenX - centerSize/2, projectile.y - centerSize/2, 
                         centerSize, centerSize);
            
            // WHITE HOT CORE - Very bright center
            ctx.fillStyle = `rgba(200, 255, 200, ${alpha * magicalPulse * 0.9})`;
            const coreSize = Math.max(2, projectile.size - 6);
            ctx.fillRect(screenX - coreSize/2, projectile.y - coreSize/2, 
                         coreSize, coreSize);
            
            // MAGICAL SPARKLES - Green sparkles around orb
            if (Math.sin(Date.now() * 0.015 + projectile.x * 0.1) > 0.6) {
                for (let s = 0; s < 5; s++) {
                    const sparkleX = screenX + (Math.random() - 0.5) * 20;
                    const sparkleY = projectile.y + (Math.random() - 0.5) * 20;
                    ctx.fillStyle = `rgba(0, 255, 0, ${magicalPulse})`;
                    ctx.fillRect(sparkleX, sparkleY, 2, 2);
                }
            }
            
            // MAGICAL TRAIL - Green energy trail
            if (projectile.trailParticles) {
                for (const trail of projectile.trailParticles) {
                    const trailScreenX = getScreenX(trail.x);
                    ctx.fillStyle = `rgba(0, 200, 0, ${trail.alpha * 0.5})`;
                    ctx.fillRect(trailScreenX - 3, trail.y - 3, 6, 6);
                }
            }
            
            // GROUND IMPACT EFFECT
            if (projectile.hasHitGround && projectile.life < 60) {
                const impactAlpha = (60 - projectile.life) / 60;
                const impactRadius = 25 * impactAlpha;
                
                ctx.fillStyle = `rgba(0, 255, 0, ${impactAlpha * 0.4})`;
                ctx.fillRect(screenX - impactRadius, CANVAS.groundY - 8, 
                             impactRadius * 2, 16);
            }
            
            continue; // Skip normal bat projectile rendering
        }
        
        // Handle regular bat projectiles (blood curse)
        const screenX = getScreenX(projectile.x);
        const alpha = projectile.life / projectile.maxLife;
        const pulse = 0.7 + Math.sin(Date.now() * 0.015) * 0.3;
        
        // TRAIL EFFECT - Blood trail
        if (projectile.trailParticles) {
            for (const trail of projectile.trailParticles) {
                const trailScreenX = getScreenX(trail.x);
                ctx.fillStyle = `rgba(139, 0, 0, ${trail.alpha * 0.6})`;
                ctx.fillRect(trailScreenX - 2, trail.y - 2, 4, 4);
            }
        }
        
        // CORRUPTION AURA - Purple/lilac corruption energy
        const auraSize = projectile.size + 12;
        ctx.fillStyle = `rgba(139, 0, 139, ${alpha * pulse * 0.4})`;
        ctx.fillRect(screenX - auraSize/2, projectile.y - auraSize/2, auraSize, auraSize);
        
        // OUTER GLOW - Red blood glow
        const glowSize = projectile.size + 6;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * pulse * 0.5})`;
        ctx.fillRect(screenX - glowSize/2, projectile.y - glowSize/2, glowSize, glowSize);
        
        // MAIN BLOOD DROP - Dark red blood
        ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
        ctx.fillRect(screenX - projectile.size/2, projectile.y - projectile.size/2, 
                     projectile.size, projectile.size);
        
        // BRIGHT CENTER - Red core
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha * pulse})`;
        const centerSize = projectile.size - 2;
        ctx.fillRect(screenX - centerSize/2, projectile.y - centerSize/2, 
                     centerSize, centerSize);
        
        // WHITE HOT CORE - Very bright center
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * pulse * 0.8})`;
        const coreSize = Math.max(2, projectile.size - 4);
        ctx.fillRect(screenX - coreSize/2, projectile.y - coreSize/2, 
                     coreSize, coreSize);
        
        // DRIPPING EFFECT - Blood droplet shape
        if (projectile.velocityY > 2) { // Only when falling
            ctx.fillStyle = `rgba(139, 0, 0, ${alpha * 0.8})`;
            // Blood drip tail
            ctx.fillRect(screenX - 1, projectile.y + projectile.size/2, 2, 
                         Math.min(6, projectile.velocityY));
        }
        
        // CORRUPTION SPARKLES - Purple corruption particles
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
export function drawBullet(ctx, x, y, enhanced = false, hasPiercingBullets = false, bullet = null) {
    // If no bullet object, use simple rendering
    if (!bullet) {
        drawSimpleBullet(ctx, x, y, enhanced, hasPiercingBullets);
        return;
    }
    
    // Calculate actual length based on direction
    const direction = bullet.speed > 0 ? 1 : -1;
    const length = Math.abs(bullet.x - bullet.tailX);
    
    if (length <= 0) return;
    
    // Always blue color scheme
    const primaryColor = '#00FFFF';
    const coreColor = '#FFFFFF';
    const glowColor = 'rgba(0, 255, 255,';
    
    // Time-based effects
    const time = Date.now() * 0.001;
    const pulse = 0.9 + Math.sin(time * 20) * 0.1;
    
    // Screen position adjustments - KORRIGIERT für beide Richtungen
    const screenX = x;
    let screenTailX, startX, endX;
    
    if (direction > 0) {
        // Shooting right
        screenTailX = x - length;
        startX = screenTailX;
        endX = screenX;
    } else {
        // Shooting left - INVERTIERT
        screenTailX = x + length;
        startX = screenX;
        endX = screenTailX;
    }
    
    // 1. Subtle outer glow (5px height total)
    ctx.fillStyle = glowColor + (0.2 * pulse) + ')';
    ctx.fillRect(Math.min(startX, endX) - 2, y - 2.5, length + 4, 5);
    
    // 2. Main laser body (3px height) - Gradient muss Richtung berücksichtigen
    const bodyGradient = ctx.createLinearGradient(
        startX, y,
        endX, y
    );
    
    if (direction > 0) {
        bodyGradient.addColorStop(0, glowColor + '0.4)');
        bodyGradient.addColorStop(0.1, primaryColor);
        bodyGradient.addColorStop(0.9, primaryColor);
        bodyGradient.addColorStop(1, coreColor);
    } else {
        // Invertierte Gradient für Links-Schuss
        bodyGradient.addColorStop(0, coreColor);
        bodyGradient.addColorStop(0.1, primaryColor);
        bodyGradient.addColorStop(0.9, primaryColor);
        bodyGradient.addColorStop(1, glowColor + '0.4)');
    }
    
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(Math.min(startX, endX), y - 1.5, length, 3);
    
    // 3. Bright core (1px height)
    ctx.fillStyle = coreColor;
    const coreStart = direction > 0 ? startX + 4 : endX - length + 4;
    const coreLength = Math.max(0, length - 8);
    ctx.fillRect(coreStart, y - 0.5, coreLength, 1);
    
    // 4. Leading edge (an der Spitze des Lasers)
    const tipX = direction > 0 ? endX : startX;
    
    if (!bullet.hit) {
        // Bright tip flash
        ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
        ctx.fillRect(tipX - 2, y - 1.5, 4, 3);
        
        // Small energy burst
        ctx.fillStyle = glowColor + (0.6 * pulse) + ')';
        ctx.fillRect(tipX - 4, y - 3, 8, 6);
    } else {
        // Impact effect
        const impactAlpha = 1 - (bullet.hitTime / 6);
        if (impactAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${impactAlpha})`;
            const impactSize = (6 - bullet.hitTime) * 2;
            ctx.fillRect(tipX - impactSize/2, y - impactSize/2, impactSize, impactSize);
            
            // Impact particles
            ctx.fillStyle = glowColor + (impactAlpha * 0.8) + ')';
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const dist = bullet.hitTime * 2;
                const px = tipX + Math.cos(angle) * dist;
                const py = y + Math.sin(angle) * dist;
                ctx.fillRect(px - 1, py - 1, 2, 2);
            }
        }
    }
    
    // 5. Enhanced mode
    if (enhanced && !bullet.hit) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const enhancedCoreStart = direction > 0 ? startX + 8 : endX - length + 8;
        ctx.fillRect(enhancedCoreStart, y - 0.5, Math.max(0, length - 16), 1);
        
        ctx.fillStyle = glowColor + '0.1)';
        ctx.fillRect(Math.min(startX, endX) - 4, y - 3.5, length + 8, 7);
    }
    
    // 6. Piercing mode
    if (hasPiercingBullets && length > 10) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        const dotStart = Math.min(startX, endX);
        for (let i = 0; i < length; i += 8) {
            ctx.fillRect(dotStart + i, y - 0.5, 1, 1);
        }
    }
    
    // 7. Motion trail (in Schussrichtung)
    if (bullet.age < 20) {
        const trailStart = direction > 0 ? startX : endX;
        ctx.fillStyle = glowColor + '0.1)';
        for (let i = 1; i <= 3; i++) {
            const trailAlpha = 0.1 / i;
            ctx.fillStyle = glowColor + trailAlpha + ')';
            const trailX = trailStart - (i * 6 * direction);
            ctx.fillRect(trailX, y - 1, 3, 2);
        }
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