import * as utils from "./utils.js"
import * as uiUtils from "./ui_utils.js"

/**
 * Finds and returns an age value from a given row
 * @param {Node} row the row that will be searched for the age value
 * @returns {Number} age as Number
 */
export function age(row) {
    return Number(row.querySelector("fw-player-age > span > span").textContent.trim())
}

/**
 * Finds and returns the ID of a player in a row
 * @param {Node} row the row that will be searched for the ID value
 * @returns {string} player ID as string
 */
export function id(row) {
    return utils.lastPathComponent(row.querySelector("fw-player-hover div.hovercard a").href)
}

/**
 * 
 * @param {Node} insertionPoint the insertion point to which the details will be appended
 * @param {Object} hiddenSkills object that contains the hidden skills definitions
 * @param {Object} config defines which skills are added
 */
export function addHiddenSkillsDetails({
    insertionPoint = undefined,
    hiddenSkills = undefined,
    config = {
        showAdvancedDevelopment: true,
        showEstimatedPotential: true
    }
} = {}) {
    if (!insertionPoint) {
        throw new Error("addHiddenSkillsDetails called with undefined insertionPoint")
    }
    if (!hiddenSkills) {
        throw new Error("addHiddenSkillsDetails called with undefined hiddenSkills argument")
    }

    const normalizedEstimatedPotential = Number(hiddenSkills["estimatedPotential"])
    if (config.showAdvancedDevelopment) {
        const normalizedAdvancedDevelopemnt = utils.normalizeAdvancedDevelopment(normalizedEstimatedPotential, Number(hiddenSkills["advancedDev"]))

        let advancedDevelopmentClass = utils.classFromTalent(normalizedEstimatedPotential, normalizedAdvancedDevelopemnt)
        const advancedDevelopmentConfig = {
            valueElementClass: advancedDevelopmentClass,
            tooltip: "Advanced development as seen by your scout, normalized by eliminating impossible values like 21 for potentials 5 and 6. Possible values:\n3,4: 18 or 19\n5,6: 19 or 20\n7,8,9: 19, 20, 21 or 22"
        }
        uiUtils.applyDetailedProperty(
            insertionPoint,
            normalizedAdvancedDevelopemnt,
            "AD",
            advancedDevelopmentConfig
        )
    }

    if (config.showEstimatedPotential) {
        const denom = "denom" + hiddenSkills["estimatedPotential"]
        const estimatedPotentialConfig = {
            valueElementClass: denom,
            tooltip: "Estimated potential that your scout sees. If you want to filter by exact potential use the controls at the top."
        }
        uiUtils.applyDetailedProperty(
            insertionPoint,
            normalizedEstimatedPotential,
            "EP",
            estimatedPotentialConfig
        )
    }
}