import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"
import { addTableRowsHighlighting } from "../../row_highlight.js"
import { processFixturesPage } from "../../calendar.js"
import * as db from "../../db_access.js"

async function updateAdditionalInfo(checkboxesData) {
    console.info("updating additional info")
    let rows = document.querySelectorAll("table > tr");
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i]
        const playerID = utils.lastPathComponent(row.querySelector("td > a").href)
        const loadedPlayerData = await db.getPlayer(playerID)
        listUtils.processTableRow(
            row,
            loadedPlayerData,
            checkboxesData,
            (row) => playerID,
            (row) => row.querySelector("td > a").textContent.trim(),
            (row) => row.querySelector("td:has(a)")
        )
    }
}

export async function processOpponentClubPage() {
    let tableNode = document.querySelector("table.table")
    if (!tableNode) return
    if (tableNode.rows.length < 2) return

    console.info(`${utils.version} 🛡️ Processing opponent club page`)

    const controlCheckboxesInsertionPoint = document.querySelector("fw-club div.card-header > div.row")

    const pattern = /club\/\d+#(.+)/
    const match = window.location.href.match(pattern)
    if (!match) {
        console.warn(`Tried to extract the selected tab from the window.location.href (${window.location.href}) but failed, club page processing interrupted`)
        return
    }
    const selectedTab = match[1]
    console.info("selectedTab", selectedTab)
    switch (selectedTab) {
        case "Squad":
            await processSquadPage({
                controlCheckboxesInsertionPoint: controlCheckboxesInsertionPoint
            })
            if (await utils.isFeatureEnabled(utils.FeatureFlagsKeys.ROW_HIGHLIGHT)) {
                await addTableRowsHighlighting()
            }
            break
        case "Fixtures":
            await processFixturesPage(`🛡️📅 Processing opponent fixtures page`)
        // pay attention here, the switch automatically falls through in javascript
        default:
            listUtils.removeControlCheckboxes(controlCheckboxesInsertionPoint)
    }
}

async function processSquadPage(config) {
    console.info(`${utils.version} 🛡️🧍‍♂️🧍‍♂️🧍‍♂️ Processing opponent squad page`)
    const result = await utils.storage.get(["checkboxes"])
    const checkboxesDefault = {
        teamwork: "true",
        sportsmanship: "true",
        advancedDevelopment: "true",
        estimatedPotential: "true"
    }
    const checkboxesData = result["checkboxes"] || checkboxesDefault

    // preparation - col-md-8 adds width 66.6% and col-md-4 33.3% so they need to be modified to make space
    const headerLeft = document.querySelector("fw-club div.card-header > div.row > div.col-md-8")
    if (headerLeft) {
        headerLeft.classList.remove("col-md-8")
    }
    const headerRight = document.querySelector("fw-club div.card-header > div.row > div.col-md-4")
    if (headerRight) {
        headerRight.remove()
    }

    listUtils.addControlCheckboxes(
        config.controlCheckboxesInsertionPoint,
        checkboxesData,
        (cData) => { updateAdditionalInfo(cData) }
    )

    updateAdditionalInfo(checkboxesData)
}