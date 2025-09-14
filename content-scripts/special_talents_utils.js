import { PositionsKeys } from "./ui_utils.js"

export const SpecialTalentsKeys = {
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
export function specialTalentDescription(specialTalentKey, positionKey) {
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