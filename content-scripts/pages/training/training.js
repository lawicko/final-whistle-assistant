import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"
import { addTableRowsHighlightingForTraining } from "../../row_highlight.js"
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

    let trainingFeed = document.querySelector("div.training-feed")
    if (!trainingFeed) { return } // site not loaded yet
    let rows = trainingFeed.querySelectorAll("article.training-feed-row")
    for (const row of rows) {
        const playerID = listUtils.id(row)
        const loadedPlayerData = await db.getPlayer(playerID)
        listUtils.processTableRow(
            row,
            loadedPlayerData,
            checkboxesData,
            (row) => playerID,
            (row) => row.querySelector("a span:not(.flag)").textContent.trim(),
            (row) => row.querySelector("div.training-feed-player")
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
        await addTableRowsHighlightingForTraining({ basicHighlight: true, persistentHighlight: false })
    }
}