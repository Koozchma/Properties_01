window.achievementsList = [
    {
        id: 'gold_1k',
        name: 'Pocket Money',
        description: 'Accumulate 1,000 Gold.',
        icon: '💰',
        unlocked: false,
        condition: (gs) => gs.gold >= 1000,
        onUnlock: (gs) => { console.log("Pocket Money Unlocked!"); }
    },
    {
        id: 'gold_1m',
        name: 'Millionaire!',
        description: 'Accumulate 1,000,000 Gold.',
        icon: '🏆',
        unlocked: false,
        condition: (gs) => gs.gold >= 1000000,
    },
    {
        id: 'ips_100',
        name: 'Income Stream',
        description: 'Reach an Income Per Second of 100.',
        icon: '💸',
        unlocked: false,
        condition: (gs) => gs.totalIPS >= 100,
    },
    {
        id: 'buy_first_tier2',
        name: 'Moving Up!',
        description: 'Purchase your first Tier 2 property.',
        icon: '🚀',
        unlocked: false,
        condition: (gs) => {
            return Object.keys(gs.ownedProperties).some(propId => {
                const propData = window.gameProperties.find(p => p.id === propId);
                return propData && propData.tier === 2 && gs.ownedProperties[propId].quantity > 0;
            });
        }
    },
    {
        id: 'max_lemonade',
        name: 'Lemonade Legend',
        description: 'Upgrade Lemonade Stand to its Max Level.',
        icon: '🍋',
        unlocked: false,
        condition: (gs) => {
            const lemonade = gs.ownedProperties['lemonadeStand'];
            const lemonadeData = window.gameProperties.find(p => p.id === 'lemonadeStand');
            return lemonade && lemonadeData && lemonade.level >= lemonadeData.maxLevel;
        }
    }
];

// Initialize unlocked status for achievements in main game state
// This will be handled by save/load. For first run, all are false.
// For safety, ensure achievement objects in main game are copies or just store unlock state.
// The `loadGame` function in main.js already handles loading unlocked status.
