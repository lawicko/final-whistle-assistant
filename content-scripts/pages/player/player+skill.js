import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as discovery from "./player+discovery.js"
import { parseNumber } from "../../list_utils.js"
import * as specialTalentsUtils from "../../special_talents_utils.js"
import { skillIndexGoalkeepers, skillIndexOutfielders } from "../../shared/skills.js"

const stClass = utils.pluginNodeClass + "SpecialTalentModified"
const stTooltipClass = stClass + "Tooltip"

export function applyAdditionalInfo(checkboxesData, playerData) {
    const specialTalents = playerData?.specialTalents
    // console.info("Special talents for ", playerData.name, playerData.specialTalents)
    console.info("Applying addtional info for checkboxesData:", checkboxesData)
    const stCheckbox = checkboxesData.specialTalents ?? false

    try {
        if (specialTalents) {
            const skillRows = document.querySelectorAll("table.player-skill-table > tbody > tr.pointer")
            if (needsUpdateSpecialTalents(skillRows, stCheckbox)) {
                const skills = getPlayerSkills(skillRows)
                console.debug("Player skills:", skills)
                const skillsWithST = applySpecialTalents(skills, specialTalents, stCheckbox)
                console.debug("skillsWithST", skillsWithST)
                setPlayerSkills(skillsWithST, skillRows)
            }
        }
    } catch (error) {
        console.info("Skills table doesn't contain numbers:", error.message)
    }
}

function getPlayerSkills(rows) {
    let data = {}
    for (const row of rows) {
        const allCells = row.querySelectorAll('td')
        const label = allCells[0].textContent.trim()
        const valueSpan = allCells[1].querySelector('span')
        const value = parseInt(valueSpan.textContent.replace(/\D/g, ''))
        const potSpan = allCells[2].querySelector('span')
        const pot = parseInt(potSpan.textContent.replace(/\D/g, ''))
        if (isNaN(value) || isNaN(pot)) {
            throw new Error(`Failed to parse numeric data for skill: "${label}"`);
        }
        data[label] = { value: value, pot: pot }
    }
    return data
}

function needsUpdateSpecialTalents(rows, specialTalents) {
    if (rows.length == 0) return false
    let hasModifiedRows = false
    for (const row of rows) {
        hasModifiedRows = row.querySelector(`td span.${stClass}`) != undefined
        if (hasModifiedRows) break
    }
    console.debug("needsUpdate: ", specialTalents != hasModifiedRows, "specialTalents", specialTalents, "hasModifiedRows", hasModifiedRows)
    return specialTalents != hasModifiedRows
}

function applySpecialTalents(originalSkills, specialTalents, add) {
    console.debug("applying special talents", specialTalents, "to skills", originalSkills)

    const skills = structuredClone(originalSkills)
    let skillIndexObject = skillIndexOutfielders
    let skillMapping = skillMappingOutfielder
    if (Object.keys(skills).length < 8) { // Goalkeepers
        console.debug("Detected GK")
        skillIndexObject = skillIndexGoalkeepers
        skillMapping = skillMappingGK
    } else {
        console.debug("Detected outfileder")
    }
    let modifications = new Array(skills.length).fill(0)
    let tooltip = "If you plan on changing the form you will have to reload the page to get the correct numbers."
    for (const specialTalent of specialTalents) {
        const affectedSkills = specialTalentsUtils.SpecialTalentsDefinitions[specialTalent]
        if (!affectedSkills) continue // for skills like tough there are no skills affected
        console.debug("talent", specialTalent, "affectedSkills", affectedSkills)
        for (const [skill, value] of Object.entries(affectedSkills)) {
            // console.info("skillMapping", skillMapping)
            // console.info("skill", skill)
            // console.info("skills", skills)
            const skillToChange = skillMapping[skill]
            if (skillToChange) {
                if (add) {
                    console.debug("changing", skills[skillToChange], "from", skills[skillToChange].value, "to", skills[skillToChange].value + value)
                    skills[skillToChange].value += value
                    if (!skills[skillToChange].tooltip) {
                        skills[skillToChange].tooltip = tooltip
                    }
                    skills[skillToChange].tooltip += "\n+" + value + " from " + specialTalent
                } else {
                    console.info("changing", skills[skillToChange], "from", skills[skillToChange].value, "to", skills[skillToChange].value - value)
                    skills[skillToChange].value -= value
                    delete skills[skillToChange].tooltip
                }
            }
        }
    }

    console.debug("new skills:", skills)
    return skills
}

const skillMappingOutfielder = {
    "SC": "Scoring",
    "OP": "Off. Pos.",
    "BC": "Ball Control",
    "PA": "Passing",
    "AE": "Aerial Ability",
    "CO": "Constitution",
    "TA": "Tackling",
    "DP": "Def. Pos."
}

const skillMappingGK = {
    "RE": "Reflex",
    "GP": "Positioning",
    "IN": "Interceptions",
    "CT": "Ball Control",
    "OR": "Organization"
}

function setPlayerSkills(skills, rows) {
    console.debug("setting skills", skills, "to rows", rows)
    for (const row of rows) {
        const allCells = row.querySelectorAll('td')
        const label = allCells[0].textContent.trim()
        const valueSpan = allCells[1].querySelector('span')
        valueSpan.textContent = skills[label].value
        const denomination = utils.denomination(skills[label].value)
        const denomClass = "denom" + denomination
        // Find the class that starts with "denom"
        const currentDenomClass = Array.from(valueSpan.classList).find(cls => cls.startsWith("denom"))
        if (currentDenomClass) {
            valueSpan.classList.remove(currentDenomClass) // remove old denomX
            valueSpan.classList.add(denomClass) // add new denomX
            const tooltip = skills[label].tooltip
            if (tooltip != undefined) {
                valueSpan.classList.add(stClass)
                // valueSpan.title = tooltip
                const tooltipNode = document.createElement("span")
                tooltipNode.classList.add(stTooltipClass)
                tooltipNode.textContent = uiUtils.questionMarkSymbol
                tooltipNode.title = tooltip
                valueSpan.after(tooltipNode)
            } else {
                valueSpan.classList.remove(stClass)
                // valueSpan.title = ""
                const tooltipNode = valueSpan.parentNode.querySelector(`span.${stTooltipClass}`)
                if (tooltipNode) {
                    tooltipNode.remove()
                }
            }
        }

        const potSpan = allCells[2].querySelector('span')
        potSpan.textContent = skills[label].pot
    }
}

export function modifyExistingComputedSkills(tableNode) {
    // TODO: modify original computed skills like long shots etc.
}

export function prepareNodeAndAppendComputedSkills(tableNode) {
    cleanUpNodeForPlayer(tableNode)
    appendComputedSkills(tableNode)
}

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
    const personalitiesTable = discovery.getPersonalitiesTable()
    if (personalitiesTable) {
        personalities = discovery.getPersonalitiesData(personalitiesTable)
    }
    console.debug("personalities:", personalities)
    const resultCurrents = uiUtils.calculateAssistance({ OP: OP, BC: BC, TA: TA, DP: DP, teamwork: personalities["teamwork"] });
    const resultPotential = uiUtils.calculateAssistance({ OP: OP_POT, BC: BC_POT, TA: TA_POT, DP: DP_POT, teamwork: personalities["teamwork"] });

    // Offensive Assistance
    let trOA = createComputedPropertyRow(
        "Offensive Assistance",
        resultCurrents.offensiveAssistanceDenominationNormalized,
        resultCurrents.offensiveAssistance,
        resultPotential.offensiveAssistanceDenominationNormalized,
        resultPotential.offensiveAssistance
    )
    tbodyNode.appendChild(trOA)

    // Defensive Assistance
    let trDA = createComputedPropertyRow(
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
    let tr = document.createElement("tr")
    tr.className = utils.pluginNodeClass

    let tdLabel = document.createElement("td")
    tdLabel.className = "text-body-secondary"
    let tdSpan = document.createElement("span")
    tdSpan.textContent = label
    tdLabel.appendChild(tdSpan)
    tr.appendChild(tdLabel)

    let tdCurrent = document.createElement("td")
    tdCurrent.className = "text-end"
    const tdCurrentSpan = document.createElement('span');
    tdCurrentSpan.className = `denom${currentDenomination}`;
    tdCurrentSpan.textContent = currentTextContent;
    tdCurrent.appendChild(tdCurrentSpan);
    tr.appendChild(tdCurrent)

    let tdPot = document.createElement("td")
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

function cleanUpNodeForPlayer(tableNode) {
    console.debug(`removing the old cells...`)
    tableNode.querySelectorAll(`tr.${utils.pluginNodeClass}`).forEach(el => el.remove())
}