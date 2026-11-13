import * as checkboxesModule from "../../shared/checkboxes.js"
import * as common from "./lineup+common.js"
import * as db from "../../db_access.js"
import * as discovery from "./lineup+discovery.js"
import * as listUtils from "../../list_utils.js"
import * as ui from "../../ui_utils.js"
import * as utils from "../../utils.js"

let skipPlayerOrdersTabUpdate = false

export async function processPlayerOrdersTab(animate = false) {
    if (skipPlayerOrdersTabUpdate) {
        console.info(`${utils.version} ⚽♟️ Skipping player orders tab update (skipPlayerOrdersTabUpdate set to true)`)
        return
    }
    console.info(`${utils.version} ⚽♟️ Processing player orders tab...`)
    // common.fixHeader({
    //     formationContainerSelector: "fw-player-orders > div.row > div.col-md-12 > div.squad-mobile-card-list",
    //     oldHeaderSelector: "div.formation-skill-header",
    //     columnLabels: ["Name", " ", "A", "Pos", "R"],
    //     columnSizes: {
    //         "Name": 176,
    //         " ": 24,
    //         "A": 22,
    //         "Pos": 38,
    //         "R": 20,
    //         "SC": 32,
    //         "OP": 33,
    //         "BC": 33,
    //         "PA": 33,
    //         "AE": 33,
    //         "TA": 33,
    //         "DP": 33
    //     }
    // })
    common.updateFormIndicators()

    const formationListToolbar = document.querySelector(`.formation-list-toolbar`)
    if (formationListToolbar && !formationListToolbar.querySelector(`#${discovery.arroganceTresholdImputID}`)) {
        await common.insertArroganceTresholdInput(formationListToolbar, () => {
            skipPlayerOrdersTabUpdate = true
            document.startViewTransition(async () => {
                await updatePage()
                setTimeout(() => {
                    skipPlayerOrdersTabUpdate = false
                }, utils.DEBOUNCE_WAIT_MS_LATER)
            })
        })
    }

    await updatePage(animate)
}

async function updatePage(animate) {
    let checkboxesData = await checkboxesModule.getCheckboxesDataFromDB()
    const checkboxes = checkboxesData
    // Check if special talents will be applied
    const applySpecialTalents = checkboxes["specialTalents"] || false
    const rows = discovery.getAllPlayerOrdersRows()
    const hrefs = discovery.getHrefList('div.squad-mobile-card-list')
    const playerIDs = hrefs.map(utils.lastPathComponent)
    const profiles = await db.bulkGetPlayers(playerIDs)
    const tresholds = await db.getTresholds()
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const profile = profiles[i]
        // Apply special talents if needed
        if (profile['specialTalents']) {
            let valueNodes = row.querySelectorAll("fw-player-skill > span > span:first-child")
            const specialTalents = profile["specialTalents"]
            if (specialTalents) {
                listUtils.updateSkillNodesWithSpecialTalents(specialTalents, valueNodes, applySpecialTalents, animate)
            }
        }

        // Apply personality traits indicators
        var personalityDestinationContainer = row.querySelector("div.p-name")
        var personalities = profile['personalities']
        if (!personalities) {
            console.debug(`No personalities in player profile for ${name}, skipping...`)

            ui.addNoDataSymbol(personalityDestinationContainer)

            continue
        } else {
            ui.removeNoDataSymbol(personalityDestinationContainer)
        }

        const leadership = personalities['leadership']
        const composure = personalities['composure']
        const arrogance = personalities['arrogance']
        const sportsmanship = personalities['sportsmanship']
        if (leadership) {
            ui.applyLeadership(personalityDestinationContainer, leadership)
        }
        if (sportsmanship) {
            ui.applySportsmanship(personalityDestinationContainer, sportsmanship)
        }

        // Check if the player is in the attack zone
        const isInAttackZone = discovery.isInAttackZone(row)
        // Also check midfielders because of the long shot option
        const isInMidfieldZone = discovery.isInMidfieldZone(row)
        const isInDefenceZone = discovery.isInDefenceZone(row)
        const isSub = discovery.isSub(row)

        if (discovery.isOutfielder(row)) {
            const reasonableSkills = discovery.isReasonableSkill(row, tresholds)

            const shouldApplyComposure = common.shouldApplyComposure(isInAttackZone, isInMidfieldZone, isSub, reasonableSkills.penaltyKick)
            if (composure && shouldApplyComposure) {
                ui.applyComposure(personalityDestinationContainer, composure)
            }

            const shouldApplyArrogance = common.shouldApplyArrogance(isInDefenceZone, isSub, reasonableSkills.DP)
            if (arrogance && arrogance < 0 && shouldApplyArrogance) {
                ui.applyArrogance(personalityDestinationContainer, arrogance)
            } else {
                ui.removeArrogance(personalityDestinationContainer)
            }
        }
    }
}