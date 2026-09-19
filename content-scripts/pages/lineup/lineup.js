import * as utils from "../../utils.js"
import * as discovery from "./lineup+discovery.js"
import * as formationTab from "./lineup+formation.js"
import * as setPiecesTab from "./lineup+setPieces.js"
import * as playerOrdersTab from "./lineup+playerOrders.js"
import * as checkboxes from "../../shared/checkboxes.js"

export async function processLineupPage() {
    console.info(`${utils.version} ⚽ Processing lineup page...`)

    let checkboxesData = await checkboxes.getCheckboxesDataFromDB()
    checkboxesData = { "specialTalents": checkboxesData.specialTalents }
    const checkboxInsertionPointQuery = "h5.card-header"
    const checkboxInsertionPoint = document.querySelector(checkboxInsertionPointQuery)
    if (checkboxInsertionPoint) {
        checkboxes.insertCheckboxesForData(
            { node: checkboxInsertionPoint, method: "append" },
            { requestedCheckboxes: { specialTalents: true }, checkboxesDataFromStorage: checkboxesData },
            (cData) => { processActiveTab(cData) }
        )
    } else {
        console.warn("Could not find checkbox insertion point. Query:", checkboxInsertionPointQuery)
    }
    await processActiveTab(checkboxesData)
}

async function processActiveTab(checkboxesData) {
    if (discovery.hasActiveFormation()) {
        await formationTab.processFormationTab(checkboxesData)
    }
    if (discovery.hasActiveSetPieces()) {
        await setPiecesTab.processSetPiecesTab(checkboxesData)
    }
    if (discovery.hasActivePlayerOrders()) {
        await playerOrdersTab.processPlayerOrdersTab(checkboxesData)
    }
}