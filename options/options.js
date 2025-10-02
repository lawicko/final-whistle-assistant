import { getDB, setDB, initDB } from "../background/database"
import { importDB, exportDB, importInto, peakImportFile } from "dexie-export-import"
import download from "downloadjs"

if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

function makeExportFileName(db, label = "export") {
    const now = new Date();

    // Format local time to YYYY-MM-DDTHH-MM (minutes precision)
    const pad = n => String(n).padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());

    // Build safe timestamp string
    const localStamp = `${year}-${month}-${day}T${hours}-${minutes}`;

    // Dexie database version
    const version = db.verno;

    return `${localStamp}_db-v${version}_${label}.json`;
}

async function exportStorage() {
    try {
        const blob = await exportDB(getDB(), { prettyJson: true, progressCallback })
        const fileName = makeExportFileName(getDB(), "final-whistle-assistant")
        download(blob, fileName, "application/json")
    } catch (error) {
        console.error('' + error)
    }
}

async function openDialogAbove(button, dialog, gap = 8) {
    // create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    document.body.appendChild(backdrop);

    // show the dialog non-modally so we can position it
    dialog.show();

    // wait for layout so offsetWidth/Height are correct
    await new Promise(req => requestAnimationFrame(req));

    const rect = button.getBoundingClientRect();
    let top = rect.top + window.scrollY - dialog.offsetHeight - gap;
    let left = rect.left + window.scrollX + (rect.width - dialog.offsetWidth) / 2;

    // If not enough space above, place below the button
    if (top < window.scrollY + 4) {
        top = rect.bottom + window.scrollY + gap;
    }

    // Keep dialog inside viewport horizontally
    const maxLeft = window.scrollX + window.innerWidth - dialog.offsetWidth - 4;
    left = Math.max(window.scrollX + 4, Math.min(left, maxLeft));

    dialog.style.top = `${top}px`;
    dialog.style.left = `${left}px`;

    // close dialog and cleanup when user closes or clicks backdrop
    function cleanup() {
        if (dialog.open) dialog.close();
        backdrop.remove();
        window.removeEventListener('resize', reposition);
        backdrop.removeEventListener('click', onBackdrop);
        dialog.removeEventListener('close', onClose);
    }

    function onBackdrop() { cleanup(); }
    function onClose() { cleanup(); }

    backdrop.addEventListener('click', onBackdrop);
    dialog.addEventListener('close', onClose);

    // reposition on resize/scroll if you want it to follow
    function reposition() {
        const r = button.getBoundingClientRect();
        let t = r.top + window.scrollY - dialog.offsetHeight - gap;
        if (t < window.scrollY + 4) t = r.bottom + window.scrollY + gap;
        let l = r.left + window.scrollX + (r.width - dialog.offsetWidth) / 2;
        const maxL = window.scrollX + window.innerWidth - dialog.offsetWidth - 4;
        l = Math.max(window.scrollX + 4, Math.min(l, maxL));
        dialog.style.top = `${t}px`;
        dialog.style.left = `${l}px`;
    }
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { passive: true });
}

document.getElementById("exportBtn").addEventListener("click", exportStorage);

const dropZoneDiv = document.getElementById('dropzone');

// Configure dropZoneDiv
dropZoneDiv.ondragover = event => {
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
};

// Handle file drop:
dropZoneDiv.ondrop = async ev => {
    ev.stopPropagation();
    ev.preventDefault();

    // Pick the File from the drop event (a File is also a Blob):
    const file = ev.dataTransfer.files[0];
    try {
        if (!file) throw new Error(`Only files can be dropped here`);
        console.info("⚙️ Importing " + file.name);
        const dbInstance = getDB()
        // If we opened in options context, clean up
        if (dbInstance) {
            dbInstance.close()
            await dbInstance.delete()
        }
        // Notify other contexts that we are about to import
        browser.runtime.sendMessage({ type: "WILL_IMPORT_DB" })
        const db = await importDB(file, {
            progressCallback
        })
        setDB(db)
        console.info("⚙️ Import complete");
        // Notify other contexts that we imported the db
        browser.runtime.sendMessage({ type: "DID_IMPORT_DB" })
        const confirmationDialog = document.getElementById("confirmationDialog");
        openDialogAbove(document.getElementById("exportBtn"), confirmationDialog)
        initDB("⚙️ DID_IMPORT_DB")
        await restoreOptions()
    } catch (error) {
        console.error('' + error);
    }
}

function progressCallback({ totalRows, completedRows }) {
    console.log(`⚙️ Progress: ${completedRows} of ${totalRows} rows completed`)
}

// Save settings when changed
async function saveOptions() {
    console.info("⚙️ Saving options to storage")
    // Collect all features
    const features = {
        academyButtonsSeparation: document.getElementById('academyButtonsSeparation').checked,
        matchBadgeEnhancement: document.getElementById('matchBadgeEnhancement').checked,
        lineupPageAdditions: document.getElementById('lineupPageAdditions').checked,
        matchDataGathering: document.getElementById('matchDataGathering').checked,
        playerPageAdditions: document.getElementById('playerPageAdditions').checked,
        playersPageAdditions: document.getElementById('playersPageAdditions').checked,
        rowHighlighting: document.getElementById('rowHighlighting').checked,
        tagsEnhancement: document.getElementById('tagsEnhancement').checked
    };

    // Collect all colors
    const colors = {};
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        colors[input.id] = input.value
    });

    // Save both to storage
    await getDB().settings.put({
        category: "features",
        settings: features
    })
    await getDB().settings.put({
        category: "colors",
        settings: colors
    })
}

// Restore settings when page is opened or the database imported
async function restoreOptions() {
    initDB("⚙️ restoreOptions")
    const loadedFeatures = await getDB().settings.get("features")
    if (loadedFeatures) {
        const features = loadedFeatures.settings
        if (features) {
            Object.keys(features).forEach((key) => {
                const el = document.getElementById(key);
                if (el) el.checked = features[key];
            });
        }
    }

    const loadedColors = await getDB().settings.get("colors")
    if (loadedColors) {
        const colors = loadedColors.settings
        if (colors) {
            Object.keys(colors).forEach((key) => {
                const el = document.getElementById(key);
                if (el) el.value = colors[key];
            });
        }
    }

    const inputs = document.querySelectorAll('input[type="color"]');
    const previews = document.querySelectorAll('span[id^="colorPreview-"]');
    for (let i = 0; i < previews.length; i++) {
        const preview = previews[i]
        const suffix = preview.id.split("-")[1]
        const input = [...inputs].find(ipt => ipt.id === suffix)

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