if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

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
    console.info(`${new Date().toLocaleString()} ${playerModulePrefix}: appending the midfield contribution...`)

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
    console.info(`SC ${SC}/${SC_POT}`)

    let OP_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Off. Pos.'
    )

    OP_cell = OP_label_cell.nextElementSibling
    let OP_span = OP_cell.querySelector("span")
    let OP = Number(OP_span.textContent.trim())

    OP_pot_cell = OP_cell.nextElementSibling
    let OP_pot_span = OP_pot_cell.querySelector("span")
    let OP_POT = Number(OP_pot_span.textContent.trim())
    console.info(`OP ${OP}/${OP_POT}`)

    let BC_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Ball Control'
    )

    BC_cell = BC_label_cell.nextElementSibling
    let BC_span = BC_cell.querySelector("span")
    let BC = Number(BC_span.textContent.trim())

    BC_pot_cell = BC_cell.nextElementSibling
    let BC_pot_span = BC_pot_cell.querySelector("span")
    let BC_POT = Number(BC_pot_span.textContent.trim())
    console.info(`BC ${BC}/${BC_POT}`)

    let PA_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Passing'
    )

    PA_cell = PA_label_cell.nextElementSibling
    let PA_span = PA_cell.querySelector("span")
    let PA = Number(PA_span.textContent.trim())

    PA_pot_cell = PA_cell.nextElementSibling
    let PA_pot_span = PA_pot_cell.querySelector("span")
    let PA_POT = Number(PA_pot_span.textContent.trim())
    console.info(`PA ${PA}/${PA_POT}`)

    let AE_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Aerial Ability'
    )

    AE_cell = AE_label_cell.nextElementSibling
    let AE_span = AE_cell.querySelector("span")
    let AE = Number(AE_span.textContent.trim())

    AE_pot_cell = AE_cell.nextElementSibling
    let AE_pot_span = AE_pot_cell.querySelector("span")
    let AE_POT = Number(AE_pot_span.textContent.trim())
    console.info(`AE ${AE}/${AE_POT}`)

    let CO_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Constitution'
    )

    CO_cell = CO_label_cell.nextElementSibling
    let CO_span = CO_cell.querySelector("span")
    let CO = Number(CO_span.textContent.trim())

    CO_pot_cell = CO_cell.nextElementSibling
    let CO_pot_span = CO_pot_cell.querySelector("span")
    let CO_POT = Number(CO_pot_span.textContent.trim())
    console.info(`CO ${CO}/${CO_POT}`)

    let TA_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Tackling'
    )

    TA_cell = TA_label_cell.nextElementSibling
    let TA_span = TA_cell.querySelector("span")
    let TA = Number(TA_span.textContent.trim())

    TA_pot_cell = TA_cell.nextElementSibling
    let TA_pot_span = TA_pot_cell.querySelector("span")
    let TA_POT = Number(TA_pot_span.textContent.trim())
    console.info(`TA ${TA}/${TA_POT}`)

    let DP_label_cell = Array.from(allCells).find(
      cell => cell.textContent.trim() === 'Def. Pos.'
    )

    DP_cell = DP_label_cell.nextElementSibling
    let DP_span = DP_cell.querySelector("span")
    let DP = Number(DP_span.textContent.trim())

    DP_pot_cell = DP_cell.nextElementSibling
    let DP_pot_span = DP_pot_cell.querySelector("span")
    let DP_POT = Number(DP_pot_span.textContent.trim())
    console.info(`DP ${DP}/${DP_POT}`)
        
    let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
    let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
    let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)

    let midfieldDominanceContributionPotential = PA_POT + Math.min(OP_POT + BC_POT, TA_POT + DP_POT) + Math.max(0, CO_POT - constitutionTreshold)
    let midfieldDominanceDenominationPotential = midfieldDominanceContributionPotential / midfieldDominanceMax
    let midfieldDominanceDenominationNormalizedPotential = denomination(midfieldDominanceDenominationPotential * 100)
        
    console.info("contribution = ", midfieldDominanceContribution, "denomination = ", midfieldDominanceDenomination, " normalized: ", midfieldDominanceDenominationNormalized)
    console.info("contribution (potential)= ", midfieldDominanceContributionPotential, "denomination = ", midfieldDominanceDenominationPotential, " normalized: ", midfieldDominanceDenominationNormalizedPotential)
        

    var trMD = document.createElement("tr")
    trMD.className = pluginNodeClass

    var tdMDLabel = document.createElement("td")
    tdMDLabel.className = "opacity-06"
    tdMDLabel.textContent = "Midfield Dominance"
    trMD.appendChild(tdMDLabel)

    var tdMDCurrent = document.createElement("td")
    tdMDCurrent.innerHTML =  
        `<div class="plugin-has-hover-card denom${midfieldDominanceDenominationNormalized}">${midfieldDominanceContribution}
            <div class="plugin-hover-card hovercard-detail">
                <span>formula: PA + min(OP + BC, TA + DP) + max(0, CO - ${constitutionTreshold})</span>
                <span>${PA} + min(${OP} + ${BC}, ${TA} + ${DP}) + max(0, ${CO - constitutionTreshold})</span>
                <span>${PA} + min(${OP + BC}, ${TA + DP}) + ${Math.max(0, CO - constitutionTreshold)}</span>
                <span>${PA} + ${Math.min(OP + BC, TA + DP)} + ${Math.max(0, CO - constitutionTreshold)} = ${PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)}</span>
            </div>
        </div>`
    
    trMD.appendChild(tdMDCurrent)

    var tdMDPot = document.createElement("td")
    tdMDPot.innerHTML =  
        `<div class="plugin-has-hover-card denom${midfieldDominanceDenominationNormalizedPotential}">${midfieldDominanceContributionPotential}
            <div class="plugin-hover-card hovercard-detail">
                <span>formula: PA + min(OP + BC, TA + DP) + max(0, CO - 50)</span>
                <span>${PA_POT} + min(${OP_POT} + ${BC_POT}, ${TA_POT} + ${DP_POT}) + max(0, ${CO_POT - constitutionTreshold})</span>
                <span>${PA_POT} + min(${OP_POT + BC_POT}, ${TA_POT + DP_POT}) + ${Math.max(0, CO_POT - constitutionTreshold)}</span>
                <span>${PA_POT} + ${Math.min(OP_POT + BC_POT, TA_POT + DP_POT)} + ${Math.max(0, CO_POT - constitutionTreshold)} = ${PA_POT + Math.min(OP_POT + BC_POT, TA_POT + DP_POT) + Math.max(0, CO_POT - constitutionTreshold)}</span>
            </div>
        </div>`
    
    trMD.appendChild(tdMDPot)

    tableNode.appendChild(trMD)
}

function cleanUpNodeForPlayer(tableNode) {
    console.info(`${new Date().toLocaleString()} ${playerModulePrefix}: removing the old cells...`)
    tableNode.querySelectorAll(`tr.${pluginNodeClass}`).forEach(el => el.remove())
}

// Options for the observer (which mutations to observe)
const playerObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const playerObservingCallback = (mutationList, observer) => {
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
        
        console.debug(`${new Date().toLocaleString()} ${playerModulePrefix}: Found the following table: `, targetTable)
        console.debug(`${new Date().toLocaleString()} ${playerModulePrefix}: tableNode.rows.length: ${targetTable.rows.length}`)
//        mutationList.forEach(el => console.info(`mutationType: ${el.type}, mutationTarget: ${el.target}, oldValue: ${el.oldValue}, newValue: ${el.data}`))
        
        
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
    .plugin-has-hover-card {
        position: relative;
    }
    .plugin-has-hover-card .plugin-hover-card.hovercard-detail {
        display: flex;
        opacity: 0;
        visibility: hidden;
        width: auto;
        height: auto;
        margin: auto;
        padding: 8px;
        flex-direction: column;

        position: absolute;
        left:0;
        transform:translateX(-104%);
        top: -9px;
    }
    .plugin-has-hover-card:hover .plugin-hover-card.hovercard-detail {
        display: flex;
        opacity: 1;
        visibility: visible;
        width: auto;
        height: auto;
        margin: auto;
        padding: 8px;
        flex-direction: column;

        position: absolute;
        left:0;
        transform:translateX(-104%);
        top: -9px;
    }

    .plugin-hover-card.hovercard-detail span {
        white-space: nowrap;
    }
`)
