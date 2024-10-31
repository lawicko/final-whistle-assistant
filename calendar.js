const calendarModulePrefix = "calendar"

console.log(`${new Date().toLocaleString()} ${calendarModulePrefix}: calendar.js script loaded...`)

// Options for the observer (which mutations to observe)
const calendarObservactionConfig = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const calendarObservationCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        observer.disconnect()
        
        console.debug(`${new Date().toLocaleString()} ${calendarModulePrefix}: Found the following table: `,tableNode)
        
        let targetNodesYouth = document.querySelectorAll("span.badge-youth");
        targetNodesYouth.forEach((element) => element.innerHTML = "Y");
        
        let targetNodesSenior = document.querySelectorAll("span.badge-senior");
        targetNodesSenior.forEach((element) => element.innerHTML = "S");
        
        observer.observe(alwaysPresentNode, calendarObservactionConfig)
    } else {
        console.debug(`${new Date().toLocaleString()} ${calendarModulePrefix}: Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const calendarObserver = new MutationObserver(calendarObservationCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${new Date().toLocaleString()} ${calendarModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.endsWith("fixtures") || request.url.endsWith("club")) {
        // Start observing the target node for configured mutations
        calendarObserver.observe(alwaysPresentNode, calendarObservactionConfig);
        console.debug(`${new Date().toLocaleString()} ${calendarModulePrefix} Started the div.wrapper observation`)
    } else {
        calendarObserver.disconnect()
        console.debug(`${new Date().toLocaleString()} ${calendarModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})
