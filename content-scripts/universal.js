import * as db from './db_access.js'
import { version } from './utils.js'

export async function setNavBarItems() {
    const shortcuts = await db.getShortcuts()

    for (const [key, value] of Object.entries(shortcuts)) {
        const shortcutElement = shortcutForConfig({
            key: key,
            href: value
        })
        addShortcutToNavbar(shortcutElement)
    }
}

function shortcutForConfig(config) {
    let linkElement = document.createElement("a")
    const iElement = document.createElement("i")
    iElement.classList.add("bi")
    iElement.classList.add("bi-trophy-fill")
    linkElement.appendChild(iElement)
    linkElement.href = config.href
    linkElement.id = config.key
    return linkElement
}

function addShortcutToNavbar(shortcutElement) {
    console.info(`${version} ⏭️ Adding shortcuts to NavBar`)
    const navbar = document.querySelector("ul.navbar-nav")
    if (navbar) {
        const existingElement = navbar.querySelector(`#${shortcutElement.id}`)
        if (!existingElement) {
            navbar.appendChild(shortcutElement)
        }
    }
}