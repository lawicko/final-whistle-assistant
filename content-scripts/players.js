import {
    storage,
    pluginNodeClass
} from './utils.js';

import { 
    addNoDataSymbol,
    applySportsmanship,
    calculateAssistance,
    calculateDefensiveAssistanceGK,
    denomination,
    personalitiesSymbols,
    removeNoDataSymbol
} from './ui_utils.js';

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
    cell.classList.add(pluginNodeClass)
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
function appendAdditionalInfo(storedPlayerData) {
    console.debug(`appending the midfield dominance...`)
    console.debug("isShowingAttackers:", isShowingAttackers(), "isShowingMidfielders:", isShowingMidfielders(), "isShowingDefenders:", isShowingDefenders(), "isShowingGoalkeepers:", isShowingGoalkeepers())

    let rows = document.querySelectorAll("table > tr");
    for (let i = 1; i < rows.length; i++) {
        // Select the first <a> inside a <td> whose href contains "/player/"
        const playerLink = rows[i].querySelector('td a[href*="/player/"]');
        // Match the number after /player/
        if (!playerLink) { // When the user hovers over the player name, the hover card shows up
            return
        }
        const match = playerLink.href.match(/\/player\/(\d+)/);
        const playerID = match ? match[1] : null;
        if (!playerID) {
            console.error("Tried to extract player ID from href ", playerLink.href, " but there are no matches")
        }
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
        const container = playerLink.parentNode.parentNode.parentNode
        if (playerData) {
            console.debug(`Found stored player data for: ${playerName}`, playerData)
        } else {
            console.debug(`Player ${playerName} has no saved profile.`)
            addNoDataSymbol(container)
        }
        var playerPersonalities = undefined
        if (playerData && playerData["personalities"]) {
            playerPersonalities = playerData["personalities"]
        }
        if (!playerPersonalities) {
            console.debug(`No personalities in player profile for ${playerName}.`)
            addNoDataSymbol(container)
        } else {
            removeNoDataSymbol(container)

            var teamwork = playerPersonalities['teamwork']
            if (teamwork) {
                if (showTeamwork) {
                    applyTeamwork(playerLink, teamwork)
                } else {
                    clearTeamwork(container)
                }
            }
            const sportsmanship = playerPersonalities['sportsmanship']
            if (sportsmanship) {
                if (showSportsmanship) {
                    applySportsmanship(playerLink, sportsmanship)
                } else {
                    clearSportsmanship(container)
                }
            }
        }
        const parseNumber = (node) => Number(node.textContent.replace(/\D/g, ''));
        if (valueNodes.length < 8) { // Goalkeepers
            let RE = parseNumber(valueNodes[0]);
            let GP = parseNumber(valueNodes[1]);
            let IN = parseNumber(valueNodes[2]);
            let CT = parseNumber(valueNodes[3]);
            let OR = parseNumber(valueNodes[4]);

            console.debug(`RE=${RE} GP=${GP} IN=${IN} CT=${CT} OR=${OR}`)
            const assistanceCalculations = calculateDefensiveAssistanceGK({ OR: OR, teamwork: teamwork });
            
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
            let longShotDenominationNormalized = denomination(longShotDenomination * 100)

            let constitutionTreshold = 50
            let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
            let midfieldDominanceMax = 100 + 200
            let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
            let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)
            
            const assistanceCalculations = calculateAssistance({ OP: OP, BC: BC, TA: TA, DP: DP, teamwork: teamwork });

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
        if (span.textContent.trim() === personalitiesSymbols["teamwork"]) {
            span.remove();
        }
    });
}

function clearSportsmanship(element) {
    const spans = element.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === personalitiesSymbols["sportsmanship"]) {
            span.remove();
        }
    });
}

function applyTeamwork(element, teamwork) {
    const hasTeamworkSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
        child => child.textContent.trim() === personalitiesSymbols["teamwork"]
    );
    if (!hasTeamworkSymbol) {
        console.debug(`Applying Teamwork: ${teamwork}`)

        const teamworkSpan = document.createElement("span");
        teamworkSpan.classList.add('teamwork')
        teamworkSpan.textContent = " " + personalitiesSymbols["teamwork"]
        switch (teamwork) {
            case -2:
                teamworkSpan.classList.add('doubleNegative');
                teamworkSpan.title = "This player is a terrible team player, he will not assist his team mates as much as his skills would indicate (assistance decreased by 25%)";
                break;
            case -1:
                teamworkSpan.classList.add('negative');
                teamworkSpan.title = "This player is not a team player, he will not assist his team mates as much as his skills would indicate (assistance decreased by 15%)";
                break;
            case 1:
                teamworkSpan.classList.add('positive');
                teamworkSpan.title = "This player is a team player, he will assist his team mates more than his skills would indicate (assistance increased by 15%)";
                break;
            case 2:
                teamworkSpan.classList.add('doublePositive');
                teamworkSpan.title = "This player is a fantastic team player, he will assist his team mates much more than his skills would indicate (assistance increased by 25%)";
                break;
            default:
                console.warn("Value of teamwork is unexpected: ", teamwork);
        }

        element.parentNode.parentNode.parentNode.appendChild(teamworkSpan)
    }
}

function cleanUpNodeForPlayers(tableNode) {
    console.debug(`removing the old cells...`)
    tableNode.querySelectorAll(`td.${pluginNodeClass}`).forEach(el => el.remove());
    tableNode.querySelectorAll(`th.${pluginNodeClass}`).forEach(el => el.remove());
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

// Boolean variables to track checkbox state
let showTeamwork = true;
let showSportsmanship = true;

function addPersonalityCheckboxes(checkboxesDataFromStorage) {
    const cardHeader = document.querySelector("fw-players div.card-header > div.row");
    if (!cardHeader) return;

    // Avoid adding duplicates
    if (document.getElementById("teamworkCheckbox")) return;

    const checkboxesData = [
        { id: "teamworkCheckbox", label: `${personalitiesSymbols["teamwork"]} Teamwork`, variable: "showTeamwork" },
        { id: "sportsmanshipCheckbox", label: `${personalitiesSymbols["sportsmanship"]} Sportsmanship`, variable: "showSportsmanship" }
    ];
    const rightItems = document.createElement("div")
    rightItems.classList.add("right-items")

    checkboxesData.forEach(item => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = item.id;

        const suffix = "Checkbox";
        const checkboxKey = item.id.slice(0, -suffix.length);
        if (checkboxesDataFromStorage[checkboxKey] === undefined) {
            checkbox.checked = true; // default to checked
        } else {
            checkbox.checked = !!checkboxesDataFromStorage[checkboxKey];
        }
        if (item.variable === "showTeamwork") showTeamwork = checkbox.checked;
        if (item.variable === "showSportsmanship") showSportsmanship = checkbox.checked;

        const label = document.createElement("label");
        label.textContent = item.label;
        label.htmlFor = item.id;

        // Update the corresponding boolean variable on change
        checkbox.addEventListener("change", async () => {
            if (item.variable === "showTeamwork") showTeamwork = checkbox.checked;
            if (item.variable === "showSportsmanship") showSportsmanship = checkbox.checked;

            console.log(`${item.label}:`, checkbox.checked);
            const {
                checkboxes: cd = {},
                "player-data": storedPlayerData = {}
            } = await storage.get(["player-data", "checkboxes"]);
            if (showTeamwork) {
                cd["teamwork"] = "true"
            } else {
                delete cd["teamwork"]
            }
            if (showSportsmanship) {
                cd["sportsmanship"] = "true"
            } else {
                delete cd["sportsmanship"]
            }
            await storage.set({ checkboxes: cd })
            appendAdditionalInfo(storedPlayerData)
        });


        rightItems.appendChild(checkbox);
        rightItems.appendChild(label);
        rightItems.appendChild(document.createTextNode(" ")); // spacing
    });
    cardHeader.appendChild(rightItems)
}

export async function processPlayersPage() {
    console.info(`Processing players page...`);
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {

        console.debug(`Found the following table: `, tableNode)
        console.debug(`tableNode.rows.length: ${tableNode.rows.length}`)

        const result = await storage.get(["player-data", "checkboxes"])
        const checkboxesData = result["checkboxes"] || {};
        const storedPlayerData = result["player-data"] || {};

        cleanUpNodeForPlayers(tableNode)

        addPersonalityCheckboxes(checkboxesData)
        createHeaders()
        appendAdditionalInfo(storedPlayerData)
    }
}