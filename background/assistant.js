import {
    dateStorageFormat,
    getStoredString,
    isEmpty,
    normalizePromise,
    optionsStorage,
    storage,
    version
} from '../content-scripts/utils.js';

import { checkDataIntegrityFor } from './data_integrity.js'
import { database } from '../content-scripts/database.js'

if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// TODO: rename and think if this needs to be always called
async function initDB() {

    const {
        "player-data": playerDataFromStorage = {},
        "matches": matchesDataFromStorage = {}
    } = await storage.get(["player-data", "matches"])

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

    database.on("populate", function (transaction) {
        // This runs only once, when the DB is first created
        console.info("Populating initial data...")

        // Add players from local storage
        transaction.table("players").bulkAdd(playersArray)

        // Add matches from local storage
        transaction.table("matches").bulkAdd(matchesArray)

        console.info("Populating initial data finished")
    })

    try {
        const dbInstance = await database.open()
        console.info("Database opened successfully:", dbInstance.name)

        // Verify
        const allPlayers = await database.players.toArray()
        console.info("Players in DB:", allPlayers)
        const allMatches = await database.matches.toArray()
        console.info("Matches in DB:", allMatches)

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

    // Database access
    if (msg.type === "getMatch") {
        return normalizePromise(database.matches.get(msg.id))
    }

    if (msg.type === "getPlayer") {
        return normalizePromise(database.players.get(msg.id))
    }

    if (msg.type === "addMatch") {
        return normalizePromise(database.matches.put(msg.data)) // put = add or update
    }

    if (msg.type === "addPlayer") {
        return normalizePromise(database.players.put(msg.data))
    }

    if (msg.type === "updateMatch") {
        return normalizePromise(database.matches.update(msg.id, msg.changes))
    }

    if (msg.type === "deleteMatch") {
        return normalizePromise(database.matches.delete(msg.id))
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

    await initDB()

    const defaultOptions = {
        modules: {
            academy_buttons: true,
            calendar: true,
            lineup: true,
            match: true,
            player: true,
            players: true,
            row_highlight: true,
            tags: true
        },
        colors: {
            color1: "#c96a68",
            color2: "#afb248",
            color3: "#33cccc",
            color4: "#ffffff",
            color5: "#dcc6c6",
            color6: "#ff99cc",
            color7: "#ff9966",
            color8: "#ff8833",
            color9: "#db6612",
            "color-setting-arrogance-": "#FFD700",
            "color-setting-arrogance--": "#FF4500",
            "color-setting-composure+": "#4CBB17",
            "color-setting-composure++": "#228B22",
            "color-setting-composure-": "#FFD700",
            "color-setting-composure--": "#FF4500",
            "color-setting-leadership+": "#4CBB17",
            "color-setting-leadership++": "#228B22",
            "color-setting-leadership-": "#FFD700",
            "color-setting-leadership--": "#FF4500",
            "color-setting-sportsmanship+": "#4CBB17",
            "color-setting-sportsmanship++": "#228B22",
            "color-setting-sportsmanship-": "#FFD700",
            "color-setting-sportsmanship--": "#FF4500",
            "color-setting-teamwork+": "#4CBB17",
            "color-setting-teamwork++": "#228B22",
            "color-setting-teamwork-": "#FFD700",
            "color-setting-teamwork--": "#FF4500",
            "color-setting-advanced-development-very-good": "#228B22",
            "color-setting-advanced-development-good": "#4CBB17",
            "color-setting-advanced-development-bad": "#FFD700",
            "color-setting-advanced-development-very-bad": "#FF4500"
        },
        tresholds: {
            composure_treshold: 50,
            arrogance_treshold: 50
        }
    }

    const { modules = {}, colors = {} } = await optionsStorage.get(["modules", "colors"]);
    for (const key in defaultOptions.modules) {
        if (!(key in modules)) {
            console.info(`Found a missing key (${key}) in the modules loaded from storage, assigned the value from the default modules (${defaultOptions.modules[key]})`)
            modules[key] = defaultOptions.modules[key];
        }
    }

    for (const key in defaultOptions.colors) {
        if (!(key in colors)) {
            console.info(`Found a missing key (${key}) in the colors loaded from storage, assigned the value from the default colors (${defaultOptions.colors[key]})`)
            colors[key] = defaultOptions.colors[key];
        }
    }

    console.info("☁️ Saving sync storage")
    await optionsStorage.set({ modules: modules, colors: colors })
    console.info("📥 Saved")

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
}

browser.runtime.onInstalled.addListener(handleInstalled)