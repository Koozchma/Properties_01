// js/prestige_upgrades.js
window.prestigeUpgradesList = [
    {
        id: 'startingGoldBoost',
        name: 'Head Start Fund',
        descriptionFunction: (level) => `Begin each Ascended run with an additional ${formatNumber(level * 250 + (level > 0 ? 50 : 0) , true)} Gold. Current Bonus: +${formatNumber( (prestigeUpgrades[this.id] || 0) * 250 + ((prestigeUpgrades[this.id] || 0) > 0 ? 50 : 0) , true)} Gold.`,
        maxLevel: 50, // e.g., max bonus of 12,550 gold
        costFormula: (level) => Math.floor(1 * Math.pow(1.6, level)) + 1, // Starts very cheap: 2, 3, 4, 6, 9 RS
        effectValueFunction: (level) => level * 250 + (level > 0 ? 50 : 0), // Base + per level
        type: 'starting_gold'
    },
    {
        id: 'cosmicBlessing',
        name: 'Cosmic Blessing',
        descriptionFunction: (level) => `All income permanently increased by ${ (level * 5).toFixed(1) }%. Current Bonus: +${ ( (prestigeUpgrades[this.id] || 0) * 5 ).toFixed(1) }%`,
        maxLevel: 100, // Max +500%
        costFormula: (level) => Math.floor(3 * Math.pow(1.4, level)) + 2, // 5, 7, 9, 13, 18 RS
        effectValueFunction: (level) => level * 0.05, // e.g., level 1 -> 0.05 (for +5%)
        type: 'income_multiplier_all'
    },
    {
        id: 'efficientRealms',
        name: 'Efficient Realms',
        descriptionFunction: (level) => `All property purchase and upgrade costs permanently reduced by ${ (level * 0.5).toFixed(1) }%. Current Bonus: -${ ( (prestigeUpgrades[this.id] || 0) * 0.5 ).toFixed(1) }%`,
        maxLevel: 40, // Max 20% reduction
        costFormula: (level) => Math.floor(5 * Math.pow(1.5, level)) + 3, // 8, 10, 13, 18, 25 RS
        effectValueFunction: (level) => level * 0.005, // e.g., level 1 -> 0.005 (for -0.5%)
        type: 'cost_reduction_all'
    },
    {
        id: 'shardHoarder',
        name: 'Shard Hoarder',
        descriptionFunction: (level) => `Gain ${level * 2}% more Realm Shards from each Ascension. Current Bonus: +${(prestigeUpgrades[this.id] || 0) * 2}%`,
        maxLevel: 25, // Max +50%
        costFormula: (level) => Math.floor(15 * Math.pow(1.8, level)), // 15, 27, 48 RS (more expensive)
        effectValueFunction: (level) => level * 0.02, // e.g., level 1 -> 0.02 (for +2%)
        type: 'shard_gain_multiplier'
    },
    {
        id: 'offlineTimeCapBoost',
        name: 'Temporal Pocket',
        descriptionFunction: (level) => `Increases maximum offline earning time by ${level * 30} minutes. Current Bonus: +${formatTime((prestigeUpgrades[this.id] || 0) * 30 * 60)}`,
        maxLevel: 20, // Max +10 hours to the base 2 hours
        costFormula: (level) => Math.floor(4 * Math.pow(1.6, level)) + 2, // 6, 8, 11, 16 RS
        effectValueFunction: (level) => level * 30 * 60, // Effect in seconds
        type: 'offline_cap_increase_seconds'
    },
    {
        id: 'offlineMultiplierBoost',
        name: 'Echoing Profits',
        descriptionFunction: (level) => `Increases offline earning effectiveness by ${level * 5}%. Current Bonus: +${(prestigeUpgrades[this.id] || 0) * 5}%`,
        maxLevel: 20, // Max +100% effectiveness
        costFormula: (level) => Math.floor(6 * Math.pow(1.65, level)) + 2, // 8, 11, 17, 26 RS
        effectValueFunction: (level) => level * 0.05,
        type: 'offline_multiplier_increase'
    }
];

// Helper function to be accessible by descriptionFunctions (will be defined in main.js too)
// These are duplicated here for context, main.js will have the definitive ones.
function formatNumber(num, floorOutputForDisplay) {
    // Basic formatter for description context, main.js has the full one
    if (typeof num !== 'number') return '...';
    if (num < 1000 && floorOutputForDisplay) return Math.floor(num).toString();
    if (num < 1000) return num.toFixed(num % 1 === 0 ? 0 : 1);
    if (num >= 1e15) return (num/1e15).toFixed(2) + "Q";
    if (num >= 1e12) return (num/1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num/1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num/1e6).toFixed(2) + "M";
    if (num >= 1e3) return (num/1e3).toFixed(2) + "K";
    return floorOutputForDisplay ? Math.floor(num).toString() : num.toFixed(1);
}
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    let result = "";
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    if (result === "") result = `${totalSeconds % 60}s`; // Only show seconds if no h/m
    return result.trim() || "0s";
}
// `prestigeUpgrades` variable will be the live state in main.js
// For the description function, we need to access this live state.
// This can be done by passing `prestigeUpgrades` from `main.js` to the rendering function
// or by making `prestigeUpgrades` a global variable in `main.js` (which it currently is).
