document.addEventListener('DOMContentLoaded', () => {
    // Game State Variables
    let gold = 0.0;
    let totalIPS = 0.0;
    let ownedProperties = {};

    // Prestige State Variables
    let totalGoldEarnedThisRun = 0.0;
    let timesAscended = 0;
    let realmShards = 0;
    let prestigeUpgrades = {
        // Example structure: 'cosmicBlessing': 0, 'efficientRealms': 0
    };

    // Constants
    const SAVE_KEY_PREFIX = 'realmTycoon_';
    const GAME_STATE_KEY = SAVE_KEY_PREFIX + 'gameState';
    const ASCEND_GOLD_REQUIREMENT_FIRST = 1e15; // 1 Quadrillion
    const ASCEND_GOLD_REQUIREMENT_SUBSEQUENT_FACTOR = 5;
    const REALM_SHARD_CALC_BASE_GOLD = 1e12; // 1 Trillion
    const REALM_SHARD_CALC_POWER = 1.8;
    const REALM_SHARD_CALC_MULTIPLIER = 3; // Adjusted for potentially more shards

    // DOM Elements
    const goldDisplay = document.getElementById('goldDisplay');
    const ipsDisplay = document.getElementById('ipsDisplay');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const ownedPropertiesContainer = document.getElementById('ownedPropertiesContainer');
    const achievementsContainer = document.getElementById('achievementsContainer');
    const currentYearSpan = document.getElementById('currentYear');
    const notificationArea = document.getElementById('notificationArea'); // Ensure this exists in HTML or create it

    // Tab Navigation Elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    // Ascendancy Tab DOM Elements
    const ascendancyTabButton = document.querySelector('.tab-button[data-tab="ascendancyTabContent"]');
    const ascendancyInfoDiv = document.getElementById('ascendancyInfo');
    const ascendButton = document.getElementById('ascendButton');
    const potentialShardsDisplay = document.getElementById('potentialShardsDisplay');
    const currentGoldForAscendDisplay = document.getElementById('currentGoldForAscendDisplay');
    const goldRequiredForAscendDisplay = document.getElementById('goldRequiredForAscendDisplay');
    const totalRealmShardsDisplay = document.getElementById('totalRealmShardsDisplay');
    const timesAscendedDisplay = document.getElementById('timesAscendedDisplay');
    const ascendReadyNotification = document.getElementById('ascendReadyNotification'); // The "Aha!" moment div
    const prestigeUpgradeShopContainer = document.getElementById('prestigeUpgradeShop');


    // --- CORE GAME LOGIC ---

    function saveGame() {
        const gameState = {
            gold: gold,
            // totalIPS: totalIPS, // Recalculated on load
            ownedProperties: ownedProperties,
            achievements: window.achievementsList ? window.achievementsList.map(a => ({ id: a.id, unlocked: a.unlocked })) : [],
            lastSaveTimestamp: Date.now(),
            totalGoldEarnedThisRun: totalGoldEarnedThisRun,
            timesAscended: timesAscended,
            realmShards: realmShards,
            prestigeUpgrades: prestigeUpgrades
        };
        try {
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
            // console.log("Game Saved!", new Date().toLocaleTimeString()); // Optional: for debugging
        } catch (e) {
            console.error("Error saving game to localStorage:", e);
        }
    }

    function loadGame() {
        try {
            const savedStateJSON = localStorage.getItem(GAME_STATE_KEY);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                gold = parseFloat(savedState.gold) || 0;

                ownedProperties = {}; // Reset before loading
                if (savedState.ownedProperties) {
                    for (const propId in savedState.ownedProperties) {
                        if (savedState.ownedProperties[propId]) {
                            const savedProp = savedState.ownedProperties[propId];
                            ownedProperties[propId] = {
                                quantity: parseInt(savedProp.quantity) || 0,
                                level: parseInt(savedProp.level) || 0,
                                currentIncomePerUnit: parseFloat(savedProp.currentIncomePerUnit) || 0,
                                currentUpgradeCost: parseFloat(savedProp.currentUpgradeCost) || 0
                            };
                            const propData = window.gameProperties.find(p => p.id === propId);
                            if (propData) { // Ensure income/cost are not 0 if they shouldn't be
                                if (ownedProperties[propId].level === 0 && ownedProperties[propId].currentIncomePerUnit === 0 && propData.baseIncome > 0) {
                                    ownedProperties[propId].currentIncomePerUnit = propData.baseIncome;
                                }
                                if (ownedProperties[propId].level === 0 && ownedProperties[propId].currentUpgradeCost === 0 && propData.upgradeCost > 0) {
                                    ownedProperties[propId].currentUpgradeCost = propData.upgradeCost;
                                }
                            }
                        }
                    }
                }

                if (savedState.achievements && window.achievementsList) {
                    savedState.achievements.forEach(savedAch => {
                        const gameAch = window.achievementsList.find(a => a.id === savedAch.id);
                        if (gameAch) gameAch.unlocked = savedAch.unlocked;
                    });
                }

                totalGoldEarnedThisRun = parseFloat(savedState.totalGoldEarnedThisRun) || 0;
                timesAscended = parseInt(savedState.timesAscended) || 0;
                realmShards = parseInt(savedState.realmShards) || 0;
                prestigeUpgrades = savedState.prestigeUpgrades || {};

                recalculateTotalIPS(); // Crucial: recalculate based on loaded state and prestige
                console.log("Game Loaded!");
                return savedState;
            }
        } catch (e) {
            console.error("Error loading game from localStorage:", e);
        }
        // Default values for a new game or if load fails
        gold = 50.0;
        totalIPS = 0;
        ownedProperties = {};
        totalGoldEarnedThisRun = 0;
        timesAscended = 0;
        realmShards = 0;
        prestigeUpgrades = {};
        recalculateTotalIPS();
        return null;
    }

    function getPrestigeUpgradeEffect(upgradeId) {
        // This function will be expanded when prestige upgrades are implemented
        // For now, it returns a base multiplier or additive bonus
        const level = prestigeUpgrades[upgradeId] || 0;
        switch (upgradeId) {
            case 'cosmicBlessing': // Example: Global Income %
                return 1 + (level * 0.10); // 10% per level
            case 'efficientRealms': // Example: Global Cost Reduction %
                return 1 - Math.min(0.9, level * 0.01); // 1% per level, cap at 90% reduction
            case 'shardHoarder':
                return 1 + (level * 0.02); // 2% more shards per level
            // Add other upgrade effects here
            default:
                return 1; // Default no effect (for multipliers) or 0 (for additive)
        }
    }


    function recalculateTotalIPS() {
        totalIPS = 0;
        const globalIncomeMultiplier = getPrestigeUpgradeEffect('cosmicBlessing');

        for (const propId in ownedProperties) {
            if (ownedProperties[propId] && ownedProperties[propId].quantity > 0) {
                let unitIncome = ownedProperties[propId].currentIncomePerUnit;
                // Apply prestige bonuses to unitIncome here
                unitIncome *= globalIncomeMultiplier;
                // Add other specific prestige bonuses if they affect individual properties
                totalIPS += unitIncome * ownedProperties[propId].quantity;
            }
        }
    }


    function initGame() {
        if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        setupTabs();

        const loadedState = loadGame(); // Load game first

        // Offline Progress Calculation
        if (loadedState && loadedState.lastSaveTimestamp) {
            const timeDiffSeconds = Math.floor((Date.now() - loadedState.lastSaveTimestamp) / 1000);
            let maxOfflineSeconds = 2 * 60 * 60; // 2 hours cap initially
            // Example: if 'warpedTime_cap' prestige upgrade exists
            // maxOfflineSeconds += (prestigeUpgrades['warpedTime_cap'] || 0) * 30 * 60; // +30 mins per level

            const offlineSecondsToCalculate = Math.min(timeDiffSeconds, maxOfflineSeconds);
            let offlineIPS = 0;

            // Recalculate offlineIPS based on properties and prestige at time of save
            // This is complex if prestige upgrades changed. Simplification: use saved totalIPS if available,
            // or current totalIPS (already recalculated with current prestige).
            // For more accuracy, save property levels and calculate based on that with current prestige.
            // For now, using the already recalculated totalIPS after loading prestige is a good approximation.
            offlineIPS = totalIPS; // Uses totalIPS as recalculated with current prestige from loaded save

            if (offlineIPS > 0 && offlineSecondsToCalculate > 10) {
                let offlineEarnings = offlineIPS * offlineSecondsToCalculate;
                // Example: if 'warpedTime_multiplier' prestige upgrade exists
                // offlineEarnings *= (1 + (prestigeUpgrades['warpedTime_multiplier'] || 0) * 0.05);

                gold += offlineEarnings;

                const welcomeMessage = document.createElement('div');
                welcomeMessage.className = 'offline-progress-popup';
                welcomeMessage.innerHTML = `
                    <h3>Welcome Back, Tycoon!</h3>
                    <p>While you were away for ${formatTime(timeDiffSeconds)},</p>
                    <p>you earned <span class="highlight">${formatNumber(offlineEarnings, true)}</span> Gold!</p>
                    <p>(Offline earnings based on current upgrades, capped at ${formatTime(maxOfflineSeconds)}).</p>
                    <button id="closeOfflinePopup">Awesome!</button>
                `;
                document.body.appendChild(welcomeMessage);
                document.getElementById('closeOfflinePopup').addEventListener('click', () => {
                    welcomeMessage.remove();
                });
            }
        }

        loadPropertiesForSale();
        renderOwnedProperties();
        renderAchievements();
        renderPrestigeShop(); // Render prestige shop (initially placeholder)
        updateDisplays();
        checkAscendEligibility(); // Initial check for ascend button state

        if (ascendButton) ascendButton.addEventListener('click', performAscension);

        setInterval(gameLoop, 1000);
        setInterval(saveGame, 30000);
        window.addEventListener('beforeunload', saveGame);
    }

    function gameLoop() {
        let incomeThisTick = totalIPS;
        if (incomeThisTick > 0) {
            gold += incomeThisTick;
            totalGoldEarnedThisRun += incomeThisTick;
        }
        updateDisplays();
        updatePurchaseButtonStates();
        updateUpgradeButtonStates();
        checkAllAchievements();
        checkAscendEligibility();
    }

    // --- TAB NAVIGATION ---
    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });
    }

    // --- PROPERTY MANAGEMENT ---
    function calculateBulkPurchaseCost(propertyId, quantityToBuy) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return Infinity;
        let currentOwned = ownedProperties[propertyId] ? ownedProperties[propertyId].quantity : 0;
        let totalCost = 0;
        const costReductionMultiplier = getPrestigeUpgradeEffect('efficientRealms');

        for (let i = 0; i < quantityToBuy; i++) {
            totalCost += Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, currentOwned + i) * costReductionMultiplier);
        }
        return totalCost;
    }

    function calculateMaxAffordableQuantity(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return 0;
        let currentOwned = ownedProperties[propertyId] ? ownedProperties[propertyId].quantity : 0;
        let tempGold = gold;
        let quantityCanBuy = 0;
        const costReductionMultiplier = getPrestigeUpgradeEffect('efficientRealms');
        let costForNext = Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, currentOwned + quantityCanBuy) * costReductionMultiplier);

        while (tempGold >= costForNext && costForNext > 0) { // Ensure costForNext is positive to prevent infinite loop if free
            tempGold -= costForNext;
            quantityCanBuy++;
            costForNext = Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, currentOwned + quantityCanBuy) * costReductionMultiplier);
            if (quantityCanBuy > 2500) break; // Safety break
        }
        return quantityCanBuy;
    }

    function purchaseProperty(propertyId, quantity = 1) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return;

        let cost;
        let actualQuantityToBuy = typeof quantity === 'string' && quantity.toUpperCase() === 'MAX' ?
                                 calculateMaxAffordableQuantity(propertyId) :
                                 parseInt(quantity) || 1;

        if (actualQuantityToBuy === 0) {
            console.log("Cannot afford or buy 0 units of " + propData.name);
            return;
        }
        cost = calculateBulkPurchaseCost(propertyId, actualQuantityToBuy);

        if (gold >= cost) {
            gold -= cost;
            if (!ownedProperties[propertyId]) {
                ownedProperties[propertyId] = {
                    quantity: 0, level: 0,
                    currentIncomePerUnit: propData.baseIncome,
                    currentUpgradeCost: propData.upgradeCost * getPrestigeUpgradeEffect('efficientRealms') // Apply cost reduction to initial upgrade cost
                };
            }
            ownedProperties[propertyId].quantity += actualQuantityToBuy;
            // totalIPS is updated via recalculateTotalIPS to ensure prestige bonuses are included
            recalculateTotalIPS();

            loadPropertiesForSale();
            renderOwnedProperties();
            updateDisplays();
            checkAllAchievements();
        } else {
            // console.log(`Not enough gold to purchase ${actualQuantityToBuy} of ${propData.name}`);
        }
    }

    function calculateNextLevelIncome(propertyId, currentUnitIncome) { // Unchanged
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return currentUnitIncome;
        return currentUnitIncome * propData.upgradeIncomeMultiplier;
    }

    function calculateUpgradeCost(propertyId) { // Modified to include prestige cost reduction
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];
        if (!propData || !ownedProp) return Infinity;
        const costReductionMultiplier = getPrestigeUpgradeEffect('efficientRealms');
        return Math.floor(propData.upgradeCost * Math.pow(propData.upgradeCostMultiplier, ownedProp.level) * costReductionMultiplier);
    }


    function upgradeProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];
        if (!ownedProp || ownedProp.quantity === 0 || ownedProp.level >= propData.maxLevel) return;

        const currentUpgradeCost = calculateUpgradeCost(propertyId); // Recalculate with potential prestige discount

        if (gold >= currentUpgradeCost) {
            gold -= currentUpgradeCost;
            ownedProp.level++;
            ownedProp.currentIncomePerUnit *= propData.upgradeIncomeMultiplier;
            ownedProp.currentUpgradeCost = calculateUpgradeCost(propertyId); // Update for next level with discount

            recalculateTotalIPS();
            renderOwnedProperties();
            updateDisplays();
            updatePurchaseButtonStates(); // Gold changed
            checkAllAchievements();
        }
    }


    // --- UI RENDERING & UPDATES ---
    function updateDisplays() {
        goldDisplay.textContent = formatNumber(gold, true);
        ipsDisplay.textContent = formatNumber(totalIPS, false);
        if (totalRealmShardsDisplay) totalRealmShardsDisplay.textContent = formatNumber(realmShards, true);
        if (timesAscendedDisplay) timesAscendedDisplay.textContent = timesAscended.toString();
    }

    function loadPropertiesForSale() {
        propertiesContainer.innerHTML = '';
        window.gameProperties.forEach(prop => {
            const cost1 = calculateBulkPurchaseCost(prop.id, 1);
            const card = document.createElement('div');
            card.classList.add('property-card', `tier-${prop.tier}`);
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                <span class="tier-indicator tier-${prop.tier}">Tier ${prop.tier}</span>
                <h3>${prop.name}</h3>
                <p class="description">${prop.description}</p>
                <p>Cost (x1): <span id="cost-${prop.id}" class="property-cost ${gold >= cost1 ? 'affordable' : 'unaffordable'}">${formatNumber(cost1, true)}</span> Gold</p>
                <p>Base Income: ${formatNumber(prop.baseIncome, false)} IPS / unit</p>
            `;
            card.appendChild(contentDiv);
            const buyButtonsDiv = document.createElement('div');
            buyButtonsDiv.className = 'buy-options';
            [1, 10, 25, 'MAX'].forEach(qty => {
                const btn = document.createElement('button');
                btn.dataset.propertyId = prop.id;
                btn.dataset.quantity = qty;
                btn.classList.add('buy-multiple-button');
                btn.addEventListener('click', () => purchaseProperty(prop.id, qty));
                buyButtonsDiv.appendChild(btn); // Text and disabled state handled by updatePurchaseButtonStates
            });
            card.appendChild(buyButtonsDiv);
            propertiesContainer.appendChild(card);
        });
        updatePurchaseButtonStates();
    }

    function renderOwnedProperties() {
        ownedPropertiesContainer.innerHTML = '';
        let hasOwned = false;
        for (const propId in ownedProperties) {
            if (ownedProperties[propId] && ownedProperties[propId].quantity > 0) {
                hasOwned = true;
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];
                const progressPercent = (ownedProp.level / propData.maxLevel) * 100;
                const currentUpgradeCost = calculateUpgradeCost(propId); // Recalculate with potential prestige discount
                const isUpgradeAffordable = gold >= currentUpgradeCost;

                let upgradeHtmlSection = `<p style="text-align:center; margin-top: 20px;">Max Level Reached!</p>`;
                if (ownedProp.level < propData.maxLevel) {
                    const nextLevelIncomePerUnit = calculateNextLevelIncome(propId, ownedProp.currentIncomePerUnit);
                    const incomeGainPerUnit = nextLevelIncomePerUnit - ownedProp.currentIncomePerUnit;
                    const totalIncomeGain = incomeGainPerUnit * ownedProp.quantity;
                    upgradeHtmlSection = `
                        <p>Upgrade Cost: <span id="upgrade-cost-${propId}" class="property-cost ${isUpgradeAffordable ? 'affordable' : 'unaffordable'}">${formatNumber(currentUpgradeCost, true)}</span> Gold</p>
                        <p class="income-gain">Next Lvl Income/Unit: ${formatNumber(nextLevelIncomePerUnit, false)} IPS</p>
                        <p class="income-gain">IPS Gain per Unit: +${formatNumber(incomeGainPerUnit, false)}</p>
                        <p class="income-gain">Total IPS Gain (x${ownedProp.quantity}): +${formatNumber(totalIncomeGain, false)}</p>
                        <button id="upgrade-${propId}" data-property-id="${propId}" class="upgrade-button ${isUpgradeAffordable ? 'btn-affordable' : ''}">Upgrade (Lvl ${ownedProp.level + 1})</button>
                    `;
                }
                const card = document.createElement('div');
                card.classList.add('property-card', 'owned-property', `tier-${propData.tier}`);
                card.innerHTML = `
                    <div>
                        <span class="tier-indicator tier-${propData.tier}">Tier ${propData.tier}</span>
                        <h3>${propData.name} (x${ownedProp.quantity})</h3>
                        <div class="owned-property-details">
                            <p>Level: <span id="level-${propId}">${ownedProp.level}</span> / ${propData.maxLevel}</p>
                            <div class="level-progress-container">
                                <div class="level-progress-bar" style="width: ${progressPercent}%;">
                                    ${ownedProp.level > 0 && progressPercent > 10 ? Math.floor(progressPercent)+'%' : ''}
                                </div>
                            </div>
                            <p>Current Income/Unit: ${formatNumber(ownedProp.currentIncomePerUnit * getPrestigeUpgradeEffect('cosmicBlessing'), false)} IPS</p>
                            <p>Total Income from Type: ${formatNumber(ownedProp.currentIncomePerUnit * ownedProp.quantity * getPrestigeUpgradeEffect('cosmicBlessing'), false)} IPS</p>
                        </div>
                        ${upgradeHtmlSection}
                    </div>
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
        const ownedSectionTitle = document.querySelector('#ownedPropertiesTabContent #owned-properties-section-content h2');
        if (ownedSectionTitle) {
            ownedSectionTitle.style.display = hasOwned ? 'block' : 'none';
            if (!hasOwned && ownedPropertiesContainer.innerHTML === '') {
                ownedPropertiesContainer.innerHTML = '<p style="text-align:center; color: var(--text-light-tertiary);">You do not own any properties yet. Purchase some from the "Available Properties" tab!</p>';
            }
        }
        updateUpgradeButtonStates();
    }


    function updatePurchaseButtonStates() {
        window.gameProperties.forEach(prop => {
            const cost1Display = document.getElementById(`cost-${prop.id}`);
            if (cost1Display) {
                const cost1 = calculateBulkPurchaseCost(prop.id, 1);
                cost1Display.textContent = formatNumber(cost1, true);
                cost1Display.classList.toggle('affordable', gold >= cost1);
                cost1Display.classList.toggle('unaffordable', gold < cost1);
            }

            const buyButtonsForProp = document.querySelectorAll(`.buy-multiple-button[data-property-id="${prop.id}"]`);
            buyButtonsForProp.forEach(button => {
                const qty = button.dataset.quantity;
                let isAffordable;
                let costForQty;

                if (qty.toUpperCase() === 'MAX') {
                    const maxQty = calculateMaxAffordableQuantity(prop.id);
                    button.textContent = `Buy Max (${maxQty})`;
                    isAffordable = maxQty > 0;
                } else {
                    const numQty = parseInt(qty);
                    button.textContent = `Buy x${numQty}`;
                    costForQty = calculateBulkPurchaseCost(prop.id, numQty);
                    isAffordable = gold >= costForQty;
                    if (numQty > 1) button.title = `Cost: ${formatNumber(costForQty, true)}`;
                }
                button.disabled = !isAffordable;
                button.classList.toggle('btn-affordable', isAffordable);
            });
        });
    }

    function updateUpgradeButtonStates() {
        for (const propId in ownedProperties) {
            if (ownedProperties[propId] && ownedProperties[propId].quantity > 0) {
                const propData = window.gameProperties.find(p => p.id === propId);
                const ownedProp = ownedProperties[propId];
                const button = document.getElementById(`upgrade-${propId}`); // Query whole document
                const costDisplay = document.getElementById(`upgrade-cost-${propId}`);

                if (button) { // Exists if not max level
                    if (ownedProp.level >= propData.maxLevel) {
                        button.disabled = true;
                        button.classList.remove('btn-affordable');
                    } else {
                        const currentUpgradeCost = calculateUpgradeCost(propId); // Recalculate with prestige
                        const isAffordable = gold >= currentUpgradeCost;
                        button.disabled = !isAffordable;
                        button.classList.toggle('btn-affordable', isAffordable);
                        if (costDisplay) { // Update cost display
                            costDisplay.textContent = formatNumber(currentUpgradeCost, true);
                            costDisplay.classList.toggle('affordable', isAffordable);
                            costDisplay.classList.toggle('unaffordable', !isAffordable);
                        }
                    }
                }
            }
        }
    }

    // --- ACHIEVEMENTS ---
    function getCurrentGameState() {
        return { gold, totalIPS, ownedProperties, timesAscended, realmShards, totalGoldEarnedThisRun };
    }

    function checkAllAchievements() {
        if (!window.achievementsList) return;
        const gameState = getCurrentGameState();
        let newAchievementUnlocked = false;
        window.achievementsList.forEach(ach => {
            if (!ach.unlocked && ach.condition(gameState)) {
                ach.unlocked = true;
                newAchievementUnlocked = true;
                if (ach.onUnlock) ach.onUnlock(gameState);
                showNotification(`Achievement Unlocked: ${ach.icon} ${ach.name}!`);
            }
        });
        if (newAchievementUnlocked) {
            renderAchievements();
            saveGame(); // Save new achievement status
        }
    }

    function showNotification(message) {
        const area = notificationArea || createNotificationArea(); // Ensure area exists
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.textContent = message;
        area.prepend(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 4500);
    }

    function createNotificationArea() { // Only if #notificationArea isn't in HTML
        let area = document.getElementById('notificationArea');
        if (!area) {
            area = document.createElement('div');
            area.id = 'notificationArea';
            document.body.appendChild(area);
        }
        return area;
    }

    function renderAchievements() {
        if (!achievementsContainer || !window.achievementsList) return;
        achievementsContainer.innerHTML = '';
        window.achievementsList.forEach(ach => {
            const achDiv = document.createElement('div');
            achDiv.className = `achievement-card ${ach.unlocked ? 'unlocked' : ''}`;
            achDiv.innerHTML = `
                <span class="achievement-icon">${ach.icon}</span>
                <div class="achievement-info">
                    <h4>${ach.name}</h4>
                    <p>${ach.description}</p>
                </div>
                <span class="achievement-status">${ach.unlocked ? 'Unlocked!' : 'Locked'}</span>
            `;
            achievementsContainer.appendChild(achDiv);
        });
    }

    // --- ASCENDANCY ---
    function getAscendGoldRequirement() {
        const baseReq = ASCEND_GOLD_REQUIREMENT_FIRST;
        if (timesAscended === 0) return baseReq;
        return baseReq * Math.pow(ASCEND_GOLD_REQUIREMENT_SUBSEQUENT_FACTOR, timesAscended);
    }

    function calculatePotentialRealmShards() {
        const requirement = getAscendGoldRequirement();
        // Require meeting the current gold goal before calculating shards based on a potentially lower base
        if (totalGoldEarnedThisRun < requirement && totalGoldEarnedThisRun < REALM_SHARD_CALC_BASE_GOLD) {
             return 0; // Don't show potential shards if way below any meaningful threshold
        }

        const baseForCalc = totalGoldEarnedThisRun / REALM_SHARD_CALC_BASE_GOLD;
        if (baseForCalc <= 0) return 0;

        // Using log10(baseForCalc) + 1 ensures that if baseForCalc is 1 (meaning totalGoldEarnedThisRun = REALM_SHARD_CALC_BASE_GOLD),
        // log10 is 0, so (0+1)^POWER = 1. This gives a base value.
        let shards = Math.floor(
            Math.pow(Math.max(0, Math.log10(baseForCalc)) + 1, REALM_SHARD_CALC_POWER) * REALM_SHARD_CALC_MULTIPLIER
        );

        shards *= getPrestigeUpgradeEffect('shardHoarder'); // Apply Shard Hoarder bonus
        return Math.max(0, Math.floor(shards));
    }


    function checkAscendEligibility() {
        const requirement = getAscendGoldRequirement();
        const canAscend = totalGoldEarnedThisRun >= requirement;

        if (goldRequiredForAscendDisplay) goldRequiredForAscendDisplay.textContent = formatNumber(requirement, true);
        if (currentGoldForAscendDisplay) currentGoldForAscendDisplay.textContent = formatNumber(totalGoldEarnedThisRun, true);
        if (potentialShardsDisplay) potentialShardsDisplay.textContent = formatNumber(calculatePotentialRealmShards(), true);


        if (ascendButton) {
            ascendButton.disabled = !canAscend;
            if (canAscend) {
                ascendButton.classList.add('btn-affordable');
                ascendButton.textContent = `ASCEND! (+${formatNumber(calculatePotentialRealmShards(), true)} Realm Shards)`;
                if(ascendancyInfoDiv) ascendancyInfoDiv.innerHTML = `<p>You are ready to Ascend! This will reset your current run's progress (Gold, Properties, Upgrades) but grant you Realm Shards for powerful permanent upgrades.</p>`;
                if (ascendReadyNotification && ascendReadyNotification.style.display === 'none') {
                    ascendReadyNotification.style.display = 'block';
                    showNotification("✨ Ascendancy Unlocked! Visit the Ascendancy tab to proceed! ✨");
                }
            } else {
                ascendButton.classList.remove('btn-affordable');
                ascendButton.textContent = 'Reach Ascension Goal';
                if(ascendancyInfoDiv) ascendancyInfoDiv.innerHTML = `<p>Reach ${formatNumber(requirement, true)} total Gold earned in this run to Ascend.</p>`;
            }
        }
    }

    function performAscension() {
        const requirement = getAscendGoldRequirement();
        if (totalGoldEarnedThisRun < requirement) {
            showNotification("You are not yet ready to Ascend!");
            return;
        }
        if (!confirm(`Are you sure you want to Ascend?\n\nThis will reset your current run's Gold, Properties, and Property Upgrades.\nYou will gain approximately ${formatNumber(calculatePotentialRealmShards(), true)} Realm Shards for powerful permanent upgrades.\n\nAchievements and unlocked Prestige Upgrades will be kept.`)) {
            return;
        }

        const shardsGained = calculatePotentialRealmShards();
        realmShards += shardsGained;
        timesAscended++;

        // Reset Core Game State for the new run
        gold = 0; // TODO: Apply 'Starting Gold' prestige upgrade
        // gold = getPrestigeUpgradeEffect('startingGold', 0); // Example with default
        ownedProperties = {};
        totalGoldEarnedThisRun = 0;
        // totalIPS will be recalculated to 0 correctly by recalculateTotalIPS()

        recalculateTotalIPS(); // This will set totalIPS to 0 based on empty ownedProperties

        showNotification(`✨ Congratulations! You have Ascended (Run #${timesAscended}) and gained ${formatNumber(shardsGained, true)} Realm Shards! ✨`);

        saveGame(); // Save the new ascended state (importantly, realmShards, timesAscended, and reset values)

        // Refresh UI completely for the new run
        loadPropertiesForSale(); // Reset available properties to initial costs (factoring in prestige cost reduction)
        renderOwnedProperties(); // Will be empty
        renderAchievements(); // Achievements remain, so re-render
        renderPrestigeShop(); // Update shop with new RS total and upgrade states
        updateDisplays(); // Show 0 gold, 0 IPS, updated RS
        checkAscendEligibility(); // Update Ascend button (will be disabled)

        if (ascendReadyNotification) ascendReadyNotification.style.display = 'none'; // Hide "ready" notification

        console.log(`Ascended! New RS total: ${realmShards}, Times Ascended: ${timesAscended}`);
    }

    function renderPrestigeShop() {
        if (!prestigeUpgradeShopContainer || !window.prestigeUpgradesList) {
            if(prestigeUpgradeShopContainer) prestigeUpgradeShopContainer.innerHTML = '<p>Prestige upgrade data not loaded. Shop unavailable.</p>';
            return;
        }
        prestigeUpgradeShopContainer.innerHTML = ''; // Clear previous

        window.prestigeUpgradesList.forEach(upgradeData => {
            const currentLevel = prestigeUpgrades[upgradeData.id] || 0;
            const cost = upgradeData.costFormula(currentLevel);
            const canAfford = realmShards >= cost;
            const isMaxLevel = upgradeData.maxLevel !== null && currentLevel >= upgradeData.maxLevel;

            const card = document.createElement('div');
            card.className = 'prestige-upgrade-card';
            if(isMaxLevel) card.classList.add('maxed-out');

            let effectDescription = typeof upgradeData.description === 'function' ?
                                    upgradeData.description(currentLevel) :
                                    upgradeData.description;
            if(isMaxLevel) effectDescription += " (MAXED)";


            card.innerHTML = `
                <h4>${upgradeData.name} ${isMaxLevel ? '' : `(Lvl ${currentLevel})`}</h4>
                <p>${effectDescription}</p>
                ${!isMaxLevel ? `
                    <p class="cost">Next Lvl Cost: ${formatNumber(cost, true)} RS</p>
                    <button class="buy-prestige-upgrade ${canAfford ? 'btn-affordable' : ''}" data-upgrade-id="${upgradeData.id}" ${!canAfford || isMaxLevel ? 'disabled' : ''}>
                        ${isMaxLevel ? 'Max Level' : 'Upgrade'}
                    </button>
                ` : '<p class="cost">Max Level Reached!</p>'}
            `;
            prestigeUpgradeShopContainer.appendChild(card);

            if (!isMaxLevel) {
                card.querySelector('.buy-prestige-upgrade').addEventListener('click', () => buyPrestigeUpgrade(upgradeData.id));
            }
        });
    }

    function buyPrestigeUpgrade(upgradeId) {
        const upgradeData = window.prestigeUpgradesList.find(u => u.id === upgradeId);
        if (!upgradeData) return;

        let currentLevel = prestigeUpgrades[upgradeId] || 0;
        if (upgradeData.maxLevel !== null && currentLevel >= upgradeData.maxLevel) {
            showNotification("This upgrade is already at its maximum level!");
            return;
        }

        const cost = upgradeData.costFormula(currentLevel);
        if (realmShards >= cost) {
            realmShards -= cost;
            currentLevel++;
            prestigeUpgrades[upgradeId] = currentLevel;

            showNotification(`${upgradeData.name} upgraded to Level ${currentLevel}!`);
            saveGame();
            updateDisplays(); // Update RS display
            renderPrestigeShop(); // Re-render shop to show new costs/levels
            recalculateTotalIPS(); // Some prestige upgrades might affect IPS immediately
            // Also need to potentially update costs for properties if cost reduction was bought
            loadPropertiesForSale();
            renderOwnedProperties(); // To update displayed upgrade costs if efficientRealms changed
        } else {
            showNotification("Not enough Realm Shards to purchase this upgrade!");
        }
    }


    // --- UTILITIES ---
    function formatNumber(num, floorOutputForDisplay) {
        let numToFormat = num;
        if (floorOutputForDisplay && Math.abs(numToFormat) < 1000 && numToFormat % 1 !== 0) { // Floor only if display needs int AND it's not yet K/M/B
             numToFormat = Math.floor(numToFormat);
        } else if (!floorOutputForDisplay && Math.abs(numToFormat) < 1 && Math.abs(numToFormat) > 0) { // for IPS < 1, show 2 decimals
            return numToFormat.toFixed(2);
        } else if (!floorOutputForDisplay && Math.abs(numToFormat) < 1000 && numToFormat % 1 !== 0) { // for IPS 1-999 with decimal
             return numToFormat.toFixed(1);
        } else if (Math.abs(numToFormat) < 1000 ) { // for whole numbers < 1000 or floored numbers
            return Math.floor(numToFormat).toString();
        }


        let baseNumForSuffix = num; // Use original num for suffix calculation for precision
        const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
        const i = Math.max(0, Math.min(suffixes.length - 1, Math.floor(Math.log10(Math.abs(baseNumForSuffix)) / 3)));

        if (i === 0) { // Should be caught by < 1000, but as a robust fallback
             return floorOutputForDisplay ? Math.floor(baseNumForSuffix).toString() : baseNumForSuffix.toFixed(1);
        }

        let shortNum = (baseNumForSuffix / Math.pow(1000, i));
        // Show 1 decimal for K/M/B unless it's a whole number like 1.0M -> 1M
        if (shortNum.toFixed(1).endsWith('.0')) {
            return shortNum.toFixed(0) + suffixes[i];
        }
        return shortNum.toFixed(1) + suffixes[i];
    }

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        let result = "";
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (seconds >= 0 || (hours === 0 && minutes === 0)) result += `${seconds}s`; // show 0s if everything is 0
        return result.trim() || "0s";
    }

    // Start the game
    initGame();
});
