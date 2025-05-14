document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let gold = 0; // Can remain integer or become float; let's make it float for precision
    let totalIPS = 0.0; // Explicitly float
    const ownedProperties = {};

    // DOM Elements
    const goldDisplay = document.getElementById('goldDisplay');
    const ipsDisplay = document.getElementById('ipsDisplay');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const ownedPropertiesContainer = document.getElementById('ownedPropertiesContainer');

    // Initialize Game
    function initGame() {
        gold = 50.0; // Starting gold as float
        loadPropertiesForSale();
        updateDisplays();
        setInterval(gameLoop, 1000); // Game loop runs every second
    }

    // Game Loop
    function gameLoop() {
        gold += totalIPS; // Add raw IPS to gold
        updateDisplays();
        updatePurchaseButtonStates();
        updateUpgradeButtonStates();
    }

    // Update UI
    function updateDisplays() {
        goldDisplay.textContent = formatNumber(gold, true); // Pass true to floor for gold display
        ipsDisplay.textContent = formatNumber(totalIPS, false); // Pass false to allow decimals for IPS
    }

    function loadPropertiesForSale() {
        propertiesContainer.innerHTML = '';
        window.gameProperties.forEach(prop => {
            const card = document.createElement('div');
            card.classList.add('property-card');
            card.innerHTML = `
                <h3>${prop.name}</h3>
                <p>${prop.description}</p>
                <p>Cost: <span id="cost-${prop.id}">${formatNumber(calculatePurchaseCost(prop.id), true)}</span> Gold</p>
                <p>Base Income: ${formatNumber(prop.baseIncome, false)} IPS / unit</p>
                <button id="buy-${prop.id}" data-property-id="${prop.id}">Purchase</button>
            `;
            propertiesContainer.appendChild(card);
            document.getElementById(`buy-${prop.id}`).addEventListener('click', () => purchaseProperty(prop.id));
        });
        updatePurchaseButtonStates();
    }

    function calculateNextLevelIncome(propertyId, currentUnitIncome) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return currentUnitIncome;
        return currentUnitIncome * propData.upgradeIncomeMultiplier; // No Math.floor here
    }

    function renderOwnedProperties() {
        ownedPropertiesContainer.innerHTML = '';
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
                        <p>Upgrade Cost: <span id="upgrade-cost-${propId}">${formatNumber(ownedProp.currentUpgradeCost, true)}</span> Gold</p>
                        <p style="color: #27ae60;">Next Lvl Income/Unit: ${formatNumber(nextLevelIncomePerUnit, false)} IPS</p>
                        <p style="color: #27ae60;">IPS Gain per Unit: +${formatNumber(incomeGainPerUnit, false)}</p>
                        <p style="color: #16a085;">Total IPS Gain (x${ownedProp.quantity}): +${formatNumber(totalIncomeGain, false)}</p>
                        <button id="upgrade-${propId}" data-property-id="${propId}" class="upgrade-button">Upgrade (Lvl ${ownedProp.level + 1})</button>
                    `;
                }

                const card = document.createElement('div');
                card.classList.add('property-card', 'owned-property');
                card.innerHTML = `
                    <h3>${propData.name} (x${ownedProp.quantity})</h3>
                    <div class="owned-property-details">
                        <p>Level: <span id="level-${propId}">${ownedProp.level}</span> / ${propData.maxLevel}</p>
                        <p>Current Income/Unit: ${formatNumber(ownedProp.currentIncomePerUnit, false)} IPS</p>
                        <p>Total Income from Type: ${formatNumber(ownedProp.currentIncomePerUnit * ownedProp.quantity, false)} IPS</p>
                        ${upgradeHtml}
                    </div>
                `;
                ownedPropertiesContainer.appendChild(card);

                if (ownedProp.level < propData.maxLevel) {
                    const upgradeButton = document.getElementById(`upgrade-${propId}`);
                    if (upgradeButton) {
                        upgradeButton.addEventListener('click', () => upgradeProperty(propId));
                    }
                }
            }
        }
        const ownedSectionTitle = document.querySelector('#owned-properties-section h2');
        if (ownedSectionTitle) {
            ownedSectionTitle.style.display = hasOwnedAndDisplayableProperties ? 'block' : 'none';
        }
        updateUpgradeButtonStates();
    }

    function calculatePurchaseCost(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedCount = ownedProperties[propertyId] ? ownedProperties[propertyId].quantity : 0;
        return Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, ownedCount));
    }

    function calculateUpgradeCost(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];
        return Math.floor(propData.upgradeCost * Math.pow(propData.upgradeCostMultiplier, ownedProp.level));
    }

    function purchaseProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const cost = calculatePurchaseCost(propertyId);

        if (gold >= cost) {
            gold -= cost;

            if (!ownedProperties[propertyId]) {
                ownedProperties[propertyId] = {
                    quantity: 0,
                    level: 0,
                    currentIncomePerUnit: propData.baseIncome, // Base income can be float if defined so in properties.js
                    currentUpgradeCost: propData.upgradeCost
                };
            }

            ownedProperties[propertyId].quantity++;
            totalIPS += ownedProperties[propertyId].currentIncomePerUnit;

            document.getElementById(`cost-${propData.id}`).textContent = formatNumber(calculatePurchaseCost(propData.id), true);
            renderOwnedProperties();
            updateDisplays(); // Critical: ensure this updates the main IPS display immediately
            updatePurchaseButtonStates();
        } else {
            console.log("Not enough gold to purchase " + propData.name);
        }
    }

    function upgradeProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];

        if (!ownedProp || ownedProp.quantity === 0 || ownedProp.level >= propData.maxLevel) {
            return;
        }
        const upgradeCost = ownedProp.currentUpgradeCost;

        if (gold >= upgradeCost) {
            gold -= upgradeCost;

            totalIPS -= ownedProp.currentIncomePerUnit * ownedProp.quantity; // Subtract old total IPS for this property type

            ownedProp.level++;
            // Apply multiplier without flooring here to maintain precision
            ownedProp.currentIncomePerUnit = ownedProp.currentIncomePerUnit * propData.upgradeIncomeMultiplier;
            ownedProp.currentUpgradeCost = calculateUpgradeCost(propertyId);

            totalIPS += ownedProp.currentIncomePerUnit * ownedProp.quantity; // Add new total IPS for this property type

            renderOwnedProperties();
            updateDisplays(); // Critical: ensure this updates the main IPS display immediately
            // updateUpgradeButtonStates(); // Called by renderOwnedProperties
        } else {
            console.log("Not enough gold to upgrade " + propData.name);
        }
    }

    function updatePurchaseButtonStates() {
        window.gameProperties.forEach(prop => {
            const button = document.getElementById(`buy-${prop.id}`);
            if (button) {
                const cost = calculatePurchaseCost(prop.id);
                button.disabled = gold < cost;
                const costDisplay = document.getElementById(`cost-${prop.id}`);
                if(costDisplay) costDisplay.textContent = formatNumber(cost, true);
            }
        });
    }

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
                        const upgradeCostDisplay = document.getElementById(`upgrade-cost-${propId}`);
                        if (upgradeCostDisplay) upgradeCostDisplay.textContent = formatNumber(ownedProp.currentUpgradeCost, true);
                    }
                }
            }
        }
    }

    // Utility to format numbers
    // Takes an additional 'floorOutput' boolean: true to always floor before suffixing (for gold/costs), false to allow decimals (for IPS)
    function formatNumber(num, floorOutputForSuffix) {
        let numToFormat = num;

        if (floorOutputForSuffix) {
            numToFormat = Math.floor(numToFormat);
        }

        if (Math.abs(numToFormat) < 1 && !floorOutputForSuffix) { // Show 2 decimal places for IPS < 1
            return numToFormat.toFixed(2);
        }
        if (Math.abs(numToFormat) < 1000) { // For numbers less than 1000
            if (floorOutputForSuffix || numToFormat % 1 === 0) { // If it's floored or a whole number
                return Math.floor(numToFormat).toString();
            } else { // Otherwise, show one decimal place
                return numToFormat.toFixed(1);
            }
        }

        // Logic for K, M, B, etc.
        const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]; // Extended suffixes
        const i = Math.floor(Math.log10(Math.abs(numToFormat)) / 3);

        if (i === 0) { // Should be caught by < 1000, but as a fallback
             return floorOutputForSuffix ? Math.floor(numToFormat).toString() : numToFormat.toFixed(1);
        }
        
        let shortNum = (numToFormat / Math.pow(1000, i));
        // For K/M/B etc display, always use one decimal place unless it's .0
        return (shortNum % 1 === 0 && i > 0 ? shortNum.toFixed(0) : shortNum.toFixed(1)) + suffixes[i];
    }

    initGame();
});
