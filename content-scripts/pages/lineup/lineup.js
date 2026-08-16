import {
    lastPathComponent,
    version,
    pluginNodeClass
} from "../../utils.js"
import * as ui from "../../ui_utils.js"

import {
    addNoDataSymbol,
    applyArrogance,
    applyComposure,
    applySportsmanship,
    hasActiveFormation,
    hasActiveSetPieces,
    removeNoDataSymbol,
    personalitiesSymbols,
    questionMarkSymbol
} from "../../ui_utils.js";
import * as db from "../../db_access.js"
import * as discovery from "./lineup+discovery.js"

function createProposedElement(
    id,
    headerText,
    hintText,
    additionalControls,
    proposedList
) {
    const headerElement = document.createElement("div")
    headerElement.classList.add(discovery.proposedListHeaderClass)
    const headerSpan = document.createElement("span")
    headerSpan.textContent = headerText + " "
    headerElement.appendChild(headerSpan)
    const infoSpan = document.createElement("span")
    infoSpan.textContent = ui.infoSymbol
    infoSpan.title = hintText
    ui.makeCursorHelp(infoSpan)
    headerElement.appendChild(infoSpan)

    const newContentContainer = document.createElement("div")
    newContentContainer.id = id
    newContentContainer.classList.add(discovery.proposedContainerClass)
    newContentContainer.append(headerElement)
    if (additionalControls != null) {
        newContentContainer.append(additionalControls)
    }
    newContentContainer.append(proposedList)
    return newContentContainer
}

async function proposeAnchors(anchors) {
    // Do we already have it?
    if (discovery.proposedAnchorsDisplayed()) {
        return
    }

    const playerSelectionContainer = discovery.getPlayerSelectionContainer()
    if (!playerSelectionContainer) {
        console.info("No Player Selection container, will try to find it when the page changes.")
        return
    }

    const proposedAnchorsList = document.createElement("ol")
    proposedAnchorsList.id = discovery.proposedAnchorsListID
    console.debug('Will iterate anchors: ', anchors)
    for (const anchor of anchors) {
        console.debug('creating list element and name span for anchor', anchor)
        var anchorListItem = document.createElement('li')
        ui.makeCursorPointer(anchorListItem)
        anchorListItem.addEventListener("click", () => {
            const playerSelect = discovery.getPlayerSelectFor(anchor.id)

            if (playerSelect) {
                playerSelect.click()
            }
        })
        var playerNameSpan = document.createElement('span')
        playerNameSpan.classList.add(`denom${Math.floor(anchor.AE / 10)}`)
        playerNameSpan.textContent = `${anchor.name} (${anchor.AE})`
        anchorListItem.appendChild(playerNameSpan)
        console.debug('appending anchor to proposedAnchors')
        proposedAnchorsList.appendChild(anchorListItem)

        if (anchor.sportsmanship > 0 || anchor.sportsmanship < 0) {
            const sportsmanshipSpan = document.createElement("span")
            sportsmanshipSpan.classList.add('sportsmanship')
            sportsmanshipSpan.textContent = " " + personalitiesSymbols["sportsmanship"]
            switch (anchor.sportsmanship) {
                case -2:
                    sportsmanshipSpan.classList.add('doubleNegative')
                    sportsmanshipSpan.title = "This players sportsmanship is very questionable, you want to avoid placing him as your central defender because he may cause penalties with his fouls. He may also loose possesion by fouling his opponents in offensive situations. You can adjust his attitude on the formation screen."
                    break
                case -1:
                    sportsmanshipSpan.classList.add('negative')
                    sportsmanshipSpan.title = "This players sportsmanship is questionable, you may want to avoid placing him as your central defender because he may cause penalties with his fouls. He may also loose possesion by fouling his opponents in offensive situations. You can adjust his attitude on the formation screen."
                    break
                case 1:
                    sportsmanshipSpan.classList.add('positive')
                    sportsmanshipSpan.title = "This players is a fair competitor with good sportsmanship, his actions should generally not result in fouls."
                    break
                case 2:
                    sportsmanshipSpan.classList.add('doublePositive')
                    sportsmanshipSpan.title = "This players is a fair competitor with excellent sportsmanship, his actions rarely result in fouls."
                    break
                default:
                    console.warn("Value of anchor.sportsmanship is unexpected: ", anchor.sportsmanship)
            }
            anchorListItem.appendChild(sportsmanshipSpan)
        }
    }

    const anchorsRow = discovery.getSetPiecesRoleRowWith("Anchor", playerSelectionContainer)

    // Ignore negative sportsmanship
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = "ignoreSportsmanshipForAnchors"
    checkbox.classList.add("form-check-input")
    const checkboxes = await db.getCheckboxes()
    checkbox.checked = checkboxes["ignoreSportsmanshipForAnchors"]
    checkbox.addEventListener("change", async () => {
        const cd = await db.getCheckboxes()
        if (checkbox.checked) {
            cd["ignoreSportsmanshipForAnchors"] = true
        } else {
            cd["ignoreSportsmanshipForAnchors"] = false
        }
        await db.putCheckboxes(cd)
        removeProposedAnchorsControls()
    })

    const label = document.createElement("label")
    label.classList.add(discovery.proposedListAdditionalControlsLabelClass)
    label.appendChild(checkbox)
    const labelSpan = document.createElement("span")
    labelSpan.textContent = "Ignore sportsmanship"
    label.appendChild(labelSpan)
    label.htmlFor = "ignoreSportsmanshipForAnchors"

    const newContentContainer = createProposedElement(
        discovery.proposedAnchorsElementID,
        "Recommended anchors",
        "The recommended list below is sorted by the aerial skill. You should have 3 recommended players on the list. Nota that this extension will NOT recommend a player with negative sportsmanship as anchor unless you check the checkbox underneath. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page.",
        label,
        proposedAnchorsList
    )
    anchorsRow.append(newContentContainer)
}

function removeProposedAnchorsControls() {
    const proposedAnchorsElement = document.querySelector(`#${discovery.proposedAnchorsElementID}`)
    if (proposedAnchorsElement) {
        console.debug(`removing ${proposedAnchorsElement}`)
        proposedAnchorsElement.remove()
    }
}

function proposeCrossTakers(takers) {
    // Do we already have it?
    if (discovery.proposedCrossTakersDisplayed()) {
        return
    }

    const playerSelectionContainer = discovery.getPlayerSelectionContainer()
    if (!playerSelectionContainer) {
        console.info("No Player Selection container, will try to find it when the page changes.")
        return
    }

    const proposedCrossTakersList = document.createElement("ol");
    proposedCrossTakersList.id = discovery.proposedCrossTakersListID
    console.debug('Will iterate cross takers: ', takers)
    for (const taker of takers) {
        console.debug('creating list element and name span for taker', taker)
        var crossTakerListItem = document.createElement('li')
        ui.makeCursorPointer(crossTakerListItem)
        crossTakerListItem.addEventListener("click", () => {
            const playerSelect = discovery.getPlayerSelectFor(taker.id)

            if (playerSelect) {
                playerSelect.click()
            }
        })
        var playerNameSpan = document.createElement('span')
        playerNameSpan.classList.add(`denom${Math.floor(taker.cross / 10)}`)
        playerNameSpan.textContent = `${taker.name} (${taker.cross})`
        crossTakerListItem.appendChild(playerNameSpan)
        console.debug('appending cross taker to proposedCrossTakers')
        proposedCrossTakersList.appendChild(crossTakerListItem)
    }

    const cornerKickRow = discovery.getSetPiecesRoleRowWith("Corner Kick", playerSelectionContainer)

    const newContentContainer = createProposedElement(
        discovery.proposedCrossTakersElementID,
        "Recommended cross takers",
        "The recommended list below is sorted by the set piece cross computed skill. You should have 3 recommended players on the list. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page.",
        null,
        proposedCrossTakersList
    )
    cornerKickRow.append(newContentContainer)
}

async function proposePenaltyTakers(takers) {
    // Do we already have it?
    if (discovery.proposedPenaltyTakersDisplayed()) {
        return
    }

    const penaltyTakersContainer = discovery.getPenaltyTakersContainer()
    if (!penaltyTakersContainer) {
        console.info("No Penalty Takers container, will try to find it when the page changes.")
        return
    }

    function createTakerListItem(taker, personalitiesSymbols) {
        const li = document.createElement("li")
        ui.makeCursorPointer(li)
        li.addEventListener("click", () => {
            const playerSelect = discovery.getPlayerSelectFor(taker.id)

            if (playerSelect) {
                playerSelect.click()
            }
        })

        const nameSpan = document.createElement("span")
        nameSpan.classList.add(`denom${Math.floor(taker.penaltyKick / 10)}`)
        nameSpan.textContent = `${taker.name} (${taker.penaltyKick})`
        li.appendChild(nameSpan)

        if (taker.composure) {
            const composureSpan = document.createElement("span")
            composureSpan.classList.add("composure")
            composureSpan.textContent = " " + personalitiesSymbols["composure"]

            switch (taker.composure) {
                case -2:
                    composureSpan.classList.add("doubleNegative")
                    composureSpan.title = "This player has terrible composure, avoid using him as penalty taker"
                    break
                case -1:
                    composureSpan.classList.add("negative")
                    composureSpan.title = "This player has bad composure, avoid using him as penalty taker"
                    break
                case 1:
                    composureSpan.classList.add("positive")
                    composureSpan.title = "This player has good composure, consider using him as penalty taker"
                    break
                case 2:
                    composureSpan.classList.add("doublePositive")
                    composureSpan.title = "This player has excellent composure, use him as penalty taker"
                    break
                default:
                    console.warn("Value of taker.composure is unexpected: ", taker.composure)
            }
            li.appendChild(composureSpan)
        }

        return li
    }

    function buildTakersList(takers, personalitiesSymbols) {
        const ol = document.createElement("ol")
        ol.id = discovery.proposedPenaltyTakersListID
        for (const taker of takers) {
            ol.appendChild(createTakerListItem(taker, personalitiesSymbols))
        }
        return ol
    }

    const composureTresholdInput = await createComposureTresholdInput()
    const ignoreComposureCheckbox = await createIgnoreComposureCheckbox()
    const additionalControls = document.createElement("div")
    additionalControls.classList.add("flex_direction_column")
    additionalControls.append(composureTresholdInput)
    additionalControls.append(ignoreComposureCheckbox)

    const proposedPenaltyTakersContainer = createProposedElement(
        discovery.proposedPenaltyTakersElementID,
        "Recommended penalty takers",
        "The recommended list below is sorted by the penalty kick computed skill, taking into account possible player composure personality trait - players with positive composure will be higher on the list as the chances of them missing the goal is lower. You should have 5 recommended players on the list, if this is not the case consider lowering the composure treshold in the extension options, because chances are there are currently not enough players with the penalty kick skill above the composure treshold to recommend here. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page.",
        additionalControls,
        buildTakersList(takers.recommended, personalitiesSymbols)
    )

    const allPenaltyTakersContainer = document.createElement("div")
    allPenaltyTakersContainer.id = discovery.allPenaltyTakersElementID
    allPenaltyTakersContainer.append(proposedPenaltyTakersContainer)

    if (takers.other.length > 0) {
        const additionalPenaltyTakersContainer = createProposedElement(
            discovery.additionalPenaltyTakersElementID,
            "Other penalty takers",
            "These are other players with the penalty kick skill above the composure treshold, who didn't make it to the recommended list for some reason - likely other players having positive composure which this extension really favours. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page.",
            null,
            buildTakersList(takers.other, personalitiesSymbols)
        )
        allPenaltyTakersContainer.append(additionalPenaltyTakersContainer)
    }

    const penaltyTakersBodyNode = penaltyTakersContainer.querySelector("div.card-body")
    penaltyTakersContainer.insertBefore(allPenaltyTakersContainer, penaltyTakersBodyNode)
}

function removeProposedPenaltyTakersControls() {
    const allPenaltyTakersElement = document.querySelector(`#${discovery.allPenaltyTakersElementID}`)
    if (allPenaltyTakersElement) {
        console.debug(`removing ${allPenaltyTakersElement}`)
        allPenaltyTakersElement.remove()
    }
}

async function createComposureTresholdInput() {
    const input = document.createElement("input")
    input.type = "number"
    input.setAttribute("min", "0")
    input.setAttribute("max", "99")
    input.setAttribute("step", "1")
    input.id = "composure-treshold"
    input.classList.add("form-check-input")
    input.placeholder = "Composure treshold"

    const tresholds = await db.getTresholds()
    const composure_treshold = tresholds.composure ?? 50
    input.value = composure_treshold

    // Add a listener for changes
    input.addEventListener("change", async (e) => {
        const newValue = e.target.value
        const tresholds = await db.getTresholds()
        tresholds['composure'] = parseInt(newValue, 10)

        await db.putTresholds(tresholds)
        console.debug("Updated tresholds =", tresholds)
        removeProposedPenaltyTakersControls()
    })

    const label = document.createElement("label")
    label.classList.add(discovery.proposedListAdditionalControlsLabelClass)
    label.appendChild(input)
    const labelSpan = document.createElement("span")
    ui.makeCursorHelp(labelSpan)
    labelSpan.textContent = ui.infoSymbol
    labelSpan.title = `Composure treshold - if the player has composure personality trait and his penalty kick skill is above this treshold, ${personalitiesSymbols["composure"]} symbol will appear next to his name. If the penalty kick skill of the player is above this treshold he will be taken into account when recommending penalty takers.`
    label.appendChild(labelSpan)
    label.htmlFor = "composure-treshold"
    return label
}

async function createIgnoreComposureCheckbox() {
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = "ignoreComposureForPenaltyTakers"
    checkbox.classList.add("form-check-input")
    const checkboxes = await db.getCheckboxes()
    checkbox.checked = checkboxes["ignoreComposureForPenaltyTakers"]
    checkbox.addEventListener("change", async () => {
        const cd = await db.getCheckboxes()
        if (checkbox.checked) {
            cd["ignoreComposureForPenaltyTakers"] = true
        } else {
            cd["ignoreComposureForPenaltyTakers"] = false
        }
        await db.putCheckboxes(cd)
        removeProposedPenaltyTakersControls()
    });

    const label = document.createElement("label")
    label.classList.add(discovery.proposedListAdditionalControlsLabelClass)
    label.appendChild(checkbox)
    const labelSpan = document.createElement("span")
    labelSpan.textContent = "Ignore composure"
    label.appendChild(labelSpan)
    label.htmlFor = "ignoreComposureForPenaltyTakers"
    return label
}

async function insertArroganceTresholdInput(parent) {
    // Create the input element
    const input = document.createElement("input");
    input.type = "number";
    input.setAttribute("min", "0");
    input.setAttribute("max", "99");
    input.setAttribute("step", "1");
    input.id = "arrogance-treshold";
    input.placeholder = "Arrogance treshold";

    const tresholds = await db.getTresholds()
    const arrogance_treshold = tresholds.arrogance ?? 50

    input.value = arrogance_treshold

    // Add a listener for changes
    input.addEventListener("change", async (e) => {
        const newValue = e.target.value;
        const tresholds = await db.getTresholds()
        tresholds['arrogance'] = parseInt(newValue, 10)

        await db.putTresholds(tresholds)
        console.debug("Updated tresholds =", tresholds);

        processLineup()
    });

    // Inject into the page
    parent.appendChild(input)
    const questionMarkSpan = document.createElement("span")
    questionMarkSpan.textContent = `  ${questionMarkSymbol} `
    questionMarkSpan.title = `Arrogance treshold - if the player has negative arrogance personality trait and is positioned in the defence, or is a substitute and his DP is above this treshold, ${personalitiesSymbols["arrogance"]} symbol will appear next to his name.`
    parent.appendChild(questionMarkSpan)
}

async function processLineup() {
    console.info(`${version} ⚽♟️ Processing lineup...`)
    const pLinks = discovery.getPlayerLinks('div.squad-mobile-card-list')
    const hrefs = discovery.getHrefList('div.squad-mobile-card-list')
    const playerIDs = hrefs.map(lastPathComponent);
    const profiles = await db.bulkGetPlayers(playerIDs)
    console.debug('Profiles: ', profiles)

    // Load tresholds from storage
    const tresholds = await db.getTresholds()
    console.debug(`Loaded tresholds from storage: `, tresholds)

    var penaltyTakersData = {
        recommended: [],
        other: [],
        discouraged: []
    }
    var penaltyTakersWithoutComposure = []
    var crossingPlayers = []
    var anchors = []

    for (let i = 0; i < pLinks.length; i++) {
        const profile = profiles[i]

        // Select the first span child
        const firstSpan = Array.from(pLinks[i].children).find(
            child => child.tagName === 'SPAN' && child.textContent.trim() !== ''
        );

        var name = ""
        if (firstSpan) {
            name = firstSpan.textContent
            console.debug('Processing player:', name);
        } else {
            console.warn('No non-empty span found - unable to determine the player name :(');
        }

        const container = pLinks[i].parentNode.parentNode.parentNode
        if (profile === null) {
            console.debug(`No profile saved in storage for ${name}, skipping...`)
            addNoDataSymbol(container)
            continue
        } else {
            removeNoDataSymbol(container)
        }

        var personalities = profile['personalities']

        if (!personalities) {
            console.debug(`No personalities in player profile for ${name}, skipping...`)

            addNoDataSymbol(container)

            continue
        } else {
            removeNoDataSymbol(container)
        }

        console.debug(`Found profile for ${name}, applying personalities: `, personalities)
        const leadership = personalities['leadership']
        const composure = personalities['composure']
        const arrogance = personalities['arrogance']
        const sportsmanship = personalities['sportsmanship']

        if (leadership) {
            applyLeadership(pLinks[i], profile['personalities']['leadership'])
        }

        // For adding composure and recommended penalty takers
        // First check if on FW position
        // Get all siblings
        const siblings = Array.from(pLinks[i].parentNode.parentNode.parentNode.parentNode.children)

        // Check if any sibling has a <span> with the class "attack-zone"
        const isInAttackZone = siblings.some(sib => sib.querySelector('span.attack-zone') !== null);
        // Also check midfielders because of the long shot option
        const isInMidfieldZone = siblings.some(sib => sib.querySelector('span.middle-zone') !== null);
        const isSub = siblings.some(sib => sib.querySelector('span.substitute') !== null);

        // Alternatively check if the effective penalty kick skill is reasonable
        const skills = siblings.filter(el => el.querySelector('fw-player-skill') !== null);
        var reasonablePenaltyKick = false
        if (skills.length == 8) { // goalkeepers have only 6 skills
            const SC = skills[0].querySelector('span[class*="denom"]').textContent.trim();
            const PA = skills[3].querySelector('span[class*="denom"]').textContent.trim();
            const penaltyKick = Math.floor(Math.max(1.2 * SC, 0.8 * PA))
            const composure_treshold = tresholds.composure ?? 50
            if (!tresholds) {
                console.warn("Tresholds could not be loaded from storage! Using default composure_treshold of ", 50)
            }
            if (composure) {
                console.debug(`${name} - comparing penaltyKick ${penaltyKick} with composure_treshold ${composure_treshold}`)
                if (penaltyKick > composure_treshold) {
                    if (composure > 0) {
                        console.debug(`processing composure, penaltyKick = ${penaltyKick} reasonable, composure ${composure} > 0, setting reasonablePenaltyKick to true`);
                        reasonablePenaltyKick = true
                        penaltyTakersData.recommended.push({ id: playerIDs[i], name: name, penaltyKick: penaltyKick, composure: composure });
                    } else {
                        console.debug(`processing composure, penaltyKick = ${penaltyKick} reasonable, but composure ${composure} < 0, leaving reasonablePenaltyKick as false`);
                        penaltyTakersData.discouraged.push({ id: playerIDs[i], name: name, penaltyKick: penaltyKick, composure: composure });
                    }
                } else {
                    console.debug(`processing composure, penaltyKick = ${penaltyKick} below reasonable level, leaving reasonablePenaltyKick as false`);
                }


                if (isInAttackZone || isInMidfieldZone || (isSub && reasonablePenaltyKick)) {
                    console.debug(`applying composure: ${composure} to ${name}`)
                    applyComposure(pLinks[i].parentNode.parentNode.parentNode, composure)
                } else {
                    console.debug('Has composure in profile, but not in the attack or midfield zone or penaltyKick under reasonable level, removing symbol if necessary');
                    const composureSpan = Array.from(pLinks[i].parentNode.parentNode.parentNode.querySelectorAll('span')).find(
                        el => el.textContent.trim() === personalitiesSymbols["composure"]
                    );
                    if (composureSpan) {
                        console.debug(`removing composure from ${name}`)
                        composureSpan.remove()
                    }
                }
            } else {
                console.debug(`processing composure, but the player is not an outfielder, leaving reasonablePenaltyKick as false`);
                if (penaltyKick > composure_treshold) {
                    penaltyTakersWithoutComposure.push({ id: playerIDs[i], name: name, penaltyKick: penaltyKick, composure: 0 })
                }
            }
        }

        if (arrogance && arrogance < 0) { // only bother with this if the arrogance is negative, otherwise there is no impact on offsides
            console.debug(`${name} arrogance negative, proceeding...`);
            // First check if on a defensive position
            // Get all siblings
            const siblings = Array.from(pLinks[i].parentNode.parentNode.parentNode.parentNode.children)

            // Check if any sibling has a <span> with the class "defence-zone"
            const isInDefenceZone = siblings.some(sib => sib.querySelector('span.defence-zone') !== null);
            const isSub = siblings.some(sib => sib.querySelector('span.substitute') !== null);

            // Alternatively check if the defensive skill is reasonable
            const skills = siblings.filter(el => el.querySelector('fw-player-skill') !== null);
            var reasonableDP = false
            const arrogance_treshold = tresholds.arrogance ?? 50
            console.debug('arrogance_treshold: ', arrogance_treshold)
            if (skills.length == 8) { // goalkeepers have only 6 skills
                const DP = skills[7].querySelector('span[class*="denom"]').textContent.trim();
                if (DP > arrogance_treshold) {
                    console.debug(`DP = ${DP} reasonable, setting reasonableDP to true for ${name}`);
                    reasonableDP = true
                } else {
                    console.debug(`DP = ${DP} below reasonable level, leaving reasonableDP as false for ${name}`);
                }
            }

            if (isInDefenceZone || (isSub && reasonableDP)) {
                console.debug(`applying arrogance: ${arrogance} to ${name}`)
                applyArrogance(pLinks[i].parentNode.parentNode.parentNode, arrogance)
            } else {
                console.debug(`${name} has arrogance in profile, but not in the defence zone or DP under reasonable level, removing symbol if necessary`);
                const arroganceSpan = Array.from(pLinks[i].parentNode.parentNode.parentNode.querySelectorAll('span')).find(
                    el => el.textContent.trim() === personalitiesSymbols["arrogance"]
                );
                if (arroganceSpan) {
                    console.debug(`removing arrogance from ${name}`)
                    arroganceSpan.remove()
                }
            }
        } else {
            console.debug(`${name} arrogance positive or not in profile, removing symbol if necessary`);
            const arroganceSpan = Array.from(pLinks[i].parentNode.parentNode.parentNode.querySelectorAll('span')).find(
                el => el.textContent.trim() === personalitiesSymbols["arrogance"]
            );
            if (arroganceSpan) {
                console.debug(`removing arrogance from ${name}`)
                arroganceSpan.remove()
            }
        }

        if (sportsmanship) {
            applySportsmanship(pLinks[i].parentNode.parentNode.parentNode, sportsmanship)
        }

        // calculate the cross skill and use AE for anchors
        if (skills.length == 8) { // goalkeepers have only 6 skills
            const BC = skills[2].querySelector('span[class*="denom"]').textContent.trim();
            const PA = skills[3].querySelector('span[class*="denom"]').textContent.trim();
            const cross = Math.floor(0.7 * PA + 0.3 * BC)
            crossingPlayers.push({ id: playerIDs[i], name: name, cross: cross })

            const AE = skills[4].querySelector('span[class*="denom"]').textContent.trim();
            anchors.push({ id: playerIDs[i], name: name, AE: AE, sportsmanship: sportsmanship ?? 0 })
        }
    }

    const checkboxes = await db.getCheckboxes()

    // Propose anchors
    const ignoreSportsmanship = checkboxes["ignoreSportsmanshipForAnchors"] || false
    let anchorsToPropose = anchors.sort((a, b) => {
        const AEDiff = b.AE - a.AE
        if (AEDiff !== 0) return AEDiff
        return b.sportsmanship - a.sportsmanship
    })
    if (!ignoreSportsmanship) {
        const withoutFouls = anchorsToPropose.filter(player => player.sportsmanship >= 0)
        await proposeAnchors(withoutFouls.slice(0, 3))
    }
    await proposeAnchors(anchors.slice(0, 3))

    // Propose cross takers
    crossingPlayers.sort((a, b) => {
        return b.cross - a.cross
    })
    proposeCrossTakers(crossingPlayers.slice(0, 3))

    // Propose penalty takers
    const ignoreComposure = checkboxes["ignoreComposureForPenaltyTakers"] || false

    if (ignoreComposure) {
        let allTakers = penaltyTakersData.recommended.concat(penaltyTakersData.discouraged).concat(penaltyTakersWithoutComposure)
        allTakers.sort((a, b) => b.penaltyKick - a.penaltyKick);
        penaltyTakersData.recommended = allTakers.slice(0, 5)
        penaltyTakersData.other = allTakers.slice(5, 10)
    } else {
        penaltyTakersWithoutComposure.sort((a, b) => b.penaltyKick - a.penaltyKick);
        console.debug('sorted penaltyTakersWithoutComposure: ', penaltyTakersWithoutComposure)
        const recommendedWithComposure = penaltyTakersData.recommended
        console.debug('recommendedWithComposure: ', recommendedWithComposure)
        const proposedCount = 5
        console.debug(`proposedCount (${proposedCount}) versus recommendedWithComposure.count (${recommendedWithComposure.length})`)
        if (recommendedWithComposure.length < proposedCount) {
            var mergedArray = recommendedWithComposure.concat(penaltyTakersWithoutComposure.slice(0, 5 - recommendedWithComposure.length));
            console.debug('mergedArray: ', mergedArray)

            mergedArray.sort((a, b) => {
                const pkDiff = b.penaltyKick - a.penaltyKick;
                if (pkDiff !== 0) return pkDiff;          // sort by penaltyKick first
                return b.composure - a.composure;         // tie-breaker by composure
            });

            console.debug('mergedArray sorted: ', mergedArray)
            penaltyTakersData.recommended = mergedArray

            // add other for the players with high penalty kick skill but for some reason not recommended (e.g. no positive or negative composure etc.)
            const other = penaltyTakersWithoutComposure.slice(5 - recommendedWithComposure.length, penaltyTakersWithoutComposure.length)
            penaltyTakersData.other = other
        }
    }

    console.debug('passing to proposePenaltyTakers: ', penaltyTakersData)
    await proposePenaltyTakers(penaltyTakersData)
}

function applyLeadership(element, leadership) {
    const hasLeadershipSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
        child => child.textContent.trim() === personalitiesSymbols["leadership"]
    );
    if (!hasLeadershipSymbol) {
        console.debug(`Applying Leadership: ${leadership}`)

        const leadershipSpan = document.createElement("span");
        leadershipSpan.classList.add('leadership')
        leadershipSpan.textContent = " " + personalitiesSymbols["leadership"]
        switch (leadership) {
            case -2:
                leadershipSpan.classList.add('doubleNegative');
                leadershipSpan.title = "This player is a terrible leader, avoid using him as your teams captain";
                break;
            case -1:
                leadershipSpan.classList.add('negative');
                leadershipSpan.title = "This player is a bad leader, avoid using him as your teams captain";
                break;
            case 1:
                leadershipSpan.classList.add('positive');
                leadershipSpan.title = "This player is a good leader, consider using him as your teams captain for extra opportunities during games";
                break;
            case 2:
                leadershipSpan.classList.add('doublePositive');
                leadershipSpan.title = "This player is an excellent leader, make him a captain of your team for extra opportunities during games";
                break;
            default:
                console.warn("Value of leadership is unexpected: ", leadership);
        }

        element.parentNode.parentNode.parentNode.appendChild(leadershipSpan)
    }
}

export async function processLineupPage() {
    console.log("Processing lineup page...")
    if (hasActiveFormation()) {
        // fixHeader({
        //     formationContainerSelector: "fw-formation div[touranchor='lineup.select']",
        //     firstPlayerCardSelector: "div.player-select > fw-player-card",
        //     columnLabels: ["Name", "S", "A", "Pos", "R"]
        // })
    }
    if (hasActiveSetPieces()) {
        // fixHeader({
        //     formationContainerSelector: "fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12",
        //     firstPlayerCardSelector: "div.container-block > fw-player-card",
        //     columnLabels: ["Name", " ", "A", "Pos", "R"]
        // })
        const h5Element = document.querySelector('h5[touranchor="lineup.tour"]');
        if (h5Element && !h5Element.querySelector('#arrogance-treshold')) {
            await insertArroganceTresholdInput(h5Element)
        }

        await processLineup()
    }
}

function fixHeader(config) {
    console.info("👨‍🔧 Fixing header")
    const formationContainer = document.querySelector(config.formationContainerSelector)

    const lineupHeaderID = pluginNodeClass + "LineupHeader"
    const existingCustomHeader = formationContainer.querySelector(`div#${lineupHeaderID}`)
    if (existingCustomHeader) existingCustomHeader.remove()

    const firstPlayerCard = formationContainer.querySelector(config.firstPlayerCardSelector)

    let columnNames = []
    const brokenHeader = firstPlayerCard.querySelector("div.p-block-header")
    if (brokenHeader) {
        columnNames = [...brokenHeader.querySelectorAll("div.header-skill > span")].map(span => span.textContent.trim())
        brokenHeader.style.display = "none"
    }
    columnNames.unshift(...config.columnLabels)
    columnNames.reverse()
    const formIndicators = document.querySelectorAll("fw-formation div[touranchor='lineup.select'] div.player-select > fw-player-card div.p-block > div.p-block-top div.form-indicator-top")
    for (const formIndicator of formIndicators) {
        formIndicator.parentNode.appendChild(formIndicator)
    }

    const firstPlayerContainer = document.querySelector(config.formationContainerSelector + " " + config.firstPlayerCardSelector + " > div.p-block > div.p-block-top")
    const newHeader = document.createElement("div")
    newHeader.id = lineupHeaderID
    newHeader.classList.add("col-12") // this adds width: 100%
    const columnSizes = []
    for (const child of firstPlayerContainer.children) {
        if (child.classList.contains('form-indicator-top')) continue

        columnSizes.push(child.getBoundingClientRect().width)
        const clone = child.cloneNode(false)
        newHeader.appendChild(clone)
    }
    columnSizes.reverse()
    // console.info("columnSizes:", [...columnSizes])

    const columnHeaders = newHeader.querySelectorAll("div")
    for (const columnHeader of columnHeaders) {
        const originalWidth = columnSizes.pop()
        const skillLabel = columnNames.pop()
        columnHeader.textContent = skillLabel
        columnHeader.style.width = `${originalWidth}px`
    }

    formationContainer.prepend(newHeader)
}