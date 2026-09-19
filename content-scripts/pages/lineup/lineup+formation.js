import * as utils from "../../utils.js"
import * as common from "./lineup+common.js"

export async function processFormationTab() {
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
}