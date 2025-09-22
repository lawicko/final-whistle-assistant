import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"

export async function processTransferPage() {
    console.info("💸 Processing transfer page")
    const rows = document.querySelectorAll("table.table > tbody> tr")
    for (const row of [...rows]) {
        const playerID = utils.lastPathComponent(row.querySelector("fw-player-hover div.hovercard a").href)
        const playerName = row
            .querySelector('fw-player-hover div.hovercard a span')
            .textContent
            .trim()
        const ageFromListing = Number(row.querySelector("fw-player-age > span > span").textContent.trim())
        const { ['player-data']: playersDataFromStorage = {} } = await utils.storage.get('player-data')
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
        if (ageFromListing < 25 && hiddenSkills) {
            const normalizedEstimatedPotential = Number(hiddenSkills["estimatedPotential"])

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
}

async function applyCustomColorsForTLDetails() {
    console.info(`Applying custom colors for transfer list details...`);
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