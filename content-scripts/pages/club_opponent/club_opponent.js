import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"
import { addTableRowsHighlighting } from "../../row_highlight.js"
import { processFixturesPage } from "../../calendar.js"
import { getCheckboxesDataFromDB, insertCheckboxesForData, removeCheckboxes } from "../../shared/checkboxes.js"
import * as db from "../../db_access.js"
import * as dbUtils from '../../db_utils.js'

async function updateAdditionalInfo(checkboxesData) {
    console.info(`${utils.version} Updating additional info`)
    let rows = document.querySelectorAll("table > tbody > tr");
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const playerID = utils.lastPathComponent(row.querySelector("td > div.squad-player-name-row > a").href)
        const loadedPlayerData = await db.getPlayer(playerID)
        listUtils.processTableRow(
            row,
            loadedPlayerData,
            checkboxesData,
            (row) => playerID,
            (row) => row.querySelector("td > div.squad-player-name-row > a").textContent.trim(),
            (row) => row.querySelector(uiUtils.playerStatusQuery)
        )
    }
}

export async function processOpponentClubPage() {
    console.info(`${utils.version} 🛡️ Processing opponent club page`)

    const controlCheckboxesInsertionPoint = document.querySelector(uiUtils.navTabsQuery)

    const pattern = /club\/\d+#(.+)/
    const match = window.location.href.match(pattern)
    if (!match) {
        console.warn(`Tried to extract the selected tab from the window.location.href (${window.location.href}) but failed, club page processing interrupted`)
        return
    }
    const selectedTab = match[1]
    console.info(`${utils.version} selectedTab: ${selectedTab}`)
    switch (selectedTab) {
        case "Squad":
            let tableNode = document.querySelector(uiUtils.opponentSquadTableQuery)
            if (!tableNode) {
                console.debug(`Opponent squad table (${uiUtils.opponentSquadTableQuery}) not loaded yet, returning...`)
                return
            }
            if (tableNode.rows.length < 2) {
                console.debug(`Opponent squad table (${uiUtils.opponentSquadTableQuery}) content not loaded yet (rows.length<2), returning...`)
                return
            }
            await processSquadPage({
                controlCheckboxesInsertionPoint: controlCheckboxesInsertionPoint
            })
            if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.RowHighlighting)) {
                await addTableRowsHighlighting()
            }
            break
        case "Fixtures":
            await processFixturesPage(uiUtils.opponentFixturesTableQuery, `${utils.version} 🛡️📅 Processing opponent fixtures page`)
        // pay attention here, the switch automatically falls through in javascript
        default:
            if (controlCheckboxesInsertionPoint) {
                removeCheckboxes(controlCheckboxesInsertionPoint)
            }
    }
}

async function processSquadPage(config) {
    console.info(`${utils.version} 🛡️🧍‍♂️🧍‍♂️🧍‍♂️ Processing opponent squad page`)
    const checkboxesData = await getCheckboxesDataFromDB()
    // preparation - col-md-8 adds width 66.6% and col-md-4 33.3% so they need to be modified to make space
    const headerLeft = document.querySelector("fw-club div.card-header > div.row > div.col-md-8")
    if (headerLeft) {
        headerLeft.classList.remove("col-md-8")
    }
    const headerRight = document.querySelector("fw-club div.card-header > div.row > div.col-md-4")
    if (headerRight) {
        headerRight.remove()
    }

    insertCheckboxesForData(
        { node: config.controlCheckboxesInsertionPoint, method: "default" },
        checkboxesData,
        (cData) => { updateAdditionalInfo(cData) }
    )

    updateAdditionalInfo(checkboxesData)
}