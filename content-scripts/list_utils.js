import * as utils from "./utils.js"
import * as uiUtils from "./ui_utils.js"
import * as specialTalentsUtils from "./special_talents_utils.js"

const skillIndexOutfielders = {
    "SC": 0,
    "OP": 1,
    "BC": 2,
    "PA": 3,
    "AE": 4,
    "CO": 5,
    "TA": 6,
    "DP": 7
}

const skillIndexGoalkeepers = {
    "RE": 0,
    "GP": 1,
    "IN": 2,
    "CT": 3,
    "OR": 4
}

export function parseNumber(node) {
    return Number(node.textContent.replace(/\D/g, ''))
}

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
            tooltip: "Estimated potential that your scout sees."
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

        checkboxContainer.appendChild(checkbox)
        checkboxContainer.appendChild(label)
        checkboxContainer.appendChild(document.createTextNode(" ")) // spacing
    })
    insertionPoint.appendChild(checkboxContainer)
}

export function removeControlCheckboxes(parentNode) {
    const checkboxContainer = parentNode.querySelector(`#${utils.pluginNodeClass + "CheckboxContainer"}`)
    if (checkboxContainer) checkboxContainer.remove()
}

export function clearTeamwork(element) {
    const spans = element.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === uiUtils.personalitiesSymbols["teamwork"]) {
            span.remove();
        }
    });
}

export function clearSportsmanship(element) {
    const spans = element.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === uiUtils.personalitiesSymbols["sportsmanship"]) {
            span.remove();
        }
    });
}

export function processTableRow(
    row,
    storedPlayerData,
    checkboxesData,
    idCallback,
    nameCallback,
    additionalInfoInsertionPointCallback,
    accountForSpecialTalents = false
) {
    // Select the first <a> inside a <td> whose href contains "/player/"
    const playerLink = row.querySelector('td a[href*="/player/"]');
    // Match the number after /player/
    if (!playerLink) { // When the user hovers over the player name, the hover card shows up
        return
    }

    const playerID = idCallback(row)//utils.lastPathComponent(row.querySelector("td > a").href)
    var playerName = nameCallback(row)//row.querySelector("td > a").textContent.trim()
    console.debug('Processing player:', playerName)

    const playerData = storedPlayerData[playerID]
    const insertionPoint = additionalInfoInsertionPointCallback(row)//row.querySelector("td:has(a)")
    if (playerData) {
        console.debug(`Found stored player data for: ${playerName}`, playerData)
        let playerPersonalities = playerData["personalities"]
        if (!playerPersonalities) {
            console.debug(`No personalities in player profile for ${playerName}.`)
            uiUtils.addNoDataSymbol(insertionPoint)
        } else {
            uiUtils.removeNoDataSymbol(insertionPoint)

            var teamwork = playerPersonalities['teamwork']
            const showTeamwork = checkboxesData['teamwork'] ?? false
            if (teamwork) {
                if (showTeamwork) {
                    uiUtils.applyTeamwork(insertionPoint, teamwork)
                } else {
                    clearTeamwork(insertionPoint)
                }
            }
            const sportsmanship = playerPersonalities['sportsmanship']
            const showSportsmanship = checkboxesData['sportsmanship'] ?? false
            if (sportsmanship) {
                if (showSportsmanship) {
                    uiUtils.applySportsmanship(insertionPoint, sportsmanship)
                } else {
                    clearSportsmanship(insertionPoint)
                }
            }
        }

        const ageFromListing = age(row)
        const showAD = checkboxesData['advancedDevelopment'] ?? false
        const showEP = checkboxesData['estimatedPotential'] ?? false
        // Hidden skills
        const hiddenSkills = playerData["hiddenSkills"]
        if (hiddenSkills) {
            updateHiddenSkillsDetails({
                insertionPoint: insertionPoint,
                hiddenSkills: hiddenSkills,
                config: {
                    showAdvancedDevelopment: showAD && ageFromListing < 25,
                    showEstimatedPotential: showEP && ageFromListing < 21
                }
            })
        }

        // Special talents
        if (accountForSpecialTalents) {
            let valueNodes = row.querySelectorAll("table.table fw-player-skill > span > span:first-child")
            const applySpecialTalents = checkboxesData['specialTalents'] ?? false
            const specialTalents = playerData["specialTalents"]
            if (specialTalents) {
                updateSkillNodesWithSpecialTalents(specialTalents, valueNodes, applySpecialTalents)
            }
        }
    } else {
        console.debug(`Player ${playerName} has no saved profile.`)
        uiUtils.addNoDataSymbol(insertionPoint)
    }
}

const IgnoredTalentsOutfielders = [
    specialTalentsUtils.SpecialTalentsKeys.OneOnOne,
    specialTalentsUtils.SpecialTalentsKeys.SetPieceSpecialist
]

const IgnoredTalentsGoalKeepers = [
    specialTalentsUtils.SpecialTalentsKeys.OneOnOne,
    specialTalentsUtils.SpecialTalentsKeys.SetPieceSpecialist
]

function updateSkillNodesWithSpecialTalents(specialTalents, valueNodes, add) {
    // console.info(`Updating (${add ? "adding" : "removing"}) talents:`, specialTalents)
    const stClass = utils.pluginNodeClass + "SpecialTalentModified"
    const stTooltipClass = stClass + "Tooltip"
    let ignoredTalents = IgnoredTalentsOutfielders
    let skillIndexArray = skillIndexOutfielders
    if (valueNodes.length < 8) { // Goalkeepers
        ignoredTalents = IgnoredTalentsGoalKeepers
        skillIndexArray = skillIndexGoalkeepers
    }
    let modifications = new Array(valueNodes.length).fill(0)
    let tooltips = new Array(valueNodes.length).fill("If you plan on changing the form you will have to reload the page to get the correct numbers.")
    for (const specialTalent of specialTalents) {
        const affectedSkills = specialTalentsUtils.SpecialTalentsDefinitions[specialTalent]
        if (!affectedSkills || IgnoredTalentsOutfielders.includes(specialTalent)) continue // for skills like tough there are no skills affected
        // console.info("talent", specialTalent, "affectedSkills", affectedSkills)
        for (const [skill, value] of Object.entries(affectedSkills)) {
            const index = skillIndexArray[skill]
            if (index === undefined) continue
            modifications[index] += value
            tooltips[index] += "\n+" + value + " from " + specialTalent
        }
    }
    // console.info("modifications", modifications)
    for (let index = 0; index < modifications.length; index++) {
        const modification = modifications[index]
        if (modification === 0) continue

        if (add && !valueNodes[index].classList.contains(stClass)) {
            const currentValue = parseNumber(valueNodes[index])
            const updatedValue = currentValue + modification
            const paddedValue = String(updatedValue).padStart(2, "0")
            console.debug("applying", currentValue, "->", updatedValue, valueNodes[index])
            const updatedText = valueNodes[index].textContent.replace(/\d+/, paddedValue)
            valueNodes[index].textContent = updatedText
            valueNodes[index].classList.add(stClass)

            let tooltipNode = valueNodes[index].parentNode.querySelector(`span.${stTooltipClass}`)
            if (!tooltipNode) {
                tooltipNode = document.createElement("span")
                tooltipNode.classList.add(stTooltipClass)
                tooltipNode.textContent = "\uf29c"
                tooltipNode.title = tooltips[index]
                valueNodes[index].after(tooltipNode)
            }

            const denomination = utils.denomination(updatedValue)
            const denomClass = "denom" + denomination
            // Find the class that starts with "denom"
            const currentDenomClass = Array.from(valueNodes[index].classList).find(cls => cls.startsWith("denom"))
            if (currentDenomClass) {
                valueNodes[index].classList.remove(currentDenomClass) // remove old denomX
                valueNodes[index].classList.add(denomClass) // add new denomX
            }
        }
        if (!add && valueNodes[index].classList.contains(stClass)) {
            const currentValue = parseNumber(valueNodes[index])
            const updatedValue = currentValue - modification
            const paddedValue = String(updatedValue).padStart(2, "0")
            console.debug("removing", currentValue, "->", updatedValue, valueNodes[index])
            const updatedText = valueNodes[index].textContent.replace(/\d+/, paddedValue)
            valueNodes[index].textContent = updatedText
            valueNodes[index].classList.remove(stClass)

            const denomination = utils.denomination(updatedValue)
            const denomClass = "denom" + denomination
            /// Find the class that starts with "denom"
            const currentDenomClass = Array.from(valueNodes[index].classList).find(cls => cls.startsWith("denom"))
            if (currentDenomClass) {
                valueNodes[index].classList.remove(currentDenomClass) // remove old denomX
                valueNodes[index].classList.add(denomClass) // add new denomX
            }
        }
    }
}