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
        updateUpgradeButtonStates(); // Ensure upgrade buttons reflect current gold
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
                <p>Base Income: ${formatNumber(prop.baseIncome)} IPS / unit</p>
                <button id="buy-${prop.id}" data-property-id="${prop.id}">Purchase</button>
            `;
            propertiesContainer.appendChild(card);

            document.getElementById(`buy-${prop.id}`).addEventListener('click', () => purchaseProperty(prop.id));
        });
        updatePurchaseButtonStates();
    }

    // Calculate potential income for the next level of a specific property unit
    function calculateNextLevelIncome(propertyId, currentUnitIncome) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return currentUnitIncome; // Should not happen if called correctly
        // This calculation should mirror the income update in upgradeProperty
        return Math.floor(currentUnitIncome * propData.upgradeIncomeMultiplier);
    }


    // Render owned properties and their upgrade options
    function renderOwnedProperties() {
        ownedPropertiesContainer.innerHTML = ''; // Clear existing
        let hasOwnedAndDisplayableProperties = false;

        for (const propId in ownedProperties) {
            if (ownedProperties[propId].quantity > 0) {
                hasOwnedAndDisplayableProperties = true;
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];

                let upgradeHtml = '<p>Max Level Reached!</p>';
                if (ownedProp.level < propData.maxLevel) {
                    const nextLevelIncomePerUnit = calculateNextLevelIncome(propId, ownedProp.currentIncomePerUnit);
                    const incomeGainPerUnit = nextLevelIncomePerUnit - ownedProp.currentIncomePerUnit;
                    const totalIncomeGain = incomeGainPerUnit * ownedProp.quantity;

                    upgradeHtml = `
                        <p>Upgrade Cost: <span id="upgrade-cost-${propId}">${formatNumber(ownedProp.currentUpgradeCost)}</span> Gold</p>
                        <p style="color: #27ae60;">Next Lvl Income/Unit: ${formatNumber(nextLevelIncomePerUnit)} IPS</p>
                        <p style="color: #27ae60;">IPS Gain per Unit: +${formatNumber(incomeGainPerUnit)}</p>
                        <p style="color: #16a085;">Total IPS Gain (x${ownedProp.quantity}): +${formatNumber(totalIncomeGain)}</p>
                        <button id="upgrade-${propId}" data-property-id="${propId}" class="upgrade-button">Upgrade (Lvl ${ownedProp.level + 1})</button>
                    `;
                }

                const card = document.createElement('div');
                card.classList.add('property-card', 'owned-property');
                card.innerHTML = `
                    <h3>${propData.name} (x${ownedProp.quantity})</h3>
                    <div class="owned-property-details">
                        <p>Level: <span id="level-${propId}">${ownedProp.level}</span> / ${propData.maxLevel}</p>
                        <p>Current Income/Unit: ${formatNumber(ownedProp.currentIncomePerUnit)} IPS</p>
                        <p>Total Income from Type: ${formatNumber(ownedProp.currentIncomePerUnit * ownedProp.quantity)} IPS</p>
                        ${upgradeHtml}
                    </div>
                `;
                ownedPropertiesContainer.appendChild(card);

                if (ownedProp.level < propData.maxLevel) {
                    const upgradeButton = document.getElementById(`upgrade-${propId}`);
                    if (upgradeButton) { // Check if button exists before adding listener
                        upgradeButton.addEventListener('click', () => upgradeProperty(propId));
                    }
                }
            }
        }
        // Show/hide the "Your Holdings" section title based on content
        const ownedSectionTitle = document.querySelector('#owned-properties-section h2');
        if (ownedSectionTitle) {
            ownedSectionTitle.style.display = hasOwnedAndDisplayableProperties ? 'block' : 'none';
        }

        updateUpgradeButtonStates();
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
            totalIPS += ownedProperties[propertyId].currentIncomePerUnit; // Add income of one new unit at its current type's level

            document.getElementById(`cost-${propData.id}`).textContent = formatNumber(calculatePurchaseCost(propData.id));

            renderOwnedProperties();
            updateDisplays();
            updatePurchaseButtonStates();
        } else {
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

        const upgradeCost = ownedProp.currentUpgradeCost; // Cost should be based on current level

        if (gold >= upgradeCost) {
            gold -= upgradeCost;

            // Subtract old income from totalIPS before recalculating
            totalIPS -= ownedProp.currentIncomePerUnit * ownedProp.quantity;

            // Increase level and update income and next upgrade cost
            ownedProp.level++;
            // The income per unit is upgraded. This applies to all units of this type.
            ownedProp.currentIncomePerUnit = Math.floor(ownedProp.currentIncomePerUnit * propData.upgradeIncomeMultiplier);
            ownedProp.currentUpgradeCost = calculateUpgradeCost(propertyId); // Recalculate for next level

            // Add new income to totalIPS
            totalIPS += ownedProp.currentIncomePerUnit * ownedProp.quantity;

            renderOwnedProperties(); // Re-render to show new stats and potential next upgrade
            updateDisplays();
            // updateUpgradeButtonStates(); // renderOwnedProperties calls this
        } else {
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

                if (button) { // Check if button exists (it wouldn't if max level already)
                    if (ownedProp.level >= propData.maxLevel) {
                        // This case is handled by renderOwnedProperties not creating a button
                        // but if it somehow existed, ensure it's disabled.
                        button.disabled = true;
                        button.textContent = 'Max Level';
                    } else {
                        button.disabled = gold < ownedProp.currentUpgradeCost;
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
        const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi"]; // Add more as needed
        const i = Math.floor(Math.log10(Math.abs(num)) / 3);
        if (i === 0) return num.toString(); // Handles numbers like 999.xxx K
        const shortNum = (num / Math.pow(1000, i));
        // Use toFixed(1) but remove .0 if it's a whole number
        return (shortNum % 1 === 0 ? shortNum.toFixed(0) : shortNum.toFixed(1)) + suffixes[i];
    }

    // Start the game
    initGame();
});
