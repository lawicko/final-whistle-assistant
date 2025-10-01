import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"
import { addTableRowsHighlighting } from "../../row_highlight.js"
import { processTags } from "../../tags.js"
import * as db from "../../db_access.js"
import * as dbUtils from '../../db_utils.js'

export async function processTrainingPage() {
    console.info(`${utils.version} 🏋️ Processing training page`)
    const pattern = /training(?:#(.*))?/
    const match = window.location.href.match(pattern)

    let selectedTab = "Reports"
    if (match && match[1]) {
        selectedTab = match[1]
    }
    switch (selectedTab) {
        case "Reports":
            await tryTagsProcessing()
            await tryRowHighlighting()

            const checkboxesData = {
                advancedDevelopment: "true",
                estimatedPotential: "true"
            }
            await updateAdditionalInfo(checkboxesData)
            break
        case "Settings":
            await tryTagsProcessing()
            break
        case "Drills":
            await tryTagsProcessing()
            break
        default:
            console.warn("Unknown tab selected:", selectedTab)
    }
}

async function updateAdditionalInfo(checkboxesData) {
    console.info(`${utils.version} 📝 Updating additional info`)

    let rows = document.querySelectorAll("table > tbody > tr")
    for (const row of rows) {
        const playerID = listUtils.id(row)
        const loadedPlayerData = await db.getPlayer(playerID)
        listUtils.processTableRow(
            row,
            loadedPlayerData,
            checkboxesData,
            (row) => playerID,
            (row) => row.querySelector("td a span:not(.flag)").textContent.trim(),
            (row) => row.querySelector("td:has(fw-player-hover)")
        )
    }
}

async function tryTagsProcessing() {
    if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.TagsEnhancement)) {
        await processTags()
    }
}

async function tryRowHighlighting() {
    if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.RowHighlighting)) {
        await addTableRowsHighlighting({ basicHighlight: true, persistentHighlight: false })
    }
}