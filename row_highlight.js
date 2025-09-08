const pluginRowHighlightClass = "player-selected"

console.log(`loading row_highlight.js...`)

function toggleClass(el, className) {
    if (el.className.indexOf(className) >= 0) {
        el.className = el.className.replace(` ${className}`, "");
    } else {
        el.className += ` ${className}`;
    }
}

function setOnClickForTableRows(tableNode) {
    for (let i = 1; i < tableNode.rows.length; i++) {
        tableNode.rows[i].onclick = function () { toggleClass(this, pluginRowHighlightClass) }
    }
}

// Options for the observer (which mutations to observe)
const rowsObservingConfig = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const rowsObservingCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {

        console.debug(`Found the following table: `, tableNode)

        setOnClickForTableRows(tableNode)

        const c = (mutationList, observer) => {
            console.debug(`table has changed`)
            observer.disconnect()

            setOnClickForTableRows(tableNode)

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

browser.runtime.onMessage.addListener((message) => {
    console.debug(`runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    const playerRowColorRaw = {
        "playerRowColorForward": "playerRowColorForwardAction",
        "playerRowColorMidfieldLeft": "playerRowColorMidfieldLeftAction",
        "playerRowColorMidfieldRight": "playerRowColorMidfieldRightAction",
        "playerRowColorMidfieldCenter": "playerRowColorMidfieldCenterAction",
        "playerRowColorDefenceLeft": "playerRowColorDefenceLeftAction",
        "playerRowColorDefenceRight": "playerRowColorDefenceRightAction",
        "playerRowColorDefenceCenter": "playerRowColorDefenceCenterAction"
    }

    const prefix = "playerRowColor";
    const suffix = "Action";

    if (message.action && message.action.startsWith(prefix) && message.action.endsWith(suffix)) {
        const position = message.action.slice(prefix.length, -suffix.length)
        const tr = document.querySelector("tr:hover");
        if (tr) {
            if (position !== "Clear") {
                tr.classList.add(pluginNodeClass + "_playerBackground" + position)
            } else {
                tr.classList.forEach(cls => {
                    if (cls.includes("_playerBackground")) {
                        tr.classList.remove(cls);
                    }
                });
            }
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

document.addEventListener("mouseover", (e) => {
    var enabled = false
    var enabledForOwnPlayers = false
    var enabledForOtherPlayers = false

    const row = e.target.closest("table.table tr")
    if (row) {
        console.debug(`it's a row`)
        enabledForOwnPlayers = row.querySelector("td fw-player-hover") !== null;
        console.debug(`enabledForOwnPlayers: `, enabledForOwnPlayers)

        otherPlayerLink = row.querySelector("td > a");
        console.debug(`otherPlayerLink: `, otherPlayerLink)
        if (otherPlayerLink && otherPlayerLink.href.includes("player/")) {
            enabledForOtherPlayers = true
        }
        console.debug(`enabledForOtherPlayers: `, enabledForOtherPlayers)
    } else {
        console.debug(`it's NOT a row`)
    }

    enabled = enabledForOwnPlayers || enabledForOtherPlayers
    console.debug(`Sending enabled: `, enabled)
    browser.runtime.sendMessage({ type: "contextMenuConfig", enabled });
});

addCSS(`
    .FinalWhistlePlugin_playerBackgroundForward {
        background-color: rgb(110 60 54 / 1.0);
    }
    .FinalWhistlePlugin_playerBackgroundMidfieldCenter {
        background-color: rgb(125 100 48 / 0.5);
    }
    .FinalWhistlePlugin_playerBackgroundDefenceCenter {
        background-color: rgb(62 111 115 / 0.3);
    }
    .FinalWhistlePlugin_playerBackgroundMidfieldLeft {
        background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgb(125 100 48 / 0.5) 10px,
            rgb(125 100 48 / 0.5) 20px
        );
    }
    .FinalWhistlePlugin_playerBackgroundMidfieldRight {
        background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgb(125 100 48 / 0.5) 10px,
            rgb(125 100 48 / 0.5) 20px
        );
    }
    .FinalWhistlePlugin_playerBackgroundDefenceLeft {
        background-image: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgb(62 111 115 / 0.3) 10px,
            rgb(62 111 115 / 0.3) 20px
        );
    }
    .FinalWhistlePlugin_playerBackgroundDefenceRight {
        background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 10px,
            rgb(62 111 115 / 0.3) 10px,
            rgb(62 111 115 / 0.3) 20px
        );
    }
    `)