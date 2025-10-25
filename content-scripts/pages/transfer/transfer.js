import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"
import * as db from "../../db_access.js"

export async function processTransferPage() {
    console.info(`💸 Processing transfer page`)
    let rows = document.querySelectorAll("table.table > tbody> tr") // main /transfer
    const fromBidsTab = document.querySelectorAll("fw-transfer-bids table.table > tr:has(fw-player-hover)")
    if (fromBidsTab.length > 0) {
        rows = [...rows, ...fromBidsTab]
    }
    const fromWatchlist = document.querySelectorAll("fw-transfer-watchlist table.table > tr:has(fw-player-hover)")
    if (fromWatchlist.length > 0) {
        rows = [...rows, ...fromWatchlist]
    }
    for (const row of [...rows]) {
        const playerID = listUtils.id(row)
        const playerName = row
            .querySelector('fw-player-hover div.hovercard a span')
            .textContent
            .trim()
        const ageFromListing = listUtils.age(row)

        // console.info(`Processing ${playerName} (${playerID})`)

        const loadedPlayerData = await db.getPlayer(playerID)
        if (!loadedPlayerData) continue

        console.debug("We have a record on ", playerName, "(", playerID, "):", loadedPlayerData)
        const personalities = loadedPlayerData["personalities"]
        if (!personalities) continue

        const insertionPoint = row.querySelector("td:has(fw-player-hover)")

        const hiddenSkills = loadedPlayerData["hiddenSkills"]
        if (window.location.href.endsWith('#Bids') && hiddenSkills) {
            // Custom binoculars
            const customBinocularsClass = `${utils.pluginNodeClass}CustomBinoculars`
            const existingBinoculars = insertionPoint.querySelector(`span.scouted`)
            if (!existingBinoculars) {
                const customBinoculars = getScoutedBinoculars(customBinocularsClass)
                insertionPoint.appendChild(customBinoculars)
            }
        }

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
        if (hiddenSkills) {
            listUtils.updateHiddenSkillsDetails({
                insertionPoint: insertionPoint,
                hiddenSkills: hiddenSkills,
                config: {
                    showAdvancedDevelopment: ageFromListing < 25,
                    showEstimatedPotential: ageFromListing < 21
                }
            })
        }
    }

    const footerElement = document.querySelector("fw-transfer-market > div.row:has(div > div.view-switch)")
    if (footerElement) {
        const resultsElement = footerElement.parentNode.querySelector("div:has(table.table)")
        footerElement.parentNode.insertBefore(footerElement, resultsElement)
    }
}

function getScoutedBinoculars(customClass) {
    const binoculars = document.createElement("span")
    binoculars.classList.add('scouted', 'ms-1', customClass)
    const iElement = document.createElement("i")
    iElement.classList.add("fa", "fa-binoculars")
    binoculars.appendChild(iElement)
    return binoculars
}

async function applyCustomColorsForTLDetails() {
    console.debug(`Applying custom colors for transfer list details...`);
    try {
        const colors = await db.getColors()
        if (!colors) return
        // Inject CSS rule so future elements are styled too
        utils.addCSS(`
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.very_good {
                color: ${colors.advancedDevelopmentVeryGood} !important;
            }
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.good {
                color: ${colors.advancedDevelopmentGood} !important;
            }
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.very_bad {
                color: ${colors.advancedDevelopmentVeryBad} !important;
            }
            .FinalWhistlePlugin_detailedPropertyContainer.FinalWhistlePluginAD .top.bad {
                color: ${colors.advancedDevelopmentBad} !important;
            }
        `, "final-whistle-custom-transfer-list-colors");
    } catch (err) {
        console.error("Failed to apply custom colors for tags:", err);
    }
}

applyCustomColorsForTLDetails()