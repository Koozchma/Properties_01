// Define the initial set of properties for the game
// Each property will have:
// - id: unique identifier
// - name: display name
// - description: a fun flavor text
// - baseCost: initial cost to purchase the first one
// - costMultiplier: how much the cost increases for each subsequent purchase (e.g., 1.15 = 15% increase)
// - baseIncome: income per second for the first level
// - upgradeCost: initial cost to upgrade
// - upgradeCostMultiplier: how much upgrade cost increases
// - upgradeIncomeMultiplier: how much income increases per upgrade (can be additive or multiplicative to base)
// - maxLevel: maximum upgrade level for this property (e.g., 10 or more)
// - tier: logical grouping for progression

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
    // --- Tier 2 Properties ---
    {
        id: 'innAndTavern',
        name: 'Inn & Tavern',
        description: 'A cozy place for travelers to rest and share tales.',
        baseCost: 20000,
        costMultiplier: 1.22, // Slightly adjusted multiplier for balance
        baseIncome: 250,
        upgradeCost: 45000,
        upgradeCostMultiplier: 2.1,
        upgradeIncomeMultiplier: 1.8,
        maxLevel: 12,
        tier: 2
    },
    {
        id: 'blacksmithForge',
        name: 'Blacksmith\'s Forge',
        description: 'Clanging hammers and roaring fires, forging tools and arms.',
        baseCost: 35000,
        costMultiplier: 1.23,
        baseIncome: 420,
        upgradeCost: 75000,
        upgradeCostMultiplier: 2.15,
        upgradeIncomeMultiplier: 1.85,
        maxLevel: 12,
        tier: 2
    },
    {
        id: 'scribesGuildhall',
        name: 'Scribe\'s Guildhall',
        description: 'Chronicling history and crafting magical scrolls.',
        baseCost: 60000,
        costMultiplier: 1.24,
        baseIncome: 700,
        upgradeCost: 130000,
        upgradeCostMultiplier: 2.2,
        upgradeIncomeMultiplier: 1.9,
        maxLevel: 12,
        tier: 2
    },
    {
        id: 'cityMarketSquare',
        name: 'City Market Square',
        description: 'A bustling hub of commerce, exotic goods from nearby lands.',
        baseCost: 100000, // 100K
        costMultiplier: 1.25,
        baseIncome: 1100, // 1.1K
        upgradeCost: 220000, // 220K
        upgradeCostMultiplier: 2.25,
        upgradeIncomeMultiplier: 1.95,
        maxLevel: 15,
        tier: 2
    },
    {
        id: 'stoneQuarry',
        name: 'Stone Quarry',
        description: 'Providing the essential building blocks for a growing kingdom.',
        baseCost: 180000, // 180K
        costMultiplier: 1.26,
        baseIncome: 1800, // 1.8K
        upgradeCost: 400000, // 400K
        upgradeCostMultiplier: 2.3,
        upgradeIncomeMultiplier: 2.0,
        maxLevel: 15,
        tier: 2
    },
    {
        id: 'lumberMill',
        name: 'Lumber Mill',
        description: 'Processing timber for construction and industry.',
        baseCost: 300000, // 300K
        costMultiplier: 1.27,
        baseIncome: 2900, // 2.9K
        upgradeCost: 650000, // 650K
        upgradeCostMultiplier: 2.35,
        upgradeIncomeMultiplier: 2.05,
        maxLevel: 15,
        tier: 2
    },
    // --- Tier 3 Properties ---
    {
        id: 'royalLibrary',
        name: 'Royal Library',
        description: 'A vast repository of knowledge, attracting scholars and mages.',
        baseCost: 750000, // 750K
        costMultiplier: 1.28,
        baseIncome: 6500, // 6.5K
        upgradeCost: 1600000, // 1.6M
        upgradeCostMultiplier: 2.4,
        upgradeIncomeMultiplier: 2.1,
        maxLevel: 20,
        tier: 3
    },
    {
        id: 'alchemistsTower',
        name: 'Alchemist\'s Tower',
        description: 'Bubbling concoctions and transmutations, seeking gold and elixirs.',
        baseCost: 1200000, // 1.2M
        costMultiplier: 1.29,
        baseIncome: 10000, // 10K
        upgradeCost: 2500000, // 2.5M
        upgradeCostMultiplier: 2.45,
        upgradeIncomeMultiplier: 2.15,
        maxLevel: 20,
        tier: 3
    },
    {
        id: 'grandTheatre',
        name: 'Grand Theatre',
        description: 'Epic performances that captivate the hearts of the populace.',
        baseCost: 2000000, // 2M
        costMultiplier: 1.30,
        baseIncome: 16000, // 16K
        upgradeCost: 4200000, // 4.2M
        upgradeCostMultiplier: 2.5,
        upgradeIncomeMultiplier: 2.2,
        maxLevel: 18,
        tier: 3
    },
    {
        id: 'jewelersEmporium',
        name: 'Jeweler\'s Emporium',
        description: 'Cutting and setting precious gems for royalty and the wealthy.',
        baseCost: 3500000, // 3.5M
        costMultiplier: 1.31,
        baseIncome: 27000, // 27K
        upgradeCost: 7500000, // 7.5M
        upgradeCostMultiplier: 2.55,
        upgradeIncomeMultiplier: 2.25,
        maxLevel: 18,
        tier: 3
    },
    {
        id: 'shipyard',
        name: 'Shipyard',
        description: 'Constructing vessels for trade and exploration across the seas.',
        baseCost: 6000000, // 6M
        costMultiplier: 1.32,
        baseIncome: 45000, // 45K
        upgradeCost: 13000000, // 13M
        upgradeCostMultiplier: 2.6,
        upgradeIncomeMultiplier: 2.3,
        maxLevel: 15,
        tier: 3
    },
    {
        id: 'universityOfMagic',
        name: 'University of Magic',
        description: 'Training the next generation of powerful sorcerers and enchantresses.',
        baseCost: 10000000, // 10M
        costMultiplier: 1.33,
        baseIncome: 75000, // 75K
        upgradeCost: 22000000, // 22M
        upgradeCostMultiplier: 2.65,
        upgradeIncomeMultiplier: 2.35,
        maxLevel: 20,
        tier: 3
    },
    // --- Tier 4 Properties ---
    {
        id: 'griffinRoost',
        name: 'Griffin Roost',
        description: 'Noble griffins offering aerial transport and guarding treasures.',
        baseCost: 25000000, // 25M
        costMultiplier: 1.34,
        baseIncome: 180000, // 180K
        upgradeCost: 55000000, // 55M
        upgradeCostMultiplier: 2.7,
        upgradeIncomeMultiplier: 2.4,
        maxLevel: 20,
        tier: 4
    },
    {
        id: 'dragonsHoardLeasing',
        name: 'Dragon\'s Hoard Leasing Office',
        description: 'Safely managing and leasing access to a (mostly) dormant dragon\'s wealth.',
        baseCost: 50000000, // 50M
        costMultiplier: 1.35,
        baseIncome: 350000, // 350K
        upgradeCost: 110000000, // 110M
        upgradeCostMultiplier: 2.75,
        upgradeIncomeMultiplier: 2.45,
        maxLevel: 15, // Dragons are fickle
        tier: 4
    },
    {
        id: 'fairyGladeInn',
        name: 'Fairy Glade Inn',
        description: 'An ethereal inn hidden within an enchanted forest, serving mystical clientele.',
        baseCost: 80000000, // 80M
        costMultiplier: 1.36,
        baseIncome: 550000, // 550K
        upgradeCost: 170000000, // 170M
        upgradeCostMultiplier: 2.8,
        upgradeIncomeMultiplier: 2.5,
        maxLevel: 20,
        tier: 4
    },
    {
        id: 'golemFactory',
        name: 'Golem Factory',
        description: 'Assembling powerful constructs for labor and defense.',
        baseCost: 150000000, // 150M
        costMultiplier: 1.37,
        baseIncome: 900000, // 900K
        upgradeCost: 320000000, // 320M
        upgradeCostMultiplier: 2.85,
        upgradeIncomeMultiplier: 2.55,
        maxLevel: 20,
        tier: 4
    },
    {
        id: 'crystalMine',
        name: 'Crystal Mine',
        description: 'Harvesting rare and potent crystals imbued with magical energy.',
        baseCost: 280000000, // 280M
        costMultiplier: 1.38,
        baseIncome: 1600000, // 1.6M
        upgradeCost: 600000000, // 600M
        upgradeCostMultiplier: 2.9,
        upgradeIncomeMultiplier: 2.6,
        maxLevel: 25,
        tier: 4
    },
    {
        id: 'skyPort',
        name: 'Sky Port',
        description: 'Docks for majestic airships and flying mounts, connecting floating islands.',
        baseCost: 500000000, // 500M
        costMultiplier: 1.39,
        baseIncome: 2800000, // 2.8M
        upgradeCost: 1100000000, // 1.1B
        upgradeCostMultiplier: 2.95,
        upgradeIncomeMultiplier: 2.65,
        maxLevel: 20,
        tier: 4
    },
    // --- Tier 5 Properties ---
    {
        id: 'starDustCollector',
        name: 'Star-Dust Collector',
        description: 'Giant orbital nets sifting valuable stardust from the cosmic winds.',
        baseCost: 1000000000, // 1B
        costMultiplier: 1.40,
        baseIncome: 5000000, // 5M
        upgradeCost: 2200000000, // 2.2B
        upgradeCostMultiplier: 3.0,
        upgradeIncomeMultiplier: 2.7,
        maxLevel: 25,
        tier: 5
    },
    {
        id: 'nebulaNurseryFlora',
        name: 'Nebula Nursery (Flora)',
        description: 'Cultivating exotic, sentient plants from the swirling colors of nebulae.',
        baseCost: 2500000000, // 2.5B
        costMultiplier: 1.41,
        baseIncome: 12000000, // 12M
        upgradeCost: 5500000000, // 5.5B
        upgradeCostMultiplier: 3.05,
        upgradeIncomeMultiplier: 2.75,
        maxLevel: 25,
        tier: 5
    },
    {
        id: 'portalHubNexus',
        name: 'Portal Hub Nexus',
        description: 'A central nexus of interdimensional portals, bustling with alien traders.',
        baseCost: 6000000000, // 6B
        costMultiplier: 1.42,
        baseIncome: 28000000, // 28M
        upgradeCost: 13000000000, // 13B
        upgradeCostMultiplier: 3.1,
        upgradeIncomeMultiplier: 2.8,
        maxLevel: 30, // End-game property
        tier: 5
    }
];

// This makes initialProperties available to other JS files
window.gameProperties = initialProperties;
