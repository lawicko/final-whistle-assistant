import { PositionsKeys } from "./ui_utils.js"

export const PersonalitiesKeys = {
    Ambition: "ambition",
    Arrogance: "arrogance",
    Attitude: "attitude",
    Commitment: "commitment",
    Composure: "composure",
    Confidence: "confidence",
    Decisions: "decisions",
    Leadership: "leadership",
    Loyalty: "loyalty",
    Sportsmanship: "sportsmanship",
    Teamwork: "teamwork",
    Temperament: "temperament",
    Workrate: "workrate"
}

const PersonalitiesDefinitions = {
    [PersonalitiesKeys.Ambition]: {},
    [PersonalitiesKeys.Arrogance]: {},
    [PersonalitiesKeys.Attitude]: {},
    [PersonalitiesKeys.Commitment]: {},
    [PersonalitiesKeys.Composure]: {},
    [PersonalitiesKeys.Confidence]: {},
    [PersonalitiesKeys.Decisions]: {},
    [PersonalitiesKeys.Leadership]: {},
    [PersonalitiesKeys.Loyalty]: {},
    [PersonalitiesKeys.Sportsmanship]: {},
    [PersonalitiesKeys.Teamwork]: {},
    [PersonalitiesKeys.Temperament]: {},
    [PersonalitiesKeys.Workrate]: {}
}

/**
 * Returns a personality trait description for a given position.
 * @param {string} personalityKey - a key as in PersonalitiesKeys
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the talent ready for display on the front-end.
 */
export function personalityDescription(personalityKey, personalityValue, positionKey) {
    switch (personalityKey) {
        case PersonalitiesKeys.Ambition:
            return ambitionDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Arrogance:
            return arroganceDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Attitude:
            return attitudeDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Commitment:
            return commitmentDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Composure:
            return composureDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Confidence:
            return confidenceDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Decisions:
            return decisionsDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Leadership:
            return leadershipDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Loyalty:
            return loyaltyDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Sportsmanship:
            return sportsmanshipDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Teamwork:
            return teamworkDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Temperament:
            return temperamentDescription(personalityValue, positionKey)
        case PersonalitiesKeys.Workrate:
            return workrateDescription(personalityValue, positionKey)
    }
}

/**
 * Returns Ambition personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function ambitionDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative ambition personality is not ideal for players younger than 21"
                case 1:
                case 2:
                    return "🤔 Positive ambition personality is ok for players younger than 21"
                default:
                    throw new Error("ambitionDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Arrogance personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function arroganceDescription(personalityValue, positionKey) {
    switch (positionKey) {
        case PositionsKeys.CB:
        case PositionsKeys.LB:
        case PositionsKeys.RB:
        case PositionsKeys.LWB:
        case PositionsKeys.RWB:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "👎 Negative arrogance personality is bad for defenders, specifically it lowers the chance that your defence will try to execute an offside trap"
                case 1:
                case 2:
                    return "🤔 Positive arrogance personality is nice to have if you want to give the player specific orders"
                default:
                    throw new Error("arroganceDescription called with personalityValue=0 or outside of <-2,2>");
            }
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative arrogance personality is not ideal if you want to give the player specific orders"
                case 1:
                case 2:
                    return "🤔 Positive arrogance personality is nice to have if you want to give the player specific orders"
                default:
                    throw new Error("arroganceDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Attitude personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function attitudeDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                    return "👎 Negative attitude personality means he will be in bad form for 25% longer"
                case -1:
                    return "🤔 Negative attitude personality is not ideal for any player"
                case 1:
                    return "🤔 Positive attitude personality is ok for any player"
                case 2:
                    return "👍 Positive attitude personality means he will get out of bad form 25% faster"
                default:
                    throw new Error("ambitionDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Commitment personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function commitmentDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative commitment personality is not ideal for any player"
                case 1:
                case 2:
                    return "🤔 Positive commitment personality is ok for any player"
                default:
                    throw new Error("commitmentDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Composure personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function composureDescription(personalityValue, positionKey) {
    switch (positionKey) {
        case PositionsKeys.FW:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "👎 Negative composure personality is disastrous for forwards, as they will miss more shots"
                case 1:
                case 2:
                    return "👍 Positive composure personality is critical for forwards, as they will miss less shots"
                default:
                    throw new Error("composureDescription called with personalityValue=0 or outside of <-2,2>");
            }
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative composure personality is not ideal for any player"
                case 1:
                case 2:
                    return "🤔 Positive composure personality is ok for any player"
                default:
                    throw new Error("composureDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Confidence personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function confidenceDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative confidence personality is not ideal for any player"
                case 1:
                case 2:
                    return "🤔 Positive confidence personality is not bad for any player"
                default:
                    throw new Error("confidenceDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Decisions personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function decisionsDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative decisions personality is not ideal for any player"
                case 1:
                case 2:
                    return "🤔 Positive decisions personality is not bad for any player"
                default:
                    throw new Error("decisionsDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Leadership personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function leadershipDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative leadership personality is not ideal for any player"
                case 1:
                case 2:
                    return "🤔 Positive leadership personality is not bad for any player"
                default:
                    throw new Error("leadershipDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Loyalty personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function loyaltyDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative loyalty personality is not ideal for any player, it means his salary is higher"
                case 1:
                case 2:
                    return "🤔 Positive loyalty personality is ok for any player, it means his salary is lower"
                default:
                    throw new Error("loyaltyDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Sportsmanship personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function sportsmanshipDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "👎 Negative sportsmanship personality means more fouls, more cards, more penalties against your team"
                case 1:
                case 2:
                    return "👍 Positive sportsmanship personality means less fouls, less cards, less penalties against your team"
                default:
                    throw new Error("sportsmanshipDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Teamwork personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function teamworkDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "👎 Negative teamwork personality means he is less effective in assisting his teammates"
                case 1:
                case 2:
                    return "👍 Positive teamwork personality means he is more effective in assisting his teammates"
                default:
                    throw new Error("teamworkDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Temperament personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function temperamentDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative temperament personality is not ideal for any player, it means more cards"
                case 1:
                case 2:
                    return "🤔 Positive temperament personality is not bad for any player, it means less cards"
                default:
                    throw new Error("temperamentDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}

/**
 * Returns Workrate personality description for a given position.
 * @param {string} personalityValue - a value of the personality <-2, 2>
 * @param {string} positionKey - a position key as in PositionsKeys
 * @returns {string} a formatted description of the personality ready for display on the front-end.
 */
function workrateDescription(personalityValue, positionKey) {
    switch (positionKey) {
        default:
            switch (personalityValue) {
                case -2:
                case -1:
                    return "🤔 Negative workrate personality is not ideal for any player"
                case 1:
                case 2:
                    return "🤔 Positive workrate personality is ok for any player"
                default:
                    throw new Error("workrateDescription called with personalityValue=0 or outside of <-2,2>");
            }
    }
}