import { addCSS, version } from './utils.js';
import * as db from './db_access.js'

async function applyCustomColorsForTags() {
    console.debug(`Applying custom colors for tags...`);
    try {
        // Load colors from storage (with defaults)
        const colors = await db.getColors()
        if (!colors) return
        // Inject CSS rule so future elements are styled too
        addCSS(`
            i.denom1, span.denom1 i, div.denom1 {
                color: ${colors.tagColor1} !important;
            }
            i.denom2, span.denom2 i, div.denom2 {
                color: ${colors.tagColor2} !important;
            }
            i.denom3, span.denom3 i, div.denom3 {
                color: ${colors.tagColor3} !important;
            }
            i.denom4, span.denom4 i, div.denom4 {
                color: ${colors.tagColor4} !important;
            }
            i.denom5, span.denom5 i, div.denom5 {
                color: ${colors.tagColor5} !important;
            }
            i.denom6, span.denom6 i, div.denom6 {
                color: ${colors.tagColor6} !important;
            }
            i.denom7, span.denom7 i, div.denom7 {
                color: ${colors.tagColor7} !important;
            }
            i.denom8, span.denom8 i, div.denom8 {
                color: ${colors.tagColor8} !important;
            }
            i.denom9, span.denom9 i, div.denom9 {
                color: ${colors.tagColor9} !important;
            }
        `, "final-whistle-custom-tag-colors");
    } catch (err) {
        console.error("Failed to apply custom colors for tags:", err);
    }
}
applyCustomColorsForTags()

export async function processTags() {
    console.info(`${version} 🏷️ Processing tags`)

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