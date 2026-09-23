import * as checkboxesModule from "../../shared/checkboxes.js"
import * as common from "./lineup+common.js"
import * as db from "../../db_access.js"
import * as discovery from "./lineup+discovery.js"
import * as listUtils from "../../list_utils.js"
import * as utils from "../../utils.js"

export async function processFormationTab(animate = false) {
    console.info(`${utils.version} ⚽♟️ Processing formation tab...`)
    // common.fixHeader({
    //     formationContainerSelector: "fw-formation div[touranchor='lineup.select']",
    //     oldHeaderSelector: "div.formation-skill-header",
    //     columnLabels: ["Name", "S", "A", "Pos", "R"],
    //     columnSizes: {
    //         "Name": 176,
    //         "S": 17,
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

    let checkboxesData = await checkboxesModule.getCheckboxesDataFromDB()
    const checkboxes = checkboxesData
    // Check if special talents will be applied
    const applySpecialTalents = checkboxes["specialTalents"] || false
    const rows = discovery.getAllPlayerSelects()
    const hrefs = discovery.getHrefList('div.squad-mobile-card-list')
    const playerIDs = hrefs.map(utils.lastPathComponent)
    const profiles = await db.bulkGetPlayers(playerIDs)
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
    }
}