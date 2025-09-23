import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"

export async function processTransferPage() {
    console.info("💸 Processing transfer page")
    const rows = document.querySelectorAll("table.table > tbody> tr")
    const { ['player-data']: playersDataFromStorage = {} } = await utils.storage.get('player-data')
    for (const row of [...rows]) {
        const playerID = listUtils.id(row)
        const playerName = row
            .querySelector('fw-player-hover div.hovercard a span')
            .textContent
            .trim()
        const ageFromListing = listUtils.age(row)
        let loadedPlayerData = playersDataFromStorage[playerID]
        if (!loadedPlayerData) continue

        console.debug("We have a record on ", playerName, "(", playerID, "):", loadedPlayerData)
        const personalities = loadedPlayerData["personalities"]
        if (!personalities) continue

        const insertionPoint = row.querySelector("td:has(fw-player-hover)")
        const teamwork = personalities["teamwork"]
        if (teamwork) {
            uiUtils.applyTeamwork(insertionPoint, teamwork)
        }
        const sportsmanship = personalities["sportsmanship"]
        if (sportsmanship) {
            uiUtils.applySportsmanship(insertionPoint, sportsmanship)
        }
        const position = loadedPlayerData["position"]
        const composure = personalities["composure"]
        if (composure && position === uiUtils.PositionsKeys.FW) {
            uiUtils.applyComposure(insertionPoint, composure)
        }
        const arrogance = personalities["arrogance"]
        const DEFENSIVE_POSITIONS = [
            uiUtils.PositionsKeys.LB,
            uiUtils.PositionsKeys.LWB,
            uiUtils.PositionsKeys.CB,
            uiUtils.PositionsKeys.RB,
            uiUtils.PositionsKeys.RWB
        ]
        // Only negative arrogance is important here
        if (arrogance && arrogance < 0 && DEFENSIVE_POSITIONS.includes(position)) {
            uiUtils.applyArrogance(insertionPoint, arrogance)
        }

        // Hidden skills
        const hiddenSkills = loadedPlayerData["hiddenSkills"]
        if (hiddenSkills) {
            listUtils.addHiddenSkillsDetails({
                insertionPoint: insertionPoint,
                hiddenSkills: hiddenSkills,
                config: {
                    showAdvancedDevelopment: ageFromListing < 25,
                    showEstimatedPotential: ageFromListing < 21
                }
            })
        }
    }
}

async function applyCustomColorsForTLDetails() {
    console.debug(`Applying custom colors for transfer list details...`);
    try {
        // Load colors from storage (with defaults)
        const { colors = {} } = await utils.optionsStorage.get("colors");
        console.log("good", colors["color-setting-advanced-development-good"])

        // Inject CSS rule so future elements are styled too
        utils.addCSS(`
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.very_good {
                color: ${colors["color-setting-advanced-development-very-good"]} !important;
            }
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.good {
                color: ${colors["color-setting-advanced-development-good"]} !important;
            }
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.very_bad {
                color: ${colors["color-setting-advanced-development-very-bad"]} !important;
            }
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.bad {
                color: ${colors["color-setting-advanced-development-bad"]} !important;
            }
        `, "final-whistle-custom-transfer-list-colors");
    } catch (err) {
        console.error("Failed to apply custom colors for tags:", err);
    }
}

// Run the function
applyCustomColorsForTLDetails()