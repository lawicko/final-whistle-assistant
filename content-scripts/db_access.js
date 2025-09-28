if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome
}

export function getMatch(id) {
    return browser.runtime.sendMessage({ type: "getMatch", id });
}

export function getPlayer(id) {
    return browser.runtime.sendMessage({ type: "getPlayer", id });
}

export function addMatch(matchObj) {
    return browser.runtime.sendMessage({ type: "addMatch", data: matchObj });
}

export function addPlayer(playerObj) {
    return browser.runtime.sendMessage({ type: "addPlayer", data: playerObj });
}

export function updateMatch(id, changes) {
    return browser.runtime.sendMessage({ type: "updateMatch", id, changes });
}

export function deleteMatch(id) {
    return browser.runtime.sendMessage({ type: "deleteMatch", id });
}
