if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// Use chrome.storage.sync or chrome.storage.local
// (sync lets settings follow user across devices)
const optionsStorage = browser.storage.sync;

function isChrome() {
    return navigator.userAgent.includes("Chrome") && !navigator.userAgent.includes("Firefox")
}

async function exportStorage() {
    try {
        const data = await optionsStorage.get();
        const json = JSON.stringify(data, null, 2);
        await navigator.clipboard.writeText(json);

        setStatus("exportStatus", "✅ Exported storage to clipboard.");
    } catch (err) {
        console.error("Export failed:", err);
        setStatus("exportStatus", "❌ Export failed: " + err.message);
    }
}

async function showPasteDialogNear(element) {
    const pasteDialog = document.getElementById("pasteDialog");
    // Get element's position
    const rect = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    // Position the dialog near the element
    pasteDialog.style.top = rect.bottom + 5 + "px"; // 5px below
    pasteDialog.show();

    const confirmed = await new Promise(resolve => {
        pasteDialog.addEventListener("close", function handler() {
            pasteDialog.removeEventListener("close", handler);
            resolve(pasteDialog.returnValue === "ok");
        });
    });

    if (!confirmed) {
        setStatus("importStatus", "❌ Import cancelled by user.");
        return null;
    }

    return document.getElementById("pasteArea").value;
}

async function importStorage() {
    try {
        let text;
        if (isChrome()) {
            // Always show paste dialog on Chrome
            text = await showPasteDialogNear(document.getElementById("importBtn"));
            if (text === null || text === "") {
                setStatus("importStatus", "❌ No text detected in the text area.");
                return;
            }
        } else {
            try {
                // Try reading from clipboard on non-Chrome
                text = await navigator.clipboard.readText();
            } catch {
                // Fallback to paste dialog if clipboard fails
                text = await showPasteDialogNear(document.getElementById("importBtn"));
                if (text === null || text === "") {
                    setStatus("importStatus", "❌ No text detected in the text area.");
                    return;
                }
            }
        }

        // Show first 50 characters in the dialog
        const preview = text.slice(0, 50).replace(/\s+/g, " ");
        document.getElementById("importPreview").textContent = preview + "...";

        const dialog = document.getElementById("importDialog");
        // Get element's position
        const element = document.getElementById("importBtn")
        const rect = element.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        // Position the dialog near the element
        dialog.style.top = rect.bottom + 5 + "px"; // 5px below
        dialog.show();

        // Wait for user response
        const confirmed = await new Promise(resolve => {
            dialog.addEventListener("close", function handler() {
                dialog.removeEventListener("close", handler);
                resolve(dialog.returnValue === "ok");
            });
        });

        if (!confirmed) {
            setStatus("importStatus", "❌ Import cancelled by user.");
            return;
        }

        const parsed = JSON.parse(text);
        if (typeof parsed !== "object" || parsed === null) {
            throw new Error("Clipboard does not contain valid JSON.");
        }

        await optionsStorage.set(parsed);
        await restoreOptions()
        setStatus("importStatus", "✅ Imported storage from clipboard.");
    } catch (err) {
        console.error("Import failed:", err);
        setStatus("importStatus", "❌ Import failed: " + err.message);
    }
}

function setStatus(id, msg) {
    document.getElementById(id).textContent = msg;
}

document.getElementById("exportBtn").addEventListener("click", exportStorage);
document.getElementById("importBtn").addEventListener("click", importStorage);


// Save settings when changed
function saveOptions() {
    console.info("Saving options to storage")
    // Collect all checkboxes
    const modules = {
        academy_buttons: document.getElementById('academy_buttons').checked,
        calendar: document.getElementById('calendar').checked,
        match: document.getElementById('match').checked,
        player: document.getElementById('player').checked,
        players: document.getElementById('players').checked,
        row_highlight: document.getElementById('row_highlight').checked,
        tags: document.getElementById('tags').checked,
        lineup: document.getElementById('lineup').checked,
    };

    // Collect all colors
    const colors = {};
    const colorInputs = document.querySelectorAll('input[id^="color"]');
    colorInputs.forEach(input => {
        colors[input.id] = input.value
    });

    // Save both to storage
    optionsStorage.set({ modules, colors }, () => {
        console.log("Options saved", { modules, colors });
    });
}

// Restore settings when page is opened
async function restoreOptions() {
    optionsStorage.get(["modules", "colors", "tresholds"], (result) => {
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

    // Handling the player data
    const textarea = document.getElementById("playerData");
    const saveBtn = document.getElementById("saveBtn");

    // Load existing player-data from storage
    const stored = await browser.storage.local.get("player-data");
    console.info("store: ", stored)
    textarea.value = stored["player-data"]
        ? JSON.stringify(stored["player-data"], null, 2)  // formatted JSON
        : "{}"; // default empty object

    // Save back to storage
    saveBtn.addEventListener("click", async () => {
        try {
            const parsed = JSON.parse(textarea.value); // make sure it's valid JSON
            await browser.storage.local.set({ "player-data": parsed });
            alert("Player data saved!");
        } catch (e) {
            alert("Invalid JSON, please fix it before saving.");
        }
    })

    const inputs = document.querySelectorAll('input[id^="color-setting"]');
    const previews = document.querySelectorAll('span[id^="color-preview"]');
    console.info("inputs.length: ", inputs.length, "previews.length: ", previews.length)
    for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i]
        const preview = previews[i]

        preview.style.color = input.value;

        input.addEventListener("input", () => {
            preview.style.color = input.value;
        });
    }
}

// Add listeners to inputs
document.addEventListener("DOMContentLoaded", restoreOptions);

document.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", saveOptions);
});
