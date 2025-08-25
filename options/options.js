if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// Use chrome.storage.sync or chrome.storage.local
// (sync lets settings follow user across devices)
const storage = browser.storage.local;

// Save settings when changed
function saveOptions() {
    // Collect all checkboxes
    const modules = {
        academy_buttons: document.getElementById('academy_buttons').checked,
        calendar: document.getElementById('calendar').checked,
        player: document.getElementById('player').checked,
        players: document.getElementById('players').checked,
        row_highlight: document.getElementById('row_highlight').checked,
        tags: document.getElementById('tags').checked,
        lineup: document.getElementById('lineup').checked,
    };

    // Collect all colors
    const colors = {};
    for (let i = 1; i <= 9; i++) {
        colors[`color${i}`] = document.getElementById(`color${i}`).value;
    }
    
    // Collect tresholds
    const tresholds = {
        composure_treshold: document.getElementById('composure_treshold').value,
        arrogance_treshold: document.getElementById('arrogance_treshold').value
    };

    // Save both to storage
    storage.set({ modules, colors, tresholds}, () => {
        console.log("Options saved", { modules, colors, tresholds});
    });
}

// Restore settings when page is opened
function restoreOptions() {
    storage.get(["modules", "colors", "tresholds"], (result) => {
        if (result.modules) {
            Object.keys(result.modules).forEach((key) => {
                const el = document.getElementById(key);
                if (el) el.checked = result.modules[key];
            });
        }

        if (result.colors) {
            Object.keys(result.colors).forEach((key) => {
                const el = document.getElementById(key);
                if (el) el.value = result.colors[key];
            });
        }
        
        if (result.tresholds) {
            Object.keys(result.tresholds).forEach((key) => {
                const el = document.getElementById(key);
                if (el) el.value = result.tresholds[key];
            });
        }
    });
}

// Add listeners to inputs
document.addEventListener("DOMContentLoaded", restoreOptions);

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", saveOptions);
});
