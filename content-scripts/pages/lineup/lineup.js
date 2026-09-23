import * as checkboxesModule from "../../shared/checkboxes.js"
import * as discovery from "./lineup+discovery.js"
import * as formationTab from "./lineup+formation.js"
import * as playerOrdersTab from "./lineup+playerOrders.js"
import * as setPiecesTab from "./lineup+setPieces.js"
import * as utils from "../../utils.js"

export async function processLineupPage() {
    console.info(`${utils.version} ⚽ Processing lineup page...`)

    let checkboxesData = await checkboxesModule.getCheckboxesDataFromDB()
    checkboxesData = { "specialTalents": checkboxesData.specialTalents }
    const checkboxInsertionPointQuery = "h5.card-header"
    const checkboxInsertionPoint = document.querySelector(checkboxInsertionPointQuery)
    if (checkboxInsertionPoint) {
        checkboxesModule.insertCheckboxesForData(
            { node: checkboxInsertionPoint, method: "append" },
            { requestedCheckboxes: { specialTalents: true }, checkboxesDataFromStorage: checkboxesData },
            (cData, animate) => {
                processActiveTab(animate)
            }
        )
    } else {
        console.info("Could not find checkbox insertion point, likely the page is not fully loaded yet, will try again in the next pass")
    }
    await processActiveTab()
}

async function processActiveTab(animate = false) {
    if (discovery.hasActiveFormation()) {
        await formationTab.processFormationTab(animate)
    }
    if (discovery.hasActiveSetPieces()) {
        await setPiecesTab.processSetPiecesTab(animate)
    }
    if (discovery.hasActivePlayerOrders()) {
        await playerOrdersTab.processPlayerOrdersTab(animate)
    }
}