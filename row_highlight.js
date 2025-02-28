if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

const pluginRowHighlightClass = "player-selected"
const rowHighlightModulePrefix = "row_highlight"

console.log(`${new Date().toLocaleString()} ${rowHighlightModulePrefix}: row_highlight.js script loaded...`)

function toggleClass(el, className) {
    if (el.className.indexOf(className) >= 0) {
        el.className = el.className.replace(` ${className}`,"");
    } else {
        el.className  += ` ${className}`;
    }
}

function setOnClickForTableRows(tableNode) {
    for (let i = 1; i < tableNode.rows.length; i++) {
        tableNode.rows[i].onclick = function() { toggleClass(this, pluginRowHighlightClass) }
    }
}

// Options for the observer (which mutations to observe)
const rowsObservingConfig = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const rowsObservingCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        
        console.debug(`${new Date().toLocaleString()} ${rowHighlightModulePrefix}: Found the following table: `,tableNode)
        
        setOnClickForTableRows(tableNode)
        
        const c = (mutationList, observer) => {
            console.debug(`${new Date().toLocaleString()} ${rowHighlightModulePrefix}: table has changed`)
            observer.disconnect()
            
            setOnClickForTableRows(tableNode)
            
            observer.observe(tableNode, { childList: true, subtree: true, characterData: true })
        }
        const o = new MutationObserver(c)
        console.debug(`${new Date().toLocaleString()} ${rowHighlightModulePrefix}: starting the table observation...`)
        o.observe(tableNode, { childList: true, subtree: true, characterData: true })
    } else {
        console.debug(`${new Date().toLocaleString()} ${rowHighlightModulePrefix}: Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const rowsObserver = new MutationObserver(rowsObservingCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${new Date().toLocaleString()} ${rowHighlightModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.endsWith("players") || request.url.endsWith("#Squad") || request.url.endsWith("training")) {
        // Start observing the target node for configured mutations
        rowsObserver.observe(alwaysPresentNode, rowsObservingConfig);
        console.debug(`${new Date().toLocaleString()} ${rowHighlightModulePrefix} Started the div.wrapper observation`)
    } else {
        rowsObserver.disconnect()
        console.debug(`${new Date().toLocaleString()} ${rowHighlightModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})
