import * as utils from "../../utils.js"
import * as common from "./lineup+common.js"

export async function processPlayerOrdersTab() {
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
}