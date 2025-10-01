if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome
}

export function getColors() {
    return browser.runtime.sendMessage({ type: "getColors" });
}

export function putColors(colorsData) {
    return browser.runtime.sendMessage({ type: "putColors", data: colorsData });
}

export function getFeatures() {
    return browser.runtime.sendMessage({ type: "getFeatures" });
}

export function putFeatures(featuresData) {
    return browser.runtime.sendMessage({ type: "putFeatures", data: featuresData });
}

export function getTresholds() {
    return browser.runtime.sendMessage({ type: "getTresholds" });
}

export function putTresholds(tresholdsData) {
    return browser.runtime.sendMessage({ type: "putTresholds", data: tresholdsData });
}

export function getCheckboxes() {
    return browser.runtime.sendMessage({ type: "getCheckboxes" });
}

export function putCheckboxes(checkboxesData) {
    return browser.runtime.sendMessage({ type: "putCheckboxes", data: checkboxesData });
}

export function getRowHighlights() {
    return browser.runtime.sendMessage({ type: "getRowHighlights" });
}

export function putRowHighlights(rowHighlightsData) {
    return browser.runtime.sendMessage({ type: "putRowHighlights", data: rowHighlightsData });
}

export function getMatch(id) {
    return browser.runtime.sendMessage({ type: "getMatch", id });
}

export function getPlayer(id) {
    return browser.runtime.sendMessage({ type: "getPlayer", id });
}

export function bulkGetPlayers(keysArray) {
    return browser.runtime.sendMessage({ type: "bulkGetPlayers", keysArray: keysArray })
}

export function putMatch(matchObj) {
    return browser.runtime.sendMessage({ type: "putMatch", data: matchObj });
}

export function putPlayer(playerObj) {
    return browser.runtime.sendMessage({ type: "putPlayer", data: playerObj });
}

export function bulkPutPlayers(playersArray) {
    return browser.runtime.sendMessage({ type: "bulkPutPlayers", data: playersArray })
}

export function updateMatch(id, changes) {
    return browser.runtime.sendMessage({ type: "updateMatch", id, changes });
}

export function deleteMatch(id) {
    return browser.runtime.sendMessage({ type: "deleteMatch", id });
}
