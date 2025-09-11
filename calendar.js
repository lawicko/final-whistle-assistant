console.log(`loading calendar.js...`)

// Options for the observer (which mutations to observe)
const calendarObservactionConfig = { attributes: false, childList: true, subtree: true };

// Callback function to execute when mutations are observed
const calendarObservationCallback = async (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.tBodies[0] && tableNode.tBodies[0].rows.length > 1) {
        observer.disconnect()
        console.debug(`Found the following table: `, tableNode)

        const { matchesInStorage = {} } = await storage.get("matches");
        console.debug("matchesInStorage:", matchesInStorage)

        const tbody = tableNode.tBodies[0]; // first tbody
        Array.from(tbody.rows).forEach(row => {
            // Add Y and S to the badges on the left
            let targetNodesYouth = document.querySelectorAll("span.badge-youth");
            targetNodesYouth.forEach((element) => {
                element.textContent = "Y";
            });

            let targetNodesSenior = document.querySelectorAll("span.badge-senior");
            targetNodesSenior.forEach((element) => {
                element.textContent = "S";
            });

            // Check if we are missing any matches for analysis
        });

        observer.observe(alwaysPresentNode, calendarObservactionConfig)
    } else {
        console.debug(`Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const calendarObserver = new MutationObserver(calendarObservationCallback);

browser.runtime.onMessage.addListener((message) => {
    console.debug(`runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    const url = message.url
    if (url) {
        if (message.url.endsWith("fixtures") || message.url.endsWith("club")) {
            // Start observing the target node for configured mutations
            calendarObserver.observe(alwaysPresentNode, calendarObservactionConfig);
            console.debug(`Started the div.wrapper observation`)
        } else {
            calendarObserver.disconnect()
            console.debug(`Skipped (or disconnected) the div.wrapper observation`)
        }
    }
})
