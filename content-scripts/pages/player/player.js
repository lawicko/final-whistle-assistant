import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as specialTalentsUtils from "../../special_talents_utils.js"
import * as personalitiesUtils from "../../personalities_utils.js"
import * as playerUtils from "./player_utils.js"
import * as db from "../../db_access.js"
import * as integrationUtils from "../../integrations/integrations_utls.js"
import { processPlayerMatchesTab } from "./player+matches.js"
import { processPlayerReports } from "./player+reports.js"
import { processPlayerTraining } from "./player+training.js"
import { showInjuries } from "./player+injuries.js"

// Calculates and adds the cells with the midfield dominance values for each player
function appendComputedSkills(tableNode) {
    let tbodyNode = tableNode.querySelector("tbody")
    let midfieldDominanceMax = 100 + 200
    let constitutionTreshold = 50

    let allCells = tableNode.querySelectorAll("tr td")
    // console.debug(`allCells.length = ${allCells.length}`)
    let SC_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Scoring'
    )

    if (!SC_label_cell) return // Goalkeeper

    const SC_cell = SC_label_cell.nextElementSibling
    let SC_span = SC_cell.querySelector("span")
    let SC = Number(SC_span.textContent.trim())
    if (Number.isNaN(SC)) {
        console.debug("Invalid number in SC_span:", SC_span.textContent, "<- assuming not our player.");
        console.info("Can't see numbers in core skills table, will not append computed skills")
        return
    }

    console.log(`Appending midfield dominance...`)

    const SC_pot_cell = SC_cell.nextElementSibling
    let SC_pot_span = SC_pot_cell.querySelector("span")
    let SC_POT = Number(SC_pot_span.textContent.trim())
    console.debug(`SC ${SC}/${SC_POT}`)

    let OP_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Off. Pos.'
    )

    const OP_cell = OP_label_cell.nextElementSibling
    let OP_span = OP_cell.querySelector("span")
    let OP = Number(OP_span.textContent.trim())

    const OP_pot_cell = OP_cell.nextElementSibling
    let OP_pot_span = OP_pot_cell.querySelector("span")
    let OP_POT = Number(OP_pot_span.textContent.trim())
    console.debug(`OP ${OP}/${OP_POT}`)

    let BC_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Ball Control'
    )

    const BC_cell = BC_label_cell.nextElementSibling
    let BC_span = BC_cell.querySelector("span")
    let BC = Number(BC_span.textContent.trim())

    const BC_pot_cell = BC_cell.nextElementSibling
    let BC_pot_span = BC_pot_cell.querySelector("span")
    let BC_POT = Number(BC_pot_span.textContent.trim())
    console.debug(`BC ${BC}/${BC_POT}`)

    let PA_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Passing'
    )

    const PA_cell = PA_label_cell.nextElementSibling
    let PA_span = PA_cell.querySelector("span")
    let PA = Number(PA_span.textContent.trim())

    const PA_pot_cell = PA_cell.nextElementSibling
    let PA_pot_span = PA_pot_cell.querySelector("span")
    let PA_POT = Number(PA_pot_span.textContent.trim())
    console.debug(`PA ${PA}/${PA_POT}`)

    let AE_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Aerial Ability'
    )

    const AE_cell = AE_label_cell.nextElementSibling
    let AE_span = AE_cell.querySelector("span")
    let AE = Number(AE_span.textContent.trim())

    const AE_pot_cell = AE_cell.nextElementSibling
    let AE_pot_span = AE_pot_cell.querySelector("span")
    let AE_POT = Number(AE_pot_span.textContent.trim())
    console.debug(`AE ${AE}/${AE_POT}`)

    let CO_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Constitution'
    )

    const CO_cell = CO_label_cell.nextElementSibling
    let CO_span = CO_cell.querySelector("span")
    let CO = Number(CO_span.textContent.trim())

    const CO_pot_cell = CO_cell.nextElementSibling
    let CO_pot_span = CO_pot_cell.querySelector("span")
    let CO_POT = Number(CO_pot_span.textContent.trim())
    console.debug(`CO ${CO}/${CO_POT}`)

    let TA_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Tackling'
    )

    const TA_cell = TA_label_cell.nextElementSibling
    let TA_span = TA_cell.querySelector("span")
    let TA = Number(TA_span.textContent.trim())

    const TA_pot_cell = TA_cell.nextElementSibling
    let TA_pot_span = TA_pot_cell.querySelector("span")
    let TA_POT = Number(TA_pot_span.textContent.trim())
    console.debug(`TA ${TA}/${TA_POT}`)

    let DP_label_cell = Array.from(allCells).find(
        cell => cell.textContent.trim() === 'Def. Pos.'
    )

    const DP_cell = DP_label_cell.nextElementSibling
    let DP_span = DP_cell.querySelector("span")
    let DP = Number(DP_span.textContent.trim())

    const DP_pot_cell = DP_cell.nextElementSibling
    let DP_pot_span = DP_pot_cell.querySelector("span")
    let DP_POT = Number(DP_pot_span.textContent.trim())
    console.debug(`DP ${DP}/${DP_POT}`)

    let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
    let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
    let midfieldDominanceDenominationNormalized = utils.denomination(midfieldDominanceDenomination * 100)

    let midfieldDominanceContributionPotential = PA_POT + Math.min(OP_POT + BC_POT, TA_POT + DP_POT) + Math.max(0, CO_POT - constitutionTreshold)
    let midfieldDominanceDenominationPotential = midfieldDominanceContributionPotential / midfieldDominanceMax
    let midfieldDominanceDenominationNormalizedPotential = utils.denomination(midfieldDominanceDenominationPotential * 100)

    console.debug("contribution = ", midfieldDominanceContribution, "denomination = ", midfieldDominanceDenomination, " normalized: ", midfieldDominanceDenominationNormalized)
    console.debug("contribution (potential)= ", midfieldDominanceContributionPotential, "denomination = ", midfieldDominanceDenominationPotential, " normalized: ", midfieldDominanceDenominationNormalizedPotential)

    // Midfield Dominance
    const trMD = createComputedPropertyRow(
        "Midfield Dominance",
        midfieldDominanceDenominationNormalized,
        midfieldDominanceContribution,
        midfieldDominanceDenominationNormalizedPotential,
        midfieldDominanceContributionPotential
    )
    tbodyNode.appendChild(trMD)

    // Assistance calculations
    let personalities = {}
    const personalitiesTable = getPersonalitiesTable()
    if (personalitiesTable) {
        personalities = getPersonalitiesData(personalitiesTable)
    }
    console.debug("personalities:", personalities)
    const resultCurrents = uiUtils.calculateAssistance({ OP: OP, BC: BC, TA: TA, DP: DP, teamwork: personalities["teamwork"] });
    const resultPotential = uiUtils.calculateAssistance({ OP: OP_POT, BC: BC_POT, TA: TA_POT, DP: DP_POT, teamwork: personalities["teamwork"] });

    // Offensive Assistance
    var trOA = createComputedPropertyRow(
        "Offensive Assistance",
        resultCurrents.offensiveAssistanceDenominationNormalized,
        resultCurrents.offensiveAssistance,
        resultPotential.offensiveAssistanceDenominationNormalized,
        resultPotential.offensiveAssistance
    )
    tbodyNode.appendChild(trOA)

    // Defensive Assistance
    var trDA = createComputedPropertyRow(
        "Defensive Assistance",
        resultCurrents.defensiveAssistanceDenominationNormalized,
        resultCurrents.defensiveAssistance,
        resultPotential.defensiveAssistanceDenominationNormalized,
        resultPotential.defensiveAssistance
    )
    tbodyNode.appendChild(trDA)

    // Tool-tips
    let updatedCells = tbodyNode.querySelectorAll("tr td")

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

    const oaValueText = `OP + BC =\n${OP} + ${BC} = ${resultCurrents.offensiveAssistance}${resultCurrents.offensiveAssistanceModifierDetails}`
    const oaPotentialText = `OP_POT + BC_POT = \n${OP_POT} + ${BC_POT} = ${resultPotential.offensiveAssistance}${resultPotential.offensiveAssistanceModifierDetails}`
    addHoverCardToCell(updatedCells, "Offensive Assistance", "OP + BC", oaValueText, oaPotentialText)

    const daValueText = `TA + DP =\n${TA} + ${DP} = ${resultCurrents.defensiveAssistance}${resultCurrents.defensiveAssistanceModifierDetails}`
    const daPotentialText = `TA_POT + DP_POT = \n${TA_POT} + ${DP_POT} = ${resultPotential.defensiveAssistance}${resultPotential.defensiveAssistanceModifierDetails}`
    addHoverCardToCell(updatedCells, "Defensive Assistance", "TA + DP", daValueText, daPotentialText)
}

function createComputedPropertyRow(label, currentDenomination, currentTextContent, potentialDenomination, potentialTextContent) {
    var tr = document.createElement("tr")
    tr.className = utils.pluginNodeClass

    var tdLabel = document.createElement("td")
    tdLabel.className = "text-body-secondary"
    var tdSpan = document.createElement("span")
    tdSpan.textContent = label
    tdLabel.appendChild(tdSpan)
    tr.appendChild(tdLabel)

    var tdCurrent = document.createElement("td")
    tdCurrent.className = "text-end"
    const tdCurrentSpan = document.createElement('span');
    tdCurrentSpan.className = `denom${currentDenomination}`;
    tdCurrentSpan.textContent = currentTextContent;
    tdCurrent.appendChild(tdCurrentSpan);
    tr.appendChild(tdCurrent)

    var tdPot = document.createElement("td")
    tdPot.className = "text-end"
    const tdPotSpan = document.createElement('span');
    tdPotSpan.className = `denom${potentialDenomination}`;
    tdPotSpan.textContent = potentialTextContent;
    tdPot.appendChild(tdPotSpan);
    tr.appendChild(tdPot)

    return tr
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
    const valueCell = targetCell.nextElementSibling
    valueCell.setAttribute("data-tooltip", valueTooltipText);
    valueCell.classList.add('value-tooltip')

    // Add tooltip with the formula to the potential cell
    const potentialCell = valueCell.nextElementSibling
    potentialCell.setAttribute("data-tooltip", potentialTooltipText)
}

/**
 * Performs a check if the player is ours.
 * @returns {boolean} True if the player is ours
 */
function isOwnPlayer() {
    // Check if there are inputs on the page
    const inputCheckbox = document.querySelector('input.form-check-input')
    // The checkboxes can appear if the player is on sale, so we need another check for control buttons that only appear on own player page
    const controlButtons = Array.from(document.querySelectorAll("button"))
        .filter(btn => {
            const txt = btn.textContent.trim();
            return txt === "Sell" || txt === "Fire";
        });
    // console.debug("inputCheckbox:", inputCheckbox, "controlButtons:", controlButtons)
    return inputCheckbox && controlButtons.length >= 2
}

/**
 * Gets the club data of the player.
 * @returns {Object} data object { id: string, name: string}
 */
function getPlayerClubData() {
    const link = document.querySelector('table span fw-club-hover a')
    if (!link) return
    const clubID = utils.lastPathComponent(link.href)
    const clubName = link.querySelector('span.club-name').textContent
    const clubData = {
        id: clubID,
        name: clubName
    }
    return clubData
}

/**
 * Gets the foot data of the player.
 * @returns {string} "L" or "R"
 */
function getPlayerFoot() {
    const playerClubMetaTable = document.querySelector(uiUtils.playerClubMetaTableQuery)
    if (!playerClubMetaTable) return
    const allCells = Array.from(playerClubMetaTable.querySelectorAll('tr > td'))
    const footCell = allCells.findLast(cell => {
        return cell.textContent.trim().endsWith("Footed")
    })
    if (!footCell) return
    const footInfo = footCell.textContent.trim()
    switch (footInfo) {
        case "Right Footed": return "R"
        case "Left Footed": return "L"
        default:
            console.warn("Unknown footInfo:", footInfo)
            return undefined
    }
}

/**
 * Returns the player personalities table if it's present on the page.
 * @returns {Object} player personalities table node.
 */
function getPersonalitiesTable() {
    const tables = document.querySelectorAll("table");

    const personalityTable = Array.from(tables).find(table =>
        Array.from(table.querySelectorAll("th")).some(
            th => th.textContent.trim() === "Personalities"
        )
    );

    return personalityTable
}

/**
 * Returns the player personalities data from a given table.
 * @param {Object} personalitiesTable as gathered in the getPersonalitiesTable function
 * @returns {Object} player personalities data.
 */
function getPersonalitiesData(personalitiesTable) {
    if (!personalitiesTable) {
        throw new Error("personalitiesTable is undefined");
    }
    const result = {};

    // Loop over each row
    personalitiesTable.querySelectorAll("tr").forEach(row => {
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

    return result
}

/**
 * Returns the player special talents table if it's present on the page.
 * @returns {Object} player special talents table node.
 */
function getSpecialTalentsTable() {
    const table = document.querySelector("table.special-ability-table");
    return table
}

/**
 * Returns the player special talents data from a given table.
 * @param {Object} specialTalentsTable as gathered in the getSpecialTalentsTable function
 * @returns {Object} player special talents data.
 */
function getSpecialTalentsData(specialTalentsTable) {
    if (!specialTalentsTable) {
        throw new Error("specialTalentsTable is undefined");
    }
    const result = [];

    // Loop over each row
    specialTalentsTable.querySelectorAll("tr").forEach(row => {
        const link = row.querySelector("a");
        if (!link) return; // skip rows without <a>

        const name = link.textContent.trim().toLowerCase();
        result.push(name);
    });

    return result
}

/**
 * Returns the player hidden skills table if it's present on the page.
 * @returns {Object} player hidden skills table node.
 */
function getHiddenSkillsTable() {
    const tables = document.querySelectorAll("table");

    const hiddenSkillsTable = Array.from(tables).find(table =>
        Array.from(table.querySelectorAll("th")).some(
            th => th.textContent.trim() === "Hidden"
        )
    );

    return hiddenSkillsTable
}

/**
 * Returns the player hidden skills data from a given table.
 * @param {Object} hiddenSkillsTable as gathered in the getHiddenSkillsTable function
 * @returns {Object} player hidden skills data.
 */
function getHiddenSkillsData(hiddenSkillsTable) {
    if (!hiddenSkillsTable) {
        throw new Error("hiddenSkillsTable is undefined");
    }
    const result = {};

    // Loop over each row
    hiddenSkillsTable.querySelectorAll("tr:has(td.hidden-skill)").forEach(row => {
        const skillLabelElement = row.querySelector("td.hidden-skill")
        const skillLabelText = skillLabelElement.textContent.trim()
        const skillValueElement = skillLabelElement.nextElementSibling

        result[utils.toCamelCase(skillLabelText)] = playerUtils.parseNumbersOnPlayerPage(skillValueElement)
    });

    return result
}

function getPlayerRating() {
    const playerSummaryStatsTable = document.querySelector(uiUtils.playerSummaryStatsTableQuery)
    const playerSummaryHeaders = playerSummaryStatsTable.querySelectorAll("th")
    const ratingHeader = Array.from(playerSummaryHeaders).find(th => th.textContent == "Rating")
    const ratingCell = ratingHeader.nextSibling
    const spans = ratingCell.querySelectorAll('span')
    const rating = spans[0].textContent.trim()
    const talent = spans[2].textContent.trim()
    return { rating: rating, talent: talent }
}

function getPlayerData() {
    const position = getPlayerPosition()
    const name = getPlayerName()
    const clubData = getPlayerClubData()
    const foot = getPlayerFoot()
    const { rating, talent } = getPlayerRating()
    const experience = getPlayerExperience()
    const timestamp = new Date().toISOString()

    const personalitiesTable = getPersonalitiesTable()
    let personalitiesData
    if (personalitiesTable) {
        personalitiesData = getPersonalitiesData(personalitiesTable)
    }
    console.debug('Result of reading the personalities', personalitiesData)

    const specialTalentsTable = getSpecialTalentsTable()
    let specialTalentsData
    if (specialTalentsTable) {
        specialTalentsData = getSpecialTalentsData(specialTalentsTable)
        console.info('Result of reading the special talents', specialTalentsData)
    } else {
        console.debug(`No special talents table found, skipping...`)
    }

    const hiddenSkillsTable = getHiddenSkillsTable()
    let hiddenSkillsData
    if (hiddenSkillsTable) {
        hiddenSkillsData = getHiddenSkillsData(hiddenSkillsTable)
    }
    console.debug("hiddenSkillsData", hiddenSkillsData)

    const playerID = utils.lastPathComponent(window.location.pathname)

    return {
        id: playerID,
        name: name,
        position: position,
        foot: foot,
        rating: rating,
        talent: talent,
        experience: experience,
        timestamp: timestamp,
        teamId: clubData ? clubData.id : null,
        ...(personalitiesData !== undefined && { personalities: personalitiesData }),
        ...(specialTalentsData !== undefined && { specialTalents: specialTalentsData }),
        ...(hiddenSkillsData != undefined && { hiddenSkills: hiddenSkillsData })
    }
}

function getBidButton() {
    return document.querySelector("button:has(> i.bi-hammer)")
}

function getScoutButton() {
    const button = Array.from(document.querySelectorAll('.btn.btn-sm.btn-secondary.me-1'))
        .find(btn => btn.textContent.trim() === 'Scout')
    return button
}

function addTrainingSimulationButtonIfNeeded() {
    if (document.getElementById("TRAINING-SIMULATION-BUTTON")) return

    const scoutButton = getScoutButton()
    // Create the new button
    const newButton = document.createElement('button')
    newButton.id = "TRAINING-SIMULATION-BUTTON"
    newButton.title = "Simulate the training progress with Badger"
    newButton.className = 'btn btn-sm btn-secondary me-1'
    newButton.textContent = 'Training simulation'; // Change this to whatever you want
    newButton.addEventListener('click', async () => {
        const text = integrationUtils.selectAllAsText()
        const compressed = await integrationUtils.compressAndBase64(text, 'gzip')
        window.open(`https://www.abelfw.org/badgerpaste?pp=${compressed}`, '_blank');
        // For dev environment
        // window.open(`https://dev.abelfw.org/badgerpaste?pp=${compressed}`, '_blank');

        // The clipboard workaround
        // const result = integrationUtils.copyRenderedPageToClipboard();
        // if (result) {
        //     console.debug("Page copied to clipboard!");
        // } else {
        //     console.error("Could not copy rendered page to clipboard :(");
        // }
    });

    // Insert as a sibling (after the Scout button)
    scoutButton?.insertAdjacentElement('afterend', newButton)
}

function isPendingSale() {
    const bidButton = getBidButton()
    return bidButton && bidButton.textContent.trim().startsWith("Place bid")
}
/**
 * Checks if the buying guide is displayed, if not it calls the assembleBuyingGuide() and attaches the result after the bid button.
 * @param {Object} playerData Data as gathered in the getPlayerData function
 */
function showBuyingGuide(playerData) {
    const bidButton = getBidButton()

    const buyingGuideIdentifier = `${utils.pluginNodeClass}-buying-guide`
    if (document.getElementById(buyingGuideIdentifier)) {
        console.debug("Buying guide already present")
        return
    }

    console.info("Adding buying guide")
    const buyingGuide = assembleBuyingGuide(buyingGuideIdentifier, playerData)
    bidButton.after(buyingGuide)
}

/**
 * Assemble buying guide ready to be attached to DOM.
 * @param {string} identifier - identifier to be used for the buying guide
 * @param {Object} playerData Data as gathered in the getPlayerData function
 * @returns {Object} buying guide node.
 */
function assembleBuyingGuide(identifier, playerData) {
    const position = playerData.position
    const experience = playerData.experience
    const playerAge = playerUtils.getPlayerAge().years
    const buyingGuideList = document.createElement("ol")
    buyingGuideList.id = identifier

    let personalitiesData = playerData.personalities
    const buyingGuideDescriptions = []
    if (personalitiesData) {
        Object.entries(personalitiesData).forEach(([personality, value]) => {
            try {
                const description = personalitiesUtils.personalityDescription(
                    personality,
                    value,
                    position,
                    experience.value
                )
                if (!description) return
                buyingGuideDescriptions.push(description)
            } catch (e) {
                console.error(e.message)
            }
        })
    }

    let specialTalentsData = playerData.specialTalents
    if (specialTalentsData) {
        console.info("Appending special talents info to buying guide")
        for (const talent of specialTalentsData) {
            // console.info("Appending special talent:", talent, ", position:", position)
            const description = specialTalentsUtils.specialTalentDescription(talent, position)
            // console.info("Appending special talent description:", description)
            buyingGuideDescriptions.push(description)
        }
    }

    let hiddenSkillsData = playerData.hiddenSkills
    if (playerAge < 21 && hiddenSkillsData) {
        const youthSpecificDescriptions = []
        // this can be "very_good", "good", "bad" or "very_bad"
        const advancedDevelopmentAssesment = utils.classFromTalent(hiddenSkillsData.estimatedPotential, hiddenSkillsData.advancedDev)
        if (["good", "very_good"].includes(advancedDevelopmentAssesment)) {
            const description = "👍 His advanced development starts early in relation to his estimated potential, which means his development will speed up while he is still eligible to play in youths"
            youthSpecificDescriptions.push(description)
        }

        if (youthSpecificDescriptions.length > 0) {
            youthSpecificDescriptions.unshift("If you plan to improve your youth team:")
        }
        buyingGuideDescriptions.push(...youthSpecificDescriptions)
    }

    console.debug("buyingGuideDescriptions", buyingGuideDescriptions)

    const processed = buyingGuideDescriptions
        .filter(str => !str.startsWith("🤔")) // remove 🤔
        .sort((a, b) => {
            if (a.startsWith("👍") && b.startsWith("👎")) return -1; // 👍 before 👎
            if (a.startsWith("👎") && b.startsWith("👍")) return 1;
            return 0; // keep relative order otherwise
        });

    console.debug("buyingGuideDescriptions after", processed);

    for (const description of processed) {
        const li = document.createElement("li");
        li.textContent = description;
        buyingGuideList.appendChild(li);
    }

    return buyingGuideList
}

/**
 * Gets the player position e.g. FW.
 * @returns {string} player position.
 */
function getPlayerPosition() {
    const badgeElement = document.querySelector(".badge-position")
    if (!badgeElement) return
    return badgeElement.textContent.trim()
}

/**
 * Gets the player name.
 * @returns {string} player name
 */
function getPlayerName() {
    const headerElement = document.querySelector("fw-player-details div.player-detail-header-title span")
    if (!headerElement) return
    let playerName = headerElement.textContent.trim()
    playerName = playerName.replace(/\s+/g, " ") // removes repeated spaces
    return playerName
}

/**
 * Gets the player experience.
 * @returns {Object} player experience as Object e.g. { value: 5, description: "good" }
 */
function getPlayerExperience() {
    const playerSummaryStatsTable = document.querySelector(uiUtils.playerSummaryStatsTableQuery)
    const tds = playerSummaryStatsTable.querySelectorAll("tr > th")

    // Find the one whose textContent includes "Experience"
    const experienceLabelTH = Array.from(tds).find(th => th.textContent.trim() === "Experience")
    const experienceValueTD = experienceLabelTH.nextElementSibling
    const descriptionSpan = experienceValueTD.querySelector("span")
    const valueSpan = descriptionSpan.nextElementSibling
    var experienceValue = undefined
    if (valueSpan) {
        const numbersOnly = valueSpan.textContent.trim().replace(/\D/g, "")
        experienceValue = parseInt(numbersOnly, 10)
    }
    const denomClass = [...descriptionSpan.classList].find(c => c.includes("denom"))
    const experienceDenomination = parseInt(denomClass.slice(5), 10)
    return { value: experienceDenomination, description: descriptionSpan.textContent.trim(), exactValue: experienceValue }
}

const positionEmoji = {
    // Forwards
    FW: "🎯",

    // Midfielders
    LW: "⚙️",
    LM: "⚙️",
    RW: "⚙️",
    RM: "⚙️",
    OM: "⚙️",
    CM: "⚙️",
    DM: "⚙️",

    // Defenders
    LWB: "🛡️",
    LB: "🛡️",
    RWB: "🛡️",
    RB: "🛡️",
    CB: "🛡️",

    // Goalkeeper
    GK: "🧤",
};

/**
 * Returns the emoji for a given position.
 * Defaults to ⚽ if position is unknown.
 * @param {string} position
 * @returns {string}
 */
function getPositionEmoji(position) {
    return positionEmoji[position] || "⚽";
}

/**
 * Returns the player skills table if it's present on the page.
 * @returns {Object} player skills table node.
 */
function getPlayerSkillsTable() {
    return document.querySelector("table:has(i.fa-user-circle)")
}

/**
 * Returns the player computed skills table if it's present on the page.
 * @returns {Object} player computed skills table node.
 */
function getPlayerComputeSkillsTable() {
    return document.querySelector("table:has(i.fa-calculator)")
}

/**
 * Checks if the site is loaded.
 * @returns {boolean} True if the site is loaded.
 */
function checkSiteLoaded() {
    const playerPosition = getPlayerPosition()
    if (!playerPosition) {
        console.info("Could not find player position")
        return false
    } else {
        console.info(`${getPositionEmoji(playerPosition)} Found player position`)
    }

    const playerName = getPlayerName()
    if (!playerName) {
        console.info("Could not find player name")
        return false
    } else {
        console.info(`🪪 Found player name`)
    }

    if (getPlayerSkillsTable()) {
        console.info(`🏋️ Found player skills table`)
    }

    if (getPersonalitiesTable()) {
        console.info("🎭 Found personalities table")
    }
    if (getSpecialTalentsTable()) {
        console.info("⚡ Found special talents table")
    }
    if (getHiddenSkillsTable()) {
        console.info("🕵️ Found hidden skills table")
    }
    if (getPlayerComputeSkillsTable()) {
        console.info("🧮 Found computed skills table")
    }
    if (getBidButton()) {
        console.info("🏷️ Found bidding section")
    }

    return true
}

function cleanUpNodeForPlayer(tableNode) {
    console.debug(`removing the old cells...`)
    tableNode.querySelectorAll(`tr.${utils.pluginNodeClass}`).forEach(el => el.remove())
}

export async function processPlayerPage() {
    console.info(`⏳ ${utils.version} Processing player page for ${utils.lastPathComponent(window.location.pathname)}...`)

    const siteLoaded = checkSiteLoaded()
    if (siteLoaded) {
        console.info("✅ Site fully loaded")
    } else {
        console.info("📄 Site not ready, skipping update...")
        return
    }

    let playerDataFromPage = getPlayerData()
    console.debug("playerDataFromPage", playerDataFromPage)

    let currentPlayerRepresentationInStorage = await db.getPlayer(playerDataFromPage.id) || {}
    console.debug('currentPlayerRepresentationInStorage = ', currentPlayerRepresentationInStorage)

    await showInjuries(currentPlayerRepresentationInStorage)

    // If the player is on sale, add buying summary
    if (isPendingSale()) {
        showBuyingGuide(playerDataFromPage)
    }

    const coreSkillsTable = getCoreSkillsTable()
    if (coreSkillsTable && coreSkillsTable.rows && coreSkillsTable.rows.length > 1) {
        cleanUpNodeForPlayer(coreSkillsTable)
        appendComputedSkills(coreSkillsTable)
        addTrainingSimulationButtonIfNeeded()
    }

    if (isShowingMatches()) {
        await processPlayerMatchesTab(playerDataFromPage)
    }

    if (isShowingReports()) {
        currentPlayerRepresentationInStorage = await processPlayerReports(currentPlayerRepresentationInStorage)
    }

    if (isShowingTraining()) {
        await processPlayerTraining()
    }

    if (isShowingOverview() || isShowingReports()) { // only save for Overview or Reports
        // console.info(`fromStorage:`,currentPlayerRepresentationInStorage)
        // console.info(`fromPage:`,playerDataFromPage)
        currentPlayerRepresentationInStorage = utils.mergeObjects(currentPlayerRepresentationInStorage, playerDataFromPage)

        // Bug? Skills Calculations/Special Talent #48
        if (isShowingOverview() && !playerDataFromPage.specialTalents) {
            delete currentPlayerRepresentationInStorage['specialTalents']
        }

        // console.info(`Will save player data to storage`, currentPlayerRepresentationInStorage)
        await db.putPlayer(currentPlayerRepresentationInStorage)

        console.info(`📥 Saved player data to storage (${playerDataFromPage.id} ${currentPlayerRepresentationInStorage.name})`, currentPlayerRepresentationInStorage)
    }

    // TODO: develop this further
    const currentWeek = uiUtils.getCurrentWeekNumber()
    if (currentWeek) {
        try {
            const formatter = new Intl.DateTimeFormat("ch-DE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short"
            })
            const currentSeasonNumber = uiUtils.getCurrentSeasonNumber()
            const now = new Date() // current date/time

            const playerAge = playerUtils.getPlayerAge()
            const lookAheadBy = 21 - playerAge.years
            const birthdaysArray = playerUtils.getFutureBirthdays(now, playerAge.years, playerAge.months, playerAge.days, lookAheadBy)

            const seasonStartDates = utils.getSeasonStartDates(now, currentWeek, lookAheadBy)
            // console.info(`Current season: ${currentSeasonNumber}, season ${currentSeasonNumber + seasonsAhead} starts on:`, formatter.format(targetSeasonStart), `(${targetSeasonStart.toUTCString()})`)

            // console.info(`Player age: ${playerAge.years}y ${playerAge.months}m ${playerAge.days}d, seasons left as youth: ${playerUtils.getSeasonsLeftAsYouth()}, next birthday: `, formatter.format(birthdaysArray[0].date), `(${birthdaysArray[0].date.toUTCString()})`)
            for (let i = 0; i < birthdaysArray.length; i++) {
                const birthday = birthdaysArray[i]
                const seasonStartDate = seasonStartDates[i]
                console.info(`Birthday ${birthday.age} on ${formatter.format(birthday.date)} (${birthday.date.toUTCString()}) is ${utils.diffInDaysUTC(seasonStartDate, birthday.date)} days after season ${currentSeasonNumber + i + 1} starts (${seasonStartDate})`)
            }
        } catch (error) {
            console.error(error)
        }
    }
}

function getCoreSkillsTable() {
    return document.querySelector("table.table:has(tr th span[ngbpopover='Core Skills'])")
}

function getActiveTab() {
    return document.querySelector(`${uiUtils.navTabsQuery} > li.nav-item > a.nav-link.active[aria-selected='true']`)
}

function isShowingOverview() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Overview"
}

function isShowingMatches() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Matches"
}

function isShowingReports() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Reports"
}

function isShowingTraining() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Training"
}