import { processPlayedMatches } from '../../match_data_gathering_indicators.js'

export async function processLeaguePage() {
    console.info("⚽📊 Processing league page")

    if (isShowingOverviewLastRound() || isShowingFixtures()) {
        const playedMatchesContainers = document.querySelectorAll("table.table-fw tr:has(td a i.fa-file-text-o)")
        console.debug("playedMatchesContainers", playedMatchesContainers)
        if (playedMatchesContainers.length > 0) {
            await processPlayedMatches(playedMatchesContainers, {
                matchLinkContainerQuery: "td:has(a i.fa-file-text-o)",
                matchLinkElementQuery: "a",
                commentStart: `⚽ Processing matches in the league fixtures`,
                commentFinished: `🔴🟠🟡🟢 Processed matches in the league fixtures, missing data indicators added`
            })
        }
    }
}

function isShowingFixtures() {
    const activeTabs = document.querySelectorAll("ul.nav-tabs > li.nav-item > a.nav-link.active[aria-selected='true']")
    const fixturesSelected = [...activeTabs].filter(el => el.textContent.trim() === "Fixtures").length > 0
    return fixturesSelected
}

function isShowingOverviewLastRound() {
    const activeTabs = document.querySelectorAll("ul.nav-tabs > li.nav-item > a.nav-link.active[aria-selected='true']")
    const overviewSelected = [...activeTabs].filter(el => el.textContent.trim() === "Overview").length > 0
    if (!overviewSelected) return false

    const lastRoundSelected = [...activeTabs].filter(el => el.textContent.trim() === "Last Round").length > 0
    return lastRoundSelected
}