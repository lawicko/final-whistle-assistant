const tagsModulePrefix = "tags"

console.log(`${new Date().toLocaleString()} ${tagsModulePrefix}: tags.js script loaded...`)

// Options for the observer (which mutations to observe)
const tagsObservactionConfig = { attributes: false, childList: true, subtree: true, characterData: false }

// Callback function to execute when mutations are observed
const tagsObservationCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        observer.disconnect()
        
        console.debug(`${new Date().toLocaleString()} ${tagsModulePrefix}: Found the following table: `,tableNode)
        
        tableNode.querySelectorAll(`td > fw-player-hover > div.hovercard > sup`).forEach((el, idx) => {
            let supNode = el
            let currentClass = supNode.className
            
            let tagNode = supNode.querySelector(`i`)
            let tagRemoved = supNode.removeChild(tagNode)
            tagRemoved.className  += ` ${currentClass}`
            supNode.parentNode.insertBefore(tagRemoved, supNode)
            supNode.remove()
        })
        
        observer.observe(alwaysPresentNode, calendarObservactionConfig)
    } else {
        console.debug(`${new Date().toLocaleString()} ${tagsModulePrefix}: Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const tagsObserver = new MutationObserver(tagsObservationCallback);

addCSS(".fa-tag::before { text-shadow: -1px 0 black, 0 1px black, 1px 0 black, 0 -1px black; }")

browser.runtime.onMessage.addListener((request) => {
    console.log(`${new Date().toLocaleString()} ${tagsModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.endsWith("players") || request.url.endsWith("training") || request.url.endsWith("training#Reports") || request.url.endsWith("training#Drills")) {
        // Start observing the target node for configured mutations
        tagsObserver.observe(alwaysPresentNode, tagsObservactionConfig);
        console.debug(`${new Date().toLocaleString()} ${tagsModulePrefix} Started the div.wrapper observation`)
    } else {
        tagsObserver.disconnect()
        console.debug(`${new Date().toLocaleString()} ${tagsModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})
