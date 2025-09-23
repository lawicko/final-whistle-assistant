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
export function updateHiddenSkillsDetails({
    insertionPoint = undefined,
    hiddenSkills = undefined,
    config = {
        showAdvancedDevelopment: true,
        showEstimatedPotential: true
    }
} = {}) {
    if (!insertionPoint) {
        throw new Error("updateHiddenSkillsDetails called with undefined insertionPoint")
    }
    if (!hiddenSkills) {
        throw new Error("updateHiddenSkillsDetails called with undefined hiddenSkills argument")
    }

    const normalizedEstimatedPotential = Number(hiddenSkills["estimatedPotential"])
    if (config.showAdvancedDevelopment) {
        const normalizedAdvancedDevelopemnt = utils.normalizeAdvancedDevelopment(normalizedEstimatedPotential, Number(hiddenSkills["advancedDev"]))

        let advancedDevelopmentClass = utils.classFromTalent(normalizedEstimatedPotential, normalizedAdvancedDevelopemnt)
        const advancedDevelopmentConfig = {
            valueElementClass: advancedDevelopmentClass,
            tooltip: "Advanced development as seen by your scout, normalized by eliminating impossible values like 21 for potentials 5 and 6. Possible values:\n3,4: 18 or 19\n5,6: 19 or 20\n7,8,9: 19, 20, 21 or 22"
        }
        uiUtils.updateDetailedProperty(
            insertionPoint,
            "AD",
            normalizedAdvancedDevelopemnt,
            advancedDevelopmentConfig
        )
    } else {
        uiUtils.updateDetailedProperty(
            insertionPoint,
            "AD"
        )
    }

    if (config.showEstimatedPotential) {
        const denom = "denom" + hiddenSkills["estimatedPotential"]
        const estimatedPotentialConfig = {
            valueElementClass: denom,
            tooltip: "Estimated potential that your scout sees. If you want to filter by exact potential use the controls at the top."
        }
        uiUtils.updateDetailedProperty(
            insertionPoint,
            "EP",
            normalizedEstimatedPotential,
            estimatedPotentialConfig
        )
    } else {
        uiUtils.updateDetailedProperty(
            insertionPoint,
            "EP"
        )
    }
}

/**
 * Adds the control checkboxes to the desired node
 * @param {Node} insertionPoint the insertion point to which the checkboxes will be appended
 * @param {Object} checkboxesDataFromStorage the object containing information on the saved selection state
 */
export function addControlCheckboxes(insertionPoint, checkboxesDataFromStorage, afterCheckboxDataSetCallback) {
    if (!insertionPoint) {
        throw new Error("addControlCheckboxes called with undefined insertionPoint")
    }

    if (!checkboxesDataFromStorage) {
        throw new Error("addControlCheckboxes called with undefined checkboxesDataFromStorage")
    }

    // If there already exists any of the chekboxes then we don't need to add anything because it's already there
    if (document.getElementById("teamworkCheckbox")) return

    const checkboxesData = [
        { id: "teamworkCheckbox", label: `${uiUtils.personalitiesSymbols["teamwork"]} Teamwork` },
        { id: "sportsmanshipCheckbox", label: `${uiUtils.personalitiesSymbols["sportsmanship"]} Sportsmanship` },
        { id: "advancedDevelopmentCheckbox", label: `AD` },
        { id: "estimatedPotentialCheckbox", label: `EP` }
    ];
    const rightItems = document.createElement("div")
    rightItems.classList.add("right-items")

    checkboxesData.forEach(item => {
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.id = item.id

        const suffix = "Checkbox";
        const checkboxKey = item.id.slice(0, -suffix.length);
        checkbox.checked = !!checkboxesDataFromStorage[checkboxKey]

        const label = document.createElement("label")
        label.textContent = item.label
        label.htmlFor = item.id

        // Update the corresponding boolean variable on change
        checkbox.addEventListener("change", async (event) => {
            const isChecked = event.target.checked
            console.debug(`${item.label}:`, checkbox.checked)
            const {
                checkboxes: cd = checkboxesDataFromStorage,
                "player-data": storedPlayerData = {}
            } = await utils.storage.get(["player-data", "checkboxes"])
            if (isChecked) {
                cd[checkboxKey] = "true"
            } else {
                delete cd[checkboxKey]
            }
            await utils.storage.set({ checkboxes: cd })
            afterCheckboxDataSetCallback(storedPlayerData, cd)
        })

        rightItems.appendChild(checkbox)
        rightItems.appendChild(label)
        rightItems.appendChild(document.createTextNode(" ")) // spacing
    })
    insertionPoint.appendChild(rightItems)
}