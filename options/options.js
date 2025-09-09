if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// Use chrome.storage.sync or chrome.storage.local
// (sync lets settings follow user across devices)
const optionsStorage = browser.storage.sync;

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

async function importStorage() {
    try {
        const text = await navigator.clipboard.readText();

        // Show preview (first 50 characters)
        const preview = text.slice(0, 50).replace(/\s+/g, " ");
        const proceed = confirm(
            `⚠️ WARNING: This will overwrite your current storage.\n\n` +
            `Preview of clipboard contents:\n${preview}...\n\n` +
            `Do you want to continue?`
        );

        if (!proceed) {
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

    // Collect tresholds
    const tresholds = {
        composure_treshold: document.getElementById('composure_treshold').value,
        arrogance_treshold: document.getElementById('arrogance_treshold').value
    };

    // Save both to storage
    optionsStorage.set({ modules, colors, tresholds }, () => {
        console.log("Options saved", { modules, colors, tresholds });
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
