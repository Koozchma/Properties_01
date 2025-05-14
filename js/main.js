document.addEventListener('DOMContentLoaded', () => {
    // Game State
    let gold = 0.0;
    let totalIPS = 0.0;
    const ownedProperties = {};

    // DOM Elements
    const goldDisplay = document.getElementById('goldDisplay');
    const ipsDisplay = document.getElementById('ipsDisplay');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const ownedPropertiesContainer = document.getElementById('ownedPropertiesContainer');
    const currentYearSpan = document.getElementById('currentYear');

    // Tab Navigation Elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // Function to handle tab switching
    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));

                // Add active class to the clicked button and corresponding panel
                button.classList.add('active');
                const targetTabId = button.dataset.tab; // e.g., "availablePropertiesTabContent"
                document.getElementById(targetTabId).classList.add('active');
            });
        });
    }

    // Initialize Game
    function initGame() {
        gold = 50.0;
        if(currentYearSpan) {
            currentYearSpan.textContent = new Date().getFullYear();
        }
        setupTabs(); // Initialize tab functionality
        loadPropertiesForSale();
        renderOwnedProperties(); // Initial render for owned properties container
        updateDisplays();
        setInterval(gameLoop, 1000);
    }

    // Game Loop
    function gameLoop() {
        gold += totalIPS;
        updateDisplays();
        updatePurchaseButtonStates();
        updateUpgradeButtonStates();
    }

    // Update UI for gold and IPS
    function updateDisplays() {
        goldDisplay.textContent = formatNumber(gold, true);
        ipsDisplay.textContent = formatNumber(totalIPS, false);
    }

    // Load properties available for purchase into the UI
    function loadPropertiesForSale() {
        propertiesContainer.innerHTML = '';
        window.gameProperties.forEach(prop => {
            const cost = calculatePurchaseCost(prop.id);
            const isAffordable = gold >= cost;

            const card = document.createElement('div');
            card.classList.add('property-card', `tier-${prop.tier}`);

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
            purchaseButton.classList.add('purchase-button');
            if (isAffordable) {
                purchaseButton.classList.add('btn-affordable');
            }
            purchaseButton.disabled = !isAffordable;
            purchaseButton.addEventListener('click', () => purchaseProperty(prop.id));

            card.appendChild(purchaseButton);
            propertiesContainer.appendChild(card);
        });
        updatePurchaseButtonStates();
    }

    // Calculate potential income for the next level
    function calculateNextLevelIncome(propertyId, currentUnitIncome) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return currentUnitIncome;
        return currentUnitIncome * propData.upgradeIncomeMultiplier;
    }

    // Render owned properties
    function renderOwnedProperties() {
        ownedPropertiesContainer.innerHTML = '';
        let hasOwnedAndDisplayableProperties = false;

        for (const propId in ownedProperties) {
            if (ownedProperties[propId].quantity > 0) {
                hasOwnedAndDisplayableProperties = true;
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];
                const progressPercent = (ownedProp.level / propData.maxLevel) * 100;
                const isUpgradeAffordable = gold >= ownedProp.currentUpgradeCost;

                let upgradeHtmlSection = `<p style="text-align:center; margin-top: 20px;">Max Level Reached!</p>`;
                if (ownedProp.level < propData.maxLevel) {
                    const nextLevelIncomePerUnit = calculateNextLevelIncome(propId, ownedProp.currentIncomePerUnit);
                    const incomeGainPerUnit = nextLevelIncomePerUnit - ownedProp.currentIncomePerUnit;
                    const totalIncomeGain = incomeGainPerUnit * ownedProp.quantity;
                    upgradeHtmlSection = `
                        <p>Upgrade Cost: <span id="upgrade-cost-${propId}" class="property-cost ${isUpgradeAffordable ? 'affordable' : 'unaffordable'}">${formatNumber(ownedProp.currentUpgradeCost, true)}</span> Gold</p>
                        <p class="income-gain">Next Lvl Income/Unit: ${formatNumber(nextLevelIncomePerUnit, false)} IPS</p>
                        <p class="income-gain">IPS Gain per Unit: +${formatNumber(incomeGainPerUnit, false)}</p>
                        <p class="income-gain">Total IPS Gain (x${ownedProp.quantity}): +${formatNumber(totalIncomeGain, false)}</p>
                        <button id="upgrade-${propId}" data-property-id="${propId}" class="upgrade-button ${isUpgradeAffordable ? 'btn-affordable' : ''}">Upgrade (Lvl ${ownedProp.level + 1})</button>
                    `;
                }

                const card = document.createElement('div');
                card.classList.add('property-card', 'owned-property', `tier-${propData.tier}`);
                card.innerHTML = `
                    <div> <span class="tier-indicator tier-${propData.tier}">Tier ${propData.tier}</span>
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
                        ${upgradeHtmlSection} </div>
                `;
                ownedPropertiesContainer.appendChild(card);

                if (ownedProp.level < propData.maxLevel) {
                    const upgradeButton = card.querySelector(`#upgrade-${propId}`);
                    if (upgradeButton) {
                        upgradeButton.disabled = !isUpgradeAffordable;
                        upgradeButton.addEventListener('click', () => upgradeProperty(propId));
                    }
                }
            }
        }
        const ownedSectionTitle = document.querySelector('#owned-properties-tabContent #owned-properties-section h2');
        if (ownedSectionTitle) { // Check specifically within the tab
            ownedSectionTitle.style.display = hasOwnedAndDisplayableProperties ? 'block' : 'none';
            // If no owned properties, maybe show a message in ownedPropertiesContainer
             if (!hasOwnedAndDisplayableProperties && ownedPropertiesContainer.innerHTML === '') {
                ownedPropertiesContainer.innerHTML = '<p style="text-align:center; color: #95a5a6;">You do not own any properties yet. Purchase some from the "Available Properties" tab!</p>';
            }
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
                    quantity: 0, level: 0,
                    currentIncomePerUnit: propData.baseIncome,
                    currentUpgradeCost: propData.upgradeCost
                };
            }
            ownedProperties[propertyId].quantity++;
            totalIPS += ownedProperties[propertyId].currentIncomePerUnit;

            loadPropertiesForSale();
            renderOwnedProperties();
            updateDisplays();
        } else {
            console.log("Not enough gold to purchase " + propData.name);
        }
    }

    function upgradeProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];
        if (!ownedProp || ownedProp.quantity === 0 || ownedProp.level >= propData.maxLevel) return;

        const upgradeCost = ownedProp.currentUpgradeCost;
        if (gold >= upgradeCost) {
            gold -= upgradeCost;
            totalIPS -= ownedProp.currentIncomePerUnit * ownedProp.quantity;
            ownedProp.level++;
            ownedProp.currentIncomePerUnit *= propData.upgradeIncomeMultiplier;
            ownedProp.currentUpgradeCost = calculateUpgradeCost(propertyId);
            totalIPS += ownedProp.currentIncomePerUnit * ownedProp.quantity;

            renderOwnedProperties();
            updateDisplays();
            updatePurchaseButtonStates(); // Gold changed, so available property affordability might change
        } else {
            console.log("Not enough gold to upgrade " + propData.name);
        }
    }

    function updatePurchaseButtonStates() {
        window.gameProperties.forEach(prop => {
            const button = document.getElementById(`buy-${prop.id}`);
            const costDisplay = document.getElementById(`cost-${prop.id}`);
            if (button && costDisplay) {
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

    function updateUpgradeButtonStates() {
        for (const propId in ownedProperties) {
            if (ownedProperties[propId].quantity > 0) {
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];
                const button = document.getElementById(`upgrade-${propId}`); // Query within the whole document
                const costDisplay = document.getElementById(`upgrade-cost-${propId}`);

                if (button) {
                    if (ownedProp.level >= propData.maxLevel) {
                        button.disabled = true;
                        button.classList.remove('btn-affordable');
                    } else {
                        const isAffordable = gold >= ownedProp.currentUpgradeCost;
                        button.disabled = !isAffordable;
                        button.classList.toggle('btn-affordable', isAffordable);
                        if (costDisplay) {
                            costDisplay.textContent = formatNumber(ownedProp.currentUpgradeCost, true);
                            costDisplay.classList.toggle('affordable', isAffordable);
                            costDisplay.classList.toggle('unaffordable', !isAffordable);
                        }
                    }
                }
            }
        }
    }

    function formatNumber(num, floorOutputForDisplay) {
        let numToFormat = num;
        if (floorOutputForDisplay && Math.abs(numToFormat) < 1000) {
            numToFormat = Math.floor(numToFormat);
        }

        if (Math.abs(numToFormat) < 1 && !floorOutputForDisplay) {
            return numToFormat.toFixed(2);
        }
        if (Math.abs(numToFormat) < 1000) {
            return (floorOutputForDisplay || numToFormat % 1 === 0) ?
                   Math.floor(numToFormat).toString() : numToFormat.toFixed(1);
        }

        let baseNumForSuffix = floorOutputForDisplay ? Math.floor(num) : num;
        const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
        const i = Math.max(0, Math.min(suffixes.length - 1, Math.floor(Math.log10(Math.abs(baseNumForSuffix)) / 3)));
        
        if (i === 0) { // Fallback for numbers like 999.999 that don't quite hit 1K for suffix
            return (floorOutputForDisplay || baseNumForSuffix % 1 === 0) ? Math.floor(baseNumForSuffix).toString() : baseNumForSuffix.toFixed(1);
        }
        
        let shortNum = (baseNumForSuffix / Math.pow(1000, i));
        if (shortNum.toFixed(1).endsWith('.0')) {
            return shortNum.toFixed(0) + suffixes[i];
        }
        return shortNum.toFixed(1) + suffixes[i];
    }

    initGame();
});
