import { optionsStorage, addCSS } from './utils.js';

console.debug(`loading tags.js...`)

async function applyCustomColorsForTags() {
    console.debug(`Applying custom colors for tags...`);
    try {
        // Load colors from storage (with defaults)
        const { colors = {} } = await optionsStorage.get("colors");

        // Inject CSS rule so future elements are styled too
        addCSS(`
            i.denom1 {
                color: ${colors.color1} !important;
            }
            i.denom2 {
                color: ${colors.color2} !important;
            }
            i.denom3 {
                color: ${colors.color3} !important;
            }
            i.denom4 {
                color: ${colors.color4} !important;
            }
            i.denom5 {
                color: ${colors.color5} !important;
            }
            i.denom6 {
                color: ${colors.color6} !important;
            }
            i.denom7 {
                color: ${colors.color7} !important;
            }
            i.denom8 {
                color: ${colors.color8} !important;
            }
            i.denom9 {
                color: ${colors.color9} !important;
            }
        `, "final-whistle-custom-tag-colors");
    } catch (err) {
        console.error("Failed to apply custom colors for tags:", err);
    }
}

// Run the function
applyCustomColorsForTags();

export async function processTags() {
    console.info(`Processing tags...`)

    let tableNodes = document.querySelectorAll("table.table")
    for (let tableNode of tableNodes) {
        if (tableNode.rows.length > 1) {
            console.debug(`Found the following table for processing tags: `, tableNode)

            tableNode.querySelectorAll(`td > fw-player-hover > div.hovercard > sup`).forEach((el, idx) => {
                let supNode = el
                let currentClass = supNode.className

                let tagNode = supNode.querySelector(`i`)
                let tagRemoved = supNode.removeChild(tagNode)
                tagRemoved.className += ` ${currentClass}`
                supNode.parentNode.insertBefore(tagRemoved, supNode)
                supNode.remove()
            })
        } else {
            console.debug(`Skipping a table with only one row (probably header): `, tableNode)
        }
    } 
}