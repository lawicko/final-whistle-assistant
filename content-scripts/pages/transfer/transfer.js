import * as utils from "../../utils.js"
import { applySportsmanship, applyTeamwork } from "../../ui_utils.js"

export async function processTransferPage() {
    console.info("💸 Processing transfer page")
    const rows = document.querySelectorAll("table.table > tbody> tr")
    for (const row of [...rows]) {
        const playerID = utils.lastPathComponent(row.querySelector("fw-player-hover div.hovercard a").href)
        const playerName = row
            .querySelector('fw-player-hover div.hovercard a span')
            .textContent
            .trim()
        const { ['player-data']: playersDataFromStorage = {} } = await utils.storage.get('player-data')
        let loadedPlayerData = playersDataFromStorage[playerID]
        if (!loadedPlayerData) continue

        console.debug("We have a record on ", playerName, "(", playerID, "):", loadedPlayerData)
        const personalities = loadedPlayerData["personalities"]
        if (!personalities) continue
        
        const insertionPoint = row.querySelector("td:has(fw-player-hover)")
        const teamwork = personalities["teamwork"]
        if (teamwork) {
            applyTeamwork(insertionPoint, teamwork)
        }
        const sportsmanship = personalities["sportsmanship"]
        if (sportsmanship) {
            applySportsmanship(insertionPoint, sportsmanship)
        }
        // for (const [pName, pValue] of Object.entries(personalities)) {
        //     console.info(pName, pValue)
        // }
    }
}