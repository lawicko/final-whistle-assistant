const playerModulePrefix = "player"

console.log(`${new Date().toLocaleString()} ${playerModulePrefix}: player.js script loaded...`)

// Recreates the denomination used on the website, used for coloring the numbers
function denomination(value) {
    let den = 0
    if (value > 29) {
        den = Math.trunc(value / 10)
    } else {
        if (value > 15) {
            den = 2
        } else {
            den = 1
        }
    }
    return den
}

// Calculates and adds the cells with the midfield contribution values for each player
function appendMidfieldContributionForPlayer(tableNode) {
    console.log(`${playerModulePrefix}: appending the midfield contribution...`)
    
    let midfieldDominanceMax = 100 + 200
    let advancedMidfieldDominanceMax = (100 + 200) * 0.5
    let advancedMidfieldDominanceFlexibleMax = 100 + 200
    let constitutionTreshold = 50
    
    let allCells = tableNode.querySelectorAll("tr td")
    // console.debug(`allCells.length = ${allCells.length}`)
    let SC_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Scoring'
                                                  )
    
    SC_cell = SC_label_cell.nextElementSibling
    let SC_span = SC_cell.querySelector("span")
    let SC = Number(SC_span.textContent.trim())
    
    SC_pot_cell = SC_cell.nextElementSibling
    let SC_pot_span = SC_pot_cell.querySelector("span")
    let SC_POT = Number(SC_pot_span.textContent.trim())
    console.debug(`SC ${SC}/${SC_POT}`)
    
    let OP_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Off. Pos.'
                                                  )
    
    OP_cell = OP_label_cell.nextElementSibling
    let OP_span = OP_cell.querySelector("span")
    let OP = Number(OP_span.textContent.trim())
    
    OP_pot_cell = OP_cell.nextElementSibling
    let OP_pot_span = OP_pot_cell.querySelector("span")
    let OP_POT = Number(OP_pot_span.textContent.trim())
    console.debug(`OP ${OP}/${OP_POT}`)
    
    let BC_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Ball Control'
                                                  )
    
    BC_cell = BC_label_cell.nextElementSibling
    let BC_span = BC_cell.querySelector("span")
    let BC = Number(BC_span.textContent.trim())
    
    BC_pot_cell = BC_cell.nextElementSibling
    let BC_pot_span = BC_pot_cell.querySelector("span")
    let BC_POT = Number(BC_pot_span.textContent.trim())
    console.debug(`BC ${BC}/${BC_POT}`)
    
    let PA_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Passing'
                                                  )
    
    PA_cell = PA_label_cell.nextElementSibling
    let PA_span = PA_cell.querySelector("span")
    let PA = Number(PA_span.textContent.trim())
    
    PA_pot_cell = PA_cell.nextElementSibling
    let PA_pot_span = PA_pot_cell.querySelector("span")
    let PA_POT = Number(PA_pot_span.textContent.trim())
    console.debug(`PA ${PA}/${PA_POT}`)
    
    let AE_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Aerial Ability'
                                                  )
    
    AE_cell = AE_label_cell.nextElementSibling
    let AE_span = AE_cell.querySelector("span")
    let AE = Number(AE_span.textContent.trim())
    
    AE_pot_cell = AE_cell.nextElementSibling
    let AE_pot_span = AE_pot_cell.querySelector("span")
    let AE_POT = Number(AE_pot_span.textContent.trim())
    console.debug(`AE ${AE}/${AE_POT}`)
    
    let CO_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Constitution'
                                                  )
    
    CO_cell = CO_label_cell.nextElementSibling
    let CO_span = CO_cell.querySelector("span")
    let CO = Number(CO_span.textContent.trim())
    
    CO_pot_cell = CO_cell.nextElementSibling
    let CO_pot_span = CO_pot_cell.querySelector("span")
    let CO_POT = Number(CO_pot_span.textContent.trim())
    console.debug(`CO ${CO}/${CO_POT}`)
    
    let TA_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Tackling'
                                                  )
    
    TA_cell = TA_label_cell.nextElementSibling
    let TA_span = TA_cell.querySelector("span")
    let TA = Number(TA_span.textContent.trim())
    
    TA_pot_cell = TA_cell.nextElementSibling
    let TA_pot_span = TA_pot_cell.querySelector("span")
    let TA_POT = Number(TA_pot_span.textContent.trim())
    console.debug(`TA ${TA}/${TA_POT}`)
    
    let DP_label_cell = Array.from(allCells).find(
                                                  cell => cell.textContent.trim() === 'Def. Pos.'
                                                  )
    
    DP_cell = DP_label_cell.nextElementSibling
    let DP_span = DP_cell.querySelector("span")
    let DP = Number(DP_span.textContent.trim())
    
    DP_pot_cell = DP_cell.nextElementSibling
    let DP_pot_span = DP_pot_cell.querySelector("span")
    let DP_POT = Number(DP_pot_span.textContent.trim())
    console.debug(`DP ${DP}/${DP_POT}`)
    
    let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
    let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
    let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)
    
    let midfieldDominanceContributionPotential = PA_POT + Math.min(OP_POT + BC_POT, TA_POT + DP_POT) + Math.max(0, CO_POT - constitutionTreshold)
    let midfieldDominanceDenominationPotential = midfieldDominanceContributionPotential / midfieldDominanceMax
    let midfieldDominanceDenominationNormalizedPotential = denomination(midfieldDominanceDenominationPotential * 100)
    
    console.debug("contribution = ", midfieldDominanceContribution, "denomination = ", midfieldDominanceDenomination, " normalized: ", midfieldDominanceDenominationNormalized)
    console.debug("contribution (potential)= ", midfieldDominanceContributionPotential, "denomination = ", midfieldDominanceDenominationPotential, " normalized: ", midfieldDominanceDenominationNormalizedPotential)
    
    
    var trMD = document.createElement("tr")
    trMD.className = pluginNodeClass
    
    var tdMDLabel = document.createElement("td")
    tdMDLabel.className = "opacity-06"
    tdMDLabel.textContent = "Midfield Dominance"
    trMD.appendChild(tdMDLabel)
    
    var tdMDCurrent = document.createElement("td")
    tdMDCurrent.innerHTML =
    `<div class="denom${midfieldDominanceDenominationNormalized}">${midfieldDominanceContribution}</div>`
    
    trMD.appendChild(tdMDCurrent)
    
    var tdMDPot = document.createElement("td")
    tdMDPot.innerHTML =
    `<div class="denom${midfieldDominanceDenominationNormalizedPotential}">${midfieldDominanceContributionPotential}</div>`
    
    trMD.appendChild(tdMDPot)
    
    tableNode.appendChild(trMD)
    
    let updatedCells = tableNode.querySelectorAll("tr td")
    
    const headingValueText = `Math.floor(0.65 * ${SC} + 0.35 * ${AE}) =\nMath.floor(${(0.65 * SC).toFixed(2)} + ${(0.35 * AE).toFixed(2)}) =\nMath.floor(${((0.65 * SC) + (0.35 * AE)).toFixed(2)}) = ${Math.floor((0.65 * SC) + (0.35 * AE))}`
    const headingPotentialText = `Math.floor(0.65 * ${SC_POT} + 0.35 * ${AE_POT}) =\nMath.floor(${(0.65 * SC_POT).toFixed(2)} + ${(0.35 * AE_POT).toFixed(2)}) =\nMath.floor(${((0.65 * SC_POT) + (0.35 * AE_POT)).toFixed(2)}) = ${Math.floor((0.65 * SC_POT) + (0.35 * AE_POT))}`
    addHoverCardToCell(updatedCells, "Heading", "Math.floor(0.65 * SC + 0.35 * AE)", headingValueText, headingPotentialText)
    
    const penaltyValueText = `Math.floor(Math.max(1.2 * ${SC}, 0.8 * ${PA})) =\nMath.floor(Math.max(${(1.2 * SC).toFixed(2)}, ${(0.8 * PA).toFixed(2)})) =\nMath.floor(${(Math.max(1.2 * SC, 0.8 * PA)).toFixed(2)}) = ${Math.floor(Math.max(1.2 * SC, 0.8 * PA))}`
    const penaltyPotentialText = `Math.floor(Math.max(1.2 * ${SC_POT}, 0.8 * ${PA_POT})) =\nMath.floor(Math.max(${(1.2 * SC_POT).toFixed(2)}, ${(0.8 * PA_POT).toFixed(2)})) =\nMath.floor(${(Math.max(1.2 * SC_POT, 0.8 * PA_POT)).toFixed(2)}) = ${Math.floor(Math.max(1.2 * SC_POT, 0.8 * PA_POT))}`
    addHoverCardToCell(updatedCells, "Penalty Kick", "Math.floor(Math.max(1.2 * SC, 0.8 * PA))", penaltyValueText, penaltyPotentialText)
    
    const longShotsValueText = `Math.floor((${SC} + Math.min(2 * ${SC}, ${PA})) / 2) =\nMath.floor((${SC} + Math.min(${2 * SC}, ${PA})) / 2) =\nMath.floor((${SC} + ${Math.min(2 * SC, PA)}) / 2) =\nMath.floor(${SC + Math.min(2 * SC, PA)} / 2) =\nMath.floor(${(SC + Math.min(2 * SC, PA)) / 2}) = ${Math.floor((SC + Math.min(2 * SC, PA)) / 2)}`
    const longShotsPotentialText = `Math.floor((${SC_POT} + Math.min(2 * ${SC_POT}, ${PA_POT})) / 2) =\nMath.floor((${SC_POT} + Math.min(${2 * SC_POT}, ${PA_POT})) / 2) =\nMath.floor((${SC_POT} + ${Math.min(2 * SC_POT, PA_POT)}) / 2) =\nMath.floor(${SC_POT + Math.min(2 * SC_POT, PA_POT)} / 2) =\nMath.floor(${(SC_POT + Math.min(2 * SC_POT, PA_POT)) / 2}) = ${Math.floor((SC_POT + Math.min(2 * SC_POT, PA_POT)) / 2)}`
    addHoverCardToCell(updatedCells, "Long Shots", "Math.floor((SC + Math.min(2 * SC, PA)) / 2)", longShotsValueText, longShotsPotentialText)
    
    const spHeadingValueText = `Math.floor(0.8 * ${AE} + 0.2 * ${CO}) =\nMath.floor(${(0.8 * AE).toFixed(2)} + ${(0.2 * CO).toFixed(2)}) =\nMath.floor(${(0.8 * AE + 0.2 * CO).toFixed(2)}) = ${Math.floor(0.8 * AE + 0.2 * CO)}`
    const spHeadingPotentialText = `Math.floor(0.8 * ${AE_POT} + 0.2 * ${CO_POT}) =\nMath.floor(${(0.8 * AE_POT).toFixed(2)} + ${(0.2 * CO_POT).toFixed(2)}) =\nMath.floor(${(0.8 * AE_POT + 0.2 * CO_POT).toFixed(2)}) = ${Math.floor(0.8 * AE_POT + 0.2 * CO_POT)}`
    addHoverCardToCell(updatedCells, "Sp. Heading", "Math.floor(0.8 * AE + 0.2 * CO)", spHeadingValueText, spHeadingPotentialText)
    
    const spCrossValueText = `Math.floor(0.7 * ${PA} + 0.3 * ${BC}) =\nMath.floor(${(0.7 * PA).toFixed(2)} + ${(0.3 * BC).toFixed(2)}) =\nMath.floor(${(0.7 * PA + 0.3 * BC).toFixed(2)}) = ${Math.floor(0.7 * PA + 0.3 * BC)}`
    const spCrossPotentialText = `Math.floor(0.7 * ${PA_POT} + 0.3 * ${BC_POT}) =\nMath.floor(${(0.7 * PA_POT).toFixed(2)} + ${(0.3 * BC_POT).toFixed(2)}) =\nMath.floor(${(0.7 * PA_POT + 0.3 * BC_POT).toFixed(2)}) = ${Math.floor(0.7 * PA_POT + 0.3 * BC_POT)}`
    addHoverCardToCell(updatedCells, "Sp. Cross", "Math.floor(0.7 * PA + 0.3 * BC)", spCrossValueText, spCrossPotentialText)
    
    const mdValueText = `${PA} + Math.min(${OP} + ${BC}, ${TA} + ${DP}) + Math.max(0, ${CO - constitutionTreshold}) =\n${PA} + Math.min(${OP + BC}, ${TA + DP}) + ${Math.max(0, CO - constitutionTreshold)} =\n${PA} + ${Math.min(OP + BC, TA + DP)} + ${Math.max(0, CO - constitutionTreshold)} = ${PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)}`
    const mdPotentialText = `${PA_POT} + Math.min(${OP_POT} + ${BC_POT}, ${TA_POT} + ${DP_POT}) + Math.max(0, ${CO_POT - constitutionTreshold}) =\n${PA_POT} + Math.min(${OP_POT + BC_POT}, ${TA_POT + DP_POT}) + ${Math.max(0, CO_POT - constitutionTreshold)} =\n${PA_POT} + ${Math.min(OP_POT + BC_POT, TA_POT + DP_POT)} + ${Math.max(0, CO_POT - constitutionTreshold)} = ${PA_POT + Math.min(OP_POT + BC_POT, TA_POT + DP_POT) + Math.max(0, CO_POT - constitutionTreshold)}`
    addHoverCardToCell(updatedCells, "Midfield Dominance", `PA + min(OP + BC, TA + DP) + max(0, CO - ${constitutionTreshold})`, mdValueText, mdPotentialText)
}

function addHoverCardToCell(allCells, targetText, tooltipText, valueTooltipText, potentialTooltipText) {
    // Find the cell whose text matches targetText
    let targetCell = Array.from(allCells).find(
                                               cell => cell.textContent.trim() === targetText
                                               );
    
    if (!targetCell) {
        console.warn(`Cell with text "${targetText}" not found.`);
        return;
    }
    
    targetCell.setAttribute("data-tooltip", tooltipText);
    targetCell.classList.add('header-tooltip')
    
    // Add tooltip with the formula to the value cell
    valueCell = targetCell.nextElementSibling
    valueCell.setAttribute("data-tooltip", valueTooltipText);
    valueCell.classList.add('value-tooltip')
    
    // Add tooltip with the formula to the potential cell
    potentialCell = valueCell.nextElementSibling
    potentialCell.setAttribute("data-tooltip", potentialTooltipText)
}

function getLastPathComponent(removeExtension = false) {
    const path = window.location.pathname;
    const parts = path.split("/").filter(Boolean);
    let last = parts.pop() || "";
    
    if (removeExtension && last.includes(".")) {
        last = last.split(".")[0];
    }
    
    return last;
}

async function savePlayerData() {
    // Get all tables on the page
    const tables = document.querySelectorAll("table");
    
    const personalityTable = Array.from(tables).find(table =>
                                                     Array.from(table.querySelectorAll("th")).some(
                                                                                                   th => th.textContent.trim() === "Personalities"
                                                                                                   )
                                                     );
    
    if (personalityTable) {
        console.info("✅ Found the table:", personalityTable);
    } else {
        console.info("No personalities table found, will try again when the page changes.");
        return
    }
    
    const result = {};
    
    // Loop over each row
    personalityTable.querySelectorAll("tr").forEach(row => {
        const link = row.querySelector("a");
        if (!link) return; // skip rows without <a>
        
        const name = link.textContent.trim().toLowerCase();
        
        // Count pluses and minuses
        const plusCount = row.querySelectorAll("i.personality-plus").length;
        const minusCount = row.querySelectorAll("i.personality-minus").length;
        
        let value = 0;
        if (plusCount > 0) {
            value = plusCount; // 1 or 2
        } else if (minusCount > 0) {
            value = -minusCount; // -1 or -2
        }
        
        result[name] = value;
    });
    
    console.debug('Result of reading the personalities', result)
    
    const playerID = getLastPathComponent()
    console.debug(`Will save personalities for playerID = ${playerID}`);
    
    savePersonalitiesToStorage(playerID, result)
}

async function savePersonalitiesToStorage(playerID, data) {
    const playerDataFromStorage = await browser.storage.sync.get('player-data');
    var loadedPlayerData = playerDataFromStorage['player-data'] || {};
    console.debug('loadedPlayerData = ', loadedPlayerData)
    var currentPlayerData = loadedPlayerData[playerID] || {};
    console.debug('currentPlayerData = ', currentPlayerData)
    currentPlayerData['personalities'] = JSON.stringify(data)
    loadedPlayerData[playerID] = currentPlayerData
    
    const key = 'player-data';
    await storage.set({ [key]: loadedPlayerData })
    console.debug(`Set data for playerID: ${playerID}`);
}

function cleanUpNodeForPlayer(tableNode) {
    console.debug(`${playerModulePrefix}: removing the old cells...`)
    tableNode.querySelectorAll(`tr.${pluginNodeClass}`).forEach(el => el.remove())
}

// Options for the observer (which mutations to observe)
const playerObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const playerObservingCallback = (mutationList, observer) => {
    savePlayerData()
    
    let tableNodes = document.querySelectorAll("table.table")
    
    let targetTable = null;
    for (const table of tableNodes) {
        const firstHeaderSpan = table.querySelector('tr th span[ngbpopover="Core Skills"]')
        if (firstHeaderSpan) {
            targetTable = table
            break;
        }
    }
    
    if (targetTable != undefined && targetTable.rows.length > 1) {
        observer.disconnect() // otherwise we end up in a loop
        
        console.debug(`${playerModulePrefix}: Found the following table: `, targetTable)
        console.debug(`${playerModulePrefix}: tableNode.rows.length: ${targetTable.rows.length}`)
        //        mutationList.forEach(el => console.debug(`mutationType: ${el.type}, mutationTarget: ${el.target}, oldValue: ${el.oldValue}, newValue: ${el.data}`))
        
        
        cleanUpNodeForPlayer(targetTable)
        appendMidfieldContributionForPlayer(targetTable)
        observer.observe(alwaysPresentNode, playerObservingConfig);
    } else {
        console.debug(`${new Date().toLocaleString()} ${playerModulePrefix}: Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const playerObserver = new MutationObserver(playerObservingCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${new Date().toLocaleString()} ${playerModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.includes("player/")) {
        // Start observing the target node for configured mutations
        playerObserver.observe(alwaysPresentNode, playerObservingConfig);
        console.debug(`${new Date().toLocaleString()} ${playerModulePrefix} Started the div.wrapper observation`)
    } else {
        playerObserver.disconnect()
        console.debug(`${new Date().toLocaleString()} ${playerModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})

addCSS(`
    [data-tooltip] {
      position: relative; /* Needed for positioning the tooltip */
      cursor: help;       /* Optional: indicates hover help */
    }

    /* The tooltip itself */
    [data-tooltip]::after {
        content: attr(data-tooltip); /* Pulls text from the attribute */
        position: absolute;
        top: 0%;
        left: 100%;

        background: rgb(77, 129, 62);
        color: #fff;
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 0.85rem;

        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease-in-out;
        display: inline-block;
        white-space: pre;        /* only break at \n */
        width: max-content;      /* shrink to longest line */
        max-width: none;         /* no implicit cap */
        z-index: 999;
    }

    .header-tooltip[data-tooltip]::after {
        left: 141%;
    }

    .value-tooltip[data-tooltip]::after {
        left: 200%;
    }

    /* Show on hover */
    [data-tooltip]:hover::after {
      opacity: 1;
    }
`)
