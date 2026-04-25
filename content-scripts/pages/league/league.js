import { processPlayedMatches } from '../../match_data_gathering_indicators.js'
import { pluginNodeClass, version } from '../../utils.js'
import { matchLinkQuery, navTabsQuery } from '../../ui_utils.js'
import * as db from '../../db_access.js'

export async function processLeaguePage() {
    console.info(`${version} ⚽📊 Processing league page`)

    if (isShowingOverviewLastRound() || isShowingFixtures()) {
        const playedMatchesContainers = document.querySelectorAll(`table.league-round-table--results tr:has(td a ${matchLinkQuery})`)
        console.debug("playedMatchesContainers", playedMatchesContainers)
        if (playedMatchesContainers.length > 0) {
            await processPlayedMatches(playedMatchesContainers, {
                matchLinkContainerQuery: `td:has(a ${matchLinkQuery})`,
                matchLinkElementQuery: "a",
                commentStart: `⚽ Processing matches in the league fixtures`,
                commentFinished: `🔴🟠🟡🟢 Processed matches in the league fixtures, missing data indicators added`
            })
        }
    }

    const leagueSelector = document.querySelector("div.league-header-selects select[name='leagueTypeHeader']")
    if (leagueSelector) {
        const currentSelection = leagueSelector.value
        // console.info("Current league selection:", currentSelection)

        const leagueControlRow = document.querySelector("h5.league-header > div")
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
                    console.info("Saving shortcuts:", shortcutsData)
                    await db.putShortcuts(shortcutsData)
                })
                leagueControlRow.appendChild(setLeagueButton)
            }
        }
    }
}

function isShowingFixtures() {
    const activeTabs = document.querySelectorAll(`${navTabsQuery} > li.nav-item > a.nav-link.active[aria-selected='true']`)
    const fixturesSelected = [...activeTabs].filter(el => el.textContent.trim() === "Fixtures").length > 0
    return fixturesSelected
}

function isShowingOverviewLastRound() {
    const activeTabs = document.querySelectorAll(`${navTabsQuery} > li.nav-item > a.nav-link.active[aria-selected='true']`)
    const overviewSelected = [...activeTabs].filter(el => el.textContent.trim() === "Overview").length > 0
    if (!overviewSelected) return false

    const lastRoundSelected = [...activeTabs].filter(el => el.textContent.trim() === "Last Round").length > 0
    return lastRoundSelected
}