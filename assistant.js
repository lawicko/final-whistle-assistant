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
        const result = await storage.get(["modules", "colors"]);
        const modules = result.modules || {};

        await executeScript(tabId, "constants.js")
        if (modules?.row_highlight) {
            await executeScript(tabId, "row_highlight.js")
        }
        if (modules?.academy_buttons) {
            await executeScript(tabId, "academy_buttons.js")
        }
        if (modules?.player) {
            await executeScript(tabId, "player.js")
        }
        if (modules?.players) {
            await executeScript(tabId, "players.js")
        }
        if (modules?.calendar) {
            await executeScript(tabId, "calendar.js")
        }
        if (modules?.tags) {
        await executeScript(tabId, "tags.js")
        }
    }
    
    await start()
    loadedMap.set(tabId, true)
}

browser.tabs.onUpdated.addListener(handleUpdated);

function saveDefaultOptions() {
    // Collect all checkboxes
    const modules = {
        academy_buttons: true,
        calendar: true,
        player: true,
        players: true,
        row_highlight: true,
        tags: true,
    };

    // Collect all colors
    const colors = {};
    colors["color1"] = "#c96a68"
    colors["color2"] = "#afb248"
    colors["color3"] = "#33cccc"
    colors["color4"] = "#ffffff"
    colors["color5"] = "#dcc6c6"
    colors["color6"] = "#ff99cc"
    colors["color7"] = "#ff9966"
    colors["color8"] = "#ff8833"
    colors["color9"] = "#db6612"

    // Save both to storage
    storage.set({ modules, colors }, () => {
        console.log("Default options saved", { modules, colors });
    });
}

async function handleInstalled(details) {
    console.log(`handleInstalled reason: ${details.reason}`);
    const { modules = {}, colors = {} } = await storage.get(["modules", "colors"]);
    if (Object.keys(modules).length > 0) {
        console.log("Modules already exist:", modules, "skipping the default options saving...");
    } else {
        console.log("Looks like this is the initial installation, saving the default options...")
        saveDefaultOptions();
    }
}
browser.runtime.onInstalled.addListener(handleInstalled);

console.debug(`assistant.js loaded`)