const pluginRowHighlightClass = "player-selected"

console.log(`loading row_highlight.js...`)

function toggleClass(el, className) {
    if (el.className.indexOf(className) >= 0) {
        el.className = el.className.replace(` ${className}`, "");
    } else {
        el.className += ` ${className}`;
    }
}

async function processTableRows(tableNode) {
    const { "row-highlight-data": rowHighlightData = {} } = await storage.get("row-highlight-data");
    for (let i = 1; i < tableNode.rows.length; i++) {
        tr = tableNode.rows[i]
        // Set onclick for the basic row highlight
        tr.onclick = function () { toggleClass(this, pluginRowHighlightClass) }

        // Select the first <a> inside a <td> whose href contains "/player/"
        const playerLink = tr.querySelector('td a[href*="/player/"]');
        // Match the number after /player/
        const match = playerLink.href.match(/\/player\/(\d+)/);
        const playerID = match ? match[1] : null;
        if (!playerID) {
            console.error("Tried to extract player ID from href ", playerLink.href, " but there are no matches")
        }
        const classForPlayerID = rowHighlightData[playerID]
        if (classForPlayerID) {
            tr.classList.add(classForPlayerID)
        } else {
            const classPrefix = pluginNodeClass + "_playerBackground"
            Array.from(tr.classList).forEach(cls => {
                if (cls.startsWith(classPrefix)) {
                    tr.classList.remove(cls);
                }
            });
        }
    }
}

// Options for the observer (which mutations to observe)
const rowsObservingConfig = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const rowsObservingCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {

        console.debug(`Found the following table: `, tableNode)

        processTableRows(tableNode)

        const c = (mutationList, observer) => {
            console.debug(`table has changed`)
            observer.disconnect()

            processTableRows(tableNode)

            observer.observe(tableNode, { childList: true, subtree: true, characterData: true })
        }
        const o = new MutationObserver(c)
        console.debug(`starting the table observation...`)
        o.observe(tableNode, { childList: true, subtree: true, characterData: true })
    } else {
        console.debug(`Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const rowsObserver = new MutationObserver(rowsObservingCallback);

async function storeRowHighlightClass(rowHighlightClass, playerID) {
    const { "row-highlight-data": rowHighlightData = {} } = await storage.get("row-highlight-data");
    rowHighlightData[playerID] = rowHighlightClass
    await storage.set({ "row-highlight-data": rowHighlightData });
}

async function clearRowHighlight(playerID) {
    const { "row-highlight-data": rowHighlightData = {} } = await storage.get("row-highlight-data");
    delete rowHighlightData[playerID]
    await storage.set({ "row-highlight-data": rowHighlightData });
}

async function clearAllRowHighlights() {
    await storage.remove("row-highlight-data")
}

browser.runtime.onMessage.addListener((message) => {
    console.debug(`runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    // const playerRowColorRaw = {
    //     "playerRowColorFW": "playerRowColorFWAction",
    //     "playerRowColorLM": "playerRowColorLMAction",
    //     "playerRowColorRM": "playerRowColorRMAction",
    //     "playerRowColorOM": "playerRowColorOMAction",
    //     "playerRowColorDM": "playerRowColorDMAction",
    //     "playerRowColorCM": "playerRowColorCMAction",
    //     "playerRowColorLB": "playerRowColorLBAction",
    //     "playerRowColorRB": "playerRowColorRBAction",
    //     "playerRowColorCB": "playerRowColorCBAction",
    //     "clearRowColors": "playerRowColorClearAction"
    // }

    const prefix = "playerRowColor";
    const suffix = "Action";

    // highlighting and clearing specific rows
    if (message.action && message.action.startsWith(prefix) && message.action.endsWith(suffix)) {
        console.debug("message.action: ", message.action)
        const position = message.action.slice(prefix.length, -suffix.length)
        const tr = clickedRow
        if (tr) {
            tr.classList.forEach(cls => {
                if (cls.includes("_playerBackground")) {
                    tr.classList.remove(cls);
                }
            });

            // Select the first <a> inside a <td> whose href contains "/player/"
            const playerLink = tr.querySelector('td a[href*="/player/"]');
            // Match the number after /player/
            const match = playerLink.href.match(/\/player\/(\d+)/);
            const playerID = match ? match[1] : null;
            if (!playerID) {
                console.error("Tried to extract player ID from href ", playerLink.href, " but there are no matches")
            }
            clearRowHighlight(playerID)
            if (position !== "Clear") {
                const highlightClass = pluginNodeClass + "_playerBackground" + position
                tr.classList.add(highlightClass)
                storeRowHighlightClass(highlightClass, playerID)
            }
        }
        return
    }

    // clearing all rows
    if (message.action && message.action === "clearAllRowHighlightsMenuAction") {
        console.debug("clearing all rows")
        clearAllRowHighlights()
        let tableNode = document.querySelector("table.table")
        if (tableNode != undefined && tableNode.rows.length > 1) {
            processTableRows(tableNode)
        }
        return
    }

    if (message.url.endsWith("players") || message.url.endsWith("#Squad") || message.url.endsWith("training")) {
        // Start observing the target node for configured mutations
        rowsObserver.observe(alwaysPresentNode, rowsObservingConfig);
        console.debug(`Started the div.wrapper observation`)
    } else {
        rowsObserver.disconnect()
        console.debug(`Skipped (or disconnected) the div.wrapper observation`)
    }
})

var clickedRow = undefined
document.addEventListener("contextmenu", (event) => {
    clickedRow = event.target.closest("tr"); // get the closest <tr> ancestor
});

document.addEventListener("mouseover", (e) => {
    var enabled = false

    const row = e.target.closest("table.table tr")
    if (row) {
        console.debug(`it's a row`)

        // Select the first <a> inside a <td> whose href contains "/player/"
        const playerLink = row.querySelector('td a[href*="/player/"]');
        console.debug(`playerLink: `, playerLink)
        if (playerLink) {
            enabled = true
        }
    } else {
        console.debug(`it's NOT a row`)
    }

    console.debug(`Sending enabled: `, enabled)
    browser.runtime.sendMessage({ type: "contextMenuConfig", enabled });
});

addCSS(`
    .FinalWhistlePlugin_playerBackgroundFW {
        background-color: rgb(110 60 54 / 1.0);
    }
    .FinalWhistlePlugin_playerBackgroundCM {
        background-color: rgb(125 100 48 / 0.4);

        // background-image: 
        //     repeating-linear-gradient(
        //         45deg,
        //         transparent,
        //         transparent 5px,
        //         rgb(125 100 48 / 0.4) 5px,
        //         rgb(125 100 48 / 0.4) 10px
        //     ),
        //     repeating-linear-gradient(
        //         -45deg,
        //         transparent,
        //         transparent 5px,
        //         rgb(125 100 48 / 0.4) 5px,
        //         rgb(125 100 48 / 0.4) 10px
        //     );

        // background-image:
        //     repeating-linear-gradient(
        //         0deg,
        //         transparent 0 5px,
        //         rgb(100 100 100 / 0.2) 5px 10px
        //     ),
        //     repeating-linear-gradient(
        //         90deg,
        //         transparent 0 5px,
        //         rgb(100 100 100 / 0.2) 5px 10px
        //     );
    }
    .FinalWhistlePlugin_playerBackgroundCB {
        background-color: rgb(62 111 115 / 0.3);
    }
    .FinalWhistlePlugin_playerBackgroundLM {
        background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            rgb(125 100 48 / 0.4) 5px,
            rgb(125 100 48 / 0.4) 10px
        );
    }
    .FinalWhistlePlugin_playerBackgroundRM {
        background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 5px,
            rgb(125 100 48 / 0.4) 5px,
            rgb(125 100 48 / 0.4) 10px
        );
    }
    .FinalWhistlePlugin_playerBackgroundOM {
        background-image: repeating-linear-gradient(
            90deg, /* vertical stripes */
            transparent,
            transparent 5px,
            rgb(125 100 48 / 0.4) 5px,
            rgb(125 100 48 / 0.4) 10px
        );
    }
    .FinalWhistlePlugin_playerBackgroundDM {
        background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 5px,
            rgb(125 100 48 / 0.4) 5px,
            rgb(125 100 48 / 0.4) 10px
        );
    }
    .FinalWhistlePlugin_playerBackgroundLB {
        background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 5px,
            rgb(62 111 115 / 0.3) 5px,
            rgb(62 111 115 / 0.3) 10px
        );
    }
    .FinalWhistlePlugin_playerBackgroundRB {
        background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 5px,
            rgb(62 111 115 / 0.3) 5px,
            rgb(62 111 115 / 0.3) 10px
        );
    }
    `)