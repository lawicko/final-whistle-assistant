import * as playerUtils from "./player+utils.js"
import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"

export async function processPlayerReports(currentPlayerRepresentationInStorage) {
    console.info(`⏳ ${utils.version} Processing player reports tab...`)
    const reportsContainer = document.querySelector('fw-player-detail-report')
    if (!reportsContainer) {
        console.info(`Did not find reports container, skipping...`)
        return
    }
    const reportElements = reportsContainer.querySelectorAll('div.card:has(div.card-header')
    if (reportElements.length) {
        console.debug(`report elements`, reportElements)
        const reports = new Map()
        for (const reportElement of [...reportElements]) {
            const rows = reportElement.querySelectorAll(`${uiUtils.playerReportTableQuery} tr:has(td)`)
            const accuracyLabelCell = Array.from(rows)
                .map(tr => Array.from(tr.querySelectorAll("td"))
                    .find(td => td.textContent.trim() === "Report Accuracy")
                )
                .find(td => td !== undefined)
            const accuracyValueCell = accuracyLabelCell.nextElementSibling
            const reportAccuracy = parseFloat(accuracyValueCell.textContent.trim())
            reports.set(reportAccuracy, reportElement)
        }

        // Sort by key
        const sortedEntries = [...reports.entries()].sort(([a], [b]) => b - a)
        const bestReport = sortedEntries[0]
        const bestReportElement = bestReport[1]
        console.debug("bestReportElement", bestReportElement)
        let parsedScoutReport = playerUtils.parseScoutReport(bestReportElement)
        console.info("Parsed scout report:", parsedScoutReport)

        const newPlayerRepresentationInStorage = utils.mergeObjects(currentPlayerRepresentationInStorage, parsedScoutReport)
        return newPlayerRepresentationInStorage
    } else {
        return currentPlayerRepresentationInStorage
    }
}