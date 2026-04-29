import { storage, version, lastPathComponent } from './utils.js';
import { processPlayedMatches } from './match_data_gathering_indicators.js'
import { addYAndSLabelsForMatchBadges } from './y_and_s_labels_for_match_badges.js'
import { matchLinkQuery } from './ui_utils.js';

export async function processFixturesPage(tableQuery, logMessage=`${version} 📅 Processing fixtures page`) {
    console.info(logMessage);
    let tableNode = document.querySelector(tableQuery)
    if (tableNode == undefined || (tableNode.tBodies[0] && tableNode.tBodies[0].rows.length == 0)) {
        console.debug("Fixtures table not loaded yet, returning...")
        return
    }

    const tbody = tableNode.tBodies[0]
        await addYAndSLabelsForMatchBadges(tbody.rows, {
            youthNodeQuery: "span.fixture-squad-dot.bg-primary",
            seniorNodeQuery: "span.fixture-squad-dot.bg-success",
            commentStart: `${version} Processing match badges for 🇸enior and 🇾outh matches`,
            commentFinished: `${version} Match badges for 🇸enior and 🇾outh matches processed`
        })

    const playedMatchesContainers = tableNode.querySelectorAll("tbody > tr.finished-match")
    console.debug("playedMatchesContainers", playedMatchesContainers)
    if (playedMatchesContainers.length > 0) {
        await processPlayedMatches(playedMatchesContainers, {
            matchLinkContainerQuery: `td:has(a ${matchLinkQuery}`,
            matchLinkElementQuery: "a",
            commentStart: `⚽ Processing played matches`,
            commentFinished: `🔴🟠🟡🟢 Played matches processed, missing data indicators added`
        })
    } else {
        console.info("Did not find any played matches, skipping")
    }
}
