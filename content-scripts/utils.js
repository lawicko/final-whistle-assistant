// The class for the new nodes inserted by the plugin, so that they can be easily found and managed later
export const pluginNodeClass = "FinalWhistlePlugin"

// The node that will be observed for mutations
export const alwaysPresentNode = document.querySelector("div.wrapper");

if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// Use sync or local
export const storage = browser.storage.local;
export const optionsStorage = browser.storage.sync;

export function isString(value) {
    return typeof value === "string" || value instanceof String
}

export function lastPathComponent(url) {
    try {
        const u = new URL(url);         // parse the URL
        const parts = u.pathname.split("/").filter(Boolean);
        return parts.pop() || "";       // last component or "" if none
    } catch (err) {
        console.error("Invalid URL:", url, err);
        return null;
    }
}

/**
 * Inject CSS into the page safely without duplicates
 * @param {string} css - The CSS string to inject
 * @param {string} id - Optional unique ID for this style block
 */
export const addCSS = (css, id = "custom-style") => {
    // If style with same ID already exists, skip
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
};

/**
 * Debounce an async function, ensuring it runs only once after the specified delay
 * since the last call.
 * @param {Function} fn - The async function to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
export function debounceAsync(fn, delay = 100) {
    let timeout;

    return async (...args) => {
        clearTimeout(timeout);

        timeout = setTimeout(async () => {
            try {
                await fn(...args);
            } catch (e) {
                console.error("Debounced async error:", e);
            }
        }, delay);
    };
}

export const FeatureFlagsKeys = {
    ACADEMY_BUTTONS: "academy_buttons",
    LETTERS_YOUTH_SENIOR: "calendar",
    LINEUP: "lineup",
    MATCH_DATA_GATHERING: "match",
    PLAYER_PAGE_ENHANCEMENTS: "player",
    PLAYERS_PAGE_ENHANCEMENTS: "players",
    ROW_HIGHLIGHT: "row_highlight",
    TAGS_ENHANCEMENTS: "tags"
};

export async function isFeatureEnabled(featureKey) {
    const { modules = {} } = await optionsStorage.get(["modules"]);
    return modules[featureKey] === true;
}