import {
    dateStorageFormat,
    formatError,
    getStoredString,
    isEmpty,
    optionsStorage,
    storage,
    version
} from '../content-scripts/utils.js';

import { checkDataIntegrityFor } from './data_integrity.js'
import { getDB, initDB } from './database.js'

if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

async function initializeDB(defaultOptions) {

    const {
        "player-data": playerDataFromStorage = {},
        "matches": matchesDataFromStorage = {},
        tresholds = {},
        checkboxes = {},
        "row-highlight-data": rowHighlightData = {}
    } = await storage.get([
        "player-data",
        "matches",
        "tresholds",
        "checkboxes",
        "row-highlight-data"
    ])

    const playersArray = Object.entries(playerDataFromStorage).map(([id, data]) => {
        // Destructure to remove playerID if it exists
        const { playerID, ...rest } = data
        return {
            id: id,
            ...rest
        }
    })

    // console.info(playersArray)

    const matchesArray = Object.entries(matchesDataFromStorage).map(([id, data]) => {
        const lineupTranformer = ([playerId, matchPlayerData]) => {
            return {
                id: playerId,
                ...matchPlayerData
            }
        }
        const lineupsTransformer = (lineups, tranformer) => {
            let result = {}
            if (lineups?.home) {
                const mappedHome = Object.entries(lineups.home).map(tranformer)
                result["home"] = mappedHome
            }
            if (lineups?.away) {
                const mappedAway = Object.entries(lineups.away).map(tranformer)
                result["away"] = mappedAway
            }
            return result
        }
        if (data.startingLineups) {
            const startingLineupsTransformed = lineupsTransformer(data.startingLineups, lineupTranformer)
            data.startingLineups = startingLineupsTransformed
        }
        if (data.finishingLineups) {
            const finishingLineupsTransformed = lineupsTransformer(data.finishingLineups, lineupTranformer)
            data.finishingLineups = finishingLineupsTransformed
        }

        return {
            id,
            ...data
        }
    })

    // console.info(matchesArray)
    const currentArroganceTreshold = parseInt(tresholds["arrogance_treshold"], 10)
    const currentComposureTreshold = parseInt(tresholds["composure_treshold"], 10)
    const tresholdsSettings = {
        arrogance: Number.isNaN(currentArroganceTreshold) ? 50 : currentArroganceTreshold,
        composure: Number.isNaN(currentComposureTreshold) ? 50 : currentComposureTreshold
    }
    const newTresholds = {
        category: "tresholds",
        settings: tresholdsSettings
    }

    let booleanSettings = Object.fromEntries(
        Object.entries(checkboxes).map(([key, value]) => [key, value === "true"])
    );
    if (isEmpty(booleanSettings)) {
        booleanSettings = defaultOptions.checkboxes
    }
    const newCheckboxes = {
        category: "checkboxes",
        settings: booleanSettings
    }

    const newRowHighligthData = {
        category: "rowHighlights",
        settings: rowHighlightData
    }

    const {
        modules = {},
        colors = {}
    } = await optionsStorage.get([
        "modules",
        "colors"
    ])

    const features = {
        category: "features",
        settings: defaultOptions.features
    }

    const newColors = {
        category: "colors",
        settings: {
            advancedDevelopmentBad: colors["color-setting-advanced-development-bad"] ?? defaultOptions.colors.advancedDevelopmentBad,
            advancedDevelopmentGood: colors["color-setting-advanced-development-good"] ?? defaultOptions.colors.advancedDevelopmentGood,
            advancedDevelopmentVeryBad: colors["color-setting-advanced-development-very-bad"] ?? defaultOptions.colors.advancedDevelopmentVeryBad,
            advancedDevelopmentVeryGood: colors["color-setting-advanced-development-very-good"] ?? defaultOptions.colors.advancedDevelopmentVeryGood,
            arroganceBad: colors["color-setting-arrogance-"] ?? defaultOptions.colors.arroganceBad,
            arroganceVeryBad: colors["color-setting-arrogance--"] ?? defaultOptions.colors.arroganceVeryBad,
            composureBad: colors["color-setting-composure-"] ?? defaultOptions.colors.composureBad,
            composureGood: colors["color-setting-composure+"] ?? defaultOptions.colors.composureGood,
            composureVeryBad: colors["color-setting-composure--"] ?? defaultOptions.colors.composureVeryBad,
            composureVeryGood: colors["color-setting-composure++"] ?? defaultOptions.colors.composureVeryGood,
            leadershipBad: colors["color-setting-leadership-"] ?? defaultOptions.colors.leadershipBad,
            leadershipGood: colors["color-setting-leadership+"] ?? defaultOptions.colors.leadershipGood,
            leadershipVeryBad: colors["color-setting-leadership--"] ?? defaultOptions.colors.leadershipVeryBad,
            leadershipVeryGood: colors["color-setting-leadership++"] ?? defaultOptions.colors.leadershipVeryGood,
            sportsmanshipBad: colors["color-setting-sportsmanship-"] ?? defaultOptions.colors.sportsmanshipBad,
            sportsmanshipGood: colors["color-setting-sportsmanship+"] ?? defaultOptions.colors.sportsmanshipGood,
            sportsmanshipVeryBad: colors["color-setting-sportsmanship--"] ?? defaultOptions.colors.sportsmanshipVeryBad,
            sportsmanshipVeryGood: colors["color-setting-sportsmanship++"] ?? defaultOptions.colors.sportsmanshipVeryGood,
            teamworkBad: colors["color-setting-teamwork-"] ?? defaultOptions.colors.teamworkBad,
            teamworkGood: colors["color-setting-teamwork+"] ?? defaultOptions.colors.teamworkGood,
            teamworkVeryBad: colors["color-setting-teamwork--"] ?? defaultOptions.colors.teamworkVeryBad,
            teamworkVeryGood: colors["color-setting-teamwork++"] ?? defaultOptions.colors.teamworkVeryGood,
            tagColor1: colors["color1"] ?? defaultOptions.colors.tagColor1,
            tagColor2: colors["color2"] ?? defaultOptions.colors.tagColor2,
            tagColor3: colors["color3"] ?? defaultOptions.colors.tagColor3,
            tagColor4: colors["color4"] ?? defaultOptions.colors.tagColor4,
            tagColor5: colors["color5"] ?? defaultOptions.colors.tagColor5,
            tagColor6: colors["color6"] ?? defaultOptions.colors.tagColor6,
            tagColor7: colors["color7"] ?? defaultOptions.colors.tagColor7,
            tagColor8: colors["color8"] ?? defaultOptions.colors.tagColor8,
            tagColor9: colors["color9"] ?? defaultOptions.colors.tagColor9
        }
    }

    const newSettings = [
        newTresholds,
        newCheckboxes,
        newRowHighligthData,
        features,
        newColors
    ]

    initDB("👨‍💻 initializeDB")
    getDB().on("populate", function (transaction) {
        try {
            // This runs only once, when the DB is first created
            console.info("👨‍💻 Populating initial data...")

            // Add players from local storage
            transaction.table("players").bulkAdd(playersArray)

            // Add matches from local storage
            transaction.table("matches").bulkAdd(matchesArray)

            // Add settings from local storage
            transaction.table("settings").bulkAdd(newSettings)

            console.info("👨‍💻 Populating initial data finished")
        } catch (e) {
            console.error(formatError(e))
        }
    })

    try {
        const dbInstance = await getDB().open()
        console.info("👨‍💻 Database opened successfully:", dbInstance.name)

        // Verify
        const allPlayers = await getDB().players.toArray()
        console.log("👨‍💻 Players in DB:", allPlayers)
        const allMatches = await getDB().matches.toArray()
        console.log("👨‍💻 Matches in DB:", allMatches)
        const allSettings = await getDB().settings.toArray()
        console.log("👨‍💻 Settings in DB:", allSettings)

        // TODO: uncomment local storage cleanup
        // await storage.remove(["player-data", "matches"])
    } catch (err) {
        console.error("Error opening database:", err)
    }
}

/**
 * 
 * @param {string} v1 
 * @param {string} v2 
 * @returns returns 1 if v1 is newer, 0 if they are equal, and -1 if v2 is newer
 */
function compareVersions(v1, v2) {
    const a = v1.split(".").map(Number);
    const b = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const num1 = a[i] || 0;
        const num2 = b[i] || 0;

        if (num1 > num2) return 1;   // v1 is newer
        if (num1 < num2) return -1;  // v2 is newer
    }

    return 0; // equal
}

async function migrateLocalStorageFromBefore3_1_0() {
    const { "player-data": playerDataFromStorage = {} } = await storage.get("player-data")
    for (const [playerID, player] of Object.entries(playerDataFromStorage)) {
        const minutesDictionary = player["minutes-played"] || {}
        if (Object.keys(minutesDictionary).length === 0) continue
        console.debug("minutesDictionary:", minutesDictionary)

        const entries = Object.entries(minutesDictionary)
            .map(([key, value]) => {
                const date = new Date(key)
                if (isNaN(date)) return null; // skip invalid dates
                const formatted = dateStorageFormat(date)
                return [formatted, value];
            })
            .filter(Boolean); // remove nulls
        const newMinutesDictionary = Object.fromEntries(entries)
        console.debug("newMinutesDictionary", newMinutesDictionary)
        player["minutes-played"] = newMinutesDictionary
        playerDataFromStorage[playerID] = player
    }
    await storage.set({ "player-data": playerDataFromStorage })
}

async function handleMigrationAndBumpLocalDataVersion(localStorageVersion) {
    console.info(`🔗 Migrating: Making local data compatible with ${version}`)

    if (!localStorageVersion) {
        await migrateLocalStorageFromBefore3_1_0()
    } else {
        // if (compareVersions(version, localStorageVersion) > 0) {

        // }
    }

    await storage.set({ version: version })
    console.info(`✅ Migration completed, new local data version: ${version}`)
}

// menus
const parentMenuID = "parentMenu"
const colorPlayerRowMenuID = "colorPlayerRowMenuID"
const clearAllRowsOnThisPageMenuID = "clearAllRowsOnThisPageMenuID"
const clearAllRowsOnThisPageMenuAction = "clearAllRowsOnThisPageMenuAction"
const clearAllRowHighlightsMenuID = "clearAllRowHighlightsMenuID"
const clearAllRowHighlightsMenuAction = "clearAllRowHighlightsMenuAction"

const playerRowColorRaw = {
    "playerRowColorFW": "playerRowColorFWAction",
    "playerRowColorLW": "playerRowColorLWAction",
    "playerRowColorLM": "playerRowColorLMAction",
    "playerRowColorRW": "playerRowColorRWAction",
    "playerRowColorRM": "playerRowColorRMAction",
    "playerRowColorOM": "playerRowColorOMAction",
    "playerRowColorCM": "playerRowColorCMAction",
    "playerRowColorDM": "playerRowColorDMAction",
    "playerRowColorLWB": "playerRowColorLWBAction",
    "playerRowColorLB": "playerRowColorLBAction",
    "playerRowColorRWB": "playerRowColorRWBAction",
    "playerRowColorRB": "playerRowColorRBAction",
    "playerRowColorCB": "playerRowColorCBAction",
    "clearRowColors": "playerRowColorClearAction"
}

// Handle clicks on the menu
function handleContextMenuClicked(info, tab) {
    switch (info.menuItemId) {
        case clearAllRowsOnThisPageMenuID:
            console.info("contexMenus.onClicked clearAllRowsOnThisPageMenuID")
            browser.tabs.sendMessage(tab.id, { action: clearAllRowsOnThisPageMenuAction })
            break
        case clearAllRowHighlightsMenuID:
            console.info("contextMenus.onClicked clearAllRowHighlightsMenuID")
            browser.tabs.sendMessage(tab.id, { action: clearAllRowHighlightsMenuAction })
            break
        default:
            console.info(`contextMenus.onClicked ${info.menuItemId}`)
            browser.tabs.sendMessage(tab.id, { action: playerRowColorRaw[info.menuItemId] })
    }
}
browser.contextMenus.onClicked.addListener(handleContextMenuClicked)

// Receive messages from content script
function handleOnMessage(msg, sender, sendResponse) {
    console.debug("received message: ", msg)
    if (msg.type === "contextMenuConfig") {
        browser.contextMenus.update(colorPlayerRowMenuID, { enabled: msg.enabled })
    }

    // Database utils
    if (msg.type === "WILL_IMPORT_DB") {
        console.info("👨‍💻 Received WILL_IMPORT_DB")
        const dbInstance = getDB()
        // console.info("playersCount",dbInstance.players.count())
        if (dbInstance) {
            dbInstance.close()
        }
        console.info("👨‍💻 WILL_IMPORT_DB processing finished")
    }

    if (msg.type === "DID_IMPORT_DB") {
        console.info("DID_IMPORT_DB")
        initDB("👨‍💻 Received DID_IMPORT_DB")
        // const dbInstance = getDB()
        // dbInstance.players.count().then(count => {
        //     console.info("players.count", count)
        // }).catch(err => {
        //     console.error("Error counting players:", err)
        // })
        console.info("👨‍💻 DID_IMPORT_DB processing finished")
    }

    // Database access
    const db = getDB()
    if (db && msg.type === "getColors") {
        db.settings.get("colors")
            .then(colors => sendResponse(colors.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }

    if (db && msg.type === "putColors") {
        db.settings.put({
            category: "colors",
            settings: msg.data
        })
            .then(colors => sendResponse(colors.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "getFeatures") {
        db.settings.get("features")
            .then(features => sendResponse(features.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "putFeatures") {
        db.settings.put({
            category: "features",
            settings: msg.data
        })
            .then(features => sendResponse(features.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "getTresholds") {
        db.settings.get("tresholds")
            .then(tresholds => sendResponse(tresholds.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "putTresholds") {
        db.settings.put({
            category: "tresholds",
            settings: msg.data
        })
            .then(tresholds => sendResponse(tresholds.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "getCheckboxes") {
        db.settings.get("checkboxes")
            .then(checkboxes => sendResponse(checkboxes.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "putCheckboxes") {
        db.settings.put({
            category: "checkboxes",
            settings: msg.data
        })
            .then(checkboxes => sendResponse(checkboxes.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "getRowHighlights") {
        db.settings.get("rowHighlights")
            .then(rowHighlights => sendResponse(rowHighlights.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "putRowHighlights") {
        db.settings.put({
            category: "rowHighlights",
            settings: msg.data
        })
            .then(rowHighlights => sendResponse(rowHighlights.settings))
            .catch(err => sendResponse({ error: err.message }))
        return true; // keep channel open
    }
    if (db && msg.type === "getMatch") {
        db.matches.get(msg.id)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "getPlayer") {
        db.players.get(msg.id)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "bulkGetPlayers") {
        db.players.bulkGet(msg.keysArray)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "putMatch") {
        db.matches.put(msg.data)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "putPlayer") {
        db.players.put(msg.data)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "bulkPutPlayers") {
        db.players.bulkPut(msg.data)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "updateMatch") {
        db.matches.update(msg.id, msg.changes)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    if (db && msg.type === "deleteMatch") {
        db.matches.delete(msg.id)
            .then(player => sendResponse(player))
            .catch(err => sendResponse({ error: err.message }));
        return true; // keep channel open
    }

    return Promise.resolve(null)
}
browser.runtime.onMessage.addListener(handleOnMessage)

// WebNavigation
const filter = { url: [{ hostContains: "finalwhistle.org" }] };

function handleNav(tabId, url) {
    console.info(`🧭 Navigation in tab ${tabId}: ${url}`);
    browser.tabs.sendMessage(tabId, { url: url })
}

// Fired when a document, including the resources it refers to, is completely loaded and initialized.
browser.webNavigation.onCompleted.addListener(details => {
    console.debug(`🧭 onCompleted`);
    handleNav(details.tabId, details.url);
}, filter);

// SPA history updates (pushState / replaceState)
browser.webNavigation.onHistoryStateUpdated.addListener(details => {
    console.debug(`🧭 onHistoryStateUpdated`);
    handleNav(details.tabId, details.url);
}, filter)

// Optional: catch hash-only changes
browser.webNavigation.onReferenceFragmentUpdated.addListener(details => {
    console.debug(`🧭 onReferenceFragmentUpdated`);
    handleNav(details.tabId, details.url);
}, filter)


// Service worker lifecycle
function handleStartup() {
    console.info("▶️ Starting up service worker")
}

browser.runtime.onStartup.addListener(handleStartup);

function handleSuspend() {
    console.info("⏸️ Suspending service worker")
}

browser.runtime.onSuspend.addListener(handleSuspend);

async function handleInstalled(details) {
    console.info(`📦 Installed (${details.reason})`);

    const {
        "player-data": playersDataFromStorage = {},
        "matches": matches = {}
    } = await storage.get(["player-data", "matches"])

    if (!isEmpty(playersDataFromStorage) && !isEmpty(matches)) {
        await checkDataIntegrityFor(playersDataFromStorage, matches, true)
    }

    // Check the local storage version
    const localStorageVersion = await getStoredString("version")
    if (localStorageVersion && compareVersions(version, localStorageVersion) <= 0) {
        console.info(`💾 Local storage on version ${localStorageVersion}, this extension version ${version} skipping migration`)
    } else {
        await handleMigrationAndBumpLocalDataVersion(localStorageVersion)
    }

    const defaultOptions = {
        features: {
            academyButtonsSeparation: true,
            matchBadgeEnhancement: true,
            lineupPageAdditions: true,
            matchDataGathering: true,
            playerPageAdditions: true,
            playersPageAdditions: true,
            rowHighlighting: true,
            tagsEnhancement: true
        },
        colors: {
            advancedDevelopmentBad: "#FFD700",
            advancedDevelopmentGood: "#4CBB17",
            advancedDevelopmentVeryBad: "#FF4500",
            advancedDevelopmentVeryGood: "#228B22",
            arroganceBad: "#FFD700",
            arroganceVeryBad: "#FF4500",
            composureBad: "#FFD700",
            composureGood: "#4CBB17",
            composureVeryBad: "#FF4500",
            composureVeryGood: "#228B22",
            leadershipBad: "#FFD700",
            leadershipGood: "#4CBB17",
            leadershipVeryBad: "#FF4500",
            leadershipVeryGood: "#228B22",
            sportsmanshipBad: "#FFD700",
            sportsmanshipGood: "#4CBB17",
            sportsmanshipVeryBad: "#FF4500",
            sportsmanshipVeryGood: "#228B22",
            teamworkBad: "#FFD700",
            teamworkGood: "#4CBB17",
            teamworkVeryBad: "#FF4500",
            teamworkVeryGood: "#228B22",
            tagColor1: "#c96a68",
            tagColor2: "#afb248",
            tagColor3: "#33cccc",
            tagColor4: "#ffffff",
            tagColor5: "#dcc6c6",
            tagColor6: "#ff99cc",
            tagColor7: "#ff9966",
            tagColor8: "#ff8833",
            tagColor9: "#db6612"
        },
        tresholds: {
            arrogance: 50,
            composure: 50
        },
        checkboxes: {
            advancedDevelopment: true,
            estimatedPotential: true,
            specialTalents: true,
            sportsmanship: true,
            teamwork: true
        }
    }

    await initializeDB(defaultOptions)

    try {
        const loadedFeatuers = await getDB().settings.get("features")
        const features = loadedFeatuers.settings
        for (const key in defaultOptions.features) {
            if (!(key in features)) {
                console.info(`Found a missing key (${key}) in the features settings loaded from storage, assigned the value from the default features (${defaultOptions.features[key]})`)
                features[key] = defaultOptions.features[key];
            }
        }
        const loadedColors = await getDB().settings.get("colors")
        const colors = loadedColors.settings
        for (const key in defaultOptions.colors) {
            if (!(key in colors)) {
                console.info(`Found a missing key (${key}) in the colors settings loaded from storage, assigned the value from the default colors (${defaultOptions.colors[key]})`)
                colors[key] = defaultOptions.colors[key];
            }
        }

        const loadedCheckboxes = await getDB().settings.get("checkboxes")
        const checkboxes = loadedCheckboxes.settings
        for (const key in defaultOptions.checkboxes) {
            if (!(key in checkboxes)) {
                console.info(`Found a missing key (${key}) in the checkboxes settings loaded from storage, assigned the value from the default checkboxes (${defaultOptions.checkboxes[key]})`)
                checkboxes[key] = defaultOptions.checkboxes[key];
            }
        }

        const loadedTresholds = await getDB().settings.get("tresholds")
        const tresholds = loadedTresholds.settings
        for (const key in defaultOptions.tresholds) {
            if (!(key in tresholds)) {
                console.info(`Found a missing key (${key}) in the tresholds settings loaded from storage, assigned the value from the default tresholds (${defaultOptions.tresholds[key]})`)
                tresholds[key] = defaultOptions.tresholds[key];
            }
        }

        console.info("☁️ Saving settings to storage")
        await getDB().settings.put({
            category: "features",
            settings: features
        })
        await getDB().settings.put({
            category: "colors",
            settings: colors
        })
        await getDB().settings.put({
            category: "checkboxes",
            settings: checkboxes
        })
        await getDB().settings.put({
            category: "tresholds",
            settings: tresholds
        })
        console.info("📥 Saved")
        const allSettings = await getDB().settings.toArray()

    } catch (e) {
        console.error(formatError(e))
    }

    browser.contextMenus.create({
        id: parentMenuID,
        title: "Final Whistle Assistant",
        contexts: ["all"] // can also be ["page", "selection", "link", "image", etc.]
    });

    // Create submenu items
    browser.contextMenus.create({
        id: colorPlayerRowMenuID,
        parentId: parentMenuID,
        title: "Color player row",
        contexts: ["all"],
        enabled: false
    });

    browser.contextMenus.create({
        id: clearAllRowsOnThisPageMenuID,
        parentId: parentMenuID,
        title: "Clear All Rows On This Page",
        contexts: ["all"],
        enabled: true
    });

    browser.contextMenus.create({
        id: clearAllRowHighlightsMenuID,
        parentId: parentMenuID,
        title: "Clear All Row Highlights",
        contexts: ["all"],
        enabled: true
    });

    for (const key of Object.keys(playerRowColorRaw)) {
        var titleSuffix = key.substring("playerRowColor".length); // everything after "playerRowColor"
        if (titleSuffix) {
            // Insert a space before each capital letter except the first
            var formattedTitle = titleSuffix
        } else {
            var formattedTitle = key.replace(/(?!^)([A-Z])/g, " $1");
            formattedTitle = formattedTitle.charAt(0).toUpperCase() + formattedTitle.slice(1);
        }
        console.debug("Adding menu item: ", key)
        browser.contextMenus.create({
            id: key,
            parentId: colorPlayerRowMenuID,
            title: formattedTitle,
            contexts: ["all"]
        });
    }
    console.info("☰ Added menu items")
    console.info(`✅ Final Whistle Assistant startup sequence complete`)
}

browser.runtime.onInstalled.addListener(handleInstalled)