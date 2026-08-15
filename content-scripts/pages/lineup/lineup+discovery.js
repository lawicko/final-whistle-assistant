import * as utils from "../../utils.js"
import * as ui from "../../ui_utils.js"

export const proposedAnchorsListID = "proposed-anchors"
export const proposedCrossTakersListID = "proposed-cross-takers"
export const proposedLongShootersListID = "proposed-long-shooters"
export const proposedPenaltyTakersListID = "proposed-penalty-takers"

export const proposedListHeaderClass = utils.pluginNodeClass + "_LineupProposedListHeader"
export const proposedListAdditionalControlsLabelClass = utils.pluginNodeClass + "_LineupProposedListAdditionalControlsLabel"

export const proposedContainerClass = utils.pluginNodeClass + "_LineupProposedContainer"

export const proposedAnchorsElementID = proposedContainerClass + "_Anchors"
export const proposedCrossTakersElementID = proposedContainerClass + "_CrossTakers"

/////////////////////// Common //////////////////////////////////
export function getPlayerSelectionContainer() {
     // Find all h2 elements
    const headers = document.querySelectorAll("h2")

    // Find the one with the text "Player Selection"
    const targetHeader = Array.from(headers).find(h => h.textContent.trim() === "Player Selection")

    if (targetHeader == null) { return }

    return targetHeader.parentNode.parentNode
}

export function getPlayerLinks(selector) {
    // Get the container
    const container = document.querySelector(selector)

    if (!container) {
        throw new Error(`Container "${selector}" not found!`)
    } else {
        console.debug(`Found container for selector: ${selector}`)
    }

    // Get all <a> descendants
    const links = container.querySelectorAll('fw-player-card fw-player-hover div.hovercard a')

    const filteredLinks = Array.from(links).filter(a =>
        a.hasAttribute("href") &&
        a.getAttribute("href").trim() !== "" &&
        !a.getAttribute("href").startsWith("javascript:")
    )

    return filteredLinks
}

export function getHrefList(selector) {
    const playerLinks = getPlayerLinks(selector)
    return playerLinks.map(a => a.href)
}

export function getSetPiecesRoleRowWith(title, container) {
    const mainContainer = container.querySelector("div.card-body")
    const rolesContainers = mainContainer.querySelectorAll("div.set-pieces-role-row")
    const rowWithTitle = Array.from(rolesContainers)
        .find(container =>
            container.querySelector('p')?.textContent.trim() === title
        )
    if (rowWithTitle) {
        console.debug("Found row:", rowWithTitle)
        return rowWithTitle
    } else {
        console.warn("No matching row (title=", title,") found in container", container)
        return null
    }
}

/////////////////////// Proposed Anchors ////////////////////////
export function proposedAnchorsDisplayed() {
    return document.querySelector(`#${proposedAnchorsListID}`) != null
}

/////////////////////// Proposed Cross Takers ///////////////////
export function proposedCrossTakersDisplayed() {
    return document.querySelector(`#${proposedCrossTakersListID}`) != null
}