import * as utils from "./utils.js"
import * as uiUtils from "./ui_utils.js"
import * as listUtils from "./list_utils.js"
import * as db from "./db_access.js"

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
function createHeaders() {
    console.debug(`appending headers...`)
    var firstRow = document.querySelector("table > tr:first-of-type");

    console.debug("isShowingAttackers:", isShowingAttackers(), "isShowingMidfielders:", isShowingMidfielders(), "isShowingDefenders:", isShowingDefenders(), "isShowingGoalkeepers:", isShowingGoalkeepers())

    if (!isShowingGoalkeepers()) {
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

// Calculates and adds the cells with the midfield dominance values for each player
async function appendAdditionalInfo(checkboxesData) {
    console.debug(`appending the midfield dominance...`)
    console.debug("isShowingAttackers:", isShowingAttackers(), "isShowingMidfielders:", isShowingMidfielders(), "isShowingDefenders:", isShowingDefenders(), "isShowingGoalkeepers:", isShowingGoalkeepers())

    let rows = document.querySelectorAll("table > tr:has(fw-player-hover)")
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

        let valueNodes = row.querySelectorAll("fw-player-skill > span > span:first-child")
        if (valueNodes.length < 8) { // Goalkeepers
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

        const result = await utils.storage.get(["checkboxes"])
        const checkboxesDefault = {
            specialTalents: "true",
            teamwork: "true",
            sportsmanship: "true",
            advancedDevelopment: "true",
            estimatedPotential: "true"
        }
        const checkboxesData = result["checkboxes"] || checkboxesDefault

        cleanUpNodeForPlayers(tableNode)

        const checkboxInsertionPoint = document.querySelector("fw-players div.card-header > div.row")
        if (checkboxInsertionPoint) {
            listUtils.addControlCheckboxes(
                checkboxInsertionPoint,
                checkboxesData,
                (cData) => { appendAdditionalInfo(cData) }
            )
        }
        createHeaders()
        await appendAdditionalInfo(checkboxesData)
    }
}