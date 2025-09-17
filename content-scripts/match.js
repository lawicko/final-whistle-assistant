import { storage, lastPathComponent, version, mergeObjects, dateStorageFormat } from './utils.js';

export async function processMatch() {
    console.info(`⏳ ${version} Processing match ${lastPathComponent(window.location.pathname)}`)
    const dateElement = document.querySelector('div.col-md-2:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
    const homeTeamElement = document.querySelector('div.col-lg-6:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    const awayTeamElement = document.querySelector('div.col-6:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    if (dateElement && dateElement.textContent && homeTeamElement && homeTeamElement.textContent && awayTeamElement && awayTeamElement.textContent) {
        console.info(`⚽ Processing match from`, dateElement.textContent.trim(), 'between', homeTeamElement.textContent.trim(), 'and', awayTeamElement.textContent.trim())
    } else {
        console.info(`📄 Match processing finished, page not loaded yet (can't find match date or home and away teams)`);
        return
    }

    const competitionSymbol = document.querySelector('div[touranchor="match.header"] div.card-body small > i.bi-trophy')
    const competitionNameTextValue = competitionSymbol.parentNode.nextElementSibling.textContent
    const competitionName = competitionNameTextValue.replace(/^[A-Za-z]\s*/, "").trim();
    if (competitionName == "Friendly" || competitionName == "Quick match") {
        console.info(`⏩ Match processing finished, skipping the ${competitionName}`);
        return
    }

    const { matches = {} } = await storage.get("matches");
    const matchID = lastPathComponent(window.location.href)
    const matchDataFromStorage = matches[matchID] ?? {};

    const teamMentalityContainer = document.querySelector("div.justify-content-between:has(div.tactics-label i.bi-lightning-charge-fill")
    const styleOfPlayContainer = document.querySelector("div.justify-content-between:has(div.tactics-label i.bi-diagram-3-fill")
    const markingContainer = document.querySelector("div.justify-content-between:has(div.tactics-label i.bi-shield-fill)")
    const defenceFocusContainer = document.querySelector("div.justify-content-between:has(div.tactics-label i.bi-bullseye)")
    const preferredSideContainer = document.querySelector("div.justify-content-between:has(div.tactics-label i.bi-arrow-left-right)")
    if (
        !teamMentalityContainer ||
        !styleOfPlayContainer ||
        !markingContainer ||
        !defenceFocusContainer ||
        !preferredSideContainer
    ) {
        console.info(`📄 Match processing finished, page not loaded yet (can't find tactics)`);
        return
    } else {
        console.info(`📋 Processing tactics`)
        const tacticsData = await processTactics([
            teamMentalityContainer,
            styleOfPlayContainer,
            markingContainer,
            defenceFocusContainer,
            preferredSideContainer
        ])
        console.debug("tacticsData", tacticsData)
        matchDataFromStorage["tactics"] = tacticsData
        matches[matchID] = matchDataFromStorage
        await storage.set({ matches: matches })
        console.info(`📋📥 Saved tactics to storage`)
    }

    const startingLineupContainers = document.querySelectorAll('div.lineup-section div.starting-lineup')
    const startingSubstituesContainers = document.querySelectorAll('div.lineup-section div.substitutes')
    const displaysStartingLineups = startingLineupContainers.length > 0
    const finishingLineupContainers = document.querySelectorAll('div.lineup-section div.finishing-lineup')
    const finishingSubstituesContainers = document.querySelectorAll('div.lineup-section div.substitutes')
    const displaysFinishingLineups = finishingLineupContainers.length > 0

    if (!displaysStartingLineups && !displaysFinishingLineups) {
        console.info(`📄 Match processing finished, page not loaded yet (can't find lineups)`);
        return
    }

    if (displaysStartingLineups) {
        console.info(`🧍🧍🧍🧍 Processing starting lineups`);
        const startingLineups = await processLineups(
            startingLineupContainers,
            startingSubstituesContainers
        )

        matchDataFromStorage["startingLineups"] = startingLineups
        matches[matchID] = matchDataFromStorage
        await storage.set({ matches: matches })
        console.info(`🧍🧍🧍📥 Saved the starting lineups to storage`)
    }

    if (displaysFinishingLineups) {
        console.info(`⚽🧍🧍🧍 Processing finishing lineups`);
        const finishingLineups = await processLineups(
            finishingLineupContainers,
            finishingSubstituesContainers,
            true
        )

        matchDataFromStorage["finishingLineups"] = finishingLineups
        matches[matchID] = matchDataFromStorage
        await storage.set({ matches: matches })
        console.info(`⚽🧍🧍📥 Saved the finishing lineups to storage`)

        await saveInjuriesAndMinutesPlayedForLineups(finishingLineups, new Date(dateElement.textContent.trim()))
    }

    console.info(`✅ Match processing finished`)
}

function formatTacticsLabel(label) {
    return label.trim().toLowerCase().replace(/\s+/g, "_")
}

async function processTactics(tacticsContainers) {
    let tacticsData = {}
    let tacticsHome = {}
    let tacticsAway = {}

    try {
        for (const container of tacticsContainers) {
            let label = container.querySelector("div.tactics-label > span")
            label = formatTacticsLabel(label.textContent)

            let homeValue = container.querySelector("div.text-end")
            homeValue = formatTacticsLabel(homeValue.textContent)

            let awayValue = container.querySelector("div.text-start")
            awayValue = formatTacticsLabel(awayValue.textContent)

            tacticsHome[label] = homeValue
            tacticsAway[label] = awayValue
        }
        tacticsData["home"] = tacticsHome
        tacticsData["away"] = tacticsAway
    } catch (e) {
        console.error(e.message)
    }

    return tacticsData
}

async function processLineups(lineups, substitutes, isFinishingLineup = false) {
    const lineupContainersArray = Array.from(lineups)
    console.debug('lineupContainersArray: ', lineupContainersArray)

    if (lineupContainersArray.length !== 2) {
        console.warn(`⚠️ Expected lineupContainersArray length 2 but got ${lineupContainersArray.length} instead`, lineupContainersArray)
        return
    }

    const homeLineupContainer = lineupContainersArray[0]
    const homeSubstitutesContainer = substitutes[0]
    const homeFirstEleven = homeLineupContainer.querySelectorAll('.d-flex.align-items-center.mb-2.ng-star-inserted')
    let homeSubstitutes
    if (homeSubstitutesContainer) {
        homeSubstitutes = homeSubstitutesContainer.querySelectorAll('.d-flex.align-items-center.mb-2.ng-star-inserted')
    }
    const homePlayers = [...homeFirstEleven, ...(homeSubstitutes ?? [])]
    console.debug('homePlayers: ', homePlayers)
    const homeLineup = await processIntoLineup(homePlayers, isFinishingLineup)

    const awayLineupContainer = lineupContainersArray[1]
    const awaySubstitutesContainer = substitutes[1]
    const awayFirstEleven = awayLineupContainer.querySelectorAll('.d-flex.align-items-center.mb-2.ng-star-inserted')
    let awaySubstitutes
    if (awaySubstitutesContainer) {
        awaySubstitutes = awaySubstitutesContainer.querySelectorAll('.d-flex.align-items-center.mb-2.ng-star-inserted')
    }
    const awayPlayers = [...awayFirstEleven, ...(awaySubstitutes ?? [])]
    console.debug('awayPlayers: ', awayPlayers)
    const awayLineup = await processIntoLineup(awayPlayers, isFinishingLineup)

    return { home: homeLineup, away: awayLineup }
}

async function processIntoLineup(players, isFinishingLineup) {
    const lineup = {}
    for (const player of players) {
        console.debug("processing player:", player)
        const position = player
            .querySelector(".badge-position")
            .textContent
            .trim()
        const playerName = player
            .querySelector("fw-player-hover div.hovercard a span")
            .textContent
            .trim()
        const playerID = lastPathComponent(player.querySelector("fw-player-hover div.hovercard a").href)
        console.debug("Found in lineup:", position, playerName, `(${playerID})`);
        lineup[playerID] = { name: playerName, position: position }

        if (isFinishingLineup) {
            // Injuries
            const lightInjury = player.querySelector('i.bi-capsule')
            if (lightInjury) {
                lineup[playerID] = mergeObjects(lineup[playerID], { injury: "light" })
            }
            const severeInjury = player.querySelector('img[src="assets/images/injury.png"]')
            if (severeInjury) {
                lineup[playerID] = mergeObjects(lineup[playerID], { injury: "severe" })
            }

            // Minutes played
            let minutesPlayed = '90'
            const playerHoverElement = player.querySelector('fw-player-hover')
            let minutesElement = playerHoverElement.nextElementSibling
            if (minutesElement && (minutesElement.tagName.toLowerCase() === "div" || minutesElement.tagName.toLowerCase() === "sup")) {
                minutesPlayed = minutesElement.textContent.trim().replace(/\D/g, "")
            }

            const playerNameSpan = player.querySelector('fw-player-hover div.hovercard a span')
            const playerName = playerNameSpan.textContent.trim()

            console.debug(playerName, '(', playerID, ') played', minutesPlayed, 'minutes.')
            lineup[playerID] = mergeObjects(lineup[playerID], { minutes: minutesPlayed })
        }
    }
    return lineup
}

async function saveInjuriesAndMinutesPlayedForLineups(lineups, date) {
    console.info(`🤕⏱️ Processing injuries and minutes played`)
    const { "player-data": playerDataFromStorage = {} } = await storage.get('player-data')

    const allPlayers = mergeObjects(lineups.home, lineups.away)
    for (const [playerID, player] of Object.entries(allPlayers)) {
        console.debug("player (", playerID, "):", player)
        let playerFromStorage = playerDataFromStorage[playerID] || {}
        let minutesDictionary = playerFromStorage["minutes-played"] || {}

        const newEntry = { [dateStorageFormat(date)]: player.minutes }
        minutesDictionary = mergeObjects(minutesDictionary, newEntry)

        // DEBUGGING: Sort by converting keys into Date objects
        // const sortedEntries = Object.entries(minutesDictionary).sort(
        //     ([a], [b]) => new Date(a) - new Date(b)
        // );
        // console.info(`sortedEntries for ${player.name}:`, sortedEntries)

        playerFromStorage["minutes-played"] = minutesDictionary

        if (player.injury) {
            let injuriesArray = playerFromStorage["injuries"] || []

            // can't just push, because the match reports can be viewed in random order
            injuriesArray.push(date)
            const dates = injuriesArray.map(dateAsString => new Date(dateAsString));
            dates.sort((a, b) => b - a);
            const storageReady = dates.map(d => dateStorageFormat(d));

            // removing unexpected things like nulls and repeated values, only makes sense for development but doesn't hurt to leave it there for now
            const cleaned = [...new Set(storageReady.filter(x => x !== null))];
            console.debug('cleaned for playerID: ', playerID, 'is: ', cleaned)

            playerFromStorage['injuries'] = cleaned
        }

        playerDataFromStorage[playerID] = playerFromStorage
    }

    await storage.set({ "player-data": playerDataFromStorage })
    console.info(`📥 Saved injuries and minutes played to storage`)
}