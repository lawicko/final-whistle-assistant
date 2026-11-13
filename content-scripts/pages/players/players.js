import * as discovery from "./players+discovery.js"
import * as utils from "../../utils.js"

export async function processPlayersPage() {
    console.info("processPlayersPage entered")
    console.info(`${utils.version} 🧍🧍🧍🧍 Processing players page`)

    if (discovery.isPageReadyForProcessing()) {
        console.info("Ready for processing")
    } else {
        console.info("Not ready, skipping...")
    }

    console.info("processPlayersPage finished")
}