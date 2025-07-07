// core/constants.js - Enhanced Constants for Roguelike System

export const GAME_CONSTANTS = {
    MAX_LEVEL_PROGRESS: 100,
    GRAVITY: 1.25,
    LIGHT_GRAVITY: 0.6,
    JUMP_STRENGTH: -10.5,
    DOUBLE_JUMP_STRENGTH: -6,
    BULLET_SPEED: 15,
    FPS: 60,
    PLAYER_MOVE_SPEED: 5,
    DAMAGE_RESISTANCE_TIME: 60,
    MAX_JUMP_HOLD_TIME: 90,
    ANIMATION_SPEED: 0.75,
    BULLET_SPEED_MULTIPLIER: 1,
    
    // New HP-based constants
    BASE_PLAYER_HEALTH: 100,
    HEALTH_PER_LEVEL: 25,
    BASE_PLAYER_DAMAGE: 20,
    DAMAGE_PER_LEVEL: 5,
    
    // Scaling multipliers
    ENEMY_HEALTH_MULTIPLIER: 1.5,  // Per level
    ENEMY_DAMAGE_MULTIPLIER: 1.3,  // Per level
    
    // Combat constants
    BASE_CRIT_CHANCE: 0.05,        // 5% base crit
    BASE_CRIT_DAMAGE: 2.0,         // 2x damage on crit
    BASE_ATTACK_SPEED: 1.0,        // 1x attack speed
    BASE_MOVE_SPEED: 1.0,          // 1x move speed
    BASE_PROJECTILE_SPEED: 1.0,    // 1x projectile speed
    
    // Regeneration rates (per second)
    BASE_HEALTH_REGEN: 0.0,        // No base health regen
    BASE_BULLET_REGEN: 0.0,        // No base bullet regen
    BASE_LIFESTEAL: 0.0,           // No base lifesteal
    
    // Drop bonuses
    BASE_DROP_BONUS: 0.0           // No base drop bonus
};

export const CAMERA_CONSTANTS = {
    DEAD_ZONE_RATIO: 0.44,
    FOLLOW_ZONE_RATIO: 0.56
};

export const GameState = {
    START: 'start',
    PLAYING: 'playing',
    PAUSED: 'paused',
    LEVEL_COMPLETE: 'levelComplete',
    GAME_OVER: 'gameOver'
};

export const DropType = {
    EXTRA_LIFE: 'extraLife',
    MEGA_BULLETS: 'megaBullets',
    SPEED_BOOST: 'speedBoost',
    JUMP_BOOST: 'jumpBoost',
    SHIELD: 'shield',
    SCORE_MULTIPLIER: 'scoreMultiplier',
    MAGNET_MODE: 'magnetMode',
    BERSERKER_MODE: 'berserkerMode',
    GHOST_WALK: 'ghostWalk',
    TIME_SLOW: 'timeSlow'
};

// Enhanced drop configuration for roguelike
export const DROP_CONFIG = {
    boss: {
        chance: 0.50,
        items: [
            { type: DropType.EXTRA_LIFE, chance: 0.20, duration: 0 },
            { type: DropType.MEGA_BULLETS, chance: 0.20, duration: 0 },
            { type: DropType.SPEED_BOOST, chance: 0.15, duration: 600 },
            { type: DropType.JUMP_BOOST, chance: 0.25, duration: 1800 },
            { type: DropType.SHIELD, chance: 0.20, duration: 0 }
        ]
    },
    common: {
        chance: 0.02, // Slightly increased for roguelike feel
        items: [
            { type: DropType.SHIELD, chance: 0.25, duration: 0 },
            { type: DropType.SCORE_MULTIPLIER, chance: 0.25, duration: 900 },
            { type: DropType.MAGNET_MODE, chance: 0.20, duration: 1200 },
            { type: DropType.BERSERKER_MODE, chance: 0.15, duration: 600 },
            { type: DropType.GHOST_WALK, chance: 0.10, duration: 300 },
            { type: DropType.TIME_SLOW, chance: 0.05, duration: 300 }
        ]
    }
};

// New weapon drops system
export const WEAPON_DROPS = {
    ricochetShots: {
        name: 'Ricochet Shots',
        icon: '🔄',
        color: '#00BFFF',
        duration: 1800, // 30 seconds
        rarity: 2, // Epic
        description: 'Bullets bounce between enemies'
    },
    explosiveRounds: {
        name: 'Explosive Rounds',
        icon: '💥',
        color: '#FF4500',
        duration: 1800, // 30 seconds
        rarity: 2, // Epic
        description: 'Bullets explode on impact'
    },
    piercingShots: {
        name: 'Piercing Shots',
        icon: '🎯',
        color: '#32CD32',
        duration: 1200, // 20 seconds
        rarity: 3, // Rare
        description: 'Bullets pass through enemies'
    },
    shotgunBlast: {
        name: 'Shotgun Blast',
        icon: '🔫',
        color: '#DC143C',
        duration: 900, // 15 seconds
        rarity: 3, // Rare
        description: 'Fire 5 bullets in a cone'
    },
    homingMissiles: {
        name: 'Homing Missiles',
        icon: '🚀',
        color: '#FF1493',
        duration: 600, // 10 seconds
        rarity: 1, // Legendary
        description: 'Bullets track nearest enemy'
    },
    laserBeam: {
        name: 'Laser Beam',
        icon: '⚡',
        color: '#00FFFF',
        duration: 300, // 5 seconds
        rarity: 1, // Legendary
        description: 'Continuous damage beam'
    },
    chainLightning2: {
        name: 'Chain Lightning+',
        icon: '⛈️',
        color: '#9370DB',
        duration: 1200, // 20 seconds
        rarity: 1, // Legendary
        description: 'Lightning chains to 7 enemies'
    },
    orbitalStrikes: {
        name: 'Orbital Strikes',
        icon: '🌟',
        color: '#FFD700',
        duration: 900, // 15 seconds
        rarity: 2, // Epic
        description: 'Delayed area bombardment'
    }
};

// Enhanced achievements for roguelike progression
export const ACHIEVEMENTS = {
    firstBlood: { 
        id: 'firstBlood', 
        name: 'First Blood', 
        desc: 'Defeat your first boss', 
        reward: '+25% drop rates', 
        unlocked: false 
    },
    untouchable: { 
        id: 'untouchable', 
        name: 'Untouchable', 
        desc: 'Complete a level without taking damage', 
        reward: '+15% permanent damage', 
        unlocked: false 
    },
    sharpshooter: { 
        id: 'sharpshooter', 
        name: 'Sharpshooter', 
        desc: '100 hits in a row', 
        reward: '+10% critical chance', 
        unlocked: false 
    },
    speedDemon: { 
        id: 'speedDemon', 
        name: 'Speed Demon', 
        desc: '10000 points in 30 seconds', 
        reward: '+20% permanent speed', 
        unlocked: false 
    },
    // New achievements for roguelike
    survivor: {
        id: 'survivor',
        name: 'Survivor',
        desc: 'Reach floor 10',
        reward: '+50 max health',
        unlocked: false
    },
    executioner: {
        id: 'executioner',
        name: 'Executioner',
        desc: 'Deal 1000 damage in one hit',
        reward: '+25% critical damage',
        unlocked: false
    },
    arsenal: {
        id: 'arsenal',
        name: 'Arsenal Master',
        desc: 'Have 3 weapon drops active simultaneously',
        reward: '+1 weapon slot',
        unlocked: false
    }
};

// Enhanced dungeon theme with new buffs
export const DUNGEON_THEME = {
    name: 'Dungeon\'s Escape',
    title: '⚡ Dungeon\'s Escape',
    labels: {
        score: 'Score',
        level: 'Floor',
        bullets: '🗲',
        lives: 'Health',
        highScore: 'High Score',
        enemies: 'Monsters',
        gameOver: '💀 Final Death! 💀',
        finalScore: 'Final Score'
    },
    buffs: [
        // Original 3 buffs
        { 
            id: 'chainLightning', 
            title: '⚡ Chain Lightning', 
            desc: 'Unleash 3 bolts at once that arc between enemies',
            statChanges: 'Multi-shot attacks'
        },
        { 
            id: 'undeadResilience', 
            title: '🧟 Undead Vigor', 
            desc: 'Gain health every 10 (15) enemy kills',
            statChanges: 'Faster health recovery'
        },
        { 
            id: 'shadowLeap', 
            title: '🌙 Shadow Leap', 
            desc: 'Unlock double jump with ethereal shadow form',
            statChanges: 'Enhanced mobility'
        },
        
        // New 6 stat-based buffs
        { 
            id: 'vampiricStrikes', 
            title: '🩸 Vampiric Strikes', 
            desc: 'Heal when dealing damage to enemies',
            statChanges: '+2% Lifesteal'
        },
        { 
            id: 'bulletStorm', 
            title: '🔫 Bullet Storm', 
            desc: 'Automatically regenerate ammunition over time',
            statChanges: '+0.5 Bullets/2sec'
        },
        { 
            id: 'berserkerRage', 
            title: '🔥 Berserker Rage', 
            desc: 'Increased damage and attack speed in combat',
            statChanges: '+25% Damage, +15% Attack Speed'
        },
        { 
            id: 'survivalInstinct', 
            title: '💚 Survival Instinct', 
            desc: 'Slowly regenerate health during combat',
            statChanges: '+0.33 Health/3sec'
        },
        { 
            id: 'criticalFocus', 
            title: '💥 Critical Focus', 
            desc: 'Increased chance for devastating critical hits',
            statChanges: '+20% Crit Chance, +1x Crit Damage'
        },
        { 
            id: 'swiftDeath', 
            title: '🏃 Swift Death', 
            desc: 'Enhanced movement and projectile velocity',
            statChanges: '+20% Move Speed, +20% Projectile Speed'
        }
    ],
    enemies: ['bat', 'vampire', 'spider', 'alphaWolf', 'skeleton', 'boltBox', 'rock', 'wolf', 'teslaCoil', 'frankensteinTable'],
    groundColor: '#2F2F2F',
    floorDetailColor: '#1A1A1A',
    startButton: 'Begin Nightmare'
};

export const HIGHSCORE_API = {
    URL: 'https://getpantry.cloud/apiv1/pantry/ee242f67-6e52-4018-a364-df8225b9e51b/basket/highscores'
};

export const MIN_SPAWN_DISTANCE = 60;
export const SPAWN_INTERVAL_DISTANCE = 1;

// Canvas dimensions (will be set by main.js)
export const CANVAS = {
    width: 888,
    height: 488,
    groundY: 340
};

// Enemy spawn chances by level - Enhanced for roguelike scaling
export const SPAWN_CHANCES = {
    getBossChance: (level) => {
        const baseChance = 0.02;
        const maxChance = 0.20; // Increased max for more boss encounters
        const scaleFactor = 0.015; // Slightly faster scaling
        return Math.min(baseChance + (level - 1) * scaleFactor, maxChance);
    },
    
    getSpecialHazardChance: (level) => {
        const baseChance = 0.15;  // Reduced from 20% to make room for more enemies
        const maxChance = 0.25;
        const scaleFactor = 0.008;
        return Math.min(baseChance + (level - 1) * scaleFactor, maxChance);
    },
    
    getTeslaRatio: () => 0.6,
    getFrankensteinRatio: () => 0.4,
    
    getFlyingChance: (level, bossChance) => {
        return bossChance + Math.min(0.45, 0.25 + (level * 0.02)); // Increased flying enemy chance
    },
    getMediumChance: (level, flyingChance) => {
        return flyingChance + Math.min(0.25, 0.15 + (level * 0.015)); // More medium enemies
    },
    getHumanChance: (level, mediumChance) => {
        return mediumChance + Math.min(0.15, 0.08 + (level * 0.007)); // More humanoid enemies
    },
    getStaticChance: (humanChance) => {
        return humanChance + 0.25; // Reduced static obstacles for more dynamic combat
    }
};

// Enhanced enemy configurations with HP/damage scaling
export const ENEMY_CONFIG = {
    skeleton: {
        width: 70,
        height: 140,
        baseHealth: 150,  // Base HP for level 1
        baseDamage: 15,   // Base damage for level 1
        points: 30,       // Increased points for tougher enemies
        timerBase: 80,
        timerMin: 20
    },
    bat: {
        width: 60,
        height: 34,
        baseHealth: 50,
        baseDamage: 10,
        points: 40,
        timerBase: 100,
        timerMin: 20
    },
    vampire: {
        width: 40,
        height: 42,
        baseHealth: 200,
        baseDamage: 20,
        points: 50,
        timerBase: 100,
        timerMin: 20
    },
    spider: {
        width: 52,
        height: 40,
        baseHealth: 100,
        baseDamage: 15,
        points: 60,
        timerBase: 120,
        timerMin: 30
    },
    wolf: {
        width: 48,
        height: 32,
        baseHealth: 300,
        baseDamage: 25,
        points: 70,
        timerBase: 120,
        timerMin: 30
    },
    alphaWolf: {
        width: 90,
        height: 80,
        baseHealth: 800,  // Boss-level HP
        baseDamage: 40,   // Boss-level damage
        points: 200,      // Boss-level points
        timerBase: 180,
        timerMin: 50
    },
    rock: {
        width: 30,
        height: 35,
        baseHealth: 1,    // Indestructible obstacle
        baseDamage: 30,   // Contact damage
        points: 10,
        timerBase: 60,
        timerMin: 15
    },
    boltBox: {
        width: 24,
        height: 16,
        baseHealth: 1,    // One-shot collectible
        baseDamage: 0,    // No damage
        points: 0,
        timerBase: 80,
        timerMin: 40
    },
    teslaCoil: {
        width: 32,
        height: 60,
        baseHealth: 1,    // Indestructible hazard
        baseDamage: 25,   // High electrical damage
        points: 0,
        timerBase: 140,
        timerMin: 30
    },
    frankensteinTable: {
        width: 48,
        height: 60,
        baseHealth: 1,    // Indestructible hazard
        baseDamage: 30,   // Very high lightning damage
        points: 0,
        timerBase: 160,
        timerMin: 40
    },
    sarcophagus: {
        width: 45,
        height: 20,
        baseHealth: 1,    // Indestructible obstacle
        baseDamage: 20,   // Contact damage
        points: 0,
        timerBase: 100,
        timerMin: 25
    }
};

// Enhanced drop visual configurations
export const DROP_INFO = {
    [DropType.EXTRA_LIFE]: { icon: '💖', color: '#FF69B4', name: 'Health Boost' }, // Changed from heart to indicate HP heal
    [DropType.MEGA_BULLETS]: { icon: '📦', color: '#FFD700', name: 'Mega Bolts' },
    [DropType.SPEED_BOOST]: { icon: '⚡', color: '#00FFFF', name: 'Speed Boost' },
    [DropType.JUMP_BOOST]: { icon: '🚀', color: '#FF4500', name: 'Jump Boost' },
    [DropType.SHIELD]: { icon: '🛡️', color: '#4169E1', name: 'Shield' },
    [DropType.SCORE_MULTIPLIER]: { icon: '💰', color: '#FFD700', name: '2x Score' },
    [DropType.MAGNET_MODE]: { icon: '🌟', color: '#FF69B4', name: 'Magnet' },
    [DropType.BERSERKER_MODE]: { icon: '🔥', color: '#FF0000', name: 'Berserker' },
    [DropType.GHOST_WALK]: { icon: '👻', color: '#9370DB', name: 'Ghost Walk' },
    [DropType.TIME_SLOW]: { icon: '⏰', color: '#00CED1', name: 'Time Slow' }
};

// Weapon rarity colors for UI
export const WEAPON_RARITY_COLORS = {
    1: '#FF6B00', // Legendary - Orange
    2: '#A335EE', // Epic - Purple  
    3: '#0070DD', // Rare - Blue
    4: '#1EFF00', // Uncommon - Green
    5: '#9D9D9D'  // Common - Gray
};

// Combat formulas for easy balancing
export const COMBAT_FORMULAS = {
    // Player scaling
    getPlayerHealth: (level) => GAME_CONSTANTS.BASE_PLAYER_HEALTH + (level - 1) * GAME_CONSTANTS.HEALTH_PER_LEVEL,
    getPlayerDamage: (level) => GAME_CONSTANTS.BASE_PLAYER_DAMAGE + (level - 1) * GAME_CONSTANTS.DAMAGE_PER_LEVEL,
    
    // Enemy scaling  
    getEnemyHealth: (baseHealth, level) => Math.floor(baseHealth * Math.pow(GAME_CONSTANTS.ENEMY_HEALTH_MULTIPLIER, level - 1)),
    getEnemyDamage: (baseDamage, level) => Math.floor(baseDamage * Math.pow(GAME_CONSTANTS.ENEMY_DAMAGE_MULTIPLIER, level - 1)),
    
    // Experience and progression
    getExpForLevel: (level) => level * 100, // Simple linear progression
    getPointsForLevel: (level) => level * 1000 // Score thresholds
};

// UI Constants for roguelike elements
export const UI_CONSTANTS = {
    DAMAGE_NUMBER_DURATION: 1000,     // ms
    CRITICAL_DAMAGE_DURATION: 1200,   // ms
    BUFF_NOTIFICATION_DURATION: 3000, // ms
    WEAPON_NOTIFICATION_DURATION: 4000, // ms
    
    // Color coding
    DAMAGE_COLOR: '#FF6B6B',
    CRITICAL_COLOR: '#FFD700',
    HEAL_COLOR: '#00FF88',
    MANA_COLOR: '#4169E1',
    
    // Animation timings
    COMBO_FADE_TIME: 500,
    BUFF_FADE_TIME: 300,
    WEAPON_FADE_TIME: 400
};

// Performance constants for optimization
export const PERFORMANCE_CONSTANTS = {
    MAX_DAMAGE_NUMBERS: 20,      // Limit simultaneous damage numbers
    MAX_PARTICLES: 100,          // Limit particle effects
    MAX_PROJECTILES: 50,         // Limit active projectiles
    CLEANUP_INTERVAL: 5000,      // ms between cleanup cycles
    
    // Culling distances
    ENTITY_CULL_DISTANCE: 1000,  // pixels off-screen before removal
    PARTICLE_CULL_DISTANCE: 500, // pixels off-screen before removal
    EFFECT_CULL_DISTANCE: 200    // pixels off-screen before removal
};

export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('de-DE');
}

export function formatScore(score) {
    return formatNumber(score);
}

export function formatHealthPercent(current, max) {
    return Math.round((current / max) * 100);
}

export function getHealthColor(current, max) {
    const percent = current / max;
    if (percent > 0.75) return '#00FF88';      // Green
    if (percent > 0.50) return '#FFD700';      // Yellow
    if (percent > 0.25) return '#FF8C00';      // Orange
    return '#FF4444';                          // Red
}

// Weapon conflict system - weapons that can't be active together
export const WEAPON_CONFLICTS = {
    shotgunBlast: ['piercingShots'],           // Shotgun vs piercing
    laserBeam: ['ricochetShots', 'homingMissiles'], // Laser vs projectile modifications
    chainLightning2: ['homingMissiles']        // Chain lightning vs homing
};

// Add weapon conflicts to weapon definitions
Object.keys(WEAPON_DROPS).forEach(weaponKey => {
    if (WEAPON_CONFLICTS[weaponKey]) {
        WEAPON_DROPS[weaponKey].conflicts = WEAPON_CONFLICTS[weaponKey];
    }
});

console.log(`
🎮 ENHANCED CONSTANTS LOADED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚔️  HP SYSTEM: 100 base + 25/level
💥  DAMAGE SYSTEM: 20 base + 5/level  
📈  ENEMY SCALING: 1.5x HP, 1.3x DMG per level
🎯  9 BUFF TYPES + 8 WEAPON TYPES
🏆  7 ACHIEVEMENTS with stat bonuses
📊  COMPREHENSIVE STAT SYSTEM

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);