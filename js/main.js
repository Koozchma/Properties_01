// js/main.js
document.addEventListener('DOMContentLoaded', () => {
    // Game State Variables
    let gold = 0.0;
    let totalIPS = 0.0;
    let ownedProperties = {};

    // Prestige State Variables
    let totalGoldEarnedThisRun = 0.0;
    let timesAscended = 0;
    let realmShards = 0;
    window.prestigeUpgrades = {}; // Global for access by prestige_upgrades.js descriptions

    // Constants
    const SAVE_KEY_PREFIX = 'realmTycoon_v1.1'; // Added a version to key in case of structure changes
    const GAME_STATE_KEY = SAVE_KEY_PREFIX + 'gameState';
    const BASE_STARTING_GOLD = 10;
    const ASCEND_GOLD_REQUIREMENT_FIRST = 1e15; // 1 Quadrillion
    const ASCEND_GOLD_REQUIREMENT_SUBSEQUENT_FACTOR = 5;
    const REALM_SHARD_CALC_BASE_GOLD = 1e12; // Gold threshold for shard formula to kick in meaningfully
    const REALM_SHARD_CALC_POWER = 1.8;
    const REALM_SHARD_CALC_MULTIPLIER = 3;
    const BASE_OFFLINE_SECONDS_CAP = 3 * 60 * 60; // 2 hours

    // DOM Elements
    const goldDisplay = document.getElementById('goldDisplay');
    const ipsDisplay = document.getElementById('ipsDisplay');
    const propertiesContainer = document.getElementById('propertiesContainer');
    const ownedPropertiesContainer = document.getElementById('ownedPropertiesContainer');
    const achievementsContainer = document.getElementById('achievementsContainer');
    const currentYearSpan = document.getElementById('currentYear');
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
    const shopRealmShardsDisplay = document.getElementById('shopRealmShardsDisplay');
    const timesAscendedDisplay = document.getElementById('timesAscendedDisplay');
    const ascendReadyNotification = document.getElementById('ascendReadyNotification');
    const prestigeUpgradeShopContainer = document.getElementById('prestigeUpgradeShop');


    // --- PRESTIGE UPGRADE EFFECT GETTERS ---
    function getPrestigeUpgradeLevel(upgradeId) {
        return window.prestigeUpgrades[upgradeId] || 0;
    }

    function getGlobalIncomeBonus() {
        const level = getPrestigeUpgradeLevel('cosmicBlessing');
        const upgradeData = window.prestigeUpgradesList && window.prestigeUpgradesList.find(upg => upg.id === 'cosmicBlessing');
        return upgradeData ? upgradeData.effectValueFunction(level) : 0;
    }

    function getGlobalCostReduction() {
        const level = getPrestigeUpgradeLevel('efficientRealms');
        const upgradeData = window.prestigeUpgradesList && window.prestigeUpgradesList.find(upg => upg.id === 'efficientRealms');
        return upgradeData ? upgradeData.effectValueFunction(level) : 0;
    }

    function getStartingGoldBonus() {
        const level = getPrestigeUpgradeLevel('startingGoldBoost');
        const upgradeData = window.prestigeUpgradesList && window.prestigeUpgradesList.find(upg => upg.id === 'startingGoldBoost');
        return upgradeData ? upgradeData.effectValueFunction(level) : 0;
    }

    function getRealmShardGainBonus() {
        const level = getPrestigeUpgradeLevel('shardHoarder');
        const upgradeData = window.prestigeUpgradesList && window.prestigeUpgradesList.find(upg => upg.id === 'shardHoarder');
        return upgradeData ? upgradeData.effectValueFunction(level) : 0;
    }

    function getOfflineTimeCapBonusSeconds() {
        const level = getPrestigeUpgradeLevel('offlineTimeCapBoost');
        const upgradeData = window.prestigeUpgradesList && window.prestigeUpgradesList.find(upg => upg.id === 'offlineTimeCapBoost');
        return upgradeData ? upgradeData.effectValueFunction(level) : 0;
    }

    function getOfflineMultiplierBonus() {
        const level = getPrestigeUpgradeLevel('offlineMultiplierBoost');
        const upgradeData = window.prestigeUpgradesList && window.prestigeUpgradesList.find(upg => upg.id === 'offlineMultiplierBoost');
        return upgradeData ? upgradeData.effectValueFunction(level) : 0;
    }


    // --- CORE GAME FUNCTIONS ---
    function saveGame() {
        const gameState = {
            gold: gold,
            ownedProperties: ownedProperties,
            achievements: window.achievementsList ? window.achievementsList.map(a => ({ id: a.id, unlocked: a.unlocked })) : [],
            lastSaveTimestamp: Date.now(),
            totalGoldEarnedThisRun: totalGoldEarnedThisRun,
            timesAscended: timesAscended,
            realmShards: realmShards,
            prestigeUpgrades: window.prestigeUpgrades
        };
        try {
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
        } catch (e) {
            console.error("Error saving game:", e);
            showNotification("Error: Could not save game! Storage might be full.", true);
        }
    }

    function loadGame() {
        try {
            const savedStateJSON = localStorage.getItem(GAME_STATE_KEY);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                gold = parseFloat(savedState.gold) || 0;
                ownedProperties = {};
                if (savedState.ownedProperties) {
                    for (const propId in savedState.ownedProperties) {
                        if (savedState.ownedProperties[propId]) {
                            const savedProp = savedState.ownedProperties[propId];
                            ownedProperties[propId] = {
                                quantity: parseInt(savedProp.quantity) || 0, level: parseInt(savedProp.level) || 0,
                                currentIncomePerUnit: parseFloat(savedProp.currentIncomePerUnit) || 0,
                                currentUpgradeCost: parseFloat(savedProp.currentUpgradeCost) || 0
                            };
                            const propData = window.gameProperties.find(p => p.id === propId);
                            if (propData) {
                                if (ownedProperties[propId].level === 0 && ownedProperties[propId].currentIncomePerUnit === 0 && propData.baseIncome > 0)
                                    ownedProperties[propId].currentIncomePerUnit = propData.baseIncome;
                                if (ownedProperties[propId].level === 0 && ownedProperties[propId].currentUpgradeCost === 0 && propData.upgradeCost > 0)
                                    ownedProperties[propId].currentUpgradeCost = propData.upgradeCost;
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
                window.prestigeUpgrades = savedState.prestigeUpgrades || {};
                recalculateTotalIPS();
                console.log("Game Loaded!");
                return savedState;
            }
        } catch (e) {
            console.error("Error loading game:", e); showNotification("Error loading save. Starting fresh.", true);
            localStorage.removeItem(GAME_STATE_KEY);
        }
        gold = BASE_STARTING_GOLD + getStartingGoldBonus(); // Apply bonus even on fresh start if somehow loaded prestige
        totalIPS = 0; ownedProperties = {}; totalGoldEarnedThisRun = 0; timesAscended = 0; realmShards = 0; window.prestigeUpgrades = {};
        if(window.achievementsList) window.achievementsList.forEach(ach => ach.unlocked = false);
        recalculateTotalIPS();
        return null;
    }

    function initGame() {
        if(currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();
        setupTabs();
        const loadedState = loadGame();

        if (loadedState && loadedState.lastSaveTimestamp) {
            const timeDiffSeconds = Math.floor((Date.now() - loadedState.lastSaveTimestamp) / 1000);
            const maxOfflineSeconds = BASE_OFFLINE_SECONDS_CAP + getOfflineTimeCapBonusSeconds();
            const offlineSecondsToCalculate = Math.min(timeDiffSeconds, maxOfflineSeconds);
            const offlineMultiplier = 1 + getOfflineMultiplierBonus();
            if (totalIPS > 0 && offlineSecondsToCalculate > 10) {
                const offlineEarnings = totalIPS * offlineSecondsToCalculate * offlineMultiplier;
                gold += offlineEarnings;
                totalGoldEarnedThisRun += offlineEarnings;
                const welcomeMessage = document.createElement('div');
                welcomeMessage.className = 'offline-progress-popup';
                welcomeMessage.innerHTML = `
                    <h3>Welcome Back, Tycoon!</h3>
                    <p>While you were away for ${formatTime(timeDiffSeconds)},</p>
                    <p>you earned <span class="highlight">${formatNumber(offlineEarnings, true)}</span> Gold!</p>
                    <p>(Calculated for ${formatTime(offlineSecondsToCalculate)} at ${formatNumber(totalIPS * offlineMultiplier, false)} effective IPS).</p>
                    <button id="closeOfflinePopup">Awesome!</button>
                `;
                document.body.appendChild(welcomeMessage);
                document.getElementById('closeOfflinePopup').addEventListener('click', () => welcomeMessage.remove());
            }
        }
        if (timesAscended === 0 && getStartingGoldBonus() === 0 && gold < BASE_STARTING_GOLD) {
            gold = BASE_STARTING_GOLD;
        } else if (timesAscended > 0 && gold < (BASE_STARTING_GOLD + getStartingGoldBonus()) ) {
             // Ensure starting gold bonus is applied if loading a just-ascended state with 0 gold
            if (gold < getStartingGoldBonus() + BASE_STARTING_GOLD) gold = getStartingGoldBonus() + BASE_STARTING_GOLD;
        }


        loadPropertiesForSale();
        renderOwnedProperties();
        renderAchievements();
        renderPrestigeShop();
        updateDisplays();
        checkAscendEligibility();
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

    function updateDisplays() {
        goldDisplay.textContent = formatNumber(gold, true);
        ipsDisplay.textContent = formatNumber(totalIPS, false);
        if (totalRealmShardsDisplay) totalRealmShardsDisplay.textContent = formatNumber(realmShards, true);
        if (shopRealmShardsDisplay) shopRealmShardsDisplay.textContent = formatNumber(realmShards, true);
        if (timesAscendedDisplay) timesAscendedDisplay.textContent = timesAscended;
        if (potentialShardsDisplay) potentialShardsDisplay.textContent = formatNumber(calculatePotentialRealmShards(), true);
        if (currentGoldForAscendDisplay) currentGoldForAscendDisplay.textContent = formatNumber(totalGoldEarnedThisRun, true);
        if (goldRequiredForAscendDisplay) goldRequiredForAscendDisplay.textContent = formatNumber(getAscendGoldRequirement(), true);
    }

    function setupTabs() {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                button.classList.add('active');
                const targetTabId = button.dataset.tab;
                const targetPanel = document.getElementById(targetTabId);
                if (targetPanel) targetPanel.classList.add('active');
                if (targetTabId === 'achievementsTabContent') renderAchievements();
                if (targetTabId === 'ascendancyTabContent') { renderPrestigeShop(); checkAscendEligibility(); }
            });
        });
    }

    function formatTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        let result = "";
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (seconds >= 0 && result === "") result += `${seconds}s`;
        else if (seconds > 0 || (hours === 0 && minutes === 0 && seconds === 0)) result += `${seconds}s`; // Ensure "0s" is shown if time is 0
        return result.trim() || "0s";
    }

    // --- PROPERTY FUNCTIONS ---
    function applyPrestigeIncomeBonus(basePropertyIncome) {
        return basePropertyIncome * (1 + getGlobalIncomeBonus());
    }

    function calculateEffectiveCost(baseCost) {
        return baseCost * Math.max(0.01, (1 - getGlobalCostReduction()));
    }

    function recalculateTotalIPS() {
        totalIPS = 0;
        for (const propId in ownedProperties) {
            if (ownedProperties[propId] && ownedProperties[propId].quantity > 0) {
                const effectiveUnitIncome = applyPrestigeIncomeBonus(ownedProperties[propId].currentIncomePerUnit);
                totalIPS += effectiveUnitIncome * ownedProperties[propId].quantity;
            }
        }
    }

    function calculateBulkPurchaseCost(propertyId, quantityToBuy) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return Infinity;
        let currentOwned = ownedProperties[propertyId] ? ownedProperties[propertyId].quantity : 0;
        let totalEffectiveCost = 0;
        for (let i = 0; i < quantityToBuy; i++) {
            const individualBaseCost = Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, currentOwned + i));
            totalEffectiveCost += calculateEffectiveCost(individualBaseCost);
        }
        return Math.floor(totalEffectiveCost);
    }

    function calculateMaxAffordableQuantity(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return 0;
        let currentOwned = ownedProperties[propertyId] ? ownedProperties[propertyId].quantity : 0;
        let tempGold = gold;
        let quantityCanBuy = 0;
        for (let i = 0; i < 2500; i++) {
            const nextUnitBaseCost = Math.floor(propData.baseCost * Math.pow(propData.costMultiplier, currentOwned + quantityCanBuy));
            const costForNext = Math.floor(calculateEffectiveCost(nextUnitBaseCost));
            if (tempGold >= costForNext && costForNext > 0) { // Ensure costForNext is positive to prevent infinite loop on free items
                tempGold -= costForNext;
                quantityCanBuy++;
            } else {
                break;
            }
        }
        return quantityCanBuy;
    }

    function loadPropertiesForSale() {
        if (!propertiesContainer) return;
        propertiesContainer.innerHTML = '';
        if (!window.gameProperties) { console.error("gameProperties not loaded!"); return; }
        window.gameProperties.forEach(prop => {
            const cost1 = calculateBulkPurchaseCost(prop.id, 1);
            const isAffordable1 = gold >= cost1;
            const card = document.createElement('div');
            card.classList.add('property-card', `tier-${prop.tier}`);
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = `
                <span class="tier-indicator tier-${prop.tier}">Tier ${prop.tier}</span>
                <h3>${prop.name}</h3>
                <p class="description">${prop.description}</p>
                <p>Cost (x1): <span id="cost-${prop.id}" class="property-cost ${isAffordable1 ? 'affordable' : 'unaffordable'}">${formatNumber(cost1, true)}</span> Gold</p>
                <p>Base Income: ${formatNumber(prop.baseIncome, false)} IPS / unit</p>
            `;
            card.appendChild(contentDiv);
            const buyButtonsDiv = document.createElement('div');
            buyButtonsDiv.className = 'buy-options';
            const quantities = [1, 10, 25, 'MAX'];
            quantities.forEach(qty => {
                const btn = document.createElement('button');
                btn.dataset.propertyId = prop.id;
                btn.dataset.quantity = qty;
                btn.classList.add('buy-multiple-button');
                if (qty === 1) btn.classList.add('purchase-button');
                btn.textContent = `Buy ${qty}`;
                btn.addEventListener('click', () => purchaseProperty(prop.id, qty));
                buyButtonsDiv.appendChild(btn);
            });
            card.appendChild(buyButtonsDiv);
            propertiesContainer.appendChild(card);
        });
        updatePurchaseButtonStates();
    }

    function renderOwnedProperties() {
        if (!ownedPropertiesContainer) return;
        ownedPropertiesContainer.innerHTML = '';
        let hasOwnedAndDisplayableProperties = false;
        for (const propId in ownedProperties) {
            if (ownedProperties[propId] && ownedProperties[propId].quantity > 0) {
                hasOwnedAndDisplayableProperties = true;
                const propData = window.gameProperties.find(p => p.id === propId);
                if (!propData) continue;
                const ownedProp = ownedProperties[propId];
                const progressPercent = (ownedProp.level / propData.maxLevel) * 100;
                const effectiveUpgradeCost = Math.floor(calculateEffectiveCost(ownedProp.currentUpgradeCost));
                const isUpgradeAffordable = gold >= effectiveUpgradeCost;
                let upgradeHtmlSection = `<p style="text-align:center; margin-top: 20px;">Max Level Reached!</p>`;
                if (ownedProp.level < propData.maxLevel) {
                    const currentUnitRawIncome = ownedProp.currentIncomePerUnit;
                    const nextLevelUnitRawIncome = currentUnitRawIncome * propData.upgradeIncomeMultiplier;
                    const incomeGainPerUnitRaw = nextLevelUnitRawIncome - currentUnitRawIncome;
                    upgradeHtmlSection = `
                        <p>Upgrade Cost: <span id="upgrade-cost-${propId}" class="property-cost ${isUpgradeAffordable ? 'affordable' : 'unaffordable'}">${formatNumber(effectiveUpgradeCost, true)}</span> Gold</p>
                        <p class="income-gain">Next Lvl Income/Unit: ${formatNumber(applyPrestigeIncomeBonus(nextLevelUnitRawIncome), false)} IPS</p>
                        <p class="income-gain">IPS Gain per Unit: +${formatNumber(applyPrestigeIncomeBonus(incomeGainPerUnitRaw), false)}</p>
                        <p class="income-gain">Total IPS Gain (x${ownedProp.quantity}): +${formatNumber(applyPrestigeIncomeBonus(incomeGainPerUnitRaw * ownedProp.quantity), false)}</p>
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
                            <p>Current Income/Unit: ${formatNumber(applyPrestigeIncomeBonus(ownedProp.currentIncomePerUnit), false)} IPS</p>
                            <p>Total Income from Type: ${formatNumber(applyPrestigeIncomeBonus(ownedProp.currentIncomePerUnit * ownedProp.quantity), false)} IPS</p>
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
        const ownedSection = document.getElementById('owned-properties-section-content');
        if (ownedSection) {
            const ownedSectionTitle = ownedSection.querySelector('h2');
            if (ownedSectionTitle) ownedSectionTitle.style.display = hasOwnedAndDisplayableProperties ? 'block' : 'none';
        }
        if (!hasOwnedAndDisplayableProperties && ownedPropertiesContainer.innerHTML === '') {
            ownedPropertiesContainer.innerHTML = '<p style="text-align:center; color: var(--text-light-tertiary);">You do not own any properties yet. Purchase some from the "Available Properties" tab!</p>';
        }
        updateUpgradeButtonStates();
    }

    function purchaseProperty(propertyId, quantityInput = 1) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        if (!propData) return;
        let actualQuantityToBuy = typeof quantityInput === 'string' && quantityInput.toUpperCase() === 'MAX' ? calculateMaxAffordableQuantity(propertyId) : parseInt(quantityInput) || 1;
        if (actualQuantityToBuy === 0) {
            updatePurchaseButtonStates(); return;
        }
        const cost = calculateBulkPurchaseCost(propertyId, actualQuantityToBuy);
        if (gold >= cost) {
            gold -= cost;
            if (!ownedProperties[propertyId]) {
                ownedProperties[propertyId] = {
                    quantity: 0, level: 0,
                    currentIncomePerUnit: propData.baseIncome,
                    currentUpgradeCost: propData.upgradeCost
                };
            }
            ownedProperties[propertyId].quantity += actualQuantityToBuy;
            recalculateTotalIPS();
            loadPropertiesForSale(); renderOwnedProperties(); updateDisplays(); checkAllAchievements();
        }
    }

    function upgradeProperty(propertyId) {
        const propData = window.gameProperties.find(p => p.id === propertyId);
        const ownedProp = ownedProperties[propertyId];
        if (!propData || !ownedProp || ownedProp.quantity === 0 || ownedProp.level >= propData.maxLevel) return;
        const effectiveUpgradeCost = Math.floor(calculateEffectiveCost(ownedProp.currentUpgradeCost));
        if (gold >= effectiveUpgradeCost) {
            gold -= effectiveUpgradeCost;
            ownedProp.level++;
            ownedProp.currentIncomePerUnit *= propData.upgradeIncomeMultiplier;
            ownedProp.currentUpgradeCost = Math.floor(propData.upgradeCost * Math.pow(propData.upgradeCostMultiplier, ownedProp.level));
            recalculateTotalIPS();
            renderOwnedProperties(); updateDisplays(); updatePurchaseButtonStates(); checkAllAchievements();
        }
    }

    function updatePurchaseButtonStates() {
        if (!window.gameProperties) return;
        window.gameProperties.forEach(prop => {
            const cost1Display = document.getElementById(`cost-${prop.id}`);
            if (cost1Display) {
                const cost1 = calculateBulkPurchaseCost(prop.id, 1);
                cost1Display.textContent = formatNumber(cost1, true);
                cost1Display.classList.toggle('affordable', gold >= cost1);
                cost1Display.classList.toggle('unaffordable', gold < cost1);
            }
            const buyMultipleButtons = document.querySelectorAll(`.buy-multiple-button[data-property-id="${prop.id}"]`);
            buyMultipleButtons.forEach(button => {
                const qty = button.dataset.quantity;
                let isAffordable; let displayQtyText = qty;
                if (qty.toUpperCase() === 'MAX') {
                    const maxQty = calculateMaxAffordableQuantity(prop.id);
                    displayQtyText = `Max (${maxQty})`; isAffordable = maxQty > 0;
                } else {
                    const numQty = parseInt(qty);
                    const costForQty = calculateBulkPurchaseCost(prop.id, numQty);
                    isAffordable = gold >= costForQty;
                    if (numQty > 1) button.title = `Cost: ${formatNumber(costForQty, true)}`;
                }
                button.textContent = `Buy ${displayQtyText}`;
                button.disabled = !isAffordable;
                button.classList.toggle('btn-affordable', isAffordable);
            });
        });
    }

    function updateUpgradeButtonStates() {
        for (const propId in ownedProperties) {
            if (ownedProperties[propId] && ownedProperties[propId].quantity > 0) {
                const propData = window.gameProperties.find(p => p.id === propId);
                if (!propData) continue;
                const ownedProp = ownedProperties[propId];
                const button = document.getElementById(`upgrade-${propId}`);
                const costDisplay = document.getElementById(`upgrade-cost-${propId}`);
                if (button) {
                    if (ownedProp.level >= propData.maxLevel) {
                        button.disabled = true; button.classList.remove('btn-affordable');
                    } else {
                        const effectiveUpgradeCost = Math.floor(calculateEffectiveCost(ownedProp.currentUpgradeCost));
                        const isAffordable = gold >= effectiveUpgradeCost;
                        button.disabled = !isAffordable;
                        button.classList.toggle('btn-affordable', isAffordable);
                        if (costDisplay) {
                            costDisplay.textContent = formatNumber(effectiveUpgradeCost, true);
                            costDisplay.classList.toggle('affordable', isAffordable);
                            costDisplay.classList.toggle('unaffordable', !isAffordable);
                        }
                    }
                }
            }
        }
    }

    // --- ACHIEVEMENTS FUNCTIONS ---
    function getCurrentGameState() { return { gold: gold, totalIPS: totalIPS, ownedProperties: ownedProperties, timesAscended: timesAscended }; }
    function checkAllAchievements() {
        if (!window.achievementsList) return;
        const gameState = getCurrentGameState(); let newAchievementUnlocked = false;
        window.achievementsList.forEach(ach => {
            if (!ach.unlocked && ach.condition(gameState)) {
                ach.unlocked = true; newAchievementUnlocked = true;
                if (ach.onUnlock) ach.onUnlock(gameState);
                showNotification(`Achievement Unlocked: ${ach.icon} ${ach.name}!`);
            }
        });
        if (newAchievementUnlocked) { renderAchievements(); saveGame(); }
    }
    function showNotification(message, isError = false) {
        const notificationArea = document.getElementById('notificationArea') || createNotificationArea();
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        if(isError) notification.classList.add('error-notification');
        notification.textContent = message;
        notificationArea.prepend(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 500);
        }, 4500);
    }
    function createNotificationArea() {
        let area = document.getElementById('notificationArea');
        if (!area) { area = document.createElement('div'); area.id = 'notificationArea'; document.body.appendChild(area); }
        return area;
    }
    function renderAchievements() {
        if (!achievementsContainer || !window.achievementsList) return;
        achievementsContainer.innerHTML = '';
        window.achievementsList.forEach(ach => {
            const achDiv = document.createElement('div');
            achDiv.className = 'achievement-card'; if (ach.unlocked) achDiv.classList.add('unlocked');
            achDiv.innerHTML = `
                <span class="achievement-icon">${ach.icon}</span>
                <div class="achievement-info"><h4>${ach.name}</h4><p>${ach.description}</p></div>
                <span class="achievement-status">${ach.unlocked ? 'Unlocked!' : 'Locked'}</span>`;
            achievementsContainer.appendChild(achDiv);
        });
    }

    // --- ASCENDANCY FUNCTIONS ---
    function getAscendGoldRequirement() {
        return timesAscended === 0 ? ASCEND_GOLD_REQUIREMENT_FIRST :
               ASCEND_GOLD_REQUIREMENT_FIRST * Math.pow(ASCEND_GOLD_REQUIREMENT_SUBSEQUENT_FACTOR, timesAscended);
    }

    function calculatePotentialRealmShards() {
        const requirement = getAscendGoldRequirement();
        if (totalGoldEarnedThisRun < requirement) return 0;
        if (totalGoldEarnedThisRun < REALM_SHARD_CALC_BASE_GOLD && totalGoldEarnedThisRun >= requirement) return Math.max(1, Math.floor(1 * (1 + getRealmShardGainBonus())));
        if (totalGoldEarnedThisRun < REALM_SHARD_CALC_BASE_GOLD) return 0;

        const baseForCalc = totalGoldEarnedThisRun / REALM_SHARD_CALC_BASE_GOLD;
        let shards = Math.floor(Math.pow(Math.log10(baseForCalc) + 1, REALM_SHARD_CALC_POWER) * REALM_SHARD_CALC_MULTIPLIER);
        shards *= (1 + getRealmShardGainBonus());
        return Math.max(1, Math.floor(shards));
    }

    function checkAscendEligibility() {
        const requirement = getAscendGoldRequirement();
        const canAscend = totalGoldEarnedThisRun >= requirement;
        if (ascendReadyNotification) ascendReadyNotification.style.display = canAscend ? 'block' : 'none';
        if (ascendButton) {
            ascendButton.disabled = !canAscend;
            const potentialShards = calculatePotentialRealmShards();
            if (canAscend) {
                ascendButton.classList.add('btn-affordable');
                ascendButton.textContent = `ASCEND! (+${formatNumber(potentialShards, true)} RS)`;
                if(ascendancyInfoDiv) ascendancyInfoDiv.innerHTML = `<p>You are ready to Ascend! Reset current run for Realm Shards and powerful permanent upgrades.</p>`;
            } else {
                ascendButton.classList.remove('btn-affordable');
                ascendButton.textContent = 'Reach Ascension Goal';
                if(ascendancyInfoDiv) ascendancyInfoDiv.innerHTML = `<p>Reach ${formatNumber(requirement, true)} total Gold earned in this run to Ascend.</p>`;
            }
        }
    }

    function performAscension() {
        const requirement = getAscendGoldRequirement();
        if (totalGoldEarnedThisRun < requirement) { showNotification("Not yet ready to Ascend!", true); return; }
        const shardsGained = calculatePotentialRealmShards();
        if (!confirm(`Are you sure you want to Ascend?\n\nThis will reset your current run's Gold, Properties, and Property Upgrades.\nYou will gain approx. ${formatNumber(shardsGained, true)} Realm Shards.\n\nAchievements, total Realm Shards, and Prestige Upgrades are kept.`)) return;
        realmShards += shardsGained; timesAscended++;
        gold = BASE_STARTING_GOLD + getStartingGoldBonus();
        ownedProperties = {}; totalGoldEarnedThisRun = 0;
        recalculateTotalIPS();
        showNotification(`✨ Ascended! Gained ${formatNumber(shardsGained, true)} RS! Total: ${formatNumber(realmShards, true)}. Times Ascended: ${timesAscended}. ✨`);
        saveGame(); loadPropertiesForSale(); renderOwnedProperties(); renderAchievements(); renderPrestigeShop();
        updateDisplays(); checkAscendEligibility();
        const availablePropsTabBtn = document.querySelector('.tab-button[data-tab="availablePropertiesTabContent"]');
        if(availablePropsTabBtn) availablePropsTabBtn.click();
    }

    function renderPrestigeShop() {
        if (!prestigeUpgradeShopContainer) return;
        if (!window.prestigeUpgradesList) { prestigeUpgradeShopContainer.innerHTML = '<p>Prestige upgrades definition file not loaded.</p>'; return; }
        prestigeUpgradeShopContainer.innerHTML = '';
        const shopHeader = document.createElement('p');
        shopHeader.innerHTML = `Your available Realm Shards: <span id="shopRealmShardsDisplayCurrent" style="color: var(--primary-accent-color); font-weight: bold;">${formatNumber(realmShards, true)}</span> RS`; // Changed ID slightly
        prestigeUpgradeShopContainer.appendChild(shopHeader);

        window.prestigeUpgradesList.forEach(upgradeData => {
            const currentLevel = getPrestigeUpgradeLevel(upgradeData.id);
            const cost = upgradeData.costFormula(currentLevel);
            const canAfford = realmShards >= cost;
            const isMaxLevel = upgradeData.maxLevel !== null && currentLevel >= upgradeData.maxLevel;
            // Description function now directly accesses window.prestigeUpgrades via getPrestigeUpgradeLevel
            // or by using currentLevel and upgradeData.effectPerLevel to construct current bonus text.
            // The prestige_upgrades.js file's description functions were updated to be self-contained.
            let description = upgradeData.descriptionFunction(currentLevel);


            const card = document.createElement('div');
            card.className = 'prestige-upgrade-card';
            card.innerHTML = `
                <h4>${upgradeData.name} (Lvl ${currentLevel}${upgradeData.maxLevel ? '/'+upgradeData.maxLevel : ''})</h4>
                <p>${description}</p>
                ${!isMaxLevel ? `<p class="cost">Next Lvl Cost: ${formatNumber(cost, true)} RS</p>` : '<p class="cost">Max Level Reached!</p>'}
                <button data-upgrade-id="${upgradeData.id}" class="${canAfford && !isMaxLevel ? 'btn-affordable' : ''}" ${!canAfford || isMaxLevel ? 'disabled' : ''}>
                    ${isMaxLevel ? 'Maxed' : 'Upgrade'}
                </button>
            `;
            const upgradeButton = card.querySelector('button');
            if (upgradeButton && !isMaxLevel) {
                upgradeButton.addEventListener('click', () => buyPrestigeUpgrade(upgradeData.id));
            }
            prestigeUpgradeShopContainer.appendChild(card);
        });
         // Update the shop specific shard display
        const shopShardsElem = document.getElementById('shopRealmShardsDisplayCurrent');
        if (shopShardsElem) shopShardsElem.textContent = formatNumber(realmShards, true);
    }

    function buyPrestigeUpgrade(upgradeId) {
        const upgradeData = window.prestigeUpgradesList.find(upg => upg.id === upgradeId);
        if (!upgradeData) { console.error("Upgrade data not found for: " + upgradeId); return; }
        const currentLevel = getPrestigeUpgradeLevel(upgradeId);
        if (upgradeData.maxLevel !== null && currentLevel >= upgradeData.maxLevel) {
            showNotification("Upgrade at max level!", true); return;
        }
        const cost = upgradeData.costFormula(currentLevel);
        if (realmShards >= cost) {
            realmShards -= cost;
            window.prestigeUpgrades[upgradeId] = currentLevel + 1;
            showNotification(`${upgradeData.name} upgraded to Level ${window.prestigeUpgrades[upgradeId]}!`);
            saveGame(); recalculateTotalIPS(); updateDisplays(); renderPrestigeShop();
            // If cost reduction was bought, property costs displayed need to update
            if (upgradeData.type === 'cost_reduction_all') {
                loadPropertiesForSale(); renderOwnedProperties();
            }
            // If starting gold was bought, it applies next ascension.
            // If offline boosts were bought, they apply next time offline progress is calculated.
        } else {
            showNotification("Not enough Realm Shards!", true);
        }
    }

    // --- UTILITY FUNCTIONS ---
    function formatNumber(num, floorOutputForDisplay) {
        let numToFormat = num;
        if (floorOutputForDisplay && Math.abs(numToFormat) < 1000 && !Number.isInteger(numToFormat)) numToFormat = Math.floor(numToFormat);
        else if (floorOutputForDisplay && Number.isInteger(numToFormat)) numToFormat = numToFormat; // No change if already integer
        else if (!floorOutputForDisplay && Math.abs(numToFormat) < 1000 && numToFormat % 1 !== 0) numToFormat = parseFloat(numToFormat.toFixed(1)); // Show 1 decimal for non-integers < 1000 if not flooring
        else if (Math.abs(numToFormat) < 1000) numToFormat = Math.floor(numToFormat); // Default floor if integer or no decimal display

        if (Math.abs(numToFormat) < 1 && !floorOutputForDisplay) return parseFloat(num.toFixed(2)).toString(); // Use original num for precision with toFixed
        if (Math.abs(numToFormat) < 1000) return numToFormat.toString();

        let baseNumForSuffix = floorOutputForDisplay ? Math.floor(num) : num;
        if (baseNumForSuffix === 0 && num !== 0 && !floorOutputForDisplay) baseNumForSuffix = num;
        const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
        let i = 0;
        if (Math.abs(baseNumForSuffix) >= 1000) i = Math.max(0, Math.min(suffixes.length - 1, Math.floor(Math.log10(Math.abs(baseNumForSuffix)) / 3)));
        if (i === 0) return (floorOutputForDisplay || baseNumForSuffix % 1 === 0) ? Math.floor(baseNumForSuffix).toString() : parseFloat(baseNumForSuffix.toFixed(1)).toString();
        let shortNum = (baseNumForSuffix / Math.pow(1000, i));
        if (shortNum.toFixed(1).endsWith('.0')) return shortNum.toFixed(0) + suffixes[i];
        return parseFloat(shortNum.toFixed(1)) + suffixes[i];
    }

    // --- INITIALIZATION ---
    initGame();
});
