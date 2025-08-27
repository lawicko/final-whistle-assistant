if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

const storage = browser.storage.local

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
        const result = await storage.get(["modules", "colors", "tresholds"]);
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
        color9: "#db6612"
    },
    tresholds: {
        composure_treshold: 50,
        arrogance_treshold: 50
    }
}

async function handleInstalled(details) {
    console.log(`handleInstalled reason: ${details.reason}`);
    const { modules = {}, colors = {}, tresholds = {} } = await storage.get(["modules", "colors", "tresholds"]);
    for (const key in defaultOptions.modules) {
        if (!(key in modules)) {
            console.info(`Found a missing key (${key}) in the modules loaded from storage, assigned the value from the default modules (${defaultOptions.modules[key]})`)
            modules[key] = defaultOptions.modules[key];
        }
    }
    console.info("Saving modules", modules)
    storage.set({ modules: modules }, () => {
        console.info("Modules saved", { modules });
    });
    
    for (const key in defaultOptions.colors) {
        if (!(key in colors)) {
            console.info(`Found a missing key (${key}) in the colors loaded from storage, assigned the value from the default colors (${defaultOptions.colors[key]})`)
            colors[key] = defaultOptions.colors[key];
        }
    }
    storage.set({ colors: colors }, () => {
        console.info("Colors saved", { colors });
    });
    
    for (const key in defaultOptions.tresholds) {
        if (!(key in tresholds)) {
            console.info(`Found a missing key (${key}) in the tresholds loaded from storage, assigned the value from the default tresholds (${defaultOptions.tresholds[key]})`)
            tresholds[key] = defaultOptions.tresholds[key];
        }
    }
    storage.set({ tresholds: tresholds }, () => {
        console.info("Tresholds saved", { tresholds });
    });
}
browser.runtime.onInstalled.addListener(handleInstalled);

console.debug(`assistant.js loaded`)
