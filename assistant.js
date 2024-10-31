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
    if (changeInfo.status === "complete" && changeInfo.url) {
        console.debug("Changed attributes: ", changeInfo)
        handleURLChanged(tabId, changeInfo.url)
    }
}

async function handleURLChanged(tabId, url) {
    if (loadedMap.get(tabId)) {
        if (lastURLMap.get(tabId) == url) {
            await loadModules(tabId, url)
            browser.tabs.sendMessage(tabId, { url: url })
        } else {
            browser.tabs.sendMessage(tabId, { url: url })
        }
    } else {
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
    }
    
    await start()
    loadedMap.set(tabId, true)
}

browser.tabs.onUpdated.addListener(handleUpdated, filter);
