// Define the initial set of properties for the game
// Each property will have:
// - id: unique identifier
// - name: display name
// - baseCost: initial cost to purchase the first one
// - costMultiplier: how much the cost increases for each subsequent purchase (e.g., 1.15 = 15% increase)
// - baseIncome: income per second for the first level
// - upgradeCost: initial cost to upgrade
// - upgradeCostMultiplier: how much upgrade cost increases
// - upgradeIncomeMultiplier: how much income increases per upgrade (can be additive or multiplicative to base)
// - maxLevel: maximum upgrade level for this property (e.g., 10 or more)
// - description: a fun flavor text

const initialProperties = [
    {
        id: 'lemonadeStand',
        name: 'Lemonade Stand',
        description: 'A humble start, quenching thirst one cup at a time.',
        baseCost: 10,
        costMultiplier: 1.15,
        baseIncome: 1, // Income per second per unit at level 1
        upgradeCost: 25,
        upgradeCostMultiplier: 1.8,
        upgradeIncomeMultiplier: 1.5, // Multiplies current income of the unit
        maxLevel: 10,
        tier: 1
    },
    {
        id: 'cobblersShop',
        name: 'Cobbler\'s Shop',
        description: 'Crafting sturdy boots for adventurous souls.',
        baseCost: 120,
        costMultiplier: 1.20,
        baseIncome: 8,
        upgradeCost: 250,
        upgradeCostMultiplier: 1.9,
        upgradeIncomeMultiplier: 1.6,
        maxLevel: 10,
        tier: 1
    },
    {
        id: 'bakery',
        name: 'Bakery',
        description: 'The sweet smell of fresh bread attracts many customers.',
        baseCost: 1500,
        costMultiplier: 1.25,
        baseIncome: 50,
        upgradeCost: 3000,
        upgradeCostMultiplier: 2.0,
        upgradeIncomeMultiplier: 1.7,
        maxLevel: 15,
        tier: 1
    },
    {
        id: 'innAndTavern',
        name: 'Inn & Tavern',
        description: 'A cozy place for travelers to rest and share tales.',
        baseCost: 20000,
        costMultiplier: 1.30,
        baseIncome: 250,
        upgradeCost: 45000,
        upgradeCostMultiplier: 2.1,
        upgradeIncomeMultiplier: 1.8,
        maxLevel: 12,
        tier: 2 // Example of a higher tier property
    }
    // Add more properties here for later tiers
];

// This makes initialProperties available to other JS files
window.gameProperties = initialProperties;