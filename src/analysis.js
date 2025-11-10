if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome
}

browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "render") {
        document.getElementById("app").innerHTML = msg.html
    }
});