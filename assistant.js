if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

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
        await executeScript(tabId, "constants.js")
        await executeScript(tabId, "row_highlight.js")
        await executeScript(tabId, "academy_buttons.js")
        await executeScript(tabId, "players.js")
        await executeScript(tabId, "calendar.js")
        await executeScript(tabId, "tags.js")
    }
    
    await start()
    loadedMap.set(tabId, true)
}

browser.tabs.onUpdated.addListener(handleUpdated);
console.debug(`assistant.js loaded`)