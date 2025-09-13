import { alwaysPresentNode, debounceAsync, FeatureFlagsKeys, isFeatureEnabled } from './utils.js';
import { processTags } from './tags.js';
import { processAcademyButtons } from './academy_buttons.js';
import { processMatchIndicators } from './calendar.js';
import { processMatch } from './match.js';
import { processPlayersPage } from './players.js';

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
        } catch (e) {
            console.error("Observer callback error:", e);
        }
        // ❌ No observer.observe here
    };
}

function makeDebouncedWithReconnect(fn, wait, targetNode, config, observer) {
    return debounceAsync(async (...args) => {
        try {
            await fn(...args);
        } catch (e) {
            console.error("Error in debounced function:", e);
        } finally {
            observer.observe(targetNode, config); // ✅ reconnect here
        }
    }, wait);
}

const universalObserver = new MutationObserver(
    createObserverCallback(alwaysPresentNode, observationConfig, async () => {
        if (!currentMessage) return;

        if (currentMessage.url.endsWith("/academy")) {
            await debouncedProcessAcademyPage();
        }

        if (currentMessage.url.endsWith("fixtures")) {
            await debouncedProcessFixturesPage();
        }

        if (currentMessage.url.includes("match/")) {
            await debouncedProcessMatchPage();
        }

        if (currentMessage.url.endsWith("players")) {
            await debouncedProcessPlayersPage();
        }

        if (
            currentMessage.url.endsWith("training") ||
            currentMessage.url.endsWith("training#Reports") ||
            currentMessage.url.endsWith("training#Drills")
        ) {
            if (await isFeatureEnabled(FeatureFlagsKeys.TAGS_ENHANCEMENTS)) {
                debouncedProcessTags();
            }
        }
    })
);

let currentMessage = null;

browser.runtime.onMessage.addListener((message) => {
    if (!message) {
        console.warn("runtime.onMessage called with undefined message");
        return;
    }
    console.debug("runtime.onMessage with message:", message);

    currentMessage = message;
});

// Start observing once
universalObserver.observe(alwaysPresentNode, observationConfig);

// Debounced processors with auto-reconnect
const debouncedProcessAcademyPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.ACADEMY_BUTTONS)) {
            processAcademyButtons();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessFixturesPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.LETTERS_YOUTH_SENIOR)) {
            await processMatchIndicators();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessMatchPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.MATCH_DATA_GATHERING)) {
            await processMatch();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessTags = makeDebouncedWithReconnect(
    processTags, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessPlayersPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.PLAYERS_PAGE_ENHANCEMENTS)) {
            await processPlayersPage();
        }
        if (await isFeatureEnabled(FeatureFlagsKeys.TAGS_ENHANCEMENTS)) {
            await processTags();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);
