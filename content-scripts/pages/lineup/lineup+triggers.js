import * as utils from "../../utils.js"

export async function processTriggersTab(animate = false) {
    console.info(`${utils.version} ⚽♟️ Processing triggers tab...`)

    const actionsToolbar = document.querySelector("div:has(> div.conditional-toolbar-actions)")
    console.info("actionsToolbar:", actionsToolbar)
    if (actionsToolbar) {
        const dividerElement = actionsToolbar.parentNode.querySelector("hr.co-section-divider")
        console.info("dividerElement:", dividerElement)
        console.info("parentNode:", actionsToolbar.parentNode)
        actionsToolbar.parentNode.insertBefore(actionsToolbar, dividerElement)
    }
}