import { storage, version, lastPathComponent } from './utils.js';
import { processPlayedMatches } from './match_data_gathering_indicators.js'
import { addYAndSLabelsForMatchBadges } from './y_and_s_labels_for_match_badges.js'

export async function processFixturesPage() {
    console.info(`${version} 📅 Processing fixtures page`);
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.tBodies[0] && tableNode.tBodies[0].rows.length > 1) {
        const tbody = tableNode.tBodies[0]
        await addYAndSLabelsForMatchBadges(tbody.rows, {
            youthNodeQuery: "span.badge-youth",
            seniorNodeQuery: "span.badge-senior",
            commentStart: "Processing match badges for 🇸enior and 🇾outh matches",
            commentFinished: "Match badges for 🇸enior and 🇾outh matches processed"
        })
    }

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
