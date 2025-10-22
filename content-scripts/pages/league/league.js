import { processPlayedMatches } from '../../match_data_gathering_indicators.js'
import { pluginNodeClass } from '../../utils.js'
import * as db from '../../db_access.js'

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

    const leagueSelector = document.querySelector("fw-league > div.card > h5.card-header div.input-group > select.navigation-senior-select")
    if (leagueSelector) {
        const currentSelection = leagueSelector.value
        // console.info("Current league selection:", currentSelection)

        const leagueControlRow = document.querySelector("fw-league > div.card > div.card-body > div.row > div > div.d-flex")
        if (leagueControlRow) {
            let setLeagueButtonID = pluginNodeClass + "SetLeagueButton"
            if (!leagueControlRow.querySelector(`button#${setLeagueButtonID}`)) {
                const setLeagueButton = document.createElement("button")
                setLeagueButton.id = setLeagueButtonID
                setLeagueButton.textContent = "Set League Shortcut"
                setLeagueButton.addEventListener("click", async () => {
                    console.debug(`Will bind ${window.location.href} for ${currentSelection}`)
                    let shortcutsData = await db.getShortcuts() ?? {}
                    console.debug("Current shortcuts data:", shortcutsData)
                    shortcutsData["LEAGUE_" + currentSelection] = window.location.href
                    console.debug("Updated shortcuts data:", shortcutsData)
                    await db.putShortcuts(shortcutsData)
                })
                leagueControlRow.appendChild(setLeagueButton)
            }
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