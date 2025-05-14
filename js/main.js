document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let gold = 0;
    let totalIPS = 0;
    const ownedProperties = {}; // Stores quantity and level of owned properties: { propertyId: { quantity: 0, level: 0, currentIncomePerUnit: 0, currentUpgradeCost: 0 } }

    // DOM Elements
    const goldDisplay = document.getElementById('goldDisplay');
    const ipsDisplay = document.getElementById('ipsDisplay');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const ownedPropertiesContainer = document.getElementById('ownedPropertiesContainer');

    // Initialize Game
    function initGame() {
        gold = 50; // Starting gold
        loadPropertiesForSale();
        updateDisplays();
        setInterval(gameLoop, 1000); // Game loop runs every second
    }

    // Game Loop
    function gameLoop() {
        gold += totalIPS;
        updateDisplays();
        updatePurchaseButtonStates();
        updateUpgradeButtonStates();
    }

    // Update UI
    function updateDisplays() {
        goldDisplay.textContent = formatNumber(gold);
        ipsDisplay.textContent = formatNumber(totalIPS);
    }

    // Load properties available for purchase
    function loadPropertiesForSale() {
        propertiesContainer.innerHTML = ''; // Clear existing
        window.gameProperties.forEach(prop => {
            const card = document.createElement('div');
            card.classList.add('property-card');
            card.innerHTML = `
                <h3>${prop.name}</h3>
                <p>${prop.description}</p>
                <p>Cost: <span id="cost-${prop.id}">${formatNumber(calculatePurchaseCost(prop.id))}</span> Gold</p>
                <p>Base Income: ${formatNumber(prop.baseIncome)} IPS</p>
                <button id="buy-${prop.id}" data-property-id="${prop.id}">Purchase</button>
            `;
            propertiesContainer.appendChild(card);

            document.getElementById(`buy-${prop.id}`).addEventListener('click', () => purchaseProperty(prop.id));
        });
        updatePurchaseButtonStates();
    }

    // Render owned properties and their upgrade options
    function renderOwnedProperties() {
        ownedPropertiesContainer.innerHTML = ''; // Clear existing
        for (const propId in ownedProperties) {
            if (ownedProperties[propId].quantity > 0) {
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];

                const card = document.createElement('div');
                card.classList.add('property-card', 'owned-property');
                card.innerHTML = `
                    <h3>${propData.name} (x${ownedProp.quantity})</h3>
                    <div class="owned-property-details">
                        <p>Level: <span id="level-${propId}">${ownedProp.level}</span> / ${propData.maxLevel}</p>
                        <p>Income per unit: ${formatNumber(ownedProp.currentIncomePerUnit)} IPS</p>
                        <p>Total Income: ${formatNumber(ownedProp.currentIncomePerUnit * ownedProp.quantity)} IPS</p>
                        ${ownedProp.level < propData.maxLevel ? `
                            <p>Upgrade Cost: <span id="upgrade-cost-${propId}">${formatNumber(ownedProp.currentUpgradeCost)}</span> Gold</p>
                            <button id="upgrade-${propId}" data-property-id="${propId}" class="upgrade-button">Upgrade (Lvl ${ownedProp.level + 1})</button>
                        ` : '<p>Max Level Reached!</p>'}
                    </div>
                `;
                ownedPropertiesContainer.appendChild(card);

                if (ownedProp.level < propData.maxLevel) {
                    document.getElementById(`upgrade-${propId}`).addEventListener('click', () => upgradeProperty(propId));
                }
            }
        }
        updateUpgradeButtonStates();
        if (Object.keys(ownedProperties).length > 0 && ownedPropertiesContainer.innerHTML === '') {
             // Handles case where a property might be 'owned' with 0 quantity after some potential future 'sell' mechanic
            // For now, this ensures the section title doesn't appear if no active properties.
        }
    }


    // Calculate Cost for next purchase of a property
    function calculatePurchaseCost(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedCount = ownedProperties[propertyId] ? ownedProperties[propertyId].quantity : 0;
        return Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, ownedCount));
    }

    // Calculate Cost for next upgrade of a property
    function calculateUpgradeCost(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];
        // Apply multiplier based on current level (level 0 is initial state before first upgrade)
        return Math.floor(propData.upgradeCost * Math.pow(propData.upgradeCostMultiplier, ownedProp.level));
    }

    // Purchase Property Logic
    function purchaseProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const cost = calculatePurchaseCost(propertyId);

        if (gold >= cost) {
            gold -= cost;

            if (!ownedProperties[propertyId]) {
                ownedProperties[propertyId] = {
                    quantity: 0,
                    level: 0, // Initial level is 0, first upgrade makes it 1
                    currentIncomePerUnit: propData.baseIncome, // Initial income
                    currentUpgradeCost: propData.upgradeCost // Initial upgrade cost
                };
            }

            ownedProperties[propertyId].quantity++;
            // If it's the first purchase and level is 0, its income is already baseIncome.
            // Subsequent purchases of the same property type will benefit from existing upgrades on that type.

            // Update total IPS: add the income of one unit at its current level.
            totalIPS += ownedProperties[propertyId].currentIncomePerUnit;


            // Update cost for next purchase on the "for sale" card
            document.getElementById(`cost-${propData.id}`).textContent = formatNumber(calculatePurchaseCost(propData.id));

            renderOwnedProperties();
            updateDisplays();
            updatePurchaseButtonStates();
        } else {
            // Optionally, provide feedback like "Not enough gold!"
            console.log("Not enough gold to purchase " + propData.name);
        }
    }

    // Upgrade Property Logic
    function upgradeProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];

        if (!ownedProp || ownedProp.quantity === 0 || ownedProp.level >= propData.maxLevel) {
            console.log("Cannot upgrade this property further or not owned.");
            return;
        }

        const upgradeCost = ownedProp.currentUpgradeCost;

        if (gold >= upgradeCost) {
            gold -= upgradeCost;

            // Subtract old income from totalIPS before recalculating
            totalIPS -= ownedProp.currentIncomePerUnit * ownedProp.quantity;

            // Increase level and update income and next upgrade cost
            ownedProp.level++;
            ownedProp.currentIncomePerUnit = Math.floor(ownedProp.currentIncomePerUnit * propData.upgradeIncomeMultiplier);
            ownedProp.currentUpgradeCost = calculateUpgradeCost(propertyId); // Recalculate for next level

            // Add new income to totalIPS
            totalIPS += ownedProp.currentIncomePerUnit * ownedProp.quantity;

            renderOwnedProperties();
            updateDisplays();
            updateUpgradeButtonStates();
        } else {
            // Optionally, provide feedback
            console.log("Not enough gold to upgrade " + propData.name);
        }
    }

    // Update enable/disable state of purchase buttons
    function updatePurchaseButtonStates() {
        window.gameProperties.forEach(prop => {
            const button = document.getElementById(`buy-${prop.id}`);
            if (button) {
                const cost = calculatePurchaseCost(prop.id);
                button.disabled = gold < cost;
                // Update cost display dynamically as gold changes
                const costDisplay = document.getElementById(`cost-${prop.id}`);
                if(costDisplay) costDisplay.textContent = formatNumber(cost);
            }
        });
    }

    // Update enable/disable state of upgrade buttons
    function updateUpgradeButtonStates() {
        for (const propId in ownedProperties) {
            if (ownedProperties[propId].quantity > 0) {
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];
                const button = document.getElementById(`upgrade-${propId}`);

                if (button) {
                    if (ownedProp.level >= propData.maxLevel) {
                        button.disabled = true;
                        button.textContent = 'Max Level';
                    } else {
                        button.disabled = gold < ownedProp.currentUpgradeCost;
                        // Update upgrade cost display dynamically
                        const upgradeCostDisplay = document.getElementById(`upgrade-cost-${propId}`);
                        if (upgradeCostDisplay) upgradeCostDisplay.textContent = formatNumber(ownedProp.currentUpgradeCost);
                    }
                }
            }
        }
    }


    // Utility to format numbers (e.g., 1000 -> 1K, 1000000 -> 1M) - very basic
    function formatNumber(num) {
        num = Math.floor(num);
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }

    // Start the game
    initGame();
});