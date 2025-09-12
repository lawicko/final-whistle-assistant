import { alwaysPresentNode } from './utils.js';
import { processTags } from './tags.js';

// Options for the observer (which mutations to observe)
const observationConfig = { attributes: false, childList: true, subtree: true, characterData: false }

/**
 * Wraps a MutationObserver callback so it:
 * 1. disconnects the observer
 * 2. runs custom async code
 * 3. re-attaches the observer
 *
 * @param {Node} targetNode - The node to observe again
 * @param {Object} config - The observation config
 * @param {Function} fn - Async function to run while disconnected
 * @returns {Function} The wrapped callback for the observer
 */
function createObserverCallback(targetNode, config, fn) {
    return async (mutationList, observer) => {
        observer.disconnect();

        try {
            await fn(mutationList, observer);
        } finally {
            observer.observe(targetNode, config);
        }
    };
}

const tagsObserver = new MutationObserver(
    createObserverCallback(alwaysPresentNode, observationConfig, async () => {
        await processTags();
    })
);

browser.runtime.onMessage.addListener((message) => {
    console.debug(`runtime.onMessage with message:`, message);

    if (!message) {
        console.warn('runtime.onMessage called, but the message is undefined')
        return
    }

    const url = message.url
    if (url) {
        if (
            message.url.endsWith("players") ||
            message.url.endsWith("training") ||
            message.url.endsWith("training#Reports") ||
            message.url.endsWith("training#Drills")){
            // A case for the tags processing
            tagsObserver.observe(alwaysPresentNode, observationConfig);
        } else {
            tagsObserver.disconnect()
        }
    }
})