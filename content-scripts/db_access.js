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
