import { lastPathComponent, storage, pluginNodeClass } from "./utils.js"
import { calculateAssistance } from "./ui_utils.js"

const PositionsKeys = {
    CB: "CB",
    CM: "CM",
    DM: "DM",
    FW: "FW",
    GK: "GK",
    LB: "LB",
    LM: "LM",
    LW: "LW",
    LWB: "LWB",
    OM: "OM",
    RB: "RB",
    RM: "RM",
    RW: "RW",
    RWB: "RWB"
}

const SpecialTalentsKeys = {
    OneOnOne: "1 on 1",
    Ambidextrous: "ambidextrous",
    Anticipator: "anticipator",
    Dribbler: "dribbler",
    Jumper: "jumper",
    Playmaker: "playmaker",
    Quick: "quick",
    Scorer: "scorer",
    SetPieceSpecialist: "set piece specialist",
    Stamina: "stamina",
    Stopper: "stopper",
    SureHands: "sure hands",
    Tough: "tough"
}

const SpecialTalentsDefinitions = {
    [SpecialTalentsKeys.OneOnOne]: {
        SC: 5,
        RE: 5
    },
    [SpecialTalentsKeys.Anticipator]: {
        DP: 5,
        GP: 4
    },
    [SpecialTalentsKeys.Dribbler]: {
        BC: 4
    },
    [SpecialTalentsKeys.Jumper]: {
        AE: 5,
        IN: 5
    },
    [SpecialTalentsKeys.Playmaker]: {
        PA: 4
    },
    [SpecialTalentsKeys.Quick]: {
        OP: 5,
        DP: 5,
        GP: 4
    },
    [SpecialTalentsKeys.Scorer]: {
        SC: 5
    },
    [SpecialTalentsKeys.SetPieceSpecialist]: {
        SC: 3,
        PA: 3,
        OR: 4
    },
    [SpecialTalentsKeys.Stamina]: {
        CO: 10
    },
    [SpecialTalentsKeys.Stopper]: {
        TA: 5
    }
}

/**
 * Returns a special talent description for a given position.
 * @param {string} specialTalentKey - a key as in SpecialTalentsKeys
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function specialTalentDescription(specialTalentKey, positionKey) {
    switch (specialTalentKey) {
        case SpecialTalentsKeys.OneOnOne:
            return oneOnOneDescription(positionKey)
        case SpecialTalentsKeys.Ambidextrous:
            return ambidextrousDescription(positionKey)
        case SpecialTalentsKeys.Anticipator:
            return anticipatorDescription(positionKey)
        case SpecialTalentsKeys.Dribbler:
            return dribblerDescription(positionKey)
        case SpecialTalentsKeys.Jumper:
            return jumperDescription(positionKey)
        case SpecialTalentsKeys.Playmaker:
            return playmakerDescription(positionKey)
        case SpecialTalentsKeys.Quick:
            return quickDescription(positionKey)
        case SpecialTalentsKeys.Scorer:
            return scorerDescription(positionKey)
        case SpecialTalentsKeys.SetPieceSpecialist:
            return setPieceSpecialistDescription(positionKey)
        case SpecialTalentsKeys.Stamina:
            return staminaDescription(positionKey)
        case SpecialTalentsKeys.Stopper:
            return stopperDescription(positionKey)
        case SpecialTalentsKeys.SureHands:
            return sureHandsDescription(positionKey)
        case SpecialTalentsKeys.Tough:
            return toughDescription(positionKey)
        default:
            return `🤔 No description available for this talent: ${specialTalentKey}`
    }
}

/**
 * Returns 1 on 1 talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function oneOnOneDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.FW:
            return "👍 1 on 1 is especially useful for forwards with high OP"
        case PositionsKeys.GK:
            return "👍 1 on 1 is especially useful for goalkeepers because it increases RE in one-on-one situations"
        default:
            return "🤔 There is no obvious benefit of 1 on 1 for outfielders that are not forwards"
    }
}

/**
 * Returns Ambidextrous talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function ambidextrousDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.LW:
        case PositionsKeys.RW:
        case PositionsKeys.LM:
        case PositionsKeys.RM:
        case PositionsKeys.OM:
        case PositionsKeys.CM:
        case PositionsKeys.DM:
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
        case PositionsKeys.LB:
        case PositionsKeys.RB:
            return "👍 Ambidextrous talent is especially useful for midfielders and side backs because you can field them on both sides of the pitch without penalty"
        default:
            return "🤔 There is no obvious benefit of ambidextrous talent for forwards, center backs or goalkeepers"
    }
}

/**
 * Returns Anticipator talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function anticipatorDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.LM:
        case PositionsKeys.RM:
        case PositionsKeys.CM:
        case PositionsKeys.DM:
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
        case PositionsKeys.LB:
        case PositionsKeys.RB:
            return "👍 Anticipator talent is especially useful for players with defensive duties on the pitch"
        case PositionsKeys.GK:
            return "👍 Anticipator talent is especially useful for goalkeepers because it increases GP"
        default:
            return "🤔 There is no obvious benefit of anticipator talent for players without defensive duties on the field"
    }
}

/**
 * Returns Dribbler talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function dribblerDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.FW:
        case PositionsKeys.LW:
        case PositionsKeys.RW:
        case PositionsKeys.LM:
        case PositionsKeys.RM:
        case PositionsKeys.OM:
        case PositionsKeys.CM:
        case PositionsKeys.DM:
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
        case PositionsKeys.LB:
        case PositionsKeys.RB:
            return "👍 Dribbler talent is especially useful for players with offensive duties on the pitch, but also for all the players that provide offensive assistance like side backs and side wing backs"
        default:
            return "🤔 There is no obvious benefit of dribbler talent for players without offensive duties on the field"
    }
}

/**
 * Returns Jumper talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function jumperDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.FW:
        case PositionsKeys.LW:
        case PositionsKeys.RW:
        case PositionsKeys.OM:
        case PositionsKeys.CB:
            return "👍 Jumper talent is especially useful for players operating in the penalty box"
        default:
            return "🤔 There is no obvious benefit of jumper talent for players that don't operate in the penalty box"
    }
}

/**
 * Returns Playmaker talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function playmakerDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.LW:
        case PositionsKeys.RW:
        case PositionsKeys.OM:
        case PositionsKeys.LM:
        case PositionsKeys.RM:
        case PositionsKeys.CM:
        case PositionsKeys.DM:
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
            return "👍 Playmaker talent is especially useful for outfielders who contribute to midfield dominance"
        default:
            return "🤔 There is no obvious benefit of playmaker talent for players who don't contribute to midfield dominance"
    }
}

/**
 * Returns Quick talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function quickDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.FW:
            return "👍 Quick talent is especially useful for forwards because it boosts their OP and allows them to avoid offsides"
        case PositionsKeys.LW:
        case PositionsKeys.RW:
        case PositionsKeys.OM:
        case PositionsKeys.LM:
        case PositionsKeys.RM:
        case PositionsKeys.CM:
        case PositionsKeys.DM:
            return "👍 Quick talent is especially useful for midfielders because it boosts their OP and DP"
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
        case PositionsKeys.LB:
        case PositionsKeys.RB:
        case PositionsKeys.CB:
            return "👍 Quick talent is especially useful for defenders because it boosts their DP"
        case PositionsKeys.GK:
            return "👍 Quick talent is especially useful for goalkeepers because it boosts their GP"
    }
}

/**
 * Returns Scorer talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function scorerDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.FW:
            return "👍 Scorer talent is especially useful for forwards because it boosts their SC"
        case PositionsKeys.LW:
        case PositionsKeys.RW:
        case PositionsKeys.OM:
            return "👍 Scorer talent is useful for midfielders who operate in the penalty box"
        default:
            return "🤔 There is no obvious benefit of scorer talent for players who don't normally operate in the penalty box"
    }
}

/**
 * Returns Set piece specialist talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function setPieceSpecialistDescription(positionKey) {
    switch (positionKey) {
        default:
            return "👍 Set piece specialist talent is useful for all players"
    }
}

/**
 * Returns Stamina talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function staminaDescription(positionKey) {
    switch (positionKey) {
        default:
            return "👍 Stamina talent is useful for all players"
    }
}

/**
 * Returns Stopper talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function stopperDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.CB:
        case PositionsKeys.LB:
        case PositionsKeys.RB:
        case PositionsKeys.DM:
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
        case PositionsKeys.LM:
        case PositionsKeys.RM:
        case PositionsKeys.CM:
            return "👍 Stopper talent is especially useful for defenders and defensively minded midfielders because it boosts their TA"
        default:
            return "🤔 Stopper talent is not particuraly useful for outfielders without defensive duties or goalkeepers"
    }
}

/**
 * Returns Sure hands talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function sureHandsDescription(positionKey) {
    switch (positionKey) {
        case PositionsKeys.GK:
            return "👍 Sure hands talent is very useful for goalkeepers because it boosts thier CT"
        default:
            return "🤔 Sure hands talent is not useful for outfielders"
    }
}

/**
 * Returns Tough talent description for a given position.
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
function toughDescription(positionKey) {
    switch (positionKey) {
        default:
            return "👍 Tough talent is useful for all players"
    }
}

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

// Calculates and adds the cells with the midfield dominance values for each player
function appendComputedSkills(tableNode) {
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
        console.info("Not our player, will not append computed skills")
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
    let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)

    let midfieldDominanceContributionPotential = PA_POT + Math.min(OP_POT + BC_POT, TA_POT + DP_POT) + Math.max(0, CO_POT - constitutionTreshold)
    let midfieldDominanceDenominationPotential = midfieldDominanceContributionPotential / midfieldDominanceMax
    let midfieldDominanceDenominationNormalizedPotential = denomination(midfieldDominanceDenominationPotential * 100)

    console.debug("contribution = ", midfieldDominanceContribution, "denomination = ", midfieldDominanceDenomination, " normalized: ", midfieldDominanceDenominationNormalized)
    console.debug("contribution (potential)= ", midfieldDominanceContributionPotential, "denomination = ", midfieldDominanceDenominationPotential, " normalized: ", midfieldDominanceDenominationNormalizedPotential)

    // Midfield Dominance
    var trMD = document.createElement("tr")
    trMD.className = pluginNodeClass

    var tdMDLabel = document.createElement("td")
    tdMDLabel.className = "opacity-06"
    tdMDLabel.textContent = "Midfield Dominance"
    trMD.appendChild(tdMDLabel)

    var tdMDCurrent = document.createElement("td")
    const mdCurrentDiv = document.createElement('div');
    mdCurrentDiv.className = `denom${midfieldDominanceDenominationNormalized}`;
    mdCurrentDiv.textContent = midfieldDominanceContribution;
    tdMDCurrent.appendChild(mdCurrentDiv);
    trMD.appendChild(tdMDCurrent)

    var tdMDPot = document.createElement("td")
    const mdPotDiv = document.createElement('div');
    mdPotDiv.className = `denom${midfieldDominanceDenominationNormalizedPotential}`;
    mdPotDiv.textContent = midfieldDominanceContributionPotential;
    tdMDPot.appendChild(mdPotDiv);
    trMD.appendChild(tdMDPot)

    tableNode.appendChild(trMD)

    // Assistance calculations
    let personalities = {}
    const personalitiesTable = getPersonalitiesTable()
    if (personalitiesTable) {
        personalities = getPersonalitiesData(personalitiesTable)
    }
    console.debug("personalities:", personalities)
    const resultCurrents = calculateAssistance({ OP: OP, BC: BC, TA: TA, DP: DP, teamwork: personalities["teamwork"] });
    const resultPotential = calculateAssistance({ OP: OP_POT, BC: BC_POT, TA: TA_POT, DP: DP_POT, teamwork: personalities["teamwork"] });

    // Offensive Assistance
    var trOA = document.createElement("tr")
    trOA.className = pluginNodeClass

    var tdOALabel = document.createElement("td")
    tdOALabel.className = "opacity-06"
    tdOALabel.textContent = "Offensive Assistance"
    trOA.appendChild(tdOALabel)

    var tdOACurrent = document.createElement("td")
    const oaCurrentDiv = document.createElement('div');
    oaCurrentDiv.className = `denom${resultCurrents.offensiveAssistanceDenominationNormalized}`;
    oaCurrentDiv.textContent = resultCurrents.offensiveAssistance;
    tdOACurrent.appendChild(oaCurrentDiv);
    trOA.appendChild(tdOACurrent)

    var tdOAPot = document.createElement("td")
    const oaPotDiv = document.createElement('div');
    oaPotDiv.className = `denom${resultPotential.offensiveAssistanceDenominationNormalized}`;
    oaPotDiv.textContent = resultPotential.offensiveAssistance;
    tdOAPot.appendChild(oaPotDiv);
    trOA.appendChild(tdOAPot)

    tableNode.appendChild(trOA)

    // Defensive Assistance
    var trDA = document.createElement("tr")
    trDA.className = pluginNodeClass

    var tdDALabel = document.createElement("td")
    tdDALabel.className = "opacity-06"
    tdDALabel.textContent = "Defensive Assistance"
    trDA.appendChild(tdDALabel)

    var tdDACurrent = document.createElement("td")
    const daCurrentDiv = document.createElement('div');
    daCurrentDiv.className = `denom${resultCurrents.defensiveAssistanceDenominationNormalized}`;
    daCurrentDiv.textContent = resultCurrents.defensiveAssistance;
    tdDACurrent.appendChild(daCurrentDiv);
    trDA.appendChild(tdDACurrent)

    var tdDAPot = document.createElement("td")
    const daPotDiv = document.createElement('div');
    daPotDiv.className = `denom${resultPotential.defensiveAssistanceDenominationNormalized}`;
    daPotDiv.textContent = resultPotential.defensiveAssistance;
    tdDAPot.appendChild(daPotDiv);
    trDA.appendChild(tdDAPot)

    tableNode.appendChild(trDA)

    // Tool-tips
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

    const oaValueText = `OP + BC =\n${OP} + ${BC} = ${resultCurrents.offensiveAssistance}${resultCurrents.offensiveAssistanceModifierDetails}`
    const oaPotentialText = `OP_POT + BC_POT = \n${OP_POT} + ${BC_POT} = ${resultPotential.offensiveAssistance}${resultPotential.offensiveAssistanceModifierDetails}`
    addHoverCardToCell(updatedCells, "Offensive Assistance", "OP + BC", oaValueText, oaPotentialText)

    const daValueText = `TA + DP =\n${TA} + ${DP} = ${resultCurrents.defensiveAssistance}${resultCurrents.defensiveAssistanceModifierDetails}`
    const daPotentialText = `TA_POT + DP_POT = \n${TA_POT} + ${DP_POT} = ${resultPotential.defensiveAssistance}${resultPotential.defensiveAssistanceModifierDetails}`
    addHoverCardToCell(updatedCells, "Defensive Assistance", "TA + DP", daValueText, daPotentialText)
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

function sumMinutes(minutesPlayed) {
    const sum = Object.values(minutesPlayed)
        .map(Number)              // convert strings like "54" → number 54
        .reduce((a, b) => a + b, 0);
    return sum
}

function minutesPlayedBetween(minutesPlayed, injurDatesAsStrings) {
    console.debug("***************** minutesPlayedBetween *****************")
    const dateMap = new Map(
        Object.entries(minutesPlayed).map(([dateStr, value]) => [
            new Date(dateStr),  // key = Date
            parseInt(value, 10) // value = integer
        ])
    );
    console.debug("dateMap: ", dateMap)

    const injuryDates = injurDatesAsStrings.map(str => new Date(str));
    console.debug("injuryDates: ", injuryDates)

    var results = []
    var previousInjuryDate = new Date()
    for (const injuryDate of injuryDates) {
        console.debug("Processing injury date: ", injuryDate)
        var sum = 0

        for (const [date, minutes] of dateMap.entries()) {
            console.debug("Found ", minutes, " played on ", date)
            console.debug("Checking if ", date, " is between ", injuryDate, "and", previousInjuryDate)
            if (date > injuryDate && date <= previousInjuryDate) {
                sum += minutes
                console.debug("It is, new sum: ", sum)
            } else {
                console.debug("It is not, skipping...")
            }
        }
        results.push(sum)
        previousInjuryDate = injuryDate
    }

    const firstKnownInjuryDate = injuryDates[injuryDates.length - 1]
    var sum = 0
    for (const [date, minutes] of dateMap.entries()) {
        if (date <= firstKnownInjuryDate) {
            sum += minutes
        }
    }
    results.push(sum)

    return results
}

async function showInjuries() {
    const playerID = lastPathComponent(window.location.pathname)
    const playerDataFromStorage = await storage.get('player-data');
    var loadedPlayerData = playerDataFromStorage['player-data'] || {};
    console.debug('loadedPlayerData = ', loadedPlayerData)
    var currentPlayerData = loadedPlayerData[playerID] || {};
    console.debug('currentPlayerData = ', currentPlayerData)
    const injuries = currentPlayerData['injuries']
    //    const injuries = ["29 Aug 2025, 12:00", "27 Aug 2025, 12:00", "15 Aug 2025, 12:00"]
    const minutesPlayed = currentPlayerData['minutes-played']

    const sisterTable = document.querySelector('div.card-body table')
    if (!sisterTable) { return }
    const tableContainer = sisterTable.parentNode
    console.debug("tableContainer: ", tableContainer)
    if (injuries && injuries.length > 0) {
        console.debug("injuries for player: ", injuries)

        // Calculate minutes played since last injury
        const minutes = minutesPlayedBetween(minutesPlayed, injuries)
        console.debug('Minutes played between injuries: ', minutes)

        if (!tableContainer.querySelector("span#minutes-since-last-injury")) {
            const span = document.createElement('span')
            span.id = 'minutes-since-last-injury'
            span.textContent = `Minutes since last injury: ${minutes[0]}`
            tableContainer.appendChild(span)
        }

        if (!tableContainer.querySelector("table#injury-table")) {
            const table = document.createElement('table')
            table.id = "injury-table"
            table.classList.add('table')
            table.classList.add('table-sm')
            table.classList.add('table-fw')
            const headerRow = document.createElement('tr')
            headerRow.classList.add('summary-row')
            const headerCellRecentInjuries = document.createElement('th')

            if (injuries.length > 1) {
                const disclosureSpan = document.createElement('span')
                disclosureSpan.classList.add('disclosure')
                disclosureSpan.textContent = '▶'
                headerCellRecentInjuries.appendChild(disclosureSpan)

                // append text without nuking the span
                headerCellRecentInjuries.appendChild(document.createTextNode(' Recent injuries'))

                headerRow.addEventListener('click', () => {
                    const disclosure = headerRow.querySelector('.disclosure');
                    let next = headerRow.nextElementSibling;
                    const isOpen = disclosure.classList.contains('open');

                    // Toggle all subsequent .details-row until another summary-row is found
                    while (next && !next.classList.contains('summary-row')) {
                        if (!next.classList.contains('injuries-first-row')) {
                            next.style.display = isOpen ? 'none' : 'table-row';
                        }
                        next = next.nextElementSibling;
                    }

                    disclosure.classList.toggle('open', !isOpen);
                });
            } else {
                headerCellRecentInjuries.appendChild(document.createTextNode('Recent injuries'))
            }
            const headerCellMinutes = document.createElement('th')
            headerCellMinutes.classList.add('table-header-minutes')
            const questionMarkSpan = document.createElement("span")
            questionMarkSpan.textContent = " \uf29c"
            questionMarkSpan.title = "Indicates how many minutes player has played until he sustained the injury (if this is his first known injury this number may be smaller than in reality because of the time the extension started collecting data)"
            headerCellMinutes.appendChild(document.createTextNode('Minutes'))
            headerCellMinutes.appendChild(questionMarkSpan)

            headerRow.appendChild(headerCellRecentInjuries)
            headerRow.appendChild(headerCellMinutes)
            table.appendChild(headerRow)

            for (let i = 0; i < injuries.length; i++) {
                const injury = injuries[i]
                const row = document.createElement('tr')
                if (table.querySelector('td')) {
                    row.classList.add('details-row')
                } else {
                    row.classList.add('injuries-first-row')
                }
                const cell = document.createElement('td')
                cell.textContent = injury
                row.appendChild(cell)

                const index = i + 1
                if (index < minutes.length) {
                    console.debug("Value exists:", minutes[index]);
                    const cell = document.createElement('td')
                    cell.textContent = minutes[index]
                    row.appendChild(cell)
                } else {
                    console.debug("No value at this index: ", index);
                }

                table.appendChild(row)
            }
            tableContainer.appendChild(table)
        }
    } else {
        var minutesWithoutInjury = 0
        if (minutesPlayed) {
            minutesWithoutInjury = sumMinutes(minutesPlayed)
        }
        if (!tableContainer.querySelector("span#minutes-since-last-injury")) {
            const span = document.createElement('span')
            span.id = 'minutes-since-last-injury'
            span.textContent = `Minutes without injury: ${minutesWithoutInjury}`
            tableContainer.appendChild(span)
        }
    }
}

function getMyTeam() {
    // Check if there are inputs on the page, if yes this is our player
    const inputCheckbox = document.querySelector('input.form-check-input')
    const controlButtons = Array.from(document.querySelectorAll("button"))
        .filter(btn => {
            const txt = btn.textContent.trim();
            return txt === "Sell" || txt === "Fire";
        });
    console.debug("inputCheckbox:", inputCheckbox, "controlButtons:", controlButtons)
    if (inputCheckbox && controlButtons.length >= 2) {
        const link = document.querySelector('table span fw-club-hover a')
        const clubID = lastPathComponent(link.href)
        const clubName = link.querySelector('span.club-name').textContent
        const clubData = {
            id: clubID,
            name: clubName
        }
        return clubData
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
 * Returns the player personalities data from a give table.
 * @returns {Object} player personalities data.
 */
function getPersonalitiesData(personalityTable) {
    if (!personalityTable) {
        throw new Error("personalityTable is undefined");
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

    return result
}

/**
 * Returns the player special talents table if it's present on the page.
 * @returns {Object} player special talents table node.
 */
function getSpecialTalentsTable() {
    // Get all <th> elements
    const thElements = document.querySelectorAll("table > tr > th");

    // Find the one whose textContent matches
    const th = Array.from(thElements).find(el => el.textContent.trim() === "Special Talent");

    // Get its parent <table>
    const table = th ? th.closest("table") : null;

    return table
}

/**
 * Returns the player special talents data from a give table.
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

function getPlayerData() {
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
    }
    console.debug('Result of reading the special talents', specialTalentsData)

    const playerID = lastPathComponent(window.location.pathname)

    return {
        playerID: playerID,
        ...(personalitiesData !== undefined && { personalities: personalitiesData }),
        ...(specialTalentsData !== undefined && { specialTalents: specialTalentsData })
    }
}

async function saveToStorage(clubData, playerData) {
    console.debug(`Will save personalities for playerID = ${playerData.playerID}`);
    const playerDataFromStorage = await storage.get('player-data');
    var loadedPlayerData = playerDataFromStorage['player-data'] || {};
    console.debug('loadedPlayerData = ', loadedPlayerData)
    var currentPlayerData = loadedPlayerData[playerData.playerID] || {};
    console.debug('currentPlayerData = ', currentPlayerData)
    currentPlayerData['personalities'] = playerData.personalities
    const specialTalents = playerData.specialTalents
    if (specialTalents) {
        currentPlayerData['specialTalents'] = specialTalents
    } else {
        delete currentPlayerData['specialTalents']
    }
    loadedPlayerData[playerData.playerID] = currentPlayerData

    const preparedForSaving = {
        club: clubData,
        "player-data": loadedPlayerData
    }
    console.debug('preparedForSaving: ', preparedForSaving)

    await storage.set(preparedForSaving)
    console.debug(`Saved to storage: `, currentPlayerData, ` and club data: `, clubData);
}

function getBidButton() {
    return document.querySelector("button:has(> i.fa-gavel)")
}

function isPendingSale() {
    const bidButton = getBidButton()
    return bidButton && bidButton.textContent.trim().startsWith("Place bid")
}
/**
 * Checks if the buying guide is displayed, if not it calls the assembleBuyingGuide() and attaches the result after the bid button.
 */
function showBuyingGuide() {
    const bidButton = getBidButton()

    const buyingGuideIdentifier = `${pluginNodeClass}-buying-guide`
    if (document.getElementById(buyingGuideIdentifier)) return

    const buyingGuide = assembleBuyingGuide(buyingGuideIdentifier)
    bidButton.after(buyingGuide)
}

/**
 * Assemble buying guide ready to be attached to DOM.
 * @param {string} identifier - identifier to be used for the buying guide
 * @returns {Object} buying guide node.
 */
function assembleBuyingGuide(identifier) {
    const position = getPlayerPosition()
    const buyingGuideList = document.createElement("ol")
    buyingGuideList.id = identifier

    const personalitiesTable = getPersonalitiesTable()
    let personalitiesData
    if (personalitiesTable) {
        personalitiesData = getPersonalitiesData(personalitiesTable)
    }

    const specialTalentsTable = getSpecialTalentsTable()
    let specialTalentsData
    if (specialTalentsTable) {
        specialTalentsData = getSpecialTalentsData(specialTalentsTable)
        for (const talent of specialTalentsData) {
            const description = specialTalentDescription(talent, position)
            const li = document.createElement("li")
            li.textContent = description
            buyingGuideList.appendChild(li)
        }
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
        console.log("Could not find player position")
        return false
    } else {
        console.info(`${getPositionEmoji(playerPosition)} Found player position`)
    }

    const playerSkillsTable = getPlayerSkillsTable()
    if (!playerSkillsTable) {
        console.log("Could not find player skills table")
        return false
    } else {
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
    tableNode.querySelectorAll(`tr.${pluginNodeClass}`).forEach(el => el.remove())
}

export async function processPlayerPage() {
    console.info("Processing player page...")

    const siteLoaded = checkSiteLoaded()
    if (siteLoaded) {
        console.info("✅ Site fully loaded")
    } else {
        console.log("Site not ready, skipping update...")
        return
    }

    const clubData = getMyTeam()
    if (clubData) {
        console.debug("clubData: ", clubData)
        const playerData = getPlayerData()
        if (playerData) {
            console.debug("playerData: ", playerData)
            await saveToStorage(clubData, playerData)
        }
    }

    await showInjuries()

    // If the player is on sale, add buying summary
    if (isPendingSale()) {
        showBuyingGuide()
    }

    const coreSkillsTable = getCoreSkillsTable()
    if (coreSkillsTable && coreSkillsTable.rows && coreSkillsTable.rows.length > 1) {
        cleanUpNodeForPlayer(coreSkillsTable)
        appendComputedSkills(coreSkillsTable);
    }
}

function getCoreSkillsTable() {
    return document.querySelector("table.table:has(tr th span[ngbpopover='Core Skills'])")
}