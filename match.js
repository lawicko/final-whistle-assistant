const matchModulePrefix = "match"

console.log(`${matchModulePrefix}: match.js script loaded...`)

async function processMatch() {
    const dateElement = document.querySelector('div.col-md-2:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2)')
    const homeTeamElement = document.querySelector('div.col-lg-6:nth-child(1) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    const guestTeamElement = document.querySelector('div.col-6:nth-child(2) > div:nth-child(1) > div:nth-child(1) > h5:nth-child(1) > a:nth-child(2)')
    if (dateElement && dateElement.textContent && homeTeamElement && homeTeamElement.textContent && guestTeamElement && guestTeamElement.textContent) {
        console.info('Processing match from ', dateElement.textContent, ' between ', homeTeamElement.textContent, ' and ', guestTeamElement.textContent)
    } else {
        return // page not yet loaded
    }
    // Select all possible container divs (adjust the main wrapper class if needed)
    const allContainers = document.querySelectorAll('div.d-flex.align-items-center.mb-2');

    // Filter only those that contain an <i> with class 'bi-capsule' (light injury) or an <img> with src equal to assets/images/injury.png (serious injury)
    const filtered = Array.from(allContainers).filter(container =>
        container.querySelector('i.bi-capsule') || container.querySelector('img[src="assets/images/injury.png"]')
    );

    console.info("Injuried players: ", filtered);
    
}

// Options for the observer (which mutations to observe)
const matchObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const matchObservingCallback = (mutationList, observer) => {
    processMatch()
};

// Create an observer instance linked to the callback function
const matchObserver = new MutationObserver(matchObservingCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${matchModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.includes("match/")) {
        // Start observing the target node for configured mutations
        matchObserver.observe(alwaysPresentNode, matchObservingConfig);
        console.debug(`${matchModulePrefix} Started the div.wrapper observation`)
    } else {
        matchObserver.disconnect()
        console.debug(`${matchModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})
