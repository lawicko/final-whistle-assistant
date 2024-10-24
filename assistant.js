const pattern1 = "*://*.finalwhistle.org/*";

const filter = {
    urls: [pattern1],
};

var isLoadingScripts = false
var scriptsLoaded = false

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
    if (!scriptsLoaded && !isLoadingScripts && changeInfo.status === "complete" && changeInfo.url) {
        isLoadingScripts = true
        console.info("Changed attributes: ", changeInfo);
        
        async function start() {
            executeScript(tabId, "constants.js")
            executeScript(tabId, "row_highlight.js")
            executeScript(tabId, "academy_buttons.js")
            executeScript(tabId, "players.js")
            executeScript(tabId, "calendar.js")
        }
        
        start()
        isLoadingScripts = false
        scriptsLoaded = true
    }
}

browser.tabs.onUpdated.addListener(handleUpdated, filter);
