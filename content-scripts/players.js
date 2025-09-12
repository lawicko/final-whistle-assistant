console.log(`loading players.js...`)

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
            var defensiveAssistanceNoModifiers = OR
            var defensiveAssistance = defensiveAssistanceNoModifiers
            var defensiveAssistanceMax = 100

            if (teamwork) {
                switch (teamwork) {
                    case -2:
                        var twp = -0.25
                        var teamworkDescription = `--`
                        break;
                    case -1:
                        var twp = -0.15
                        var teamworkDescription = `-`
                        break;
                    case 1:
                        var twp = 0.15
                        var teamworkDescription = `+`
                        break;
                    case 2:
                        var twp = 0.25
                        var teamworkDescription = `++`
                        break;
                    default:
                        console.warn("Value of teamwork is unexpected: ", teamwork);
                        var twp = 0
                }
                defensiveAssistance = Math.floor(defensiveAssistanceNoModifiers + defensiveAssistanceNoModifiers * twp)
            }
            let defensiveAssistanceDenomination = defensiveAssistance / defensiveAssistanceMax
            let defensiveAssistanceDenominationNormalized = denomination(defensiveAssistanceDenomination * 100)

            const defensiveAssistanceModifierDifference = defensiveAssistance - defensiveAssistanceNoModifiers
            var defensiveAssistanceModifierDetails = ``
            if (defensiveAssistanceModifierDifference !== 0) {
                const sign = defensiveAssistanceModifierDifference > 0 ? '+' : '-'
                defensiveAssistanceModifierDetails = ` (${defensiveAssistanceNoModifiers} ${sign} ${Math.abs(defensiveAssistanceModifierDifference)} from Teamwork${teamworkDescription} personality)`
            }
            const tdDA = createHoverCardCell(
                "td",
                defensiveAssistance,
                `formula: OR\n${defensiveAssistance}${defensiveAssistanceModifierDetails}`,
                `denom${defensiveAssistanceDenominationNormalized}`);
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
        if (span.textContent.trim() === "⬡") {
            span.remove();
        }
    });
}

function clearSportsmanship(element) {
    const spans = element.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === "⚖︎") {
            span.remove();
        }
    });
}

function applyTeamwork(element, teamwork) {
    const hasTeamworkSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
        child => child.textContent.trim() === "⬡"
    );
    if (!hasTeamworkSymbol) {
        console.debug(`Applying Teamwork: ${teamwork}`)

        const teamworkSpan = document.createElement("span");
        teamworkSpan.classList.add('teamwork')
        teamworkSpan.textContent = " ⬡"
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
        { id: "teamworkCheckbox", label: "⬡ Teamwork", variable: "showTeamwork" },
        { id: "sportsmanshipCheckbox", label: "⚖︎ Sportsmanship", variable: "showSportsmanship" }
    ];
    rightItems = document.createElement("div")
    rightItems.classList.add("right-items")

    checkboxesData.forEach(item => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = item.id;

        const suffix = "Checkbox";
        const checkboxKey = item.id.slice(0, -suffix.length);
        checkbox.checked = !!checkboxesDataFromStorage[checkboxKey]
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

// Options for the observer (which mutations to observe)
const playersObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const playersObservingCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        observer.disconnect() // otherwise we end up in a loop

        console.debug(`Found the following table: `, tableNode)
        console.debug(`tableNode.rows.length: ${tableNode.rows.length}`)
        //        mutationList.forEach(el => console.debug(`mutationType: ${el.type}, mutationTarget: ${el.target}, oldValue: ${el.oldValue}, newValue: ${el.data}`))

        storage.get(["player-data", "checkboxes"]).then(result => {
            const checkboxesData = result["checkboxes"] || {};
            const storedPlayerData = result["player-data"] || {};

            cleanUpNodeForPlayers(tableNode)

            addPersonalityCheckboxes(checkboxesData)
            createHeaders()
            appendAdditionalInfo(storedPlayerData)
            observer.observe(alwaysPresentNode, playersObservingConfig);
        });
    } else {
        console.debug(`Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const playersObserver = new MutationObserver(playersObservingCallback);

browser.runtime.onMessage.addListener((message) => {
    console.debug(`runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    const url = message.url
    if (url) {
        if (url.endsWith("players")) {
            // Start observing the target node for configured mutations
            playersObserver.observe(alwaysPresentNode, playersObservingConfig);
            console.debug(`Started the div.wrapper observation`)
        } else {
            playersObserver.disconnect()
            console.debug(`Skipped (or disconnected) the div.wrapper observation`)
        }
    }
})


async function applyCustomColorsSquadSymbols() {
    try {
        // Load colors from storage (with defaults)
        const optionsStorage = browser.storage.sync;
        const { colors = {} } = await optionsStorage.get("colors");

        // Inject CSS rule so future elements are styled too
        const style = document.createElement("style");
        style.textContent = `
        span.teamwork.doublePositive {
            color: ${colors["color-setting-teamwork++"]};
        }
        span.teamwork.positive {
            color: ${colors["color-setting-teamwork+"]};
        }
        span.teamwork.negative {
            color: ${colors["color-setting-teamwork-"]};
        }
        span.teamwork.doubleNegative {
            color: ${colors["color-setting-teamwork--"]};
        }
    `;
        document.head.appendChild(style);

    } catch (err) {
        console.error("Failed to apply custom colors squad symbols:", err);
    }
}

// Run the function
applyCustomColorsSquadSymbols();