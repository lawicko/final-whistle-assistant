// Use chrome.storage.sync or chrome.storage.local
// (sync lets settings follow user across devices)
const storage = chrome.storage.local;

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
    };

    // Collect all colors
    const colors = {};
    for (let i = 1; i <= 9; i++) {
        colors[`color${i}`] = document.getElementById(`color${i}`).value;
    }

    // Save both to storage
    storage.set({ modules, colors }, () => {
        console.log("Options saved", { modules, colors });
    });
}

// Restore settings when page is opened
function restoreOptions() {
    storage.get(["modules", "colors"], (result) => {
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
    });
}

// Add listeners to inputs
document.addEventListener("DOMContentLoaded", restoreOptions);

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", saveOptions);
});
