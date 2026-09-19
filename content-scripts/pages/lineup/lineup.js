import * as utils from "../../utils.js"
import * as discovery from "./lineup+discovery.js"
import * as formationTab from "./lineup+formation.js"
import * as setPiecesTab from "./lineup+setPieces.js"
import * as playerOrdersTab from "./lineup+playerOrders.js"

export async function processLineupPage() {
    console.info(`${utils.version} ⚽ Processing lineup page...`)
    if (discovery.hasActiveFormation()) {
        await formationTab.processFormationTab()
    }
    if (discovery.hasActiveSetPieces()) {
        await setPiecesTab.processSetPiecesTab()
    }
    if (discovery.hasActivePlayerOrders()) {
        await playerOrdersTab.processPlayerOrdersTab()
    }
}