import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"

export async function processPlayerTraining() {
    console.info(`⏳ ${utils.version} Processing player training tab...`)

    const playerTrainingTable = document.querySelector(uiUtils.playerTrainingTableQuery)
    if (!playerTrainingTable) {
        console.debug("Player training table not found, skipping...")
        return
    }

    const potentialRiseIndicators = playerTrainingTable.querySelectorAll(`tbody > tr > td > span.text-info`)
    const potentialRiseAdditionalClass = utils.pluginNodeClass + "PotentialRiseAdditionalClass"
    for (const indicator of potentialRiseIndicators) {
        indicator.classList.add(potentialRiseAdditionalClass)
    }
}