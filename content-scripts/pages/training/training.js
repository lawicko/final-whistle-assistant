import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as listUtils from "../../list_utils.js"
import { addTableRowsHighlighting } from "../../row_highlight.js"
import { processTags } from "../../tags.js"

export async function processTrainingPage() {
    console.info(`${utils.version} 🏋️ Processing training page`)
    const pattern = /training(?:#(.*))?/
    const match = window.location.href.match(pattern)

    let selectedTab = "Reports"
    if (match) {
        selectedTab = match[1]
    }
    switch (selectedTab) {
        case "Reports":
            await tryTagsProcessing()
            await tryRowHighlighting()

            const result = await utils.storage.get(["player-data"])
            const checkboxesData = {
                advancedDevelopment: "true",
                estimatedPotential: "true"
            }
            const storedPlayerData = result["player-data"] || {}
            updateAdditionalInfo(storedPlayerData, checkboxesData)
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

function updateAdditionalInfo(storedPlayerData, checkboxesData) {
    console.info(`${utils.version} 📝 Updating additional info`)

    let rows = document.querySelectorAll("table > tbody > tr")
    for (const row of rows) {
        const playerID = listUtils.id(row)
        listUtils.processTableRow(
            row,
            storedPlayerData,
            checkboxesData,
            (row) => playerID,
            (row) => row.querySelector("td a span:not(.flag)").textContent.trim(),
            (row) => row.querySelector("td:has(fw-player-hover)")
        )
    }
}

async function tryTagsProcessing() {
    if (await utils.isFeatureEnabled(utils.FeatureFlagsKeys.TAGS_ENHANCEMENTS)) {
        await processTags()
    }
}

async function tryRowHighlighting() {
    if (await utils.isFeatureEnabled(utils.FeatureFlagsKeys.ROW_HIGHLIGHT)) {
        await addTableRowsHighlighting({ basicHighlight: true, persistentHighlight: false })
    }
}