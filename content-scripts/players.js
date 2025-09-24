import * as utils from "./utils.js"
import * as uiUtils from "./ui_utils.js"
import * as listUtils from "./list_utils.js"

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
function appendAdditionalInfo(storedPlayerData, checkboxesData) {
    console.debug(`appending the midfield dominance...`)
    console.debug("isShowingAttackers:", isShowingAttackers(), "isShowingMidfielders:", isShowingMidfielders(), "isShowingDefenders:", isShowingDefenders(), "isShowingGoalkeepers:", isShowingGoalkeepers())

    let rows = document.querySelectorAll("table > tr");
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        // Select the first <a> inside a <td> whose href contains "/player/"
        const playerLink = row.querySelector('td a[href*="/player/"]');
        // Match the number after /player/
        if (!playerLink) { // When the user hovers over the player name, the hover card shows up
            return
        }

        const playerID = listUtils.id(row)

        // Select the first span child
        const firstSpan = Array.from(playerLink.children).find(
            child => child.tagName === 'SPAN' && child.textContent.trim() !== ''
        );
        var playerName = ""
        if (firstSpan) {
            playerName = firstSpan.textContent
            console.debug('Processing player:', playerName);
        } else {
            console.warn('No non-empty span found - unable to determine the player name :(');
        }

        let valueNodes = rows[i].querySelectorAll("fw-player-skill > span > span:first-child");

        const playerData = storedPlayerData[playerID]
        const insertionPoint = rows[i].querySelector("td:has(fw-player-hover)")
        if (playerData) {
            console.debug(`Found stored player data for: ${playerName}`, playerData)
            let playerPersonalities = playerData["personalities"]
            if (!playerPersonalities) {
                console.debug(`No personalities in player profile for ${playerName}.`)
                uiUtils.addNoDataSymbol(insertionPoint)
            } else {
                uiUtils.removeNoDataSymbol(insertionPoint)

                var teamwork = playerPersonalities['teamwork']
                const showTeamwork = checkboxesData['teamwork'] ?? false
                if (teamwork) {
                    if (showTeamwork) {
                        uiUtils.applyTeamwork(insertionPoint, teamwork)
                    } else {
                        clearTeamwork(insertionPoint)
                    }
                }
                const sportsmanship = playerPersonalities['sportsmanship']
                const showSportsmanship = checkboxesData['sportsmanship'] ?? false
                if (sportsmanship) {
                    if (showSportsmanship) {
                        uiUtils.applySportsmanship(insertionPoint, sportsmanship)
                    } else {
                        clearSportsmanship(insertionPoint)
                    }
                }
            }

            const ageFromListing = listUtils.age(row)
            const showAD = checkboxesData['advancedDevelopment'] ?? false
            const showEP = checkboxesData['estimatedPotential'] ?? false
            // Hidden skills
            const hiddenSkills = playerData["hiddenSkills"]
            if (hiddenSkills) {
                listUtils.updateHiddenSkillsDetails({
                    insertionPoint: insertionPoint,
                    hiddenSkills: hiddenSkills,
                    config: {
                        showAdvancedDevelopment: showAD && ageFromListing < 25,
                        showEstimatedPotential: showEP && ageFromListing < 21
                    }
                })
            }
        } else {
            console.debug(`Player ${playerName} has no saved profile.`)
            uiUtils.addNoDataSymbol(insertionPoint)
        }

        const parseNumber = (node) => Number(node.textContent.replace(/\D/g, ''));
        if (valueNodes.length < 8) { // Goalkeepers
            let RE = parseNumber(valueNodes[0]);
            let GP = parseNumber(valueNodes[1]);
            let IN = parseNumber(valueNodes[2]);
            let CT = parseNumber(valueNodes[3]);
            let OR = parseNumber(valueNodes[4]);

            console.debug(`RE=${RE} GP=${GP} IN=${IN} CT=${CT} OR=${OR}`)
            const assistanceCalculations = uiUtils.calculateDefensiveAssistanceGK({ OR: OR, teamwork: teamwork });

            const tdDA = createHoverCardCell(
                "td",
                assistanceCalculations.defensiveAssistance,
                `formula: OR\n${assistanceCalculations.defensiveAssistance}${assistanceCalculations.defensiveAssistanceModifierDetails}`,
                `denom${assistanceCalculations.defensiveAssistanceDenominationNormalized}`);
            rows[i].appendChild(tdDA);
        } else { // Outfielders
            let SC = parseNumber(valueNodes[0]);
            let OP = parseNumber(valueNodes[1]);
            let BC = parseNumber(valueNodes[2]);
            let PA = parseNumber(valueNodes[3]);
            let CO = parseNumber(valueNodes[5]);
            let TA = parseNumber(valueNodes[6]);
            let DP = parseNumber(valueNodes[7]);

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
                rows[i].appendChild(tdLS);

                const tdMD = createHoverCardCell(
                    "td",
                    midfieldDominanceContribution,
                    `formula: PA + min(OP + BC, TA + DP) + max(0, CO - ${constitutionTreshold})\n${PA} + min(${OP} + ${BC}, ${TA} + ${DP}) + max(0, ${CO - constitutionTreshold})\n${PA} + min(${OP + BC}, ${TA + DP}) + ${Math.max(0, CO - constitutionTreshold)}\n${PA} + ${Math.min(OP + BC, TA + DP)} + ${Math.max(0, CO - constitutionTreshold)} = ${PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)}`,
                    `denom${midfieldDominanceDenominationNormalized}`);
                rows[i].appendChild(tdMD);

                const tdOA = createHoverCardCell(
                    "td",
                    assistanceCalculations.offensiveAssistance,
                    `formula: OP + BC\n${OP} + ${BC} = ${assistanceCalculations.offensiveAssistance}${assistanceCalculations.offensiveAssistanceModifierDetails}`,
                    `denom${assistanceCalculations.offensiveAssistanceDenominationNormalized}`);
                rows[i].appendChild(tdOA);
            }

            if (!isShowingAttackers()) {
                const tdDA = createHoverCardCell(
                    "td",
                    assistanceCalculations.defensiveAssistance,
                    `formula: TA + DP\n${TA} + ${DP} = ${assistanceCalculations.defensiveAssistance}${assistanceCalculations.defensiveAssistanceModifierDetails}`,
                    `denom${assistanceCalculations.defensiveAssistanceDenominationNormalized}`);
                rows[i].appendChild(tdDA);
            }
        }
    }
}

function clearTeamwork(element) {
    const spans = element.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === uiUtils.personalitiesSymbols["teamwork"]) {
            span.remove();
        }
    });
}

function clearSportsmanship(element) {
    const spans = element.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === uiUtils.personalitiesSymbols["sportsmanship"]) {
            span.remove();
        }
    });
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
    if (tableNode != undefined && tableNode.rows.length > 1) {

        console.debug(`Found the following table: `, tableNode)
        console.debug(`tableNode.rows.length: ${tableNode.rows.length}`)

        const result = await utils.storage.get(["player-data", "checkboxes"])
        const checkboxesDefault = {
            teamwork: "true",
            sportsmanship: "true",
            advancedDevelopment: "true",
            estimatedPotential: "true"
        }
        const checkboxesData = result["checkboxes"] || checkboxesDefault
        const storedPlayerData = result["player-data"] || {}

        cleanUpNodeForPlayers(tableNode)

        listUtils.addControlCheckboxes(
            document.querySelector("fw-players div.card-header > div.row"),
            checkboxesData,
            (pData, cData) => { appendAdditionalInfo(pData, cData) }
        )
        createHeaders()
        appendAdditionalInfo(storedPlayerData, checkboxesData)
    }
}