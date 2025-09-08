
console.log(`loading constants.js...`)

// The class for the new nodes inserted by the plugin, so that they can be easily found and managed later
const pluginNodeClass = "FinalWhistlePlugin"

// The node that will be observed for mutations
const alwaysPresentNode = document.querySelector("div.wrapper");

if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// Use chrome.storage.sync or chrome.storage.local
// (sync lets settings follow user across devices)
const storage = browser.storage.local;

function isString(value) {
    return typeof value === "string" || value instanceof String
}

const addCSS = css => document.head.appendChild(document.createElement("style")).innerHTML=css

console.log(`constants.js script loaded...`)
