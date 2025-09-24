import { toggleClass, alwaysPresentNode } from "./ui_utils";
import { storage, pluginNodeClass, version } from "./utils.js";

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

let rowWithMouseOver
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
            rowWithMouseOver = row
        }
    } else {
        // console.debug(`it's NOT a row`)
        rowWithMouseOver = undefined
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
            setRowColoringForPosition(tr, position)
        }
        return
    }

    // clearing the rows on the page
    if (message.action === "clearAllRowsOnThisPageMenuAction") {
        console.debug("row_highlight: clear all rows on the page")
        await clearAllRowsOnThisPage()
        let tableNode = document.querySelector("table.table")
        if (tableNode != undefined && tableNode.rows.length > 1) {
            processTableRows(tableNode)
        }
        return
    }

    // clearing all rows
    if (message.action === "clearAllRowHighlightsMenuAction") {
        console.debug("row_highlight: clearing all rows")
        await clearAllRowHighlights()
        let tableNode = document.querySelector("table.table")
        if (tableNode != undefined && tableNode.rows.length > 1) {
            processTableRows(tableNode)
        }
        return
    }
}

function setRowColoringForPosition(tr, position) {
    tr.classList.forEach(cls => {
        if (cls.includes("_playerBackground")) {
            tr.classList.remove(cls);
        }
    });

    const playerID = getPlayerIDFromRow(tr)
    if (!playerID) {
        console.error("Tried to extract player ID from tr ", tr, " but there are no matches")
        return
    }
    clearRowHighlight(playerID)
    if (position !== "Clear") {
        const highlightClass = pluginNodeClass + "_playerBackground" + position
        tr.classList.add(highlightClass)
        storeRowHighlightClass(highlightClass, playerID)
    }
}

function handleKeyboardShortcutForPosition(rowWithMouseOver, position) {
    let alreadyLabeledWithPosition = false
    rowWithMouseOver.classList.forEach(cls => {
        if (cls.includes("_playerBackground" + position)) {
            rowWithMouseOver.classList.remove(cls);
            alreadyLabeledWithPosition = true
        }
    });
    if (alreadyLabeledWithPosition) {
        const playerID = getPlayerIDFromRow(rowWithMouseOver)
        if (!playerID) {
            console.error("Tried to extract player ID from rowWithMouseOver ", rowWithMouseOver, " but there are no matches")
            return
        }
        clearRowHighlight(playerID)
    } else {
        setRowColoringForPosition(rowWithMouseOver, position)
    }
}

function getShortcutCallback(position) {
    return () => {
        console.debug("⚡ Keyboard shortcut called on", rowWithMouseOver)

        if (!rowWithMouseOver) {
            console.debug("keyDownListener invoked but the mouse is not pointing to a player row but to", rowWithMouseOver)
            return
        } else {
            handleKeyboardShortcutForPosition(rowWithMouseOver, position)
        }
    }
}

let shortcutsMap = {
    "q": getShortcutCallback("LW"),
    "w": getShortcutCallback("FW"),
    "shift+w": getShortcutCallback("OM"),
    "e": getShortcutCallback("RW"),
    "a": getShortcutCallback("LM"),
    "s": getShortcutCallback("CM"),
    "shift+s": getShortcutCallback("DM"),
    "d": getShortcutCallback("RM"),
    "z": getShortcutCallback("LB"),
    "shift+z": getShortcutCallback("LWB"),
    "x": getShortcutCallback("CB"),
    "c": getShortcutCallback("RB"),
    "shift+c": getShortcutCallback("RWB")
}
const keyDownListener = (event) => {
    const parts = [];

    if (event.ctrlKey) parts.push("ctrl");
    if (event.shiftKey) parts.push("shift");
    if (event.altKey) parts.push("alt");

    parts.push(event.key.toLowerCase());

    const combo = parts.join("+");
    // console.info("combo:",combo)

    if (shortcutsMap[combo]) {
        // event.preventDefault();
        shortcutsMap[combo](event);
    }
}

async function processTableRows(tableNode, config = {
    basicHighlight: true,
    persistentHighlight: true
}) {
    console.info(`${version} ✨ Adding row highlighting`)
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
                continue
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
    if (config.persistentHighlight) {
        document.addEventListener("mouseover", mouseOverListener);
        document.addEventListener("keydown", keyDownListener);
        document.addEventListener("contextmenu", contextMenuListener);
        browser.runtime.onMessage.addListener(onMessageListener);
    } else {
        document.removeEventListener("mouseover", mouseOverListener);
        document.removeEventListener("keydown", keyDownListener);
        document.removeEventListener("contextmenu", contextMenuListener);
        browser.runtime.onMessage.removeListener(onMessageListener);
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
    await storage.set({ "row-highlight-data": rowHighlightData })
}

async function clearAllRowsOnThisPage() {
    const { "row-highlight-data": rowHighlightData = {} } = await storage.get("row-highlight-data");
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        for (let i = 1; i < tableNode.rows.length; i++) {
            const tr = tableNode.rows[i]
            const playerID = getPlayerIDFromRow(tr)
            if (!playerID) {
                console.error("Tried to extract player ID from tr ", tr, " but there are no matches")
                continue
            }
            console.debug("removing row highlighting for", playerID)
            delete rowHighlightData[playerID]
        }
        await storage.set({ "row-highlight-data": rowHighlightData })
    }
}

async function clearAllRowHighlights() {
    await storage.remove("row-highlight-data")
}