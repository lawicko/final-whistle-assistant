import {
    lastPathComponent,
    version,
    pluginNodeClass
} from "./utils.js";

import {
    addNoDataSymbol,
    applyArrogance,
    applyComposure,
    applySportsmanship,
    hasActiveFormation,
    hasActiveSetPieces,
    removeNoDataSymbol,
    personalitiesSymbols
} from "./ui_utils";
import * as db from "./db_access.js"

function getPlayerLinks(selector) {
    // Get the container
    const container = document.querySelector(selector);

    if (!container) {
        throw new Error(`Container "${selector}" not found!`);
    } else {
        console.debug(`Found container for selector: ${selector}`)
    }

    // Get all <a> descendants
    const links = container.querySelectorAll('fw-player-card fw-player-hover div.hovercard a');

    const filteredLinks = Array.from(links).filter(a =>
        a.hasAttribute("href") &&
        a.getAttribute("href").trim() !== "" &&
        !a.getAttribute("href").startsWith("javascript:")
    );

    return filteredLinks
}

function getHrefList(selector) {
    const playerLinks = getPlayerLinks(selector)

    return playerLinks.map(a => a.href);
}

async function proposeAnchors(anchors) {
    // Do we already have it?
    if (document.querySelector('#proposed-anchors')) {
        return
    }

    // Find all h5 elements
    const headers = document.querySelectorAll("h5");

    // Find the one with the text "Penalty Takers"
    const targetHeader = Array.from(headers).find(h => h.textContent.trim() === "Player Selection");

    if (!targetHeader) {
        console.info("No Player Selection header, will try to find it when the page changes. ")
        return
    }

    const proposedAnchors = document.createElement("ol");
    proposedAnchors.id = 'proposed-anchors'
    console.debug('Will iterate anchors: ', anchors)
    for (const anchor of anchors) {
        console.debug('creating takerSpan')
        var anchorListItem = document.createElement('li')
        var playerNameSpan = document.createElement('span')
        playerNameSpan.classList.add(`denom${Math.floor(anchor.AE / 10)}`)
        playerNameSpan.textContent = `${anchor.name} (${anchor.AE})`
        anchorListItem.appendChild(playerNameSpan)
        console.debug('appending takerSpan to proposedAnchors')
        proposedAnchors.appendChild(anchorListItem)

        if (anchor.sportsmanship > 0 || anchor.sportsmanship < 0) {
            const sportsmanshipSpan = document.createElement("span");
            sportsmanshipSpan.classList.add('sportsmanship')
            sportsmanshipSpan.textContent = " " + personalitiesSymbols["sportsmanship"]
            switch (anchor.sportsmanship) {
                case -2:
                    sportsmanshipSpan.classList.add('doubleNegative');
                    sportsmanshipSpan.title = "This players sportsmanship is very questionable, you want to avoid placing him as your central defender because he may cause penalties with his fouls. He may also loose possesion by fouling his opponents in offensive situations. You can adjust his attitude on the formation screen.";
                    break;
                case -1:
                    sportsmanshipSpan.classList.add('negative');
                    sportsmanshipSpan.title = "This players sportsmanship is questionable, you may want to avoid placing him as your central defender because he may cause penalties with his fouls. He may also loose possesion by fouling his opponents in offensive situations. You can adjust his attitude on the formation screen.";
                    break;
                case 1:
                    sportsmanshipSpan.classList.add('positive');
                    sportsmanshipSpan.title = "This players is a fair competitor with good sportsmanship, his actions should generally not result in fouls.";
                    break;
                case 2:
                    sportsmanshipSpan.classList.add('doublePositive');
                    sportsmanshipSpan.title = "This players is a fair competitor with excellent sportsmanship, his actions rarely result in fouls.";
                    break;
                default:
                    console.warn("Value of anchor.sportsmanship is unexpected: ", anchor.sportsmanship);
            }
            anchorListItem.appendChild(sportsmanshipSpan)
        }
    }

    console.debug("sibling nodes: ", Array.from(targetHeader.parentNode.parentNode.children))
    const siblingWithAnchor = Array.from(targetHeader.parentNode.parentNode.children)
        .find(sibling =>
            sibling !== targetHeader && sibling.querySelector('div p')?.textContent.trim() === "Anchor"
        );

    if (siblingWithAnchor) {
        console.debug("Found sibling:", siblingWithAnchor);
    } else {
        console.warn("No matching sibling found, can't insert the recommended anchors");
        return
    }

    targetHeader.parentNode.parentNode.insertBefore(proposedAnchors, siblingWithAnchor)

    const proposedAnchorsHeader = document.createElement("h6");
    proposedAnchorsHeader.id = 'proposed-anchors-header'
    proposedAnchorsHeader.textContent = "Recommended anchors "
    const questionMarkSpan = document.createElement("span")
    questionMarkSpan.textContent = "\uf29c"
    questionMarkSpan.title = "The recommended list below is sorted by the aerial skill. You should have 3 recommended players on the list. Nota that this extension will NOT recommend a player with negative sportsmanship as anchor unless you check the checkbox underneath. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
    proposedAnchorsHeader.appendChild(questionMarkSpan)
    targetHeader.parentNode.parentNode.insertBefore(proposedAnchorsHeader, proposedAnchors)

    // Ignore negative sportsmanship
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = "ignoreSportsmanshipForAnchors"
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
    label.appendChild(checkbox)
    const labelSpan = document.createElement("span")
    labelSpan.textContent = " Ignore sportsmanship"
    label.appendChild(labelSpan)
    label.htmlFor = "ignoreSportsmanshipForAnchors"
    proposedAnchorsHeader.appendChild(label)
}

function removeProposedAnchorsControls() {
    if (document.querySelector('#proposed-anchors-header')) {
        console.debug("removing #proposed-anchors-header")
        document.querySelector('#proposed-anchors-header').remove()
    }
    if (document.querySelector('#proposed-anchors')) {
        console.debug("removing #proposed-anchors")
        document.querySelector('#proposed-anchors').remove()
    }
}

// This may be used for both corners and free kicks, so we need to make a destinction when inserting the list
function proposeCrossTakers(takers) {
    // Do we already have it?
    if (document.querySelector('#proposed-corner-takers')) {
        return
    }

    // Find all h5 elements
    const headers = document.querySelectorAll("h5");

    // Find the one with the text "Penalty Takers"
    const targetHeader = Array.from(headers).find(h => h.textContent.trim() === "Player Selection");

    if (!targetHeader) {
        console.info("No Player Selection header, will try to find it when the page changes. ")
        return
    }

    const proposedCrossTakers = document.createElement("ol");
    proposedCrossTakers.id = 'proposed-corner-takers'
    console.debug('Will iterate takers: ', takers)
    for (const taker of takers) {
        console.debug('creating takerSpan')
        var takerLi = document.createElement('li')
        var takerSpan = document.createElement('span')
        takerSpan.classList.add(`denom${Math.floor(taker.cross / 10)}`)
        takerSpan.textContent = `${taker.name} (${taker.cross})`
        takerLi.appendChild(takerSpan)
        console.debug('appending takerSpan to proposedCrossTakers')
        proposedCrossTakers.appendChild(takerLi)
    }

    console.debug("sibling nodes: ", Array.from(targetHeader.parentNode.parentNode.children))
    const siblingWithCornerKick = Array.from(targetHeader.parentNode.parentNode.children)
        .find(sibling =>
            sibling !== targetHeader && sibling.querySelector('div p')?.textContent.trim() === "Corner Kick"
        );

    if (siblingWithCornerKick) {
        console.debug("Found sibling:", siblingWithCornerKick);
    } else {
        console.warn("No matching sibling found, can't insert the recommended corner takers");
        return
    }
    targetHeader.parentNode.parentNode.insertBefore(proposedCrossTakers, siblingWithCornerKick)

    const proposedCornerTakersHeader = document.createElement("h6");
    proposedCornerTakersHeader.id = 'proposed-corner-takers-header'
    proposedCornerTakersHeader.textContent = "Recommended corner takers "
    const questionMarkSpan = document.createElement("span")
    questionMarkSpan.textContent = "\uf29c"
    questionMarkSpan.title = "The recommended list below is sorted by the set piece cross computed skill. You should have 3 recommended players on the list. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
    proposedCornerTakersHeader.appendChild(questionMarkSpan)
    targetHeader.parentNode.parentNode.insertBefore(proposedCornerTakersHeader, proposedCrossTakers)
}

async function proposePenaltyTakers(takers) {
    // Do we already have it?
    if (document.querySelector('.proposed-penalty-takers-container') || document.querySelector('#proposed-penalty-takers')) {
        return
    }

    // Find all h5 elements
    const headers = document.querySelectorAll("h5");

    // Find the one with the text "Penalty Takers"
    const targetHeader = Array.from(headers).find(h => h.textContent.trim() === "Penalty Takers");

    if (!targetHeader) {
        console.info("No Penalty Takers header, will try to find it when the page changes. ")
        return
    }

    function createTakerListItem(taker, personalitiesSymbols) {
        const li = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.classList.add(`denom${Math.floor(taker.penaltyKick / 10)}`);
        nameSpan.textContent = `${taker.name} (${taker.penaltyKick})`;
        li.appendChild(nameSpan);

        if (taker.composure) {
            const composureSpan = document.createElement("span");
            composureSpan.classList.add("composure");
            composureSpan.textContent = " " + personalitiesSymbols["composure"];

            switch (taker.composure) {
                case -2:
                    composureSpan.classList.add("doubleNegative");
                    composureSpan.title = "This player has terrible composure, avoid using him as penalty taker";
                    break;
                case -1:
                    composureSpan.classList.add("negative");
                    composureSpan.title = "This player has bad composure, avoid using him as penalty taker";
                    break;
                case 1:
                    composureSpan.classList.add("positive");
                    composureSpan.title = "This player has good composure, consider using him as penalty taker";
                    break;
                case 2:
                    composureSpan.classList.add("doublePositive");
                    composureSpan.title = "This player has excellent composure, use him as penalty taker";
                    break;
                default:
                    console.warn("Value of taker.composure is unexpected: ", taker.composure);
            }
            li.appendChild(composureSpan);
        }

        return li;
    }

    function buildTakersList(takers, personalitiesSymbols) {
        const ol = document.createElement("ol");
        ol.id = "proposed-penalty-takers";
        for (const taker of takers) {
            ol.appendChild(createTakerListItem(taker, personalitiesSymbols));
        }
        return ol;
    }

    function createSectionHeader(text, tooltip) {
        const header = document.createElement("h6");
        header.id = "proposed-penalty-takers-header";
        header.textContent = text + " ";

        const questionMark = document.createElement("span");
        questionMark.textContent = "\uf29c"; // your icon char
        questionMark.title = tooltip;

        header.appendChild(questionMark);
        return header;
    }

    // Always build recommended takers
    const recommendedHeader = createSectionHeader(
        "Recommended penalty takers",
        "The recommended list below is sorted by the penalty kick computed skill, taking into account possible player composure personality trait - players with positive composure will be higher on the list as the chances of them missing the goal is lower. You should have 5 recommended players on the list, if this is not the case consider lowering the composure treshold in the extension options, because chances are there are currently not enough players with the penalty kick skill above the composure treshold to recommend here. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
    );

    const recommendedList = buildTakersList(takers.recommended, personalitiesSymbols);
    // Decide layout
    if (takers.other.length > 0) {
        // Create two-panel layout
        const container = document.createElement("div");
        container.classList.add("proposed-penalty-takers-container");

        const leftPanel = document.createElement("div");
        leftPanel.classList.add("proposed-penalty-takers-panel");

        const rightPanel = document.createElement("div");
        rightPanel.classList.add("proposed-penalty-takers-panel");

        container.append(leftPanel, rightPanel);
        targetHeader.parentNode.after(container);

        // Fill left panel with recommended
        leftPanel.append(recommendedHeader, recommendedList);
        await insertComposureTresholdInput(recommendedHeader);

        // Add “other takers” on the right
        const otherHeader = createSectionHeader(
            "Other penalty takers",
            "These are other players with the penalty kick skill above the composure treshold, who didn't make it to the recommended list for some reason - likely other players having positive composure which this extension really favours. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
        );
        const otherList = buildTakersList(takers.other, personalitiesSymbols);

        rightPanel.append(otherHeader, otherList);

    } else {
        // Just show recommended below targetHeader
        targetHeader.parentNode.after(recommendedList);
        targetHeader.parentNode.after(recommendedHeader);
        await insertComposureTresholdInput(recommendedHeader);
    }
}

function removeProposedPenaltyTakersControls() {
    if (document.querySelector('.proposed-penalty-takers-container')) {
        console.debug("removing .proposed-penalty-takers-container")
        document.querySelector('.proposed-penalty-takers-container').remove()
    } else {
        if (document.querySelector('#proposed-penalty-takers-header')) {
            console.debug("removing #proposed-penalty-takers-header")
            document.querySelector('#proposed-penalty-takers-header').remove()
        }
        if (document.querySelector('#proposed-penalty-takers')) {
            console.debug("removing #proposed-penalty-takers")
            document.querySelector('#proposed-penalty-takers').remove()
        }
    }
}

async function insertComposureTresholdInput(parent) {
    // Create the input element
    const input = document.createElement("input");
    input.type = "number";
    input.setAttribute("min", "0");
    input.setAttribute("max", "99");
    input.setAttribute("step", "1");
    input.id = "composure-treshold";
    input.placeholder = "Composure treshold";

    const tresholds = await db.getTresholds()
    const composure_treshold = tresholds.composure ?? 50
    input.value = composure_treshold

    // Add a listener for changes
    input.addEventListener("change", async (e) => {
        const newValue = e.target.value;
        const tresholds = await db.getTresholds()
        tresholds['composure'] = parseInt(newValue, 10)

        await db.putTresholds(tresholds)
        console.debug("Updated tresholds =", tresholds);
        removeProposedPenaltyTakersControls()
    });

    // Inject into the page
    parent.appendChild(input)
    const questionMarkSpan = document.createElement("span")
    questionMarkSpan.textContent = " \uf29c "
    questionMarkSpan.title = `Composure treshold - if the player has composure personality trait and his penalty kick skill is above this treshold, ${personalitiesSymbols["composure"]} symbol will appear next to his name. If the penalty kick skill of the player is above this treshold he will be taken into account when recommending penalty takers.`
    parent.appendChild(questionMarkSpan)

    // Ignore composure
    const checkbox = document.createElement("input")
    checkbox.type = "checkbox"
    checkbox.id = "ignoreComposureForPenaltyTakers"
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
    label.appendChild(checkbox)
    const labelSpan = document.createElement("span")
    labelSpan.textContent = " Ignore composure"
    label.appendChild(labelSpan)
    label.htmlFor = "ignoreComposureForPenaltyTakers"
    parent.appendChild(label)
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
    questionMarkSpan.textContent = "  \uf29c "
    questionMarkSpan.title = `Arrogance treshold - if the player has negative arrogance personality trait and is positioned in the defence, or is a substitute and his DP is above this treshold, ${personalitiesSymbols["arrogance"]} symbol will appear next to his name.`
    parent.appendChild(questionMarkSpan)
}

async function processLineup() {
    console.info(`${version} ⚽♟️ Processing lineup...`)
    const pLinks = getPlayerLinks('[id^="ngb-nav-"][id$="-panel"] > fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12')
    const hrefs = getHrefList('[id^="ngb-nav-"][id$="-panel"] > fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12');
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
            const SC = skills[0].querySelector('span[class^="denom"]').textContent.trim();
            const PA = skills[3].querySelector('span[class^="denom"]').textContent.trim();
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
                        penaltyTakersData.recommended.push({ name: name, penaltyKick: penaltyKick, composure: composure });
                    } else {
                        console.debug(`processing composure, penaltyKick = ${penaltyKick} reasonable, but composure ${composure} < 0, leaving reasonablePenaltyKick as false`);
                        penaltyTakersData.discouraged.push({ name: name, penaltyKick: penaltyKick, composure: composure });
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
                    penaltyTakersWithoutComposure.push({ name: name, penaltyKick: penaltyKick, composure: 0 })
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
                const DP = skills[7].querySelector('span[class^="denom"]').textContent.trim();
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
            const BC = skills[2].querySelector('span[class^="denom"]').textContent.trim();
            const PA = skills[3].querySelector('span[class^="denom"]').textContent.trim();
            const cross = Math.floor(0.7 * PA + 0.3 * BC)
            crossingPlayers.push({ name: name, cross: cross })

            const AE = skills[4].querySelector('span[class^="denom"]').textContent.trim();
            anchors.push({ name: name, AE: AE, sportsmanship: sportsmanship ?? 0 })
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
        fixHeader({
            formationContainerSelector: "fw-formation div[touranchor='lineup.select']",
            firstPlayerCardSelector: "div.player-select > fw-player-card",
            columnLabels: ["Name", "S", "A", "Pos", "R"]
        })
    }
    if (hasActiveSetPieces()) {
        fixHeader({
            formationContainerSelector: "fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12",
            firstPlayerCardSelector: "div.container-block > fw-player-card",
            columnLabels: ["Name", " ", "A", "Pos", "R"]
        })
        try {
            const h5Element = document.querySelector('h5[touranchor="lineup.tour"]');
            if (h5Element && !h5Element.querySelector('#arrogance-treshold')) {
                await insertArroganceTresholdInput(h5Element)
            }

            await processLineup()
        } catch (err) {
            console.error(err.message);
        }
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
    const formIndicators = document.querySelectorAll("fw-formation div[touranchor='lineup.select'] > div.player-select > fw-player-card div.p-block > div.p-block-top div.form-indicator-top")
    for (const formIndicator of formIndicators) {
        formIndicator.parentNode.appendChild(formIndicator)
    }

    const firstPlayerContainer = document.querySelector(config.formationContainerSelector + " > " + config.firstPlayerCardSelector + " > div.p-block > div.p-block-top")
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