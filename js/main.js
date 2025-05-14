document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let gold = 0.0;
    let totalIPS = 0.0;
    const ownedProperties = {}; // Stores quantity, level, currentIncomePerUnit, currentUpgradeCost

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
        updatePurchaseButtonStates(); // Continuously update button states based on gold
        updateUpgradeButtonStates();  // Continuously update button states based on gold
    }

    // Update UI for gold and IPS
    function updateDisplays() {
        goldDisplay.textContent = formatNumber(gold, true); // True to floor for gold display
        ipsDisplay.textContent = formatNumber(totalIPS, false); // False to allow decimals for IPS
    }

    // Load properties available for purchase into the UI
    function loadPropertiesForSale() {
        propertiesContainer.innerHTML = ''; // Clear existing
        window.gameProperties.forEach(prop => {
            const cost = calculatePurchaseCost(prop.id);
            const isAffordable = gold >= cost;

            const card = document.createElement('div');
            card.classList.add('property-card', `tier-${prop.tier}`); // Add tier class

            // Inner div for content to help with flexbox spacing if button is separate
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                <span class="tier-indicator tier-${prop.tier}">Tier ${prop.tier}</span>
                <h3>${prop.name}</h3>
                <p class="description">${prop.description}</p>
                <p>Cost: <span id="cost-${prop.id}" class="property-cost ${isAffordable ? 'affordable' : 'unaffordable'}">${formatNumber(cost, true)}</span> Gold</p>
                <p>Base Income: ${formatNumber(prop.baseIncome, false)} IPS / unit</p>
            `;
            card.appendChild(contentDiv);

            const purchaseButton = document.createElement('button');
            purchaseButton.id = `buy-${prop.id}`;
            purchaseButton.dataset.propertyId = prop.id;
            purchaseButton.textContent = 'Purchase';
            purchaseButton.classList.add('purchase-button'); // Add class for specific styling if needed
            if (isAffordable) {
                purchaseButton.classList.add('btn-affordable');
            }
            purchaseButton.disabled = !isAffordable;
            purchaseButton.addEventListener('click', () => purchaseProperty(prop.id));

            card.appendChild(purchaseButton);
            propertiesContainer.appendChild(card);
        });
        // Initial state update for buttons after loading
        updatePurchaseButtonStates();
    }

    // Calculate potential income for the next level of a specific property unit
    function calculateNextLevelIncome(propertyId, currentUnitIncome) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return currentUnitIncome;
        // Apply multiplier without flooring here to maintain precision
        return currentUnitIncome * propData.upgradeIncomeMultiplier;
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
                const progressPercent = (ownedProp.level / propData.maxLevel) * 100;
                const isUpgradeAffordable = gold >= ownedProp.currentUpgradeCost;

                let upgradeHtml = `<p style="text-align:center; margin-top: 20px;">Max Level Reached!</p>`;
                if (ownedProp.level < propData.maxLevel) {
                    const nextLevelIncomePerUnit = calculateNextLevelIncome(propId, ownedProp.currentIncomePerUnit);
                    const incomeGainPerUnit = nextLevelIncomePerUnit - ownedProp.currentIncomePerUnit;
                    const totalIncomeGain = incomeGainPerUnit * ownedProp.quantity;

                    upgradeHtml = `
                        <p>Upgrade Cost: <span id="upgrade-cost-${propId}" class="property-cost ${isUpgradeAffordable ? 'affordable' : 'unaffordable'}">${formatNumber(ownedProp.currentUpgradeCost, true)}</span> Gold</p>
                        <p class="income-gain">Next Lvl Income/Unit: ${formatNumber(nextLevelIncomePerUnit, false)} IPS</p>
                        <p class="income-gain">IPS Gain per Unit: +${formatNumber(incomeGainPerUnit, false)}</p>
                        <p class="income-gain">Total IPS Gain (x${ownedProp.quantity}): +${formatNumber(totalIncomeGain, false)}</p>
                        <button id="upgrade-${propId}" data-property-id="${propId}" class="upgrade-button ${isUpgradeAffordable ? 'btn-affordable' : ''}">Upgrade (Lvl ${ownedProp.level + 1})</button>
                    `;
                }

                const card = document.createElement('div');
                card.classList.add('property-card', 'owned-property', `tier-${propData.tier}`);

                // Inner div for content
                const contentDiv = document.createElement('div');
                contentDiv.innerHTML = `
                    <span class="tier-indicator tier-${propData.tier}">Tier ${propData.tier}</span>
                    <h3>${propData.name} (x${ownedProp.quantity})</h3>
                    <div class="owned-property-details">
                        <p>Level: <span id="level-${propId}">${ownedProp.level}</span> / ${propData.maxLevel}</p>
                        <div class="level-progress-container">
                            <div class="level-progress-bar" style="width: ${progressPercent}%;">
                                ${ownedProp.level > 0 && progressPercent > 10 ? Math.floor(progressPercent)+'%' : ''}
                            </div>
                        </div>
                        <p>Current Income/Unit: ${formatNumber(ownedProp.currentIncomePerUnit, false)} IPS</p>
                        <p>Total Income from Type: ${formatNumber(ownedProp.currentIncomePerUnit * ownedProp.quantity, false)} IPS</p>
                    </div>
                `; // Upgrade HTML will be appended or inserted after this

                // Append upgradeHTML to the contentDiv or card directly.
                // For flex structure, better to keep button separate or ensure upgradeHtml also goes into a div
                const detailsDiv = contentDiv.querySelector('.owned-property-details');
                detailsDiv.insertAdjacentHTML('beforeend', upgradeHtml); // Insert after existing details

                card.appendChild(contentDiv);

                // If upgrade button exists, add event listener (it's created via innerHTML now)
                if (ownedProp.level < propData.maxLevel) {
                    const upgradeButton = card.querySelector(`#upgrade-${propId}`); // Query within the card
                    if (upgradeButton) {
                         upgradeButton.disabled = !isUpgradeAffordable; // Set initial disabled state
                        upgradeButton.addEventListener('click', () => upgradeProperty(propId));
                    }
                }
                ownedPropertiesContainer.appendChild(card);
            }
        }
        // Show/hide the "Your Holdings" section title based on content
        const ownedSectionTitle = document.querySelector('#owned-properties-section h2');
        if (ownedSectionTitle) {
            ownedSectionTitle.style.display = hasOwnedAndDisplayableProperties ? 'block' : 'none';
        }
        // Initial state update for upgrade buttons after rendering
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
                    level: 0,
                    currentIncomePerUnit: propData.baseIncome,
                    currentUpgradeCost: propData.upgradeCost
                };
            }
            ownedProperties[propertyId].quantity++;
            totalIPS += ownedProperties[propertyId].currentIncomePerUnit; // Add income of one new unit

            // After purchase, re-evaluate all property costs and button states in "Available"
            // And also update owned properties display if it's the first of its kind
            loadPropertiesForSale(); // This will re-render available items and update their button states
            renderOwnedProperties(); // This ensures the newly purchased item shows up in "owned" correctly
            updateDisplays(); // Update main gold/IPS display
            // updatePurchaseButtonStates(); // Covered by loadPropertiesForSale
            // updateUpgradeButtonStates(); // Covered by renderOwnedProperties
        } else {
            console.log("Not enough gold to purchase " + propData.name);
        }
    }

    // Upgrade Property Logic
    function upgradeProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];

        if (!ownedProp || ownedProp.quantity === 0 || ownedProp.level >= propData.maxLevel) {
            return; // Should not happen if button is correctly disabled
        }
        const upgradeCost = ownedProp.currentUpgradeCost; // Cost should be based on current level

        if (gold >= upgradeCost) {
            gold -= upgradeCost;

            totalIPS -= ownedProp.currentIncomePerUnit * ownedProp.quantity; // Subtract old total IPS

            ownedProp.level++;
            ownedProp.currentIncomePerUnit *= propData.upgradeIncomeMultiplier; // No Math.floor
            ownedProp.currentUpgradeCost = calculateUpgradeCost(propertyId); // Recalculate for next level

            totalIPS += ownedProp.currentIncomePerUnit * ownedProp.quantity; // Add new total IPS

            renderOwnedProperties(); // Re-render to show new stats and update button states for owned items
            updateDisplays(); // Update main gold/IPS
            updatePurchaseButtonStates(); // Gold has changed, so update available property buttons too
        } else {
            console.log("Not enough gold to upgrade " + propData.name);
        }
    }

    // Update enable/disable state and style of purchase buttons
    function updatePurchaseButtonStates() {
        window.gameProperties.forEach(prop => {
            const button = document.getElementById(`buy-${prop.id}`);
            const costDisplay = document.getElementById(`cost-${prop.id}`); // Get cost span
            if (button && costDisplay) { // Ensure both elements exist
                const cost = calculatePurchaseCost(prop.id);
                const isAffordable = gold >= cost;

                button.disabled = !isAffordable;
                button.classList.toggle('btn-affordable', isAffordable);

                costDisplay.textContent = formatNumber(cost, true);
                costDisplay.classList.toggle('affordable', isAffordable);
                costDisplay.classList.toggle('unaffordable', !isAffordable);
            }
        });
    }

    // Update enable/disable state and style of upgrade buttons
    function updateUpgradeButtonStates() {
        for (const propId in ownedProperties) {
            if (ownedProperties[propId].quantity > 0) {
                const propData = window.gameProperties.find(p => p.id === propId); // Needed for maxLevel check
                const ownedProp = ownedProperties[propId];
                const button = document.getElementById(`upgrade-${propId}`);
                const costDisplay = document.getElementById(`upgrade-cost-${propId}`); // Get cost span

                if (button) { // Button exists if not max level
                    // Check against maxLevel again in case it was just reached
                    if (ownedProp.level >= propData.maxLevel) {
                        button.disabled = true;
                        button.classList.remove('btn-affordable');
                        // Potentially change text or hide button, already handled by render logic
                    } else {
                        const isAffordable = gold >= ownedProp.currentUpgradeCost;
                        button.disabled = !isAffordable;
                        button.classList.toggle('btn-affordable', isAffordable);

                        if (costDisplay) { // Ensure cost display for upgrade exists
                            costDisplay.textContent = formatNumber(ownedProp.currentUpgradeCost, true);
                            costDisplay.classList.toggle('affordable', isAffordable);
                            costDisplay.classList.toggle('unaffordable', !isAffordable);
                        }
                    }
                }
            }
        }
    }

    // Utility to format numbers
    // Takes an additional 'floorOutputForSuffix' boolean: true to always floor before suffixing (for gold/costs), false to allow decimals (for IPS)
    function formatNumber(num, floorOutputForDisplay) {
        let numToFormat = num;

        // For IPS, we want to see decimals. For Gold/Costs, we typically floor for display unless it's suffixed.
        if (floorOutputForDisplay && Math.abs(numToFormat) < 1000) { // Only floor if display demands it AND it's not going to be K/M/B
            numToFormat = Math.floor(numToFormat);
        }

        if (Math.abs(numToFormat) < 1 && !floorOutputForDisplay) { // Show 2 decimal places for IPS < 1
            return numToFormat.toFixed(2);
        }
        if (Math.abs(numToFormat) < 1000) { // For numbers less than 1000
            // If it's meant to be floored for display OR if it's a whole number already after potential float ops
            if (floorOutputForDisplay || numToFormat % 1 === 0) {
                return Math.floor(numToFormat).toString(); // Ensure it's an integer string
            } else { // Otherwise, show one decimal place (typically for IPS)
                return numToFormat.toFixed(1);
            }
        }

        // Logic for K, M, B, etc.
        // For these large numbers, flooring the base before dividing for suffix is acceptable for costs/gold.
        // For IPS, if it's large, the toFixed(1) on the suffixed number is usually good.
        let baseNumForSuffix = floorOutputForDisplay ? Math.floor(num) : num;

        const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]; // Extended suffixes
        const i = Math.floor(Math.log10(Math.abs(baseNumForSuffix)) / 3);

        if (i === 0) { // Fallback, should have been caught by < 1000
             return floorOutputForDisplay ? Math.floor(baseNumForSuffix).toString() : baseNumForSuffix.toFixed(1);
        }
        
        let shortNum = (baseNumForSuffix / Math.pow(1000, i));
        // For K/M/B etc display, always use one decimal place unless it's effectively .0 after rounding
        // e.g. 1.0M should be 1M, 1.2M should be 1.2M
        if (shortNum.toFixed(1).endsWith('.0')) {
            return shortNum.toFixed(0) + suffixes[i];
        }
        return shortNum.toFixed(1) + suffixes[i];
    }

    // Start the game
    initGame();
});
