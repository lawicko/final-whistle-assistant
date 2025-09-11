console.log(`loading match.js...`)

async function processMatch() {
    const dateElement = document.querySelector('div.col-md-2:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
    const homeTeamElement = document.querySelector('div.col-lg-6:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    const guestTeamElement = document.querySelector('div.col-6:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    if (dateElement && dateElement.textContent && homeTeamElement && homeTeamElement.textContent && guestTeamElement && guestTeamElement.textContent) {
        console.info('=============================== Processing match from', dateElement.textContent.trim(), 'between', homeTeamElement.textContent.trim(), 'and', guestTeamElement.textContent.trim(), '===============================')
    } else {
        console.info(`=============================== Match processing finished, page not loaded yet ===============================`);
        return
    }

    const competitionSymbol = document.querySelector('div[touranchor="match.header"] div.card-body small > i.bi-trophy')
    const competitionNameTextValue = competitionSymbol.parentNode.nextElementSibling.textContent
    const competitionName = competitionNameTextValue.replace(/^[A-Za-z]\s*/, "").trim();
    if (competitionName == "Friendly" || competitionName == "Quick match") {
        console.info(`=============================== Match processing finished, skipping the ${competitionName} ===============================`);
        return
    }

    const result = await storage.get('club')
    if (!result) {
        console.warn("Can't determine own club ID and name, please visit one of your players page first and then relaod this page.")
        return
    }
    const clubData = result['club']
    const clubID = clubData['id']
    const clubName = clubData['name']

    const allContainers = document.querySelectorAll('div.card-body.text-center')
    console.debug('allContainers: ', allContainers)
    const lineupContainers = Array.from(allContainers).filter(container => container.querySelector('h5 fw-flag a'))
    console.debug('lineupContainers: ', lineupContainers)
    const ownLineupContainer = Array.from(lineupContainers).filter(container => {
        const link = container.querySelector('h5 > a')
        const thisClubID = lastPathComponent(link.href)
        const thisClubName = link.textContent.trim()
        return thisClubID === clubID && thisClubName === clubName
    })[0]
    if (!ownLineupContainer) { // not our match, skip
        console.info(`=============================== Match processing finished, not our own match ===============================`);
        return
    }
    console.debug('ownLineupContainer: ', ownLineupContainer)
    const { matches = {} } = await storage.get("matches");
    const matchID = lastPathComponent(window.location.href)
    const matchData = matches[matchID] ?? {};

    const ownPlayers = ownLineupContainer.querySelectorAll('.d-flex.align-items-center.mb-2.ng-star-inserted')
    console.debug('ownPlayers: ', ownPlayers)

    const ownInitialLineup = {}
    for (const player of ownPlayers) {
        const initialPosition = player.querySelector("span.badge-position").textContent.trim()
        const playerName = player.querySelector("fw-player-hover div.hovercard a span").textContent.trim()
        const playerID = lastPathComponent(player.querySelector("fw-player-hover div.hovercard a").href)
        console.info("Found in own lineup:", initialPosition, playerName, `(${playerID})`);
        ownInitialLineup[playerID] = { name: playerName, initialPosition: initialPosition }
    }
    
    const initialLineups = matchData["initialLineups"] ?? {}
    initialLineups["own"] = ownInitialLineup

    matchData["initialLineups"] = initialLineups
    matches[matchID] = matchData
    await storage.set({ matches: matches })

    const playerDataFromStorage = await storage.get('player-data');
    var loadedPlayerData = playerDataFromStorage['player-data'] || {};
    console.debug('initial loadedPlayerData = ', loadedPlayerData)

    const foundInjuries = processInjuries(loadedPlayerData, ownPlayers, dateElement.textContent.trim())
    console.debug('after processInjuries loadedPlayerData = ', loadedPlayerData)

    const foundPlayingPlayers = processMinutesPlayed(loadedPlayerData, ownPlayers, dateElement.textContent.trim())
    console.debug('after processMinutes loadedPlayerData = ', loadedPlayerData)

    if (foundInjuries || foundPlayingPlayers) {
        const key = 'player-data';
        await storage.set({ [key]: loadedPlayerData })
        console.info(`=============================== Match processing finished, saved player data to storage ===============================`);
    } else {
        console.info(`=============================== Match processing finished, skipping the saving step as nothing interesting was found ===============================`);
    }
}

function processInjuries(loadedPlayerData, players, date) {
    // Filter only those that contain an <i> with class 'bi-capsule' (light injury) or an <img> with src equal to assets/images/injury.png (serious injury)
    const injuried = Array.from(players).filter(container =>
        container.querySelector('i.bi-capsule') || container.querySelector('img[src="assets/images/injury.png"]')
    );

    if (injuried.length == 0) {
        console.debug('Did not find any injuried players.')
        return false
    }
    console.info('Found these injuried players: ', injuried)
    var playerIDs = []
    for (const playerElement of injuried) {
        const link = playerElement.querySelector('fw-player-hover div.hovercard a');
        const href = link.href
        const playerID = lastPathComponent(href)
        playerIDs.push(playerID)
    }

    console.debug('before saveInjuriesToStorage: ', loadedPlayerData)
    saveInjuriesToStorage(loadedPlayerData, playerIDs, date)
    return true
}

function saveInjuriesToStorage(loadedPlayerData, playerIDs, date) {
    console.debug('saveInjuriesToStorage for playerIDs: ', playerIDs, ' date: ', date)
    console.debug('inside saveInjuriesToStorage: ', loadedPlayerData)

    for (const playerID of playerIDs) {
        var currentPlayerData = loadedPlayerData[playerID] || {};
        console.debug('currentPlayerData for playerID: ', playerID, ' is: ', currentPlayerData)
        var injuries = currentPlayerData['injuries'] || [];

        // can't just push, because the match reports can be viewed in random order
        injuries.push(date)
        const dates = injuries.map(s => new Date(s));
        dates.sort((a, b) => b - a);
        const storageReady = dates.map(d =>
            d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
        );

        // removing unexpected things like nulls and repeated values, only makes sense for development but doesn't hurt to leave it there for now
        const cleaned = [...new Set(storageReady.filter(x => x !== null))];
        console.debug('cleaned for playerID: ', playerID, 'is: ', cleaned)

        currentPlayerData['injuries'] = cleaned
        loadedPlayerData[playerID] = currentPlayerData
    }

    loadedPlayerData
}

function processMinutesPlayed(loadedPlayerData, players, date) {
    // Filter only those who played, use rating element for that
    const playing = Array.from(players).filter(container => container.querySelector('div.rating-badge'))

    if (playing.length == 0) {
        console.debug('Did not find any playing players, maybe the starting lineups are displayed?')
        return false
    }
    console.debug('Found these playing players: ', playing)

    var minutesPlayedDictionary = {}
    for (const playerElement of playing) {
        var minutesPlayed = '90'

        const playerHoverElement = playerElement.querySelector('fw-player-hover')
        let minutesElement = playerHoverElement.nextElementSibling
        if (minutesElement && (minutesElement.tagName.toLowerCase() === "div" || minutesElement.tagName.toLowerCase() === "sup")) {
            minutesPlayed = minutesElement.textContent.trim().replace(/\D/g, "")
        }

        const playerNameSpan = playerElement.querySelector('fw-player-hover div.hovercard a span')
        const playerName = playerNameSpan.textContent.trim()
        const link = playerElement.querySelector('fw-player-hover div.hovercard a');
        const href = link.href
        const playerID = lastPathComponent(href)

        console.debug(playerName, '(', playerID, ') played', minutesPlayed, 'minutes.')
        minutesPlayedDictionary[playerID] = { [date]: minutesPlayed }
    }

    saveMinutesPlayedToStorage(loadedPlayerData, minutesPlayedDictionary)
    return true
}

function saveMinutesPlayedToStorage(loadedPlayerData, minutesPlayed) {
    console.debug('saving minutesPlayed: ', minutesPlayed)

    for (const [key, value] of Object.entries(minutesPlayed)) {
        var currentPlayerData = loadedPlayerData[key] || {};
        console.debug('currentPlayerData for ', key, ' = ', currentPlayerData)

        var loadedMinutesPlayed = currentPlayerData['minutes-played'] || {};
        console.debug('loadedMinutesPlayed = ', loadedMinutesPlayed)
        const [minutesPlayedKey, minutesPlayedValue] = Object.entries(value)[0];
        console.debug('minutesPlayedKey: ', minutesPlayedKey, 'minutesPlayedValue: ', minutesPlayedValue)
        loadedMinutesPlayed[minutesPlayedKey] = minutesPlayedValue
        console.debug('updated loadedMinutesPlayed = ', loadedMinutesPlayed)

        currentPlayerData['minutes-played'] = loadedMinutesPlayed
        loadedPlayerData[key] = currentPlayerData
    }
    loadedPlayerData
}

// Options for the observer (which mutations to observe)
const matchObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const matchObservingCallback = (mutationList, observer) => {
    processMatch()
};

// Create an observer instance linked to the callback function
const matchObserver = new MutationObserver(matchObservingCallback);

browser.runtime.onMessage.addListener((message) => {
    console.debug(`runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    const url = message.url
    if (url) {
        if (message.url.includes("match/")) {
            // Start observing the target node for configured mutations
            matchObserver.observe(alwaysPresentNode, matchObservingConfig);
            console.debug(`Started the div.wrapper observation`)
        } else {
            matchObserver.disconnect()
            console.debug(`Skipped (or disconnected) the div.wrapper observation`)
        }
    }
})
