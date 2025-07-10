// core/constants.js - Alle Spielkonstanten für Dungeon Runner


export const GAME_CONSTANTS = {
    // Existing constants
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
    
    // NEW: HP SYSTEM CONSTANTS
    PLAYER_BASE_HP: 100,
    PLAYER_HP_PER_LEVEL: 25,
    PLAYER_BASE_DAMAGE: 20,
    PLAYER_DAMAGE_PER_LEVEL: 10,
	
	    PLAYER_BASE_HEALTH_REGEN: 0.5,    // 1 HP every 2 seconds
    PLAYER_BASE_BULLET_REGEN: 0.5,    // 1 bullet every 2 seconds
	
	    PLAYER_BASE_MAX_BULLETS: 100,        // Start with 100 bullets max
    PLAYER_BULLETS_PER_LEVEL: 100,        // +25 bullets per level (matches HP scaling)
    
    // NEW: ENEMY SCALING MULTIPLIERS
    ENEMY_HP_MULTIPLIER_PER_LEVEL: 1.25,
    ENEMY_DAMAGE_MULTIPLIER_PER_LEVEL: 1.2
};

// NEW: ENEMY BASE STATS OBJECT (separate from GAME_CONSTANTS)
export const ENEMY_BASE_STATS = {
    bat: { hp: 20, damage: 10 },
    spider: { hp: 30, damage: 10 },
    vampire: { hp: 50, damage: 20 },
    skeleton: { hp: 100, damage: 20 },
    wolf: { hp: 80, damage: 20 },
    alphaWolf: { hp: 200, damage: 40 },
    rock: { hp: 1, damage: 0 },
    teslaCoil: { hp: 1, damage: 20 },
    frankensteinTable: { hp: 1, damage: 20 },
    sarcophagus: { hp: 1, damage: 0 },
    boltBox: { hp: 1, damage: 0 }
};


GAME_CONSTANTS.PLAYER_BASE_STAT_BONUSES = {
    damageBonus: 0,       // Percentage bonus to base damage
    attackSpeed: 0,       // Percentage increase to attack rate
    moveSpeed: 0,         // Percentage increase to movement speed
    projectileSpeed: 0,   // Percentage increase to bullet speed
    healthRegen: 0,       // HP regen per second
    bulletRegen: 0,       // Bullet regen per second
    lifeSteal: 0,         // Percentage of damage dealt returned as healing
    critChance: 0,        // Percentage chance to land a critical hit
    critDamage: 1.5       // Multiplier for critical hit damage (starts at 50% bonus)
};


// NEW: Helper functions for bullet capacity
export function calculatePlayerMaxBullets(level) {
    return GAME_CONSTANTS.PLAYER_BASE_MAX_BULLETS + (level - 1) * GAME_CONSTANTS.PLAYER_BULLETS_PER_LEVEL;
}

// Update existing HP calculation functions (keep these)
export function calculatePlayerMaxHP(level) {
    return GAME_CONSTANTS.PLAYER_BASE_HP + (level - 1) * GAME_CONSTANTS.PLAYER_HP_PER_LEVEL;
}

export function calculatePlayerDamage(level) {
    return GAME_CONSTANTS.PLAYER_BASE_DAMAGE + (level - 1) * GAME_CONSTANTS.PLAYER_DAMAGE_PER_LEVEL;
}

export function calculateEnemyHP(enemyType, level) {
    const baseStats = ENEMY_BASE_STATS[enemyType];
    if (!baseStats) return 100; // Fallback
    
    const multiplier = Math.pow(GAME_CONSTANTS.ENEMY_HP_MULTIPLIER_PER_LEVEL, level - 1);
    return Math.floor(baseStats.hp * multiplier);
}

export function calculateEnemyDamage(enemyType, level) {
    const baseStats = ENEMY_BASE_STATS[enemyType];
    if (!baseStats) return 20; // Fallback
    
    const multiplier = Math.pow(GAME_CONSTANTS.ENEMY_DAMAGE_MULTIPLIER_PER_LEVEL, level - 1);
    return Math.floor(baseStats.damage * multiplier);
}

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
    TIME_SLOW: 'timeSlow',
    // NEW: Health-related buffs
    HEALING_BOOST: 'healingBoost',
    REGENERATION: 'regeneration'
};



export const DROP_CONFIG = {
    boss: {
        chance: 0.50,
        items: [
            { type: DropType.EXTRA_LIFE, chance: 0.25, duration: 0 },
            { type: DropType.MEGA_BULLETS, chance: 0.25, duration: 0 },
            { type: DropType.SPEED_BOOST, chance: 0.20, duration: 600 },
            { type: DropType.JUMP_BOOST, chance: 0.30, duration: 1800 }
        ]
    },
    common: {
        chance: 0.01,
        items: [
            { type: DropType.SHIELD, chance: 0.20, duration: 0 },
            { type: DropType.SCORE_MULTIPLIER, chance: 0.30, duration: 900 },
            { type: DropType.MAGNET_MODE, chance: 0.20, duration: 1200 },
            { type: DropType.BERSERKER_MODE, chance: 0.15, duration: 600 },
            { type: DropType.GHOST_WALK, chance: 0.10, duration: 300 },
            { type: DropType.TIME_SLOW, chance: 0.05, duration: 300 }
        ]
    }
};


export const STAT_BUFFS = [
    // Original buffs
    { 
        id: 'undeadResilience', 
        title: '🧟 Undead Vigor', 
        desc: 'Gain extra life every 10 bullet hits (was 15)' 
    },
    { 
        id: 'shadowLeap', 
        title: '🌙 Shadow Leap', 
        desc: 'Unlock double jump with ethereal shadow form' 
    },
    
    // New stat-based buffs
    {
        id: 'vampiricStrikes',
        title: '🩸 Vampiric Strikes',
        desc: 'Gain 2% life steal, healing on enemy kills'
    },
    {
        id: 'bulletStorm',
        title: '🔥 Bullet Storm',
        desc: 'Regenerate 1 bullet every 2 seconds'
    },
    {
        id: 'berserkerRage',
        title: '💢 Berserker Rage',
        desc: 'Gain +25% damage and +15% attack speed'
    },
    {
        id: 'survivalInstinct',
        title: '💚 Survival Instinct',
        desc: 'Regenerate 1 HP every 3 seconds'
    },
    {
        id: 'criticalFocus',
        title: '🎯 Critical Focus',
        desc: '20% chance for critical hits (2x damage)'
    },
    {
        id: 'swiftDeath',
        title: '⚡ Swift Death',
        desc: '+20% movement and projectile speed'
    }
];


export const ACHIEVEMENTS = {
    firstBlood: { 
        id: 'firstBlood', 
        name: 'First Blood', 
        desc: 'Defeat your first boss', 
        reward: 'Higher drop rates', 
        unlocked: false 
    },
    untouchable: { 
        id: 'untouchable', 
        name: 'Untouchable', 
        desc: 'Complete a level without damage', 
        reward: 'Start with shield', 
        unlocked: false 
    },
    sharpshooter: { 
        id: 'sharpshooter', 
        name: 'Sharpshooter', 
        desc: '50 hits in a row', 
        reward: 'Piercing bullets', 
        unlocked: false 
    },
    speedDemon: { 
        id: 'speedDemon', 
        name: 'Speed Demon', 
        desc: '1000 points in 30 seconds', 
        reward: '+10% permanent speed', 
        unlocked: false 
    }
};

export const DUNGEON_THEME = {
    name: 'Dungeon\'s Escape',
    title: '⚡ Dungeon\'s Escape',
    labels: {
        score: 'Score',
        level: 'Level',
        bullets: '🗲',
        lives: 'Lives',
        highScore: 'High Score',
        enemies: 'Monsters',
        gameOver: '💀 Final Death! 💀',
        finalScore: 'Final Score'
    },
   
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
    width: 960,
    height: 540,
    groundY: 380
};

// Enemy spawn chances by level - MIT SPECIAL HAZARD SYSTEM
export const SPAWN_CHANCES = {
    getBossChance: (level) => {
        const baseChance = 0.02;
        const maxChance = 0.15;
        const scaleFactor = 0.01;
        return Math.min(baseChance + (level - 1) * scaleFactor, maxChance);
    },
    
    // NEU: Special Hazards (Tesla & Frankenstein) - bleiben konstant oder steigen
    getSpecialHazardChance: (level) => {
        const baseChance = 0.20;  // 20% Basis-Chance
        const maxChance = 0.30;    // 30% Maximum in späteren Levels
        const scaleFactor = 0.008; // Langsamer Anstieg
        return Math.min(baseChance + (level - 1) * scaleFactor, maxChance);
    },
    
    // Innerhalb der Special Hazards: Wie viel % ist Tesla vs Frankenstein
    getTeslaRatio: () => 0.6,      // 60% der Special Hazards sind Tesla
    getFrankensteinRatio: () => 0.4, // 40% sind Frankenstein
    
    getFlyingChance: (level, bossChance) => {
        return bossChance + Math.min(0.45, 0.20 + (level * 0.015));
    },
    getMediumChance: (level, flyingChance) => {
        return flyingChance + Math.min(0.20, 0.10 + (level * 0.01));
    },
    getHumanChance: (level, mediumChance) => {
        return mediumChance + Math.min(0.10, 0.05 + (level * 0.005));
    },
    getStaticChance: (humanChance) => {
        return humanChance + 0.30;
    }
};

// Enemy configurations
export const ENEMY_CONFIG = {
    skeleton: {
        width: 70,
        height: 140,
        health: 3,
        points: 20,
        timerBase: 80,
        timerMin: 20
    },
    bat: {
        width: 60,
        height: 34,
        health: 1,
        points: 40,
        timerBase: 100,
        timerMin: 20
    },
    vampire: {
        width: 40,
        height: 42,
        health: 4,
        points: 25,
        timerBase: 100,
        timerMin: 20
    },
    spider: {
        width: 52,
        height: 40,
        health: 2,
        points: 50,
        timerBase: 120,
        timerMin: 30
    },
    wolf: {
        width: 48,
        height: 32,
        health: 4,
        points: 35,
        timerBase: 120,
        timerMin: 30
    },
    alphaWolf: {
        width: 90,
        height: 80,
        health: 8,
        points: 100,
        timerBase: 180,
        timerMin: 50
    },
    rock: {
        width: 30,
        height: 35,
        health: 1,
        points: 10,
        timerBase: 60,
        timerMin: 15
    },
    boltBox: {
        width: 24,
        height: 16,
        health: 1,
        points: 0,
        timerBase: 80,
        timerMin: 40
    },
    teslaCoil: {
        width: 32,
        height: 60,
        health: 1,
        points: 0,  // Keine Punkte da es ein Hindernis ist
        timerBase: 140,  // Halb so häufig wie rock (70 * 2)
        timerMin: 30
    },
    frankensteinTable: {
        width: 48,
        height: 60,
        health: 1,
        points: 0,  // Keine Punkte da es ein Hindernis ist
        timerBase: 160,  // Seltener als Tesla Coil
        timerMin: 40
    },
    sarcophagus: {
    width: 45,
    height: 20,
    health: 1,
    points: 0,
    timerBase: 100,
    timerMin: 25
}
};

// Drop visual configurations
export const DROP_INFO = {
    [DropType.EXTRA_LIFE]: { icon: '❤️', color: '#FF0000', name: 'Smart Heal' },
    [DropType.MEGA_BULLETS]: { icon: '📦', color: '#FFD700', name: 'Mega Bolts' },
    [DropType.SPEED_BOOST]: { icon: '⚡', color: '#00FFFF', name: 'Speed Boost' },
    [DropType.JUMP_BOOST]: { icon: '🚀', color: '#FF4500', name: 'Jump Boost' },
    [DropType.SHIELD]: { icon: '🛡️', color: '#4169E1', name: 'Shield' },
    [DropType.SCORE_MULTIPLIER]: { icon: '💰', color: '#FFD700', name: '2x Score' },
    [DropType.MAGNET_MODE]: { icon: '🌟', color: '#FF69B4', name: 'Magnet' },
    [DropType.BERSERKER_MODE]: { icon: '🔥', color: '#FF0000', name: 'Berserker' },
    [DropType.GHOST_WALK]: { icon: '👻', color: '#9370DB', name: 'Ghost Walk' },
    [DropType.TIME_SLOW]: { icon: '⏰', color: '#00CED1', name: 'Time Slow' },
    // NEW: Health-related buffs
    [DropType.HEALING_BOOST]: { icon: '💚', color: '#00ff88', name: 'Healing Boost' },
    [DropType.REGENERATION]: { icon: '💖', color: '#ff69b4', name: 'Regeneration' }
};

export function formatNumber(num) {
    return num.toLocaleString('de-DE');
}

export function formatScore(score) {
    return formatNumber(score);
}