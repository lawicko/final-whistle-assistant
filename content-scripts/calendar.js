import { storage, version, lastPathComponent } from './utils.js';
import { processPlayedMatches } from './match_data_gathering_indicators.js'

export async function processFixturesPage() {
    console.info(`${version} 📅 Processing fixtures page`);
    await processMatchIndicators()

    const playedMatchesContainers = document.querySelectorAll("table.table > tbody > tr.finished-match")
    console.debug("playedMatchesContainers", playedMatchesContainers)
    if (playedMatchesContainers.length > 0) {
        await processPlayedMatches(playedMatchesContainers, {
            matchLinkContainerQuery: "td:has(a i.fa-file-text-o",
            matchLinkElementQuery: "a",
            commentStart: `⚽ Processing played matches`,
            commentFinished: `🔴🟠🟡🟢 Played matches processed, missing data indicators added`
        })
    } else {
        console.info("Did not find any played matches, skipping")
    }
}

async function processMatchIndicators() {
    console.info(`Processing match indicators for 🇸enior and 🇾outh matches`);
    // 🆂🆈 fallback if the above renders bad on Mac or Chromium Windows

    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.tBodies[0] && tableNode.tBodies[0].rows.length > 1) {
        console.debug(`Found the following table for processing match indicators: `, tableNode)

        // This is for the future, when we will check for matches missing in storage
        const { matchesInStorage = {} } = await storage.get("matches");
        console.debug("matchesInStorage:", matchesInStorage)

        const tbody = tableNode.tBodies[0]; // first tbody
        Array.from(tbody.rows).forEach(row => {
            // Add Y and S to the badges on the left
            let targetNodesYouth = row.querySelectorAll("span.badge-youth");
            targetNodesYouth.forEach((element) => {
                element.textContent = "Y";
            });

            let targetNodesSenior = row.querySelectorAll("span.badge-senior");
            targetNodesSenior.forEach((element) => {
                element.textContent = "S";
            });
        });
    }
}
