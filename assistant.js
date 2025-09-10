if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

const optionsStorage = browser.storage.sync

const pattern1 = "*://*.finalwhistle.org/*";

const filter = {
    urls: [pattern1],
};

const loadedMap = new Map()
const lastURLMap = new Map()

async function executeScript(tabId, scriptName) {
    try {
        console.log(`executeScript ${scriptName}`);
        let resultsArray = await browser.scripting.executeScript({
            target: {
                tabId: tabId,
                allFrames: true,
            },
            files: [scriptName],
        });
        console.debug(`resultsArray has ${resultsArray.length} elements`)
        for (let i = 0; i < resultsArray.length; i++) {
            let result = resultsArray[i]
            console.debug(`processing ${i} result`)
            if (result.hasOwnProperty("error")) {
                console.error(`script ${scriptName} execution failed with error: ${result.error}`)
            } else {
                console.info(`execution result for ${scriptName}: ${JSON.stringify(result)}`)
            }
        }
    } catch (err) {
        console.error(`failed to execute script ${scriptName}: ${err}`);
    }
}

function handleUpdated(tabId, changeInfo, tabInfo) {
    console.debug(`handleUpdated called`)
    console.debug(`tabId: ${tabId}`)
    console.debug(`changeInfo: ${JSON.stringify(changeInfo)}`)
    console.debug(`tabInfo: ${JSON.stringify(tabInfo)}`)
    // On Firefox the new url comes in the changeInfo, on Chrome-based browsers the only way is to get it from the tabInfo
    let url = changeInfo.url || tabInfo.url
    if (changeInfo.status === "complete" && url) {
        console.debug("Changed attributes: ", changeInfo)
        handleURLChanged(tabId, url)
    }
}

async function handleURLChanged(tabId, url) {
    if (loadedMap.get(tabId)) {
        if (lastURLMap.get(tabId) == url) {
            // This is the case when you reload the website, then the modules need to be loaded again
            await loadModules(tabId, url)
            browser.tabs.sendMessage(tabId, { url: url })
        } else {
            // This is the case when the url has changed because of the js or other natigation that is not a hard reload
            browser.tabs.sendMessage(tabId, { url: url })
        }
    } else {
        // Nothing was loaded before, so the modules need to be loaded
        await loadModules(tabId, url)
        browser.tabs.sendMessage(tabId, { url: url })
    }
    lastURLMap.set(tabId, url)
}

async function loadModules(tabId, url) {
    loadedMap.set(tabId, false)

    async function start() {
        const result = await optionsStorage.get(["modules", "colors"]);
        const modules = result.modules || {};

        await executeScript(tabId, "constants.js")

        if (modules?.academy_buttons) {
            console.info(`Loading academy_buttons...`)
            await executeScript(tabId, "academy_buttons.js")
        }
        if (modules?.calendar) {
            console.info(`Loading calendar...`)
            await executeScript(tabId, "calendar.js")
        }
        if (modules?.lineup) {
            console.info(`Loading lineup...`)
            await executeScript(tabId, "lineup.js")
        }
        if (modules?.match) {
            console.info(`Loading match...`)
            await executeScript(tabId, "match.js")
        }
        if (modules?.player) {
            console.info(`Loading player...`)
            await executeScript(tabId, "player.js")
        }
        if (modules?.players) {
            console.info(`Loading players...`)
            await executeScript(tabId, "players.js")
        }
        if (modules?.row_highlight) {
            console.info(`Loading row_highlight...`)
            await executeScript(tabId, "row_highlight.js")
        }
        if (modules?.tags) {
            console.info(`Loading tags...`)
            await executeScript(tabId, "tags.js")
        }
    }

    await start()
    loadedMap.set(tabId, true)
}

browser.tabs.onUpdated.addListener(handleUpdated);

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
        "color-setting-teamwork--": "#FF4500"
    },
    tresholds: {
        composure_treshold: 50,
        arrogance_treshold: 50
    }
}

async function handleInstalled(details) {
    console.log(`handleInstalled reason: ${details.reason}`);
    const { modules = {}, colors = {} } = await optionsStorage.get(["modules", "colors"]);
    for (const key in defaultOptions.modules) {
        if (!(key in modules)) {
            console.info(`Found a missing key (${key}) in the modules loaded from storage, assigned the value from the default modules (${defaultOptions.modules[key]})`)
            modules[key] = defaultOptions.modules[key];
        }
    }
    console.info("Saving modules", modules)
    optionsStorage.set({ modules: modules }, () => {
        console.info("Modules saved", { modules });
    });

    for (const key in defaultOptions.colors) {
        if (!(key in colors)) {
            console.info(`Found a missing key (${key}) in the colors loaded from storage, assigned the value from the default colors (${defaultOptions.colors[key]})`)
            colors[key] = defaultOptions.colors[key];
        }
    }
    optionsStorage.set({ colors: colors }, () => {
        console.info("Colors saved", { colors });
    });

    browser.contextMenus.removeAll()

    // context menus
    const parentMenuID = "parentMenu"
    const colorPlayerRowMenuID = "colorPlayerRowMenuID"
    const clearAllRowHighlightsMenuID = "clearAllRowHighlightsMenuID"
    const clearAllRowHighlightsMenuAction = "clearAllRowHighlightsMenuAction"

    const playerRowColorRaw = {
        "playerRowColorFW": "playerRowColorFWAction",
        "playerRowColorLM": "playerRowColorLMAction",
        "playerRowColorRM": "playerRowColorRMAction",
        "playerRowColorOM": "playerRowColorOMAction",
        "playerRowColorCM": "playerRowColorCMAction",
        "playerRowColorDM": "playerRowColorDMAction",
        "playerRowColorLB": "playerRowColorLBAction",
        "playerRowColorRB": "playerRowColorRBAction",
        "playerRowColorCB": "playerRowColorCBAction",
        "clearRowColors": "playerRowColorClearAction"
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
        console.info("Adding menu item: ", key)
        browser.contextMenus.create({
            id: key,
            parentId: colorPlayerRowMenuID,
            title: formattedTitle,
            contexts: ["all"]
        });
    }

    // Handle clicks on the menu
    browser.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === clearAllRowHighlightsMenuID) {
            console.info("contextMenus.onClicked clearAllRowHighlightsMenuID")
            browser.tabs.sendMessage(tab.id, { action: clearAllRowHighlightsMenuAction });
        } else {
            browser.tabs.sendMessage(tab.id, { action: playerRowColorRaw[info.menuItemId] });
        }
    });

    // Receive messages from content script
    browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        console.debug("received message: ", msg)
        if (msg.type === "contextMenuConfig") {
            browser.contextMenus.update("colorPlayerRowMenuID", { enabled: msg.enabled });
        }
    });
}
browser.runtime.onInstalled.addListener(handleInstalled);

console.debug(`assistant.js loaded`)
