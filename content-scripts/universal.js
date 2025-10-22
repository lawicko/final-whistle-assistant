import * as db from './db_access.js'

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
    const navbar = document.querySelector("fw-app fw-nav-bar2 > nav div.navbar-left > div.nav-item-group")
    if (navbar) {
        const existingElement = navbar.querySelector(`#${shortcutElement.id}`)
        if (!existingElement) {
            navbar.appendChild(shortcutElement)
        }
    }
}