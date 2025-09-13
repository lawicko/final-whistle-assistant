import { alwaysPresentNode, debounceAsync, FeatureFlagsKeys, isFeatureEnabled } from './utils.js';
import { processTags } from './tags.js';
import { processAcademyButtons } from './academy_buttons.js';
import { processMatchIndicators } from './calendar.js';
import { processMatch } from './match.js';
import { processPlayersPage } from './players.js';
import { processLineupPage } from './lineup.js';
import { processPlayerPage } from './player.js';
import { addTableRowsHighlighting } from './row_highlight.js';

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
        if (!currentMessage || !currentMessage.url) {
            return;
        }

        if (currentMessage.url.endsWith("/academy")) {
            await debouncedProcessAcademyPage();
        }

        if (currentMessage.url.endsWith("fixtures")) {
            await debouncedProcessFixturesPage();
        }

        if (currentMessage.url.includes("lineup")) {
            await debouncedProcessLineupPage();
        }

        if (currentMessage.url.includes("match/")) {
            await debouncedProcessMatchPage();
        }

        if (currentMessage.url.includes("player/")) {
            await debouncedProcessPlayerPage();
        }

        if (currentMessage.url.endsWith("players")) {
            await debouncedProcessPlayersPage();
        }

        if (currentMessage.url.endsWith("training#Drills")) {
            await debouncedProcessTrainingDrillsPage();
        }

        if (currentMessage.url.endsWith("training") || currentMessage.url.endsWith("training#Reports")) {
            await debouncedProcessTrainingPage();
        }

        if (currentMessage.url.endsWith("#Squad")) {
            await debouncedProcessSquadPage();
        }
    })
);

let currentMessage = null;

/**
 * Listens for messages from the background script about URL changes. ATTENTION: This method is critial for the handling of the DOM changes. Note how the currentMessage is not assigned if the message doesn't have a URL. The extension uses the messaging system to send other types of messages like context menu actions, which are not relevant for the DOM processing. It's important to ignore those messages here and not assign them to currentMessage, otherwise the observer will try to process the DOM based on an irrelevant message and likely fail. One example of this would be changing between FW, M, B and GK on the players page which doesn't send any messages at all but only changes the DOM. If a context menu message was the last one received, the observer would try to process the DOM with that message and fail.
 */
browser.runtime.onMessage.addListener((message) => {
    if (!message) {
        console.warn("work_dispatcher: runtime.onMessage called with undefined message");
        return;
    }
    console.debug("work_dispatcher: runtime.onMessage with message:", message);

    if (!message.url) {
        console.debug("work_dispatcher: Message arrived without URL, skipping...");
        return;
    }
    currentMessage = message;
    console.debug("work_dispatcher: assigned currentMessage to:", message);
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

const debouncedProcessPlayerPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.PLAYER_PAGE_ENHANCEMENTS)) {
            await processPlayerPage();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessPlayersPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.PLAYERS_PAGE_ENHANCEMENTS)) {
            await processPlayersPage();
        }
        if (await isFeatureEnabled(FeatureFlagsKeys.TAGS_ENHANCEMENTS)) {
            await processTags();
        }
        if (await isFeatureEnabled(FeatureFlagsKeys.ROW_HIGHLIGHT)) {
            await addTableRowsHighlighting();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessSquadPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.ROW_HIGHLIGHT)) {
            await addTableRowsHighlighting();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessLineupPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.LINEUP)) {
            await processLineupPage();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessTrainingPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.ROW_HIGHLIGHT)) {
            await addTableRowsHighlighting({ basicHighlight: true, persistentHighlight: false });
        }
        if (await isFeatureEnabled(FeatureFlagsKeys.TAGS_ENHANCEMENTS)) {
            await processTags();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessTrainingDrillsPage = makeDebouncedWithReconnect(
    async () => {
        if (await isFeatureEnabled(FeatureFlagsKeys.TAGS_ENHANCEMENTS)) {
            await processTags();
        }
    }, 500, alwaysPresentNode, observationConfig, universalObserver
);
