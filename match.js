const matchModulePrefix = "match"

console.log(`${matchModulePrefix}: match.js script loaded...`)

async function processMatch() {
    const dateElement = document.querySelector('div.col-md-2:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
    const homeTeamElement = document.querySelector('div.col-lg-6:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    const guestTeamElement = document.querySelector('div.col-6:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    if (dateElement && dateElement.textContent && homeTeamElement && homeTeamElement.textContent && guestTeamElement && guestTeamElement.textContent) {
        console.info('Processing match from', dateElement.textContent.trim(), 'between', homeTeamElement.textContent.trim(), 'and', guestTeamElement.textContent.trim())
    } else {
        return // page not yet loaded
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
    console.info('allContainers: ', allContainers)
    const lineupContainers = Array.from(allContainers).filter( container => container.querySelector('h5 fw-flag a') )
    console.info('lineupContainers: ', lineupContainers)
    const ownLineupContainer = Array.from(lineupContainers).filter( container => {
        const link = container.querySelector('h5 > a')
        const thisClubID = lastPathComponent(link.href)
        const thisClubName = link.textContent.trim()
        return thisClubID === clubID && thisClubName === clubName
    })[0]
    console.info('ownLineupContainer: ', ownLineupContainer)
    
    const allPlayers = ownLineupContainer.querySelectorAll('.d-flex.align-items-center.mb-2.ng-star-inserted')
    console.info('allPlayers: ', allPlayers)

    // Filter only those that contain an <i> with class 'bi-capsule' (light injury) or an <img> with src equal to assets/images/injury.png (serious injury)
    const filtered = Array.from(allPlayers).filter(container =>
        container.querySelector('i.bi-capsule') || container.querySelector('img[src="assets/images/injury.png"]')
    );
    console.info('filtered: ', filtered)

    if (filtered.length == 0) { return } // nothing to do here
    
    console.info("Injuried players: ", filtered);
    for (const playerElement of filtered) {
        const link = playerElement.querySelector('fw-player-hover div.hovercard a');
        const href = link.href
        const playerID = lastPathComponent(href)
        saveInjuriesToStorage(playerID, dateElement.textContent)
    }
}

async function saveInjuriesToStorage(playerID, data) {
    const playerDataFromStorage = await browser.storage.sync.get('player-data');
    var loadedPlayerData = playerDataFromStorage['player-data'] || {};
    console.debug('loadedPlayerData = ', loadedPlayerData)
    var currentPlayerData = loadedPlayerData[playerID] || {};
    console.debug('currentPlayerData = ', currentPlayerData)
    var injuries = currentPlayerData['injuries'] || [];
    
    // can't just push, because the match reports can be viewed in random order
    injuries.push(data)
    const dates = injuries.map(s => new Date(s));
    dates.sort((a, b) => a - b);
    const storageReady = dates.map(d =>
        d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    );
    
    // removing unexpected things like nulls and repeated values, only makes sense for development but doesn't hurt to leave it there for now
    const cleaned = [...new Set(storageReady.filter(x => x !== null))];
    
    currentPlayerData['injuries'] = cleaned
    loadedPlayerData[playerID] = currentPlayerData
    
    const key = 'player-data';
    await storage.set({ [key]: loadedPlayerData })
    console.debug(`Set data for playerID: ${playerID}`);
}

// Options for the observer (which mutations to observe)
const matchObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const matchObservingCallback = (mutationList, observer) => {
    processMatch()
};

// Create an observer instance linked to the callback function
const matchObserver = new MutationObserver(matchObservingCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${matchModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.includes("match/")) {
        // Start observing the target node for configured mutations
        matchObserver.observe(alwaysPresentNode, matchObservingConfig);
        console.debug(`${matchModulePrefix} Started the div.wrapper observation`)
    } else {
        matchObserver.disconnect()
        console.debug(`${matchModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})
