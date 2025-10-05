import * as utils from './utils.js'
import * as uiUtils from './ui_utils.js'
import * as db from './db_access.js'

export async function processMatch() {
    console.info(`⏳ ${utils.version} Processing match ${utils.lastPathComponent(window.location.pathname)}`)
    const dateElement = document.querySelector('div.col-md-2:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
    const homeTeamElement = document.querySelector('div.col-lg-6:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    const awayTeamElement = document.querySelector('div.col-6:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    if (dateElement && dateElement.textContent && homeTeamElement && homeTeamElement.textContent && awayTeamElement && awayTeamElement.textContent) {
        console.info(`⚽ Processing match from`, dateElement.textContent.trim(), 'between', homeTeamElement.textContent.trim(), 'and', awayTeamElement.textContent.trim())
    } else {
        console.info(`📄 Match processing finished, page not loaded yet (can't find match date or home and away teams)`)
        return
    }

    const competitionSymbol = document.querySelector('div[touranchor="match.header"] div.card-body small > i.bi-trophy')
    const competitionNameTextValue = competitionSymbol.parentNode.nextElementSibling.textContent
    const competitionName = competitionNameTextValue.replace(/^[A-Za-z]\s*/, "").trim();
    const ignoredMatchTypesForPlayerCalculations = ["Friendly", "Quick match", "Custom competition"]
    if (ignoredMatchTypesForPlayerCalculations.includes(competitionName)) {
        console.info(`⏩ ${competitionName} processing, player minutes and injuries will be skipped`)
    }

    const matchID = utils.lastPathComponent(window.location.href)
    const matchDate = dateElement.textContent.trim()
    const homeTeamName = homeTeamElement.textContent.trim()
    const homeTeamID = utils.lastPathComponent(homeTeamElement.href)
    const awayTeamName = awayTeamElement.textContent.trim()
    const awayTeamID = utils.lastPathComponent(awayTeamElement.href)

    let matchData = {
        id: matchID,
        date: matchDate,
        competition: competitionName,
        homeTeamID: homeTeamID,
        homeTeamName: homeTeamName,
        awayTeamID: awayTeamID,
        awayTeamName: awayTeamName
    }
    const matchDataFromStorage = await db.getMatch(matchID)
    if (matchDataFromStorage) {
        matchData = utils.mergeObjects(matchDataFromStorage, matchData)
    }

    // Save the basic match data we have so far
    await db.putMatch(matchData)
    console.debug("Basic match data", matchData)
    console.info(`📅📥 Saved basic match data to storage`)

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
        matchData["tactics"] = tacticsData
        await db.putMatch(matchData)
        console.info(`📋📥 Saved tactics to storage`)
    }

    const startingLineupContainers = document.querySelectorAll('div.lineup-section div.starting-lineup')
    let startingSubstitutesContainers
    if (startingLineupContainers.length > 0) {
        const startingSubstitutesContainerHome = uiUtils.nextMatching(startingLineupContainers[0], 'div.lineup-section div.substitutes')
        const startingSubstitutesContainerAway = uiUtils.nextMatching(startingLineupContainers[1], 'div.lineup-section div.substitutes')
        startingSubstitutesContainers = [startingSubstitutesContainerHome, startingSubstitutesContainerAway]
    }
    const displaysStartingLineups = startingLineupContainers.length > 0

    const finishingLineupContainers = document.querySelectorAll('div.lineup-section div.finishing-lineup')
    let finishingSubstitutesContainers
    if (finishingLineupContainers.length > 0) {
        const finishingSubstitutesContainerHome = uiUtils.nextMatching(finishingLineupContainers[0], 'div.lineup-section div.substitutes')
        const finishingSubstitutesContainerAway = uiUtils.nextMatching(finishingLineupContainers[1], 'div.lineup-section div.substitutes')
        finishingSubstitutesContainers = [finishingSubstitutesContainerHome, finishingSubstitutesContainerAway]
    }
    const displaysFinishingLineups = finishingLineupContainers.length > 0

    if (!displaysStartingLineups && !displaysFinishingLineups) {
        console.info(`📄 Match processing finished, page not loaded yet (can't find lineups)`)
        return
    }

    if (displaysStartingLineups) {
        console.info(`🧍🧍🧍🧍 Processing starting lineups`);
        const startingLineups = await processLineups(
            startingLineupContainers,
            startingSubstitutesContainers
        )

        matchData["startingLineups"] = startingLineups
        await db.putMatch(matchData)
        console.info(`🧍🧍🧍📥 Saved the starting lineups to storage`)
    }

    if (displaysFinishingLineups) {
        console.info(`⚽🧍🧍🧍 Processing finishing lineups`);
        const finishingLineups = await processLineups(
            finishingLineupContainers,
            finishingSubstitutesContainers,
            true
        )

        matchData["finishingLineups"] = finishingLineups
        await db.putMatch(matchData)
        console.info(`⚽🧍🧍📥 Saved the finishing lineups to storage`)

        const matchPlayers = processMatchPlayers(matchData)
        await db.bulkPutMatchPlayers(matchPlayers)
        console.info(`⚽🧍🧍📥 Saved match players to storage`)

        if (ignoredMatchTypesForPlayerCalculations.includes(competitionName)) {
            console.info(`⏩ Skipping player minutes and injuries processing for ${competitionName}`)
        } else {
            await saveInjuriesAndMinutesPlayedForLineups(finishingLineups, new Date(matchDate))
        }
    }

    console.info(`✅ Match processing finished`)
}

function processMatchPlayers(matchData) {
    const rows = []
    function getMatchPlayer(matchId, teamId, opponentId, opponentName, player) {
        let mPlayer = {
            matchId: matchId,
            playerId: player.id,
            teamId: teamId,
            opponentId: opponentId,
            opponentName: opponentName,
            name: player.name,
            minutesPlayed: parseInt(player.minutes)
        }
        if (player.injury) mPlayer["injury"] = player.injury
        if (player.goals) mPlayer["goals"] = player.goals
        if (player.cards) mPlayer["cards"] = player.cards
        return mPlayer
    }

    for (const p of matchData.finishingLineups.home) {
        let mPlayer = getMatchPlayer(
            matchData.id,
            matchData.homeTeamID,
            matchData.awayTeamID,
            matchData.awayTeamName,
            p
        )
        mPlayer['date'] = matchData.date
        mPlayer['competition'] = matchData.competition
        rows.push(mPlayer)
    }
    for (const p of matchData.finishingLineups.away) {
        let mPlayer = getMatchPlayer(
            matchData.id,
            matchData.awayTeamID,
            matchData.homeTeamID,
            matchData.homeTeamName,
            p
        )
        mPlayer['date'] = matchData.date
        mPlayer['competition'] = matchData.competition
        rows.push(mPlayer)
    }

    return rows
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
    const lineup = []
    for (const player of players) {
        // console.info("processing player:", player)
        const position = player
            .querySelector(".badge-position")
            .textContent
            .trim()
        const playerName = player
            .querySelector("fw-player-hover div.hovercard a span")
            .textContent
            .trim()
        const playerID = utils.lastPathComponent(player.querySelector("fw-player-hover div.hovercard a").href)
        const playerData = { id: playerID, name: playerName, position: position }
        // console.info(`Found in ${isFinishingLineup ? 'finishing' : 'starting'} lineup:`, playerData)

        if (isFinishingLineup) {
            const statusStack = player.querySelector("div.player-status-stack")
            if (statusStack) {
                // Goals
                const goalCountElement = statusStack.querySelector("span.status-item > span.goal-count")
                if (goalCountElement) {
                    const goalCount = goalCountElement.textContent.trim()
                    playerData['goals'] = parseInt(goalCount)
                }

                // Cards
                const yellowCardElement = statusStack.querySelector("span.status-item > img.img-fluid.status-icon[src='assets/images/yellow.png']")
                if (yellowCardElement) {
                    playerData['cards'] = "🟨" // add 🟥 later when it's supported
                }

            }
            // Injuries
            const lightInjury = player.querySelector('i.bi-capsule')
            if (lightInjury) {
                playerData['injury'] = "light"
            }
            const severeInjury = player.querySelector('img[src="assets/images/injury.png"]')
            if (severeInjury) {
                playerData['injury'] = "severe"
            }

            // Minutes played
            let minutesPlayed = '90'
            const playerHoverElement = player.querySelector('fw-player-hover')
            let minutesElement = playerHoverElement.nextElementSibling
            if (minutesElement && (minutesElement.tagName.toLowerCase() === "div" || minutesElement.tagName.toLowerCase() === "sup")) {
                minutesPlayed = minutesElement.textContent.trim().replace(/\D/g, "")
            }

            playerData['minutes'] = minutesPlayed
            // console.info(`Added minutes played for`, playerData)
        }

        lineup.push(playerData)
        // console.info(`pushed player to the lineup`, playerData, `${lineup.length} so far`)
    }
    return lineup
}

async function saveInjuriesAndMinutesPlayedForLineups(lineups, date) {
    console.info(`🤕⏱️ Processing injuries and minutes played`)

    const allPlayers = [...lineups.home, ...lineups.away]
    const allPlayersKeys = allPlayers.map(p => p.id)
    let playersInStorage = await db.bulkGetPlayers(allPlayersKeys)
    if (playersInStorage) {
        playersInStorage = playersInStorage.filter(p => p != null)
    }
    let updatedPlayers = []
    // console.info("playersInStorage", playersInStorage)

    for (const player of allPlayers) {
        let playerData = { id: player.id }
        if (playersInStorage) {
            playerData = utils.mergeObjects(playerData, playersInStorage.find(p => p.id === player.id))
        }
        // console.info("playerFromStorage", playerData)
        let minutesDictionary = playerData["minutes-played"] || {}
        // console.info("minutesDictionary", minutesDictionary)

        const newEntry = { [utils.dateStorageFormat(date)]: player.minutes }
        minutesDictionary = utils.mergeObjects(minutesDictionary, newEntry)

        // DEBUGGING: Sort by converting keys into Date objects
        // const sortedEntries = Object.entries(minutesDictionary).sort(
        //     ([a], [b]) => new Date(a) - new Date(b)
        // );
        // console.info(`sortedEntries for ${player.name}:`, sortedEntries)

        playerData["minutes-played"] = minutesDictionary

        if (player.injury) {
            let injuriesArray = playerData["injuries"] || []

            // can't just push, because the match reports can be viewed in random order
            injuriesArray.push(utils.dateStorageFormat(date))
            const dates = injuriesArray.map(dateAsString => new Date(dateAsString))
            dates.sort((a, b) => b - a)
            const storageReady = dates.map(d => utils.dateStorageFormat(d))

            // removing unexpected things like nulls and repeated values
            const cleaned = [...new Set(storageReady.filter(x => x !== null))]

            playerData['injuries'] = cleaned
        }

        updatedPlayers.push(playerData)
    }

    await db.bulkPutPlayers(updatedPlayers)
    console.info(`📥 Saved injuries and minutes played to storage`)
}