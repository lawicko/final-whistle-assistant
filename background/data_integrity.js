import * as utils from "../content-scripts/utils"

export async function checkDataIntegrityFor(playersDataFromStorage, matches, repair = false) {
    console.info("🗄️ Checking data integrity")

    const originalMatches = structuredClone(matches)
    let playersFromMatches = {}
    let matchesWithoutDates = []
    let matchesWithDates = []
    for (const [matchID, matchData] of Object.entries(matches)) {
        try {
            if (!matchData["date"]) {
                matchesWithoutDates.push({ matchID, matchData })
            } else {
                matchesWithDates.push({ matchID, matchData })
            }
            const finishingLinups = matchData["finishingLineups"]
            if (!finishingLinups) continue
            const home = finishingLinups["home"]
            const away = finishingLinups["away"]
            const keyToUse = matchData["date"] || matchID
            let allPlayers = utils.mergeObjects(home, away)
            for (const [playerID, playerFromLineup] of Object.entries(allPlayers)) {
                let p = playersFromMatches[playerID] || {}
                let minutes = p["minutes-played"] || {}
                minutes[keyToUse] = playerFromLineup["minutes"]
                p["minutes-played"] = minutes
                playersFromMatches[playerID] = p
            }
        } catch (e) {
            console.error(e.message)
            continue
        }
    }

    console.info("🔍 Checking empty matches object")
    try {
        if (utils.isEmpty(matches)) {
            console.warn("⚠️ Matches object from storage is empty")
        } else {
            console.info("✅ Matches object from storage valid")
        }
    } catch (e) {
        console.error(e.message)
    }

    console.info("🔍 Checking empty matches inside")
    try {
        const emptyMatches = Object.fromEntries(
            Object.entries(matches).filter(([key, value]) => utils.isEmpty(value))
        )
        if (Object.keys(emptyMatches).length > 0) {
            console.warn(`⚠️ Found empty {} matches:`, emptyMatches)
            if (repair) {
                console.info("🩹 Repairing: removing empty matches from matches")
                for (const matchID of Object.keys(emptyMatches)) {
                    console.info(`🩹 will remove ${matchID} from matches`)
                    delete matches[matchID]
                }
                console.info("✅ Done removing empty {} matches from matches")
            }
        } else {
            console.info("✅ Did not find any empty {} matches")
        }
    } catch (e) {
        console.error(e.message)
    }

    console.info("🔍 Checking matches with empty properties recursively { foo: { bar: {} } }")
    try {
        const matchesWithEmptyProps = Object.fromEntries(
            Object.entries(matches).filter(([key, matchData]) => utils.hasEmptyRecursive(matchData, ["string", "number"]))
        )
        const matchesWithEmptyPropsLength = Object.keys(matchesWithEmptyProps).length
        if (matchesWithEmptyPropsLength > 0) {
            console.warn(`⚠️ Found ${matchesWithEmptyPropsLength} matches with empty properties { foo: { bar: {} } }: ${JSON.stringify(matchesWithEmptyProps, null, 2)}`)
            if (repair) {
                console.info("🩹 Repairing: removing empty properties from matches recursively")
                const cleaned = utils.removeEmptyProps(matchesWithEmptyProps, ["string", "number"])
                if (Object.keys(cleaned).length > 0) {
                    console.info(`🩹 will replace ${Object.keys(cleaned).length} matches with empty props with the cleaned version of ${Object.keys(cleaned).length} matches ${JSON.stringify(cleaned, null, 2)}`)
                    for (const [matchID, cleanedData] of Object.entries(cleaned)) {
                        matches[matchID] = cleanedData
                        delete matchesWithEmptyProps[matchID]
                    }
                    console.info("✅ Replaced matches with empty props with the cleaned version (recursively)")
                }
                const newLength = Object.keys(matchesWithEmptyProps).length
                if (newLength > 0 || Object.keys(cleaned).length == 0) {
                    console.info(`🩹 will remove ${matchesWithEmptyPropsLength - Object.keys(cleaned).length} matches that only consist of nested empty objects: ${JSON.stringify(matchesWithEmptyProps, null, 2)}`)
                    for (const matchID of Object.keys(matchesWithEmptyProps)) {
                        delete matches[matchID]
                    }
                    console.info("✅ Removed matches that only consisted of nested empty objects")
                }
            }
        } else {
            console.info("✅ Did not find any matches with empty properties recursively")
        }
    } catch (e) {
        console.error(e.message)
    }

    console.info("🔍 Checking matches with empty properties { foo: {} }")
    try {
        const matchesWithEmptyProps = Object.fromEntries(
            Object.entries(matches).filter(([key, matchData]) => {
                const matchDataEntries = Object.entries(matchData)
                const emptyProps = matchDataEntries.filter(([key, value]) => utils.isEmpty(value, ["string", "number"]))
                return !utils.isEmpty(matchData) && Object.keys(emptyProps).length > 0
            })
        )
        if (Object.keys(matchesWithEmptyProps).length > 0) {
            console.warn(`⚠️ Found matches with empty properties { foo: {} }: ${JSON.stringify(matchesWithEmptyProps, null, 2)}`)
            if (repair) {
                console.info("🩹 Repairing: removing empty properties from matches, if all properties are empty the match will be removed entirely")
                const cleanedMatches = Object.fromEntries(
                    Object.entries(matches).map(([key, matchData]) => {
                        if (!matchData || typeof matchData !== "object") return [key, matchData];

                        const cleanedMatchData = Object.fromEntries(
                            Object.entries(matchData).filter(
                                ([k, value]) => !utils.isEmpty(value, ["string", "number"])
                            )
                        );

                        return [key, cleanedMatchData];
                    })
                );
                for (const [key, mData] of Object.entries(matchesWithEmptyProps)) {
                    if (!utils.isEmpty(cleanedMatches[key], ["string", "number"])) {
                        console.info(`🩹 Repairing: will replace match with empty properties: ${JSON.stringify(Object.fromEntries([[key, mData]]), null, 2)} with cleaned version: ${JSON.stringify(Object.fromEntries([[key, cleanedMatches[key]]]), null, 2)}`)
                        matches[key] = cleanedMatches[key]
                        console.info("✅ Replaced match with empty properties with the cleaned version")
                    } else {
                        console.info(`🩹 Repairing: will remove match ${key} because it became and empty object {} after cleaing up empty properties`)
                        delete matches[key]
                        console.info("✅ Removed empty match")
                    }
                }
            }
        } else {
            console.info("✅ Did not find any matches with empty properties")
        }
    } catch (e) {
        console.error(e.message)
    }

    console.info("🔍 Checking matches without date property")
    if (matchesWithoutDates.length > 0) {
        console.warn(`💡 Found matches without date property, best thing to do is to revisit the matches:`, matchesWithoutDates.map(m => `https://www.finalwhistle.org/en/match/${m.matchID}`))
    } else {
        console.info("✅ All matches have date property")
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
        console.info("✅ Passed check for players in matches that are not in the local storage, you have more players in local storage than in the matches, but this is perfectly fine if you visit player pages organically")
    } else if (playersLength > playersDataFromStorageLength) {
        const missing = Object.keys(playersFromMatches).filter(key => !(key in playersDataFromStorage));
        presentInBoth = Object.keys(playersFromMatches).filter(key => (key in playersDataFromStorage));
        console.info("Players from matches that are not in local storage:", missing)
        console.warn(`🔍 This doesn't make sense, match module always saves all players, data integrity error!`)
    } else {
        console.info("✅ Passed check for players in matches that are not in the local storage")
    }

    console.info("🔍 Checking for players who have more minutes in matches than in local storage")
    let anomalies = []
    let minutesFromPreviousVersions = []
    for (const playerID of presentInBoth) {
        const minutesDictInStorage = playersDataFromStorage[playerID]["minutes-played"]
        const minutesSumFromStorage = utils.sumMinutes(minutesDictInStorage)
        const minutesDictFromMatches = playersFromMatches[playerID]["minutes-played"]
        const minutesSumFromMatches = utils.sumMinutes(minutesDictFromMatches)
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
        console.debug("Surplus minutes in player profiles: ", minutesFromPreviousVersions)
    } else {
        console.debug("Looks like all minutes in storage come from match browsing")
    }

    if (anomalies.length > 0) {
        console.warn(`🔍 Anomalies found, these players have more minutes in matches than in local storage`, anomalies)
        if (repair) {
            console.info("🩹 Possible repair step: checking matches with dates - some may have minutes info that can be missing in player profiles")
            // TODO: filter to see if we have some additional data in the matches that is not in player profiles
            // if (matchesWithDates.length > 0) {
            //     console.info("💡 Found matches with dates: ", matchesWithDates)
            // } else {
            //     console.info("✅ Done")
            // }
        }
    } else {
        console.info("✅ There were no players who have more minutes in matches than in local storage")
    }

    const diff = utils.diffObjects(originalMatches, matches)
    console.info(`🔀 Changes to the matches object: ${JSON.stringify(diff, null, 2)}`)
    console.info(`🗄️📥 Saving to storage`)
    await utils.storage.set({ "matches": matches })
    console.info("🗄️🏁 Data integrity test concluded")
}