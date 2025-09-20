import * as utils from "../content-scripts/utils"
import { calculateDataGatheringProgressForMatch, createProgressDot } from './match_utils.js'

/**
 * Adds match data indicators for a given page configuration
 * @param {Object} playedMatchesContainers a result of querySelectorAll for getting rows of a table
 * @param {Object} config the configuration to use
 * 
 * @example
 * const config = {
 *     matchLinkContainerQuery: "td:has(fw-club-hover)",
 *     matchLinkElementQuery: "span > a",
 *     commentStart: "⚽ Processing matches payed by the player",
 *     commentFinished: "🔴🟠🟡🟢 Matches payed by the player, missing data indicators added"
 * }
 */
export async function processPlayedMatches(playedMatchesContainers, config) {
    if (!playedMatchesContainers) {
        throw new Error(`processPlayedMatches was called with invalid playedMatchesContainers (empty)`)
    }

    if (!config) {
        throw new Error(`processPlayedMatches was called with invalid config (empty)`)
    }

    if (!config.matchLinkContainerQuery || !config.matchLinkElementQuery) {
        throw new Error(`processPlayedMatches was called with invalid config, query element(s) missing: ${JSON.stringify(config, null, 2)}`)
    }

    const commentStart = config.commentStart || "⚽ Processing matches"
    console.info(commentStart)

    const { matches = {} } = await utils.storage.get("matches")

    try {
        for (const tr of playedMatchesContainers) {
            const matchLinkContainer = tr.querySelector(config.matchLinkContainerQuery)

            const existingIndicator = matchLinkContainer.querySelector("span.final-whistle-assistant-played-match-indicator")
            if (existingIndicator) {
                existingIndicator.remove()
            }

            const matchLinkElement = matchLinkContainer.querySelector(config.matchLinkElementQuery)
            const matchID = utils.lastPathComponent(matchLinkElement.href)

            const matchDataFromStorage = matches[matchID] ?? {}
            const progress = calculateDataGatheringProgressForMatch(matchDataFromStorage)
            const dotSpan = createProgressDot(progress)

            matchLinkContainer.appendChild(dotSpan)
        }
        const commentFinished = config.commentFinished || "🔴🟠🟡🟢 Data indicators for matches added"
        console.info(commentFinished)
    } catch (e) {
        console.error(e.message)
    }
}