import { storage, version, lastPathComponent } from './utils.js';
import { calculateDataGatheringProgressForMatch, createProgressDot } from './match_utils.js'

export async function processFixturesPage() {
    console.info(`${version} 📅 Processing fixtures page`);
    await processMatchIndicators()

    const playedMatchesContainers = document.querySelectorAll("table.table > tbody > tr.finished-match")
    console.debug("playedMatchesContainers", playedMatchesContainers)
    if (playedMatchesContainers.length > 0) {
        await processPlayedMatches(playedMatchesContainers)
    } else {
        console.info("Did not find any played matches, skipping")
    }
}

async function processPlayedMatches(playedMatchesContainers) {
    console.info(`⚽ Processing played matches`);

    const { matches = {} } = await storage.get("matches");

    try {
        for (const tr of playedMatchesContainers) {
            const lastTD = tr.querySelector("td:has(a i.fa-file-text-o")

            const existingIndicator = lastTD.querySelector("span.final-whistle-assistant-played-match-indicator")
            if (existingIndicator) {
                existingIndicator.remove()
            }

            const matchLinkElement = lastTD.querySelector("a")
            const matchID = lastPathComponent(matchLinkElement.href)

            const matchDataFromStorage = matches[matchID] ?? {};
            const progress = calculateDataGatheringProgressForMatch(matchDataFromStorage)
            const dotSpan = createProgressDot(progress)

            lastTD.appendChild(dotSpan)
        }
    } catch (e) {
        console.error(e.message)
    }
    console.info(`🔴🟠🟡🟢 Played matches processed, missing data indicators added`);
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
