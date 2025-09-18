import { mergeObjects, storage, sumMinutes } from "../content-scripts/utils";

export async function checkDataIntegrity() {
    console.info("🗄️ Checking data integrity")
    const {
        "player-data": playersDataFromStorage = {},
        "matches": matches = {}
    } = await storage.get(["player-data", "matches"])

    let playersFromMatches = {}
    let matchesWithoutDates = []
    for (const [matchID, matchData] of Object.entries(matches)) {
        try {
            if (!matchData["date"]) matchesWithoutDates.push({ matchID, matchData} )
            const finishingLinups = matchData["finishingLineups"]
            if (!finishingLinups) continue
            const home = finishingLinups["home"]
            const away = finishingLinups["away"]
            let allPlayers = mergeObjects(home, away)
            for (const [playerID, playerFromLineup] of Object.entries(allPlayers)) {
                let p = playersFromMatches[playerID] || {}
                let minutes = p["minutes-played"] || {}
                minutes[matchID] = playerFromLineup["minutes"]
                p["minutes-played"] = minutes
                playersFromMatches[playerID] = p
            }
        } catch (e) {
            console.error(e.message)
            continue
        }
    }

    console.info("🔍 Checking matches without date property")
    if (matchesWithoutDates.length > 0) {
        console.warn(`🔍⚠️ Found matches without date property, best thing to do is to revisit the matches:`, matchesWithoutDates.map(m => `https://www.finalwhistle.org/en/match/${m.matchID}`))
    } else {
        console.info("🔍✅ All matches have date property")
    }

    console.debug("playersFromMatches:", playersFromMatches)
    const playersLength = Object.keys(playersFromMatches).length
    const playersDataFromStorageLength = Object.keys(playersDataFromStorage).length
    console.debug("playersLength", playersLength, "playersDataFromStorageLength", playersDataFromStorageLength)

    console.info("🔍 Checking for players in matches that are not in the local storage")
    let presentInBoth
    if (playersDataFromStorageLength > playersLength) {
        const missing = Object.keys(playersDataFromStorage).filter(key => !(key in playersFromMatches));
        presentInBoth = Object.keys(playersDataFromStorage).filter(key => (key in playersFromMatches));
        console.debug("Players in local storage that are not in any of the matches (visited organically):", missing)
        console.info("✅🔍 Passed check for players in matches that are not in the local storage, you have more players in local storage than in the matches, but this is perfectly fine if you visit player pages organically")
    } else if (playersLength > playersDataFromStorageLength) {
        const missing = Object.keys(playersFromMatches).filter(key => !(key in playersDataFromStorage));
        presentInBoth = Object.keys(playersFromMatches).filter(key => (key in playersDataFromStorage));
        console.info("Players from matches that are not in local storage:", missing)
        console.warn(`⚠️🔍 This doesn't make sense, match module always saves all players, data integrity error!`)
    } else {
        console.info("✅🔍 Passed check for players in matches that are not in the local storage")
    }

    console.info("🔍 Checking for players who have more minutes in matches than in local storage")
    let anomalies = []
    let minutesFromPreviousVersions = []
    for (const playerID of presentInBoth) {
        const minutesDictInStorage = playersDataFromStorage[playerID]["minutes-played"]
        const minutesSumFromStorage = sumMinutes(minutesDictInStorage)
        const minutesDictFromMatches = playersFromMatches[playerID]["minutes-played"]
        const minutesSumFromMatches = sumMinutes(minutesDictFromMatches)
        if (minutesSumFromMatches > minutesSumFromStorage) {
            console.warn(`⚠️ ${playersDataFromStorage[playerID]['name']} has more minutes in matches than in storage. This doesn't make sense, match module always saves all minutes played, data integrity error!`)
            anomalies.push({
                playerID: playerID,
                minutesSumFromStorage: minutesSumFromStorage,
                minutesSumFromMatches: minutesSumFromMatches,
                minutesDictFromMatches: minutesDictFromMatches
            })
        } else {
            minutesFromPreviousVersions.push({
                playerID: playerID,
                minutesSumFromStorage: minutesSumFromStorage,
                minutesSumFromMatches: minutesSumFromMatches
            })
        }
    }

    if (minutesFromPreviousVersions.length > 0) {
        console.debug("Some players have more minutes saved than what can be seen in the saved matches, but this is possible if the minutes were saved before match module started saving home and away teams")
        console.debug("Surplus minutes in player profiles: ",minutesFromPreviousVersions)
    } else {
        console.debug("Looks like all minutes in storage come from match browsing")
    }

    if (anomalies.length > 0) {
        console.warn(`⚠️🔍 Anomalies found, these players have more minutes in matches than in local storage`, anomalies)
    } else {
        console.info("✅🔍 There were no players who have more minutes in matches than in local storage")
    }

    // TODO: Check matches that have dates

    
    console.info("🗄️🏁 Data integrity test concluded")
}