import * as utils from "./utils.js"
import * as uiUtils from "./ui_utils.js"
import { processTags } from './tags.js'
import { processAcademyButtons } from './pages/academy/academy_buttons.js'
import { processFixturesPage } from './calendar.js'
import { processMatch } from './match.js'
import { processPlayersPage } from './players.js'
import { processLineupPage } from './lineup.js'
import { processPlayerPage } from './pages/player/player.js'
import { addTableRowsHighlighting } from './row_highlight.js'
import { processLeaguePage } from './pages/league/league.js'
import { processOpponentClubPage } from "./pages/club_opponent/club_opponent.js"
import { processTransferPage } from './pages/transfer/transfer.js'
import { processTrainingPage } from "./pages/training/training.js"
import * as dbUtils from './db_utils.js'
import { setNavBarItems } from './universal.js';

// How long to wait after the last mutation before processing the DOM (in ms)
const DEBOUNCE_WAIT_MS = 150;

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
        observer.disconnect()

        // console.info("createObserverCallback - mutationList:", mutationList)

        let skipFunctionCall = false
        outer: for (const mutationRecord of mutationList) {
            const addedOrRemoved = [...mutationRecord.addedNodes, ...mutationRecord.removedNodes]
            if (addedOrRemoved.length < 1 || addedOrRemoved.length > 1) continue
            // console.info("mutationRecord.addedNodes:", mutationRecord.addedNodes)
            // console.info("mutationRecord.removedNodes:", mutationRecord.removedNodes)
            for (const node of addedOrRemoved) {
                if (
                    node.nodeType === Node.ELEMENT_NODE &&
                    (
                        node.matches("ngb-popover-window.popover[role=tooltip]") ||
                        node.matches("div.hovercard-detail.hovercard-active") ||
                        node.matches("div.ngx-spinner.ng-star-inserted") ||
                        node.matches("div.ngx-bar.ng-star-inserted")
                    )
                ) {
                    // console.info("skipping because of:", node)
                    skipFunctionCall = true
                    break outer
                }
            }
        }

        if (skipFunctionCall) {
            observer.observe(targetNode, config)
        } else {
            try {
                await fn(mutationList, observer)
            } catch (e) {
                console.error("Observer callback error:", e)
            }
        }
    };
}

function makeDebouncedWithReconnect(fn, wait, targetNode, config, observer) {
    return utils.debounceAsync(async (...args) => {
        try {
            await fn(...args);
        } catch (e) {
            console.error("Error in debounced function:", e);
        } finally {
            observer.observe(targetNode, config); // ✅ reconnect here
        }
    }, wait);
}

async function dispatchWork(currentMessage) {
    if (!currentMessage || !currentMessage.url) {
        return
    }

    if (currentMessage.url.endsWith("/academy")) {
        await debouncedProcessAcademyPage()
    }

    if (currentMessage.url.endsWith("fixtures")) {
        await debouncedProcessFixturesPage()
    }

    if (currentMessage.url.includes("league")) {
        await debouncedProcessLeaguePage()
    }

    if (currentMessage.url.includes("lineup")) {
        await debouncedProcessLineupPage()
    }

    if (currentMessage.url.includes("match/")) {
        await debouncedProcessMatchPage()
    }

    if (currentMessage.url.includes("player/")) {
        await debouncedProcessPlayerPage()
    }

    if (currentMessage.url.endsWith("players")) {
        await debouncedProcessPlayersPage()
    }

    // training pattern with possible # at the end
    const trainingPattern = /training/
    if (trainingPattern.test(currentMessage.url)) {
        await debouncedProcessTrainingPage()
    }

    // transfer pattern with possible # at the end
    const transferPattern = /transfer/
    if (transferPattern.test(currentMessage.url)) {
        await debouncedProcessTransfersPage()
    }

    // club pattern with # at the end for the selected tab
    const clubPattern = /club\/\d+#/
    if (clubPattern.test(currentMessage.url)) {
        await debouncedProcessOpponentClubPage()
    }
}

const universalObserver = new MutationObserver(
    createObserverCallback(uiUtils.alwaysPresentNode, observationConfig, async () => {
        console.debug("universalObserver: dispatching work with the last known message:", lastMessageFromBackground);
        dispatchWork(lastMessageFromBackground)
    })
);

let lastMessageFromBackground = null;

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
    lastMessageFromBackground = message;
    console.debug("work_dispatcher: runtime.onMessage assigned lastMessageFromBackground to:", message)
    dispatchWork(message)
    return true;
});

// Start observing once
universalObserver.observe(uiUtils.alwaysPresentNode, observationConfig);

// Debounced processors with auto-reconnect
const debouncedProcessAcademyPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.AcademyButtonsSeparation)) {
            processAcademyButtons();
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessFixturesPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.MatchBadgeEnhancement)) {
            await processFixturesPage();
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessLeaguePage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.MatchDataGathering)) {
            await processLeaguePage();
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessMatchPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.MatchDataGathering)) {
            await processMatch();
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessPlayerPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.PlayerPageAdditions)) {
            await processPlayerPage();
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessPlayersPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.PlayersPageAdditions)) {
            await processPlayersPage();
        }
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.TagsEnhancement)) {
            await processTags();
        }
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.RowHighlighting)) {
            await addTableRowsHighlighting();
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessOpponentClubPage = makeDebouncedWithReconnect(
    async () => {
        await processOpponentClubPage()
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessLineupPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.LineupPageAdditions)) {
            await processLineupPage()
        }
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
);

const debouncedProcessTrainingPage = makeDebouncedWithReconnect(
    async () => {
        await processTrainingPage()
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
)

const debouncedProcessTransfersPage = makeDebouncedWithReconnect(
    async () => {
        if (await dbUtils.isFeatureEnabled(dbUtils.FeatureFlagsKeys.RowHighlighting)) {
            await addTableRowsHighlighting({ basicHighlight: true, persistentHighlight: false });
        }
        await processTransferPage()
        await setNavBarItems()
    }, DEBOUNCE_WAIT_MS, uiUtils.alwaysPresentNode, observationConfig, universalObserver
)