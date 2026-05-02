import * as db from "../db_access.js"
import * as uiUtils from "../ui_utils.js"
import * as utils from "../utils.js"

export async function getCheckboxesDataFromDB() {
    const checkboxes = await db.getCheckboxes()
    const checkboxesDefault = {
        specialTalents: true,
        teamwork: true,
        sportsmanship: true,
        advancedDevelopment: true,
        estimatedPotential: true
    }
    return checkboxes || checkboxesDefault
}

/**
 * Adds the control checkboxes to the desired node
 * @param {Object} insertionPointConfig the insertion point node and to which the checkboxes will be appended with specified method
 * @param {Object} checkboxesDataFromStorage the object containing information on the saved selection state
 */
export function insertCheckboxesForData(insertionPointConfig, checkboxesDataFromStorage, afterCheckboxDataSetCallback) {
    if (!insertionPointConfig) {
        throw new Error("insertCheckboxesForData called with undefined insertionPointConfig")
    }

    if (!checkboxesDataFromStorage) {
        throw new Error("insertCheckboxesForData called with undefined checkboxesDataFromStorage")
    }

    // If there already exists any of the chekboxes then we don't need to add anything because it's already there
    if (document.getElementById("teamworkCheckbox")) return

    const checkboxesData = [
        { id: "specialTalentsCheckbox", label: `${uiUtils.specialTalentSymbol} ST` },
        { id: "teamworkCheckbox", label: `${uiUtils.personalitiesSymbols["teamwork"]} Teamwork` },
        { id: "sportsmanshipCheckbox", label: `${uiUtils.personalitiesSymbols["sportsmanship"]} Sportsmanship` },
        { id: "advancedDevelopmentCheckbox", label: `AD` },
        { id: "estimatedPotentialCheckbox", label: `EP` }
    ];
    const checkboxContainer = document.createElement("div")
    checkboxContainer.id = utils.pluginNodeClass + "CheckboxContainer"
    checkboxContainer.classList.add("right-items")
    checkboxContainer.classList.add("float-end") // comes from the game

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
            const cd = await db.getCheckboxes() || checkboxesDataFromStorage
            if (isChecked) {
                cd[checkboxKey] = true
            } else {
                cd[checkboxKey] = false
            }
            await db.putCheckboxes(cd)
            await afterCheckboxDataSetCallback(cd)
        })

        checkboxContainer.appendChild(checkbox)
        checkboxContainer.appendChild(label)
        checkboxContainer.appendChild(document.createTextNode(" ")) // spacing
    })

    if (insertionPointConfig.method == "after") {
        insertionPointConfig.node.after(checkboxContainer)
    } else {
        insertionPointConfig.node.appendChild(checkboxContainer)
    }
}

export function removeCheckboxes(parentNode) {
    const checkboxContainer = parentNode.querySelector(`#${utils.pluginNodeClass + "CheckboxContainer"}`)
    if (checkboxContainer) checkboxContainer.remove()
}