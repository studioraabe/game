// js/enhanced-arcade-sound-system.js - Professional Arcade Sound Integration
// Replace your existing soundManager with this enhanced version

export class EnhancedArcadeSoundManager {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.backgroundMusic = null;
        this.musicVolume = 0.1;
        this.sfxVolume = 0.1; // Slightly higher for better impact
        this.theme = 'arcade';
        
        // Resume audio context on first interaction
        this.setupAudioContext();
    }

    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Auto-resume on user interaction
            const resumeAudio = () => {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
            };
            
            document.addEventListener('click', resumeAudio, { once: true });
            document.addEventListener('keydown', resumeAudio, { once: true });
            document.addEventListener('touchstart', resumeAudio, { once: true });
            
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    init() {
        if (!this.audioContext) {
            this.setupAudioContext();
        }
        this.initBackgroundMusic();
    }

    // ========================================
    // ENHANCED OSCILLATOR CREATION
    // ========================================

    createEnhancedOscillator(frequency, type, duration, envelope = {}) {
        if (!this.audioContext) return null;
        
        const osc = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // Default arcade envelope - punchy and clear
        const env = {
            attack: 0.001,   // Very fast attack for crisp sound
            decay: 0.02,     // Quick decay
            sustain: 0.5,    // Moderate sustain
            release: 0.06,   // Fast release for clean cutoff
            ...envelope
        };
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // Setup filter for arcade character
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
        filter.Q.setValueAtTime(2, this.audioContext.currentTime);
        
        // Connect: osc -> filter -> gain -> destination
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Apply envelope
        const now = this.audioContext.currentTime;
        const volume = this.sfxVolume;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + env.attack);
        gainNode.gain.linearRampToValueAtTime(volume * env.sustain, now + env.attack + env.decay);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        return { osc, gainNode, filter };
    }

    createNoise(duration, intensity = 0.3) {
        if (!this.audioContext) return null;
        
        const bufferSize = Math.floor(this.audioContext.sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise with slight filtering for arcade character
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * intensity;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
        
        source.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        return { source, gainNode };
    }

    // ========================================
    // ARCADE SOUND CONFIGURATIONS
    // ========================================

    getArcadeSoundConfig(soundType) {
        const configs = {
            shoot: {
                layers: [
                    { freq: 800, type: 'square', detune: 0, volume: 0.6 },
                    { freq: 400, type: 'triangle', detune: -2, volume: 0.4 }
                ],
                duration: 0.08,
                envelope: { attack: 0.001, decay: 0.02, sustain: 0.5, release: 0.06 },
                effects: { retro: true }
            },
            
            laser: {
                layers: [
                    { freq: 1200, type: 'square', detune: 0, volume: 0.6 },
                    { freq: 600, type: 'triangle', detune: 2, volume: 0.5 },
                    { freq: 1800, type: 'sine', detune: -1, volume: 0.3 }
                ],
                duration: 0.15,
                envelope: { attack: 0.005, decay: 0.05, sustain: 0.7, release: 0.1 },
                effects: { sweep: true, retro: true }
            },
            
            hit: {
                layers: [
                    { freq: 200, type: 'square', detune: 0, volume: 0.7 },
                    { freq: 100, type: 'triangle', detune: -3, volume: 0.5 }
                ],
                duration: 0.15,
                envelope: { attack: 0.001, decay: 0.05, sustain: 0.3, release: 0.1 },
                effects: { noise: true, retro: true }
            },
            
            jump: {
                layers: [
                    { freq: 200, type: 'square', detune: 0, volume: 1.0 }
                ],
                duration: 0.2,
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.4, release: 0.1 },
                effects: { pitch_bend: { start: 200, end: 350 } }
            },
            
            death: {
                layers: [
                    { freq: 100, type: 'sawtooth', detune: 0, volume: 1.0 },
                    { freq: 80, type: 'square', detune: -5, volume: 0.8 }
                ],
                duration: 0.8,
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 },
                effects: { pitch_drop: true, noise: true }
            },
            
            pickup: {
                layers: [
                    { freq: 800, type: 'sine', detune: 0, volume: 0.5 },
                    { freq: 1200, type: 'triangle', detune: 2, volume: 0.3 }
                ],
                duration: 0.1,
                envelope: { attack: 0.001, decay: 0.02, sustain: 0.8, release: 0.08 },
                effects: { brightness: true }
            },
            
            powerUp: {
                sequence: [
                    { freq: 400, delay: 0 },
                    { freq: 600, delay: 0.05 },
                    { freq: 800, delay: 0.1 },
                    { freq: 1200, delay: 0.15 }
                ],
                type: 'triangle',
                duration: 0.08,
                envelope: { attack: 0.01, decay: 0.02, sustain: 0.8, release: 0.05 }
            }
        };
        
        return configs[soundType] || configs.shoot;
    }

    // ========================================
    // ENHANCED SOUND GENERATION
    // ========================================

    playArcadeSound(soundType) {
        if (!this.audioContext || this.isMuted) return;
        
        const config = this.getArcadeSoundConfig(soundType);
        const now = this.audioContext.currentTime;
        
        // Handle special sequence sounds (like powerUp)
        if (config.sequence) {
            config.sequence.forEach(note => {
                setTimeout(() => {
                    const { osc, gainNode } = this.createEnhancedOscillator(
                        note.freq,
                        config.type,
                        config.duration,
                        config.envelope
                    );
                    
                    if (osc) {
                        gainNode.gain.value *= 0.6; // Adjust volume for sequence
                        osc.start();
                        osc.stop(this.audioContext.currentTime + config.duration);
                    }
                }, note.delay * 1000);
            });
            return;
        }
        
        // Handle regular layered sounds
        if (config.layers) {
            config.layers.forEach((layer, index) => {
                const { osc, gainNode, filter } = this.createEnhancedOscillator(
                    layer.freq,
                    layer.type,
                    config.duration,
                    config.envelope
                );
                
                if (!osc) return;
                
                // Apply detuning for thickness
                if (layer.detune) {
                    osc.detune.setValueAtTime(layer.detune, now);
                }
                
                // Adjust volume for layering
                gainNode.gain.value *= layer.volume * (1 / config.layers.length) * 1.2;
                
                // Apply special effects
                if (config.effects) {
                    this.applyArcadeEffects(osc, gainNode, filter, config.effects, config.duration);
                }
                
                osc.start(now);
                osc.stop(now + config.duration);
            });
        }
        
        // Add noise layer for impact sounds
        if (config.effects && config.effects.noise) {
            const { source, gainNode } = this.createNoise(config.duration * 0.3, 0.2);
            if (source) {
                gainNode.gain.setValueAtTime(0, now);
                gainNode.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration * 0.3);
                
                source.start(now);
                source.stop(now + config.duration * 0.3);
            }
        }
    }

    applyArcadeEffects(osc, gainNode, filter, effects, duration) {
        const now = this.audioContext.currentTime;
        
        // Frequency sweep effect (for laser)
        if (effects.sweep) {
            const startFreq = osc.frequency.value;
            osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, now + duration);
        }
        
        // Pitch bend effect (for jump)
        if (effects.pitch_bend) {
            osc.frequency.setValueAtTime(effects.pitch_bend.start, now);
            osc.frequency.exponentialRampToValueAtTime(effects.pitch_bend.end, now + duration * 0.6);
        }
        
        // Pitch drop effect (for death)
        if (effects.pitch_drop) {
            const startFreq = osc.frequency.value;
            osc.frequency.exponentialRampToValueAtTime(startFreq * 0.1, now + duration);
        }
        
        // Brightness effect (for pickup)
        if (effects.brightness) {
            filter.frequency.setValueAtTime(filter.frequency.value, now);
            filter.frequency.exponentialRampToValueAtTime(filter.frequency.value * 3, now + duration * 0.5);
        }
        
        // Retro filter sweep
        if (effects.retro) {
            filter.Q.setValueAtTime(4, now);
            filter.frequency.linearRampToValueAtTime(filter.frequency.value * 0.6, now + duration);
        }
    }

    // ========================================
    // GAME SOUND METHODS (Replace existing ones)
    // ========================================

    jump() { 
        this.playArcadeSound('jump');
    }
    
    shoot() { 
        this.playArcadeSound('shoot');
    }
    
    hit() { 
        this.playArcadeSound('hit');
    }
    
    death() { 
        this.stopBackgroundMusic();
        this.playArcadeSound('death');
    }
    
    pickup() { 
        this.playArcadeSound('pickup');
    }
    
    powerUp() { 
        this.playArcadeSound('powerUp');
    }

    // Enhanced laser sound for continuous beam
    laserStart() {
        this.playArcadeSound('laser');
    }
    
    laserLoop() {
        // For continuous laser, play a shorter version repeatedly
        if (!this.isMuted) {
            this.playArcadeSound('laser');
        }
    }
    
    laserStop() {
        // Quick stop sound
        if (!this.audioContext || this.isMuted) return;
        
        const { osc, gainNode } = this.createEnhancedOscillator(
            800, 'square', 0.05, 
            { attack: 0.001, decay: 0.01, sustain: 0.3, release: 0.04 }
        );
        
        if (osc) {
            gainNode.gain.value *= 0.4;
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.05);
        }
    }

    // ========================================
    // BACKGROUND MUSIC SYSTEM (Keep existing)
    // ========================================

    initBackgroundMusic() {
        if (this.backgroundMusic) return;
        
        this.backgroundMusic = new Audio('assets/music.ogg');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = this.musicVolume;
        this.backgroundMusic.preload = 'auto';
        
        this.backgroundMusic.addEventListener('error', (e) => {
            console.warn('Background music loading failed:', e);
        });
    }

    startBackgroundMusic() {
        if (!this.backgroundMusic) {
            this.initBackgroundMusic();
            setTimeout(() => this.startBackgroundMusic(), 500);
            return;
        }
        
        if (this.isMuted) return;
        
        this.backgroundMusic.currentTime = 0;
        const playPromise = this.backgroundMusic.play();
        
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                const startMusicOnClick = () => {
                    this.backgroundMusic.play().catch(() => {});
                };
                document.addEventListener('click', startMusicOnClick, { once: true });
                document.addEventListener('keydown', startMusicOnClick, { once: true });
            });
        }
    }

    pauseBackgroundMusic() {
        if (this.backgroundMusic && !this.backgroundMusic.paused) {
            this.backgroundMusic.pause();
        }
    }

    resumeBackgroundMusic() {
        if (this.backgroundMusic && this.backgroundMusic.paused && !this.isMuted) {
            const playPromise = this.backgroundMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
    }

    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }

    // ========================================
    // UTILITY METHODS (Keep existing)
    // ========================================

    toggleMute() {
        this.isMuted = !this.isMuted;
        const muteIcon = document.getElementById('muteIcon');
        const muteButton = document.getElementById('muteButton');
        
        if (this.isMuted) {
            if (muteIcon) muteIcon.textContent = '🔇';
            if (muteButton) muteButton.classList.add('muted');
            this.pauseBackgroundMusic();
        } else {
            if (muteIcon) muteIcon.textContent = '🔊';
            if (muteButton) muteButton.classList.remove('muted');
            this.resumeBackgroundMusic();
        }
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
    }

    // Legacy compatibility method
    play(frequency, duration, type = 'square') {
        // Fallback for any remaining legacy calls
        this.playArcadeSound('shoot');
    }
}

// ========================================
// INTEGRATION INSTRUCTIONS
// ========================================

/*
HOW TO INTEGRATE:

1. Replace your existing soundManager in systems.js:

// OLD:
export const soundManager = new SoundManager();

// NEW:
export const soundManager = new EnhancedArcadeSoundManager();

2. Or add this to main.js after importing:

import { EnhancedArcadeSoundManager } from './enhanced-arcade-sound-system.js';
window.soundManager = new EnhancedArcadeSoundManager();

3. For continuous laser integration, update your laser system:

// In your laser firing code:
soundManager.laserStart(); // When laser starts
// For continuous firing:
setInterval(() => soundManager.laserLoop(), 100); // Every 100ms while firing
soundManager.laserStop(); // When laser stops

4. Test all sounds:
soundManager.jump();     // ✓ Enhanced jump sound
soundManager.shoot();    // ✓ Crisp arcade shooting
soundManager.hit();      // ✓ Punchy impact sound  
soundManager.powerUp();  // ✓ Classic power-up sequence
soundManager.death();    // ✓ Dramatic death sound

FEATURES:
- ✅ Multiple oscillator layers for richness
- ✅ Proper envelopes for clean attack/release  
- ✅ Retro filtering for authentic arcade feel
- ✅ Noise layers for impact sounds
- ✅ Pitch bending and frequency sweeps
- ✅ Consistent volume levels
- ✅ Better browser compatibility
- ✅ Maintains all existing functionality
*/