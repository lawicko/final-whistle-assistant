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
    console.info(`appending headers...`)
    var firstRow = document.querySelector("table > tr:first-of-type");

    const thLS = createHoverCardCell("th", "LS", "Long Shot");
    firstRow.appendChild(thLS);

    const thMD = createHoverCardCell("th", "MD", "Midfield Dominance");
    firstRow.appendChild(thMD);
}

// Calculates and adds the cells with the midfield contribution values for each player
function appendMidfieldContributionForPlayers() {
    console.info(`appending the midfield contribution...`)
    let rows = document.querySelectorAll("table > tr");
    let longShotMax = (100 + Math.min(2 * 100, 100)) / 2
    let midfieldDominanceMax = 100 + 200
    // let advancedMidfieldDominanceMax = (100 + 200) * 0.5
    // let advancedMidfieldDominanceFlexibleMax = 100 + 200
    let constitutionTreshold = 50
    for (let i = 1; i < rows.length; i++) {
        let valueNodes = rows[i].querySelectorAll("fw-player-skill > span > span:first-child");

        // Because we are listening to the changes on the insides of the table, it is possible that some updates come in-between when the cells are not yet populated, so for this cases we don't need to do anything
        if (valueNodes.length < 8) {
            return
        }

        const parseNumber = (node) => Number(node.textContent.replace(/\D/g, ''));

        let SC = parseNumber(valueNodes[0]);
        let OP = parseNumber(valueNodes[1]);
        let BC = parseNumber(valueNodes[2]);
        let PA = parseNumber(valueNodes[3]);
        let CO = parseNumber(valueNodes[5]);
        let TA = parseNumber(valueNodes[6]);
        let DP = parseNumber(valueNodes[7]);

        // console.debug(`SC=${SC} OP=${OP} BC=${BC} PA=${PA} TA=${TA} DP=${DP}`)

        let longShot = (SC + Math.min(2 * SC, PA)) / 2
        let longShotDenomination = longShot / longShotMax
        let longShotDenominationNormalized = denomination(longShotDenomination * 100)

        let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
        let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
        let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)

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
    }
}

function cleanUpNodeForPlayers(tableNode) {
    console.debug(`removing the old cells...`)
    tableNode.querySelectorAll(`td.${pluginNodeClass}`).forEach(el => el.remove());
    tableNode.querySelectorAll(`th.${pluginNodeClass}`).forEach(el => el.remove());
}

function isShowingGoalkeepers() {
    let goalkeeperFilter = document.querySelector("div.lineup-filter > span.goalkeeper > span")
    return (goalkeeperFilter != "undefined" && goalkeeperFilter.innerHTML != "-")
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


        cleanUpNodeForPlayers(tableNode)

        if (!isShowingGoalkeepers()) {
            createHeaders()
            appendMidfieldContributionForPlayers()
        } else {
        }
        observer.observe(alwaysPresentNode, playersObservingConfig);
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

addCSS(`
    .${pluginNodeClass}[data-tooltip]::after {
        right: 0%;   /* push it left of the parent */
        left: auto;    /* reset the left so it doesn’t conflict */
        top: auto;
        bottom: 100%;
    }
`)
