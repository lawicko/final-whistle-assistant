import { toggleClass } from "./ui_utils";
import { alwaysPresentNode, storage, pluginNodeClass } from "./utils.js";

// Helpers
function getPlayerIDFromRow(tr) {
    // Select the first <a> inside a <td> whose href contains "/player/"
    const playerLink = tr.querySelector('td a[href*="/player/"]');
    // Match the number after /player/
    const match = playerLink.href.match(/\/player\/(\d+)/);
    const playerID = match ? match[1] : null;
    return playerID
}

// Event listeners
let clickedRow

const contextMenuListener = (event) => {
    clickedRow = event.target.closest("tr"); // get the closest <tr> ancestor
}

const mouseOverListener = (e) => {
    var enabled = false

    const row = e.target.closest("table.table tr")
    if (row) {
        // console.debug(`it's a row`)

        // Select the first <a> inside a <td> whose href contains "/player/"
        const playerLink = row.querySelector('td a[href*="/player/"]');
        // console.debug(`playerLink: `, playerLink)
        if (playerLink) {
            enabled = true
        }
    } else {
        // console.debug(`it's NOT a row`)
    }

    browser.runtime.sendMessage({ type: "contextMenuConfig", enabled });
}

const onMessageListener = async (message) => {
    console.debug(`row_highlight: runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    if (!message.action) {
        console.debug('row_highlight: runtime.onMessage arrived in row_highlight, but the message.action is undefined, skiping...')
        return
    } else {
        console.debug("row_highlight: message.action: ", message.action)
    }

    // const playerRowColorRaw = {
    //     "playerRowColorFW": "playerRowColorFWAction",
    //     "playerRowColorLW": "playerRowColorLWAction",
    //     "playerRowColorLM": "playerRowColorLMAction",
    //     "playerRowColorRW": "playerRowColorRWAction",
    //     "playerRowColorRM": "playerRowColorRMAction",
    //     "playerRowColorOM": "playerRowColorOMAction",
    //     "playerRowColorCM": "playerRowColorCMAction",
    //     "playerRowColorDM": "playerRowColorDMAction",
    //     "playerRowColorLWB": "playerRowColorLWBAction",
    //     "playerRowColorLB": "playerRowColorLBAction",
    //     "playerRowColorRWB": "playerRowColorRWBAction",
    //     "playerRowColorRB": "playerRowColorRBAction",
    //     "playerRowColorCB": "playerRowColorCBAction",
    //     "clearRowColors": "playerRowColorClearAction"
    // }

    const prefix = "playerRowColor";
    const suffix = "Action";

    // highlighting and clearing specific rows
    if (message.action.startsWith(prefix) && message.action.endsWith(suffix)) {
        console.debug("row_highlight: highlighting/clearing specific row")
        const position = message.action.slice(prefix.length, -suffix.length)
        const tr = clickedRow
        if (tr) {
            tr.classList.forEach(cls => {
                if (cls.includes("_playerBackground")) {
                    tr.classList.remove(cls);
                }
            });

            const playerID = getPlayerIDFromRow(tr)
            if (!playerID) {
                console.error("Tried to extract player ID from tr ", tr, " but there are no matches")
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
    if (message.action === "clearAllRowHighlightsMenuAction") {
        console.debug("row_highlight: clearing all rows")
        clearAllRowHighlights()
        let tableNode = document.querySelector("table.table")
        if (tableNode != undefined && tableNode.rows.length > 1) {
            processTableRows(tableNode)
        }
        return
    }
}

async function processTableRows(tableNode, config = {
    basicHighlight: true,
    persistentHighlight: true
}) {
    console.info("Adding row highlighting...")
    const { "row-highlight-data": rowHighlightData = {} } = await storage.get("row-highlight-data");
    for (let i = 1; i < tableNode.rows.length; i++) {
        const tr = tableNode.rows[i]
        if (config.basicHighlight) {
            const pluginRowHighlightClass = "player-selected"
            tr.onclick = function () {
                console.debug("Toggling row highlight for row: ", tr)
                toggleClass(this, pluginRowHighlightClass)
            }
        }

        if (config.persistentHighlight) {
            const playerID = getPlayerIDFromRow(tr)
            if (!playerID) {
                console.error("Tried to extract player ID from tr ", tr, " but there are no matches")
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
            document.addEventListener("mouseover", mouseOverListener);
            document.addEventListener("contextmenu", contextMenuListener);
            browser.runtime.onMessage.addListener(onMessageListener);
        } else {
            document.removeEventListener("mouseover", mouseOverListener);
            document.removeEventListener("contextmenu", contextMenuListener);
            browser.runtime.onMessage.removeListener(onMessageListener);
        }
    }
}

export async function addTableRowsHighlighting(config = {
    basicHighlight: true,
    persistentHighlight: true
}) {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        console.debug(`Found the following table: `, tableNode)

        processTableRows(tableNode, config)
    }
}

// Saving to storage
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