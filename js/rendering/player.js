// rendering/player.js - Dungeon Character Rendering with GLOW EFFECTS

import { activeDropBuffs } from '../systems.js';

export function drawPlayer(ctx, x, y, player, gameState) {
    const scale = 1.6;
    const isInvulnerable = gameState.postBuffInvulnerability > 0 || gameState.postDamageInvulnerability > 0;
    const isDead = gameState.lives <= 0;
    const facingLeft = player.facingDirection === -1;
    
    // Blink effect when invulnerable
    if (isInvulnerable) {
        const blinkFrequency = 8;
        const activeInvulnerability = Math.max(gameState.postBuffInvulnerability, gameState.postDamageInvulnerability);
        
        if (Math.floor(activeInvulnerability / blinkFrequency) % 2 === 0) {
            return;
        }
    }
    
    ctx.save();
    
    // Apply scaling
    ctx.translate(x + player.width/2, y + player.height/2);
    ctx.scale(scale, scale);
    ctx.translate(-player.width/2, -player.height/2);
    
    // ===== NEUE GLOW EFFEKTE =====
    
    // Shield Glow - Blauer Schutzschild
    if (gameState.shieldCharges > 0) {
    for (let i = 0; i < Math.min(gameState.shieldCharges, 3); i++) { // Max 3 visual rings
        const shieldPulse = 0.7 + Math.sin(Date.now() * 0.003 + i * 0.5) * 0.3;
        const shieldRadius = 35 + (i * 8); // Each shield adds 8px radius
        const shieldAlpha = shieldPulse * (0.8 - i * 0.15); // Outer shields are more transparent
        
        ctx.strokeStyle = `rgba(65, 105, 225, ${shieldAlpha})`;
        ctx.lineWidth = 3 - i; // Outer shields are thinner
        ctx.beginPath();
        ctx.arc(player.width/2, player.height/2, shieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shield glow
        ctx.fillStyle = `rgba(65, 105, 225, ${shieldAlpha * 0.15})`;
        ctx.beginPath();
        ctx.arc(player.width/2, player.height/2, shieldRadius, 0, Math.PI * 2);
        ctx.fill();
    }
    
  
}
    
    
    
    
     // NEU: CORRUPTION EFFECT - Lila/Schwarze Aura
    if (gameState.isCorrupted) {
        const corruptionIntensity = gameState.corruptionTimer / 120; // 0-1 basierend auf verbleibender Zeit
        const corruptionPulse = 0.5 + Math.sin(Date.now() * 0.02) * 0.5;
        
        // Dunkle Corruption Aura
        const corruptionGradient = ctx.createRadialGradient(
            player.width/2, player.height/2, 0,
            player.width/2, player.height/2, 50
        );
        corruptionGradient.addColorStop(0, `rgba(139, 0, 139, ${corruptionIntensity * corruptionPulse * 0.6})`);
        corruptionGradient.addColorStop(0.5, `rgba(75, 0, 130, ${corruptionIntensity * corruptionPulse * 0.4})`);
        corruptionGradient.addColorStop(1, 'rgba(25, 25, 112, 0)');
        ctx.fillStyle = corruptionGradient;
        ctx.fillRect(-25, -25, player.width + 50, player.height + 50);
        
        // Corruption Partikel
        for (let i = 0; i < 6; i++) {
            const particleTime = Date.now() * 0.003 + i * 1.5;
            const particleX = player.width/2 + Math.sin(particleTime * 2) * 20;
            const particleY = player.height/2 + Math.cos(particleTime * 1.5) * 20;
            const particleSize = 2 + Math.sin(particleTime * 4) * 1;
            
            ctx.fillStyle = `rgba(139, 0, 139, ${corruptionIntensity * corruptionPulse})`;
            ctx.fillRect(particleX - particleSize/2, particleY - particleSize/2, particleSize, particleSize);
        }
        
        // Schwächung-Indikator (X über Waffe und Sprung-Bereichen)
        ctx.strokeStyle = `rgba(255, 0, 0, ${corruptionPulse})`;
        ctx.lineWidth = 2;
        
        // X über Waffen-Bereich (rechts)
        ctx.beginPath();
        ctx.moveTo(player.width - 15, 15);
        ctx.lineTo(player.width - 5, 25);
        ctx.moveTo(player.width - 5, 15);
        ctx.lineTo(player.width - 15, 25);
        ctx.stroke();
        
        // X über Sprung-Bereich (Füße)
        ctx.beginPath();
        ctx.moveTo(15, player.height - 15);
        ctx.lineTo(25, player.height - 5);
        ctx.moveTo(25, player.height - 15);
        ctx.lineTo(15, player.height - 5);
        ctx.stroke();
        
        // Corruption Timer Bar (zeigt verbleibende Zeit)
        const barWidth = 30;
        const barHeight = 3;
        const timerProgress = gameState.corruptionTimer / 120;
        
        // Bar Hintergrund
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(player.width/2 - barWidth/2, -10, barWidth, barHeight);
        
        // Timer Progress
        ctx.fillStyle = `rgba(139, 0, 139, ${corruptionPulse})`;
        ctx.fillRect(player.width/2 - barWidth/2, -10, barWidth * timerProgress, barHeight);
        
        // Corruption "Schwächung" Text
        if (Math.sin(Date.now() * 0.01) > 0.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${corruptionPulse})`;
            ctx.font = '8px Rajdhani';
            ctx.textAlign = 'center';
            ctx.fillText('BLOOD CURSED!', player.width/2, -15);
        }
    }
    
    
    
    
    // Score Multiplier - Goldener Glanz mit Funken
    if (activeDropBuffs.scoreMultiplier) {
        const goldPulse = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        const gradient = ctx.createRadialGradient(
            player.width/2, player.height/2, 0,
            player.width/2, player.height/2, 40
        );
        gradient.addColorStop(0, `rgba(255, 215, 0, ${goldPulse * 0.3})`);
        gradient.addColorStop(0.5, `rgba(255, 215, 0, ${goldPulse * 0.2})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(-20, -20, player.width + 40, player.height + 40);
        
        // Kleine goldene Funken
        for (let i = 0; i < 6; i++) {
            const sparkTime = Date.now() * 0.005 + i * 1.5;
            const sparkX = player.width/2 + Math.cos(sparkTime) * 25;
            const sparkY = player.height/2 + Math.sin(sparkTime) * 25;
            const sparkSize = 1 + Math.sin(sparkTime * 3) * 0.5;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${goldPulse})`;
            ctx.fillRect(sparkX - sparkSize, sparkY - sparkSize, sparkSize * 2, sparkSize * 2);
        }
    }
    
    // Berserker Mode - INTENSIVES FEUER!
    if (gameState.isBerserker) {
        // Große Flammen um den Spieler
        for (let i = 0; i < 12; i++) {
            const fireTime = Date.now() * 0.008 + i * 0.5;
            const angle = (i / 12) * Math.PI * 2;
            const distance = 20 + Math.sin(fireTime * 2) * 10;
            const fireX = player.width/2 + Math.cos(angle) * distance;
            const fireY = player.height/2 + Math.sin(angle) * distance;
            const fireSize = 6 + Math.sin(fireTime * 3) * 3;
            
            // Äußere Flamme (rot)
            ctx.fillStyle = `rgba(255, 0, 0, ${0.8 - (distance - 20) / 20})`;
            ctx.fillRect(fireX - fireSize/2, fireY - fireSize, fireSize, fireSize * 2);
            
            // Innere Flamme (gelb)
            ctx.fillStyle = `rgba(255, 215, 0, ${0.9 - (distance - 20) / 20})`;
            ctx.fillRect(fireX - fireSize/3, fireY - fireSize * 0.7, fireSize * 0.6, fireSize * 1.4);
            
            // Weiße Hitze im Kern
            if (distance < 25) {
                ctx.fillStyle = `rgba(255, 255, 255, ${0.7 - (distance - 20) / 10})`;
                ctx.fillRect(fireX - fireSize/4, fireY - fireSize * 0.5, fireSize * 0.4, fireSize);
            }
        }
        
        // Aufsteigende Feuerpartikel
        for (let i = 0; i < 8; i++) {
            const particleTime = Date.now() * 0.003 + i * 1.2;
            const particleX = player.width/2 + Math.sin(particleTime * 2) * 15;
            const particleY = player.height - (particleTime * 40 % 80);
            const particleSize = 4 + Math.sin(particleTime * 4) * 2;
            
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(particleX - particleSize/2, particleY, particleSize, particleSize);
            
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(particleX - particleSize/3, particleY + 1, particleSize * 0.6, particleSize * 0.6);
        }
        
        // Hitze-Verzerrung (wellenförmiger Umriss)
        const heatWave = Math.sin(Date.now() * 0.015) * 2;
        ctx.strokeStyle = 'rgba(255, 69, 0, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.width/2, player.height/2, 35 + heatWave, 0, Math.PI * 2);
        ctx.stroke();
        
        // Glühender Boden unter dem Spieler
        const groundGlow = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
        ctx.fillStyle = `rgba(255, 69, 0, ${groundGlow * 0.5})`;
        ctx.ellipse(player.width/2, player.height + 2, 25, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Jump Boost - Sprungfedern unter den Füßen
    if (activeDropBuffs.jumpBoost) {
        ctx.strokeStyle = '#FF4500';
        ctx.lineWidth = 2;
        const springBounce = Math.abs(Math.sin(Date.now() * 0.008)) * 3;
        
        // Left spring
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(12, player.height + 2 + i * 3 - springBounce, 3, 0, Math.PI);
            ctx.stroke();
        }
        
        // Right spring
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(28, player.height + 2 + i * 3 - springBounce, 3, 0, Math.PI);
            ctx.stroke();
        }
    }
    
    // Magnet Mode - Anziehungsfeld
    if (activeDropBuffs.magnetMode) {
        const magnetPulse = Date.now() * 0.002;
        ctx.strokeStyle = 'rgba(255, 105, 180, 0.4)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 3; i++) {
            const radius = 30 + i * 15 + Math.sin(magnetPulse + i) * 5;
            ctx.beginPath();
            ctx.arc(player.width/2, player.height/2, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Magnetic particles
        for (let i = 0; i < 4; i++) {
            const angle = magnetPulse * 2 + i * Math.PI / 2;
            const particleX = player.width/2 + Math.cos(angle) * 40;
            const particleY = player.height/2 + Math.sin(angle) * 40;
            ctx.fillStyle = '#FF69B4';
            ctx.fillRect(particleX - 2, particleY - 2, 4, 4);
        }
    }
    
    // Time Slow - Zeit-Verzerrung
    if (activeDropBuffs.timeSlow) {
        const timePulse = Date.now() * 0.001;
        ctx.strokeStyle = 'rgba(0, 206, 209, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = timePulse * 10;
        
        ctx.beginPath();
        ctx.arc(player.width/2, player.height/2, 45, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
    
    // Ghost Walking - Transparenz ist bereits implementiert
    if (gameState.isGhostWalking) {
        ctx.globalAlpha = 0.5;
        
        // Ghost trail
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = 0.1 / i;
            ctx.save();
            ctx.translate(-i * 5 * player.facingDirection, 0);
            drawDungeonCharacter(ctx, 0, 0, facingLeft, isDead);
            ctx.restore();
        }
        ctx.globalAlpha = 0.5;
    }
    
    // ===== ENDE NEUE EFFEKTE =====
    
    // Draw the dungeon character
    drawDungeonCharacter(ctx, 0, 0, facingLeft, isDead);
    
    ctx.restore();
}

function drawDungeonCharacter(ctx, x, y, facingLeft = false, isDead = false) {
    ctx.save();
    
    if (facingLeft) {
        ctx.scale(-1, 1);
        x = -x - 40; // player.width
    }
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(x + 8, y + 60, 28, 4);
    
    // Armor - Main body
    ctx.fillStyle = '#5F9F5F';
    ctx.fillRect(x + 8, y + 6, 22, 18);
    
    // Armor highlights
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(x + 10, y + 6, 20, 18);
    ctx.fillRect(x + 6, y + 6, 24, 4);
    ctx.fillStyle = '#7FDF7F';
    ctx.fillRect(x + 6, y + 6, 24, 2);
    
    // Helmet
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 4, y, 30, 8);
    ctx.fillRect(x + 33, y + 2, 3, 4);
    ctx.fillRect(x + 2, y + 1, 3, 5);
    ctx.fillRect(x + 24, y - 1, 2, 3);
    ctx.fillRect(x + 10, y - 1, 2, 3);
    
    // Helmet detail
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x + 10, y + 8, 16, 1);
    ctx.fillStyle = '#1A6B1A';
    ctx.fillRect(x + 10, y + 9, 16, 1);
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 5; i++) {
        ctx.fillRect(x + 11 + i * 3, y + 7, 1, 1);
        ctx.fillRect(x + 11 + i * 3, y + 10, 1, 1);
        ctx.fillRect(x + 12 + i * 3, y + 8, 1, 2);
    }
    
    // Electric gauntlets
    const boltGlow = 0.7 + Math.sin(Date.now() * 0.008) * 0.3;
    
    ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.fillRect(x + 1, y + 15, 8, 5);
    ctx.fillRect(x + 31, y + 15, 10, 5);
    
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(x + 4, y + 16, 5, 3);
    ctx.fillRect(x + 33, y + 16, 6, 3);
    
    ctx.fillStyle = '#808080';
    ctx.fillRect(x + 5, y + 16, 3, 3);
    ctx.fillRect(x + 34, y + 16, 4, 3);
    
    // Electric sparks on gauntlets
    if (window.gameState.bullets > 0 || Math.random() > 0.7 || window.gameState.isBerserker) {
        ctx.fillStyle = `rgba(0, 255, 255, ${boltGlow})`;
        ctx.fillRect(x + 3, y + 15, 1, 1);
        ctx.fillRect(x + 2, y + 18, 1, 1);
        ctx.fillRect(x + 6, y + 14, 1, 1);
        ctx.fillRect(x + 38, y + 15, 1, 1);
        ctx.fillRect(x + 39, y + 17, 1, 1);
        ctx.fillRect(x + 37, y + 14, 1, 1);
    }
    
    // Eyes
    if (isDead) {
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(x + 15, y + 11, 3, 3);
        ctx.fillRect(x + 24, y + 11, 3, 3);
        ctx.fillStyle = '#000000';
        // X pattern for dead eyes
        ctx.fillRect(x + 15, y + 11, 1, 1);
        ctx.fillRect(x + 17, y + 13, 1, 1);
        ctx.fillRect(x + 17, y + 11, 1, 1);
        ctx.fillRect(x + 15, y + 13, 1, 1);
        ctx.fillRect(x + 24, y + 11, 1, 1);
        ctx.fillRect(x + 26, y + 13, 1, 1);
        ctx.fillRect(x + 26, y + 11, 1, 1);
        ctx.fillRect(x + 24, y + 13, 1, 1);
    } else {
        // Eye glow
        ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.fillRect(x + 14, y + 10, 5, 5);
        ctx.fillRect(x + 23, y + 10, 5, 5);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(x + 15, y + 11, 3, 3);
        ctx.fillRect(x + 24, y + 11, 3, 3);
        
        ctx.fillStyle = '#00FFFF';
        ctx.fillRect(x + 16, y + 11, 1, 1);
        ctx.fillRect(x + 25, y + 11, 1, 1);
    }
    
    // Mouth/breathing apparatus
    ctx.fillStyle = '#1A6B1A';
    ctx.fillRect(x + 18, y + 19, 7, 3);
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x + 18, y + 19, 6, 2);
    
    // Shoulder detail
    ctx.fillStyle = '#228B22';
    ctx.fillRect(x + 13, y + 14, 1, 6);
    ctx.fillRect(x + 28, y + 16, 1, 1);
    ctx.fillRect(x + 29, y + 17, 1, 1);
    ctx.fillRect(x + 30, y + 18, 1, 1);
    
    // Armor joints
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 12, y + 15, 1, 1);
    ctx.fillRect(x + 14, y + 15, 1, 1);
    ctx.fillRect(x + 12, y + 18, 1, 1);
    ctx.fillRect(x + 14, y + 18, 1, 1);
    
    // Chest piece
    ctx.fillStyle = '#5F9F5F';
    ctx.fillRect(x + 8, y + 24, 22, 24);
    
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(x + 10, y + 24, 20, 24);
    
    // Dark undersuit
    ctx.fillStyle = '#1A2A2A';
    ctx.fillRect(x + 10, y + 26, 22, 20);
    
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(x + 12, y + 26, 20, 20);
    
    // Glowing chest details
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(x + 11, y + 30, 4, 6);
    ctx.fillRect(x + 22, y + 35, 3, 4);
    ctx.fillRect(x + 17, y + 28, 2, 8);
    
       // Arms with green gloves - IMMER GLEICHE POSITIONEN! ❌
    ctx.fillStyle = '#5F9F5F';
    ctx.fillRect(x + 6, y + 28, 7, 16);   // Linker Arm
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(x + 4, y + 28, 6, 16);   // Linker Arm
    
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(x + 26, y + 28, 8, 16);  // Rechter Arm
    
    // Green gloves/hands - IMMER GLEICHE POSITIONEN! ❌
    ctx.fillStyle = '#5F9F5F';
    ctx.fillRect(x + 3, y + 42, 7, 6);    // Linke Hand
    ctx.fillRect(x + 26, y + 42, 7, 6);   // Rechte Hand
    
    // Handschuh-Details
    ctx.fillStyle = '#90EE90'; // Hellgrün
    ctx.fillRect(x + 4, y + 43, 5, 4); // Linke Hand Highlight
    ctx.fillRect(x + 27, y + 43, 5, 4); // Rechte Hand Highlight
    
    // Finger-Andeutungen
    ctx.fillStyle = '#5F9F5F';
    ctx.fillRect(x + 5, y + 47, 1, 1);
    ctx.fillRect(x + 7, y + 47, 1, 1);
    ctx.fillRect(x + 28, y + 47, 1, 1);
    ctx.fillRect(x + 30, y + 47, 1, 1);
    
    // Legs
    ctx.fillStyle = '#5F9F5F';
    ctx.fillRect(x + 12, y + 48, 6, 14);
    ctx.fillRect(x + 20, y + 48, 6, 14);
    
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(x + 14, y + 48, 6, 14);
    ctx.fillRect(x + 22, y + 48, 6, 14);
    
    // Orb weapon (if has bullets or berserker)
    if (window.gameState.bullets > 0 || window.gameState.isBerserker) {
        const energyPulse = 0.6 + Math.sin(Date.now() * 0.01) * 0.4;
        
        // Orb glow
        ctx.fillStyle = `rgba(0, 255, 255, ${energyPulse * 0.4})`;
        ctx.fillRect(x + 28, y + 26, 16, 16);
        
        // Orb core
        ctx.fillStyle = window.gameState.activeBuffs.chainLightning > 0 || window.gameState.isBerserker ? '#FF4500' : '#00FFFF';
        ctx.fillRect(x + 33, y + 31, 6, 6);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x + 35, y + 33, 2, 2);
        
        // Energy ring
        ctx.strokeStyle = `rgba(0, 255, 255, ${energyPulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x + 36, y + 34, 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Chain lightning effects
        if (window.gameState.activeBuffs.chainLightning > 0 || window.gameState.isBerserker) {
            ctx.fillStyle = `rgba(255, 215, 0, ${energyPulse})`;
            ctx.fillRect(x + 31, y + 29, 2, 2);
            ctx.fillRect(x + 39, y + 35, 2, 2);
            ctx.fillRect(x + 36, y + 27, 1, 1);
        }
        
        // Lightning bolt
        ctx.strokeStyle = `rgba(0, 255, 255, ${energyPulse * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(x + 36, y + 34);
        ctx.lineTo(x + 42, y + 32);
        ctx.lineTo(x + 40, y + 34);
        ctx.lineTo(x + 44, y + 36);
        ctx.stroke();
        
        // Floating spark
        const sparkX = x + 36 + Math.sin(Date.now() * 0.02) * 3;
        const sparkY = y + 34 + Math.cos(Date.now() * 0.015) * 3;
        ctx.fillStyle = `rgba(255, 255, 255, ${energyPulse})`;
        ctx.fillRect(sparkX, sparkY, 1, 1);
        
        // Berserker mode extra effects
        if (window.gameState.isBerserker) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${energyPulse * 0.8})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x + 36, y + 34);
            ctx.lineTo(x + 44 + Math.random() * 5, y + 34 + Math.random() * 5 - 2.5);
            ctx.stroke();
        }
    }
    
    ctx.restore();
}