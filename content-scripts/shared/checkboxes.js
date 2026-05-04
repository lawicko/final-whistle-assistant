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
 * @param {Object} insertionPointConfig the insertion point config containing the insertion node to which the checkboxes will be appended with specified method
 * @param {Object} checkboxesConfig the config containing information on the requested checkboxes and the saved selection state
 */
export function insertCheckboxesForData(insertionPointConfig, checkboxesConfig, afterCheckboxDataSetCallback) {
    if (!insertionPointConfig) {
        throw new Error("insertCheckboxesForData called with undefined insertionPointConfig")
    }

    if (!checkboxesConfig) {
        throw new Error("insertCheckboxesForData called with undefined checkboxesConfig")
    }

    // If there already exists a chekboxes container, then we don't need to add anything
    if (document.getElementById(utils.pluginNodeClass + "CheckboxContainer")) return

    let checkboxesData = []
    if (!checkboxesConfig.requestedCheckboxes) {
        checkboxesData = [
            { id: "specialTalentsCheckbox", label: `${uiUtils.specialTalentSymbol} ST` },
            { id: "teamworkCheckbox", label: `${uiUtils.personalitiesSymbols["teamwork"]} Teamwork` },
            { id: "sportsmanshipCheckbox", label: `${uiUtils.personalitiesSymbols["sportsmanship"]} Sportsmanship` },
            { id: "advancedDevelopmentCheckbox", label: `AD` },
            { id: "estimatedPotentialCheckbox", label: `EP` }
        ]
    } else {
        if (checkboxesConfig.requestedCheckboxes.specialTalents) {
            checkboxesData.push({ id: "specialTalentsCheckbox", label: `${uiUtils.specialTalentSymbol} ST` })
        }
        if (checkboxesConfig.requestedCheckboxes.teamwork) {
            checkboxesData.push({ id: "teamworkCheckbox", label: `${uiUtils.personalitiesSymbols["teamwork"]} Teamwork` })
        }
        if (checkboxesConfig.requestedCheckboxes.sportsmanship) {
            checkboxesData.push({ id: "sportsmanshipCheckbox", label: `${uiUtils.personalitiesSymbols["sportsmanship"]} Sportsmanship` })
        }
        if (checkboxesConfig.requestedCheckboxes.advancedDevelopment) {
            checkboxesData.push({ id: "advancedDevelopmentCheckbox", label: `AD` })
        }
        if (checkboxesConfig.requestedCheckboxes.estimatedPotential) {
            checkboxesData.push({ id: "estimatedPotentialCheckbox", label: `EP` })
        }
    }
        
    const checkboxContainer = document.createElement("div")
    checkboxContainer.id = utils.pluginNodeClass + "CheckboxContainer"
    checkboxContainer.classList.add("right-items")
    checkboxContainer.classList.add("float-end") // comes from the game

    checkboxesData.forEach(item => {
        const checkbox = document.createElement("input")
        checkbox.type = "checkbox"
        checkbox.id = item.id
        checkbox.className = "form-check-input"

        const suffix = "Checkbox";
        const checkboxKey = item.id.slice(0, -suffix.length);
        checkbox.checked = !!checkboxesConfig.checkboxesDataFromStorage[checkboxKey]

        const label = document.createElement("label")
        label.textContent = item.label
        label.htmlFor = item.id

        // Update the corresponding boolean variable on change
        checkbox.addEventListener("change", async (event) => {
            const isChecked = event.target.checked
            console.debug(`${item.label}:`, checkbox.checked)
            const cd = await db.getCheckboxes() || checkboxesConfig.checkboxesDataFromStorage
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