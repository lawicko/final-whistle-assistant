import * as utils from "./utils.js"
import * as uiUtils from "./ui_utils.js"
import * as listUtils from "./list_utils.js"
import * as db from "./db_access.js"
import { specialTalentsSymbols, specialTalentsDescriptions } from "./special_talents_utils.js"

/**
 * Creates a <td> or <th> element with a hover-card.
 *
 * @param {"td" | "th"} tag - The type of cell to create ("td" or "th").
 * @param {string} mainLabel - The main text to display (e.g. "LS").
 * @param {string[] | string} hoverContent - Either a single string or an array of strings for the hover card.
 * @param {string} [extraClass=""] - Optional extra class for the <td>/<th>.
 * @returns {HTMLTableCellElement} The constructed table cell element.
 */
function createHoverCardCell(tag, mainLabel, hoverContent, extraClass = "") {
    const cell = document.createElement(tag);
    cell.classList.add(utils.pluginNodeClass)
    cell.setAttribute("data-tooltip", hoverContent);

    // span with text
    const span = document.createElement("span");
    if (extraClass) {
        span.classList.add(extraClass);
    }
    span.textContent = mainLabel;
    cell.appendChild(span);

    return cell;
}

// Adds the headers to the players table
async function createHeaders() {
    console.debug(`appending headers...`)
    const firstRow = document.querySelector("table > tr:first-of-type");

    console.debug("isShowingAttackers:", isShowingAttackers(), "isShowingMidfielders:", isShowingMidfielders(), "isShowingDefenders:", isShowingDefenders(), "isShowingGoalkeepers:", isShowingGoalkeepers())

    const headerClass = utils.pluginNodeClass + "PlayersTableColumnHeader"

    // const footTH = createHoverCardCell("th", "🦶🏻", "Foot")
    // footTH.classList.add(headerClass)
    // firstRow.appendChild(footTH)

    const overrides = await db.getOverrides()
    if (!overrides['preferOriginalSpecialTalentsColumn']) {
        const originalSTHeader = firstRow.querySelector('th[title="Special Talents"]')
        if (originalSTHeader) originalSTHeader.remove()

        const specialTalentsTH = createHoverCardCell("th", "", "Special Talents")
        const specialTalentsBolt = document.createElement("i")
        specialTalentsBolt.classList.add("fa", "fa-bolt")
        specialTalentsTH.appendChild(specialTalentsBolt)
        specialTalentsTH.classList.add(headerClass)
        firstRow.appendChild(specialTalentsTH)
    }

    if (!isShowingGoalkeepers()) {
        const formTH = createHoverCardCell("th", "Exp", "Experience")
        formTH.classList.add(headerClass)
        // Find the form TH and insert before it
        const allThs = firstRow.querySelectorAll('th')
        allThs.forEach((th) => {
            if (th.textContent.trim() === 'Form') {
                th.parentNode.insertBefore(formTH, th)
            }
        })

        const thLS = createHoverCardCell("th", "LS", "Long Shot");
        firstRow.appendChild(thLS);

        const thMD = createHoverCardCell("th", "MD", "Midfield Dominance");
        firstRow.appendChild(thMD);

        const thOA = createHoverCardCell("th", "OA", "Offensive Assistance");
        firstRow.appendChild(thOA);
    }

    if (!isShowingAttackers()) {
        const thDA = createHoverCardCell("th", "DA", "Defensive Assistance");
        firstRow.appendChild(thDA);
    }
}

function createFootCell(foot) {
    const cellClass = utils.pluginNodeClass + "PlayersTableCell"
    const tdFoot = document.createElement("td")
    tdFoot.classList.add(utils.pluginNodeClass)
    tdFoot.classList.add(cellClass)

    const span = document.createElement("span")
    span.textContent = foot
    tdFoot.appendChild(span)
    return tdFoot
}

function createSpecialTalentsCell(specialTalents) {
    const cellClass = utils.pluginNodeClass + "PlayersTableCell"
    const tdST = document.createElement("td")
    tdST.classList.add(utils.pluginNodeClass)
    tdST.classList.add(cellClass)
    if (specialTalents) {
        for (const talent of specialTalents) {
            const span = document.createElement("span")
            span.classList.add("SpecialTalentSymbol")
            span.textContent = specialTalentsSymbols[talent]
            span.title = specialTalentsDescriptions[talent]
            tdST.appendChild(span)
        }
    }
    return tdST
}

// Calculates and adds the cells with the midfield dominance values for each player
async function appendAdditionalInfo(checkboxesData) {
    console.debug(`appending the midfield dominance...`)
    console.debug("isShowingAttackers:", isShowingAttackers(), "isShowingMidfielders:", isShowingMidfielders(), "isShowingDefenders:", isShowingDefenders(), "isShowingGoalkeepers:", isShowingGoalkeepers())

    let rows = document.querySelectorAll("table > tr:has(fw-player-hover)")
    const overrides = await db.getOverrides()
    for (const row of rows) {
        const playerID = listUtils.id(row)
        const loadedPlayerData = await db.getPlayer(playerID)
        listUtils.processTableRow(
            row,
            loadedPlayerData,
            checkboxesData,
            (row) => playerID,
            (row) => row.querySelector("td a span:not(.flag)").textContent.trim(),
            (row) => row.querySelector("td:has(fw-player-hover)"),
            true
        )

        const playerData = loadedPlayerData
        let playerPersonalities
        if (playerData && playerData["personalities"]) {
            playerPersonalities = playerData["personalities"]
        }
        let teamwork
        if (playerPersonalities && playerPersonalities['teamwork']) {
            teamwork = playerPersonalities['teamwork']
        }

        let specialTalents
        if (playerData && playerData.specialTalents) {
            specialTalents = playerData.specialTalents
        }

        let footInfo
        if (playerData && playerData.foot) {
            footInfo = playerData.foot
        }

        let experienceData
        if (playerData && playerData.experience) {
            experienceData = playerData.experience
        }

        let savedDate
        if (playerData && playerData.timestamp) {
            savedDate = new Date(playerData.timestamp)
            savedDate = savedDate.toLocaleString()
        }

        let valueNodes = row.querySelectorAll("fw-player-skill > span > span:first-child")
        if (valueNodes.length < 8) { // Goalkeepers
            // const tdFoot = createFootCell(footInfo ?? "")
            // row.appendChild(tdFoot)
            if (!overrides['preferOriginalSpecialTalentsColumn']) {
                const originalSTCell = row.querySelector('td:has(fw-player-talent)')
                if (originalSTCell) originalSTCell.remove()

                const tdST = createSpecialTalentsCell(specialTalents ?? [])
                row.appendChild(tdST)
            }

            let RE = listUtils.parseNumber(valueNodes[0]);
            let GP = listUtils.parseNumber(valueNodes[1]);
            let IN = listUtils.parseNumber(valueNodes[2]);
            let CT = listUtils.parseNumber(valueNodes[3]);
            let OR = listUtils.parseNumber(valueNodes[4]);

            console.debug(`RE=${RE} GP=${GP} IN=${IN} CT=${CT} OR=${OR}`)
            const assistanceCalculations = uiUtils.calculateDefensiveAssistanceGK({ OR: OR, teamwork: teamwork });

            const tdDA = createHoverCardCell(
                "td",
                assistanceCalculations.defensiveAssistance,
                `formula: OR\n${assistanceCalculations.defensiveAssistance}${assistanceCalculations.defensiveAssistanceModifierDetails}`,
                `denom${assistanceCalculations.defensiveAssistanceDenominationNormalized}`);
            row.appendChild(tdDA);
        } else { // Outfielders
            // const tdFoot = createFootCell(footInfo ?? "")
            // row.appendChild(tdFoot)

            if (!overrides['preferOriginalSpecialTalentsColumn']) {
                const originalSTCell = row.querySelector('td:has(fw-player-talent)')
                if (originalSTCell) originalSTCell.remove()

                const tdST = createSpecialTalentsCell(specialTalents ?? [])
                row.appendChild(tdST)
            }

            let SC = listUtils.parseNumber(valueNodes[0]);
            let OP = listUtils.parseNumber(valueNodes[1]);
            let BC = listUtils.parseNumber(valueNodes[2]);
            let PA = listUtils.parseNumber(valueNodes[3]);
            let CO = listUtils.parseNumber(valueNodes[5]);
            let TA = listUtils.parseNumber(valueNodes[6]);
            let DP = listUtils.parseNumber(valueNodes[7]);

            console.debug(`SC=${SC} OP=${OP} BC=${BC} PA=${PA} TA=${TA} DP=${DP}`)

            let longShot = (SC + Math.min(2 * SC, PA)) / 2
            let longShotMax = (100 + Math.min(2 * 100, 100)) / 2
            let longShotDenomination = longShot / longShotMax
            let longShotDenominationNormalized = utils.denomination(longShotDenomination * 100)

            let constitutionTreshold = 50
            let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
            let midfieldDominanceMax = 100 + 200
            let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
            let midfieldDominanceDenominationNormalized = utils.denomination(midfieldDominanceDenomination * 100)

            const assistanceCalculations = uiUtils.calculateAssistance({ OP: OP, BC: BC, TA: TA, DP: DP, teamwork: teamwork });

            if (!isShowingGoalkeepers()) {
                // Find the form cell and insert before it
                const formCell = row.querySelector('fw-player-form').parentNode
                let expContent
                let expClass
                let expHoverDescription
                if (experienceData && experienceData.value && experienceData.description) {
                    expContent = experienceData.description
                    expClass = `denom${experienceData.value}`
                    expHoverDescription = `Experience level`
                    if (savedDate) {
                        expHoverDescription += ` from ${savedDate}`
                    }
                } else {
                    expContent = '📂'
                    expClass = `denom4`
                    expHoverDescription = `Experience level - please visit the player profile to fetch the data necessary for displaying accurate description here`
                }
                const tdExp = createHoverCardCell(
                    "td",
                    expContent,
                    expHoverDescription,
                    expClass
                )
                tdExp.classList.add(utils.pluginNodeClass + "PlayersTableCell")
                row.insertBefore(tdExp, formCell)

                const tdLS = createHoverCardCell(
                    "td",
                    Math.trunc(longShot),
                    `formula: (SC + min(2 * SC, PA)) / 2\n(${SC} + min(2 * ${SC}, ${PA})) / 2\n(${SC} + ${Math.min(2 * SC, PA)}) / 2\n${SC + Math.min(2 * SC, PA)} / 2 = ${(SC + Math.min(2 * SC, PA)) / 2}`,
                    `denom${longShotDenominationNormalized}`);
                row.appendChild(tdLS);

                const tdMD = createHoverCardCell(
                    "td",
                    midfieldDominanceContribution,
                    `formula: PA + min(OP + BC, TA + DP) + max(0, CO - ${constitutionTreshold})\n${PA} + min(${OP} + ${BC}, ${TA} + ${DP}) + max(0, ${CO - constitutionTreshold})\n${PA} + min(${OP + BC}, ${TA + DP}) + ${Math.max(0, CO - constitutionTreshold)}\n${PA} + ${Math.min(OP + BC, TA + DP)} + ${Math.max(0, CO - constitutionTreshold)} = ${PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)}`,
                    `denom${midfieldDominanceDenominationNormalized}`);
                row.appendChild(tdMD);

                const tdOA = createHoverCardCell(
                    "td",
                    assistanceCalculations.offensiveAssistance,
                    `formula: OP + BC\n${OP} + ${BC} = ${assistanceCalculations.offensiveAssistance}${assistanceCalculations.offensiveAssistanceModifierDetails}`,
                    `denom${assistanceCalculations.offensiveAssistanceDenominationNormalized}`);
                row.appendChild(tdOA);
            }

            if (!isShowingAttackers()) {
                const tdDA = createHoverCardCell(
                    "td",
                    assistanceCalculations.defensiveAssistance,
                    `formula: TA + DP\n${TA} + ${DP} = ${assistanceCalculations.defensiveAssistance}${assistanceCalculations.defensiveAssistanceModifierDetails}`,
                    `denom${assistanceCalculations.defensiveAssistanceDenominationNormalized}`);
                row.appendChild(tdDA);
            }
        }
    }
}

function cleanUpNodeForPlayers(tableNode) {
    console.debug(`removing the old cells...`)
    tableNode.querySelectorAll(`td.${utils.pluginNodeClass}`).forEach(el => el.remove());
    tableNode.querySelectorAll(`th.${utils.pluginNodeClass}`).forEach(el => el.remove());
}

function isShowingAttackers() {
    let attackerFilter = document.querySelector("div.lineup-filter > span.attack-zone > span")
    return (attackerFilter && attackerFilter.textContent.trim() != "-")
}

function isShowingMidfielders() {
    let midfielderFilter = document.querySelector("div.lineup-filter > span.middle-zone > span")
    return (midfielderFilter && midfielderFilter.textContent.trim() != "-")
}

function isShowingDefenders() {
    let defenderFilter = document.querySelector("div.lineup-filter > span.defence-zone > span")
    return (defenderFilter && defenderFilter.textContent.trim() != "-")
}

function isShowingGoalkeepers() {
    let goalkeeperFilter = document.querySelector("div.lineup-filter > span.goalkeeper > span")
    return (goalkeeperFilter && goalkeeperFilter.textContent.trim() != "-")
}

export async function processPlayersPage() {

    console.info(`${utils.version} 🧍🧍🧍🧍 Processing players page`)
    let tableNode = document.querySelector("table.table")
    if (tableNode && tableNode.rows.length > 1) {

        console.debug(`Found the following table: `, tableNode)
        console.debug(`tableNode.rows.length: ${tableNode.rows.length}`)

        const checkboxes = await db.getCheckboxes()
        const checkboxesDefault = {
            specialTalents: true,
            teamwork: true,
            sportsmanship: true,
            advancedDevelopment: true,
            estimatedPotential: true
        }
        const checkboxesData = checkboxes || checkboxesDefault

        cleanUpNodeForPlayers(tableNode)

        const checkboxInsertionPoint = document.querySelector("fw-players div.card-header > div.row")
        if (checkboxInsertionPoint) {
            listUtils.addControlCheckboxes(
                checkboxInsertionPoint,
                checkboxesData,
                (cData) => { appendAdditionalInfo(cData) }
            )
        }

        const footDisplay = getFootDisplay(tableNode)
        if (footDisplay) {
            await updateFootInfo()
        }

        await createHeaders()
        await appendAdditionalInfo(checkboxesData)
    }
}

function getFootDisplay(table) {
    return table.querySelector("th.pointer > i.bi-layout-split")
}

async function updateFootInfo() {
    let rows = document.querySelectorAll("table > tr:has(fw-player-hover)")
    const playersIDs = [...rows].map(row => listUtils.id(row))
    const footInfo = [...rows].map(row => row.querySelector('td > div.opacity-08.ng-star-inserted').textContent.trim())
    await db.bulkGetPlayers(playersIDs)
    if (playersIDs.length != footInfo.length) {
        console.warn("Tried to update foot info for the players, but the players from storage have different size than footInfo array. Aborting before we corrupt the DB.", playersIDs, footInfo)
        return
    }
    for (let i = 0; i < playersIDs.length; i++) {
        const playerID = playersIDs[i]
        if (!playerID) continue

        const fInfo = footInfo[i]
        await db.updatePlayer(playerID, { foot: fInfo })
    }
}