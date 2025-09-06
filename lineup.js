const lineupModulePrefix = "lineup"

console.log(`${new Date().toLocaleString()} ${lineupModulePrefix}: lineup.js script loaded...`)

const optionsStorage = browser.storage.sync;

function getPlayerLinks(selector) {
    // Get the container
    const container = document.querySelector(selector);
    
    if (!container) {
        throw new Error(`Container "${selector}" not found!`);
    } else {
        console.log(`Found container for selector: ${selector}`)
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

function hasActiveSetPieces() {
    const link = document.querySelector('ul.nav-tabs > li.nav-item > a.nav-link.active');
    if (!link) {
        console.log(`No link element`)
    } else {
        console.log(`Found link element: ${link.href}`)
        console.log(`Link text content: ${link.textContent.trim()}`)
    }
    
    return link && link.textContent.trim() === "Set Pieces";
}

function lastPathComponent(url) {
    try {
        const u = new URL(url);         // parse the URL
        const parts = u.pathname.split("/").filter(Boolean);
        return parts.pop() || "";       // last component or "" if none
    } catch (err) {
        console.error("Invalid URL:", url, err);
        return null;
    }
}

async function loadValuesForComponents(components) {
    const playerData = await storage.get('player-data')
    
    const result = playerData['player-data']
    
    return components.map(key => {
        const raw = result[key];
        if (!raw) return null; // missing key
        
        return raw
    });
}

function proposeAnchors(anchors) {
    // Do we already have it?
    if (document.querySelector('#proposed-anchors')) {
        return
    }
    
    // Find all h5 elements
    const headers = document.querySelectorAll("h5");
    
    // Find the one with the text "Penalty Takers"
    const targetHeader = Array.from(headers).find( h => h.textContent.trim() === "Player Selection" );
    
    if (!targetHeader) {
        console.info("No Player Selection header, will try to find it when the page changes. ")
        return
    }
    
    const proposedAnchors = document.createElement("ol");
    proposedAnchors.id = 'proposed-anchors'
    console.debug('Will iterate anchors: ', anchors)
    for (const anchor of anchors) {
        console.debug('creating takerSpan')
        var takerSpan = document.createElement('li')
        takerSpan.classList.add(`denom${Math.floor(anchor.AE / 10)}`)
        takerSpan.textContent = `${anchor.name} (${anchor.AE})`
        console.debug('appending takerSpan to proposedAnchors')
        proposedAnchors.appendChild(takerSpan)
        
        if (anchor.sportsmanship > 0) {
            const sportsmanshipSpan = document.createElement("span");
            sportsmanshipSpan.classList.add('sportsmanship')
            sportsmanshipSpan.textContent = " ⚖\uFE0E"
            switch (anchor.sportsmanship) {
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
            takerSpan.appendChild(sportsmanshipSpan)
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
    questionMarkSpan.title = "The recommended list below is sorted by the aerial skill. You should have 3 recommended players on the list. Nota that this extension will NOT recommend a player with negative sportsmanship as anchor. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
    proposedAnchorsHeader.appendChild(questionMarkSpan)
    
    targetHeader.parentNode.parentNode.insertBefore(proposedAnchorsHeader, proposedAnchors)
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
    const targetHeader = Array.from(headers).find( h => h.textContent.trim() === "Player Selection" );
    
    if (!targetHeader) {
        console.info("No Player Selection header, will try to find it when the page changes. ")
        return
    }
    
    const proposedCrossTakers = document.createElement("ol");
    proposedCrossTakers.id = 'proposed-corner-takers'
    console.debug('Will iterate takers: ', takers)
    for (const taker of takers) {
        console.debug('creating takerSpan')
        var takerSpan = document.createElement('li')
        takerSpan.classList.add(`denom${Math.floor(taker.cross / 10)}`)
        takerSpan.textContent = `${taker.name} (${taker.cross})`
        console.debug('appending takerSpan to proposedCrossTakers')
        proposedCrossTakers.appendChild(takerSpan)
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

function proposePenaltyTakers(takers) {
    // Do we already have it?
    if (document.querySelector('.proposed-penalty-takers-container') || document.querySelector('#proposed-penalty-takers')) {
        return
    }
        
    // Find all h5 elements
    const headers = document.querySelectorAll("h5");
    
    // Find the one with the text "Penalty Takers"
    const targetHeader = Array.from(headers).find( h => h.textContent.trim() === "Penalty Takers" );
    
    if (!targetHeader) {
        console.info("No Penalty Takers header, will try to find it when the page changes. ")
        return
    }
    
    if (takers.other.length > 0) {
        const proposedPenaltyTakersContainer = document.createElement("div")
        proposedPenaltyTakersContainer.classList.add("proposed-penalty-takers-container")
        
        const leftPanel = document.createElement("div")
        leftPanel.classList.add("proposed-penalty-takers-panel")
        
        const rightPanel = document.createElement("div")
        rightPanel.classList.add("proposed-penalty-takers-panel")
        
        proposedPenaltyTakersContainer.appendChild(leftPanel)
        proposedPenaltyTakersContainer.appendChild(rightPanel)
        
        targetHeader.parentNode.after(proposedPenaltyTakersContainer)
        
        const proposedPenaltyTakers = document.createElement("ol");
        proposedPenaltyTakers.id = 'proposed-penalty-takers'
        console.debug('Will iterate takers.recommended: ', takers.recommended)
        for (const taker of takers.recommended) {
            console.debug('creating takerSpan')
            var takerSpan = document.createElement('li')
            takerSpan.classList.add(`denom${Math.floor(taker.penaltyKick / 10)}`)
            takerSpan.textContent = `${taker.name} (${taker.penaltyKick})`
            console.debug('appending takerSpan to proposedPenaltyTakers')
            proposedPenaltyTakers.appendChild(takerSpan)
            
            if (taker.composure) {
                const composureSpan = document.createElement("span");
                composureSpan.classList.add('composure')
                composureSpan.textContent = " ○"
                switch (taker.composure) {
                    case -2:
                        composureSpan.classList.add('doubleNegative');
                        composureSpan.title = "This player has terrible composure, avoid using him as penalty taker";
                        break;
                    case -1:
                        composureSpan.classList.add('negative');
                        composureSpan.title = "This player has bad composure, avoid using him as penalty taker";
                        break;
                    case 1:
                        composureSpan.classList.add('positive');
                        composureSpan.title = "This player has good composure, consider using him as penalty taker";
                        break;
                    case 2:
                        composureSpan.classList.add('doublePositive');
                        composureSpan.title = "This player has excellent composure, use him as penalty taker";
                        break;
                    default:
                        console.warn("Value of taker.composure is unexpected: ", taker.composure);
                }
                takerSpan.appendChild(composureSpan)
            }
        }
        
        const proposedPenaltyTakersHeader = document.createElement("h6");
        proposedPenaltyTakersHeader.id = 'proposed-penalty-takers-header'
        proposedPenaltyTakersHeader.textContent = "Recommended penalty takers "
        const questionMarkSpan = document.createElement("span")
        questionMarkSpan.textContent = "\uf29c"
        questionMarkSpan.title = "The recommended list below is sorted by the penalty kick computed skill, taking into account possible player composure personality trait - players with positive composure will be higher on the list as the chances of them missing the goal is lower. You should have 5 recommended players on the list, if this is not the case consider lowering the composure treshold in the extension options, because chances are there are currently not enough players with the penalty kick skill above the composure treshold to recommend here. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
        proposedPenaltyTakersHeader.appendChild(questionMarkSpan)
        
        leftPanel.appendChild(proposedPenaltyTakersHeader)
        leftPanel.appendChild(proposedPenaltyTakers)
        insertComposureTresholdInput(proposedPenaltyTakersHeader)
        
        // Add the other penalty takers to the right panel
        const otherPenaltyTakers = document.createElement("ol");
        otherPenaltyTakers.id = 'proposed-penalty-takers'
        console.debug('Will iterate takers.other: ', takers.other)
        for (const taker of takers.other) {
            console.debug('creating takerSpan')
            var takerSpan = document.createElement('li')
            takerSpan.classList.add(`denom${Math.floor(taker.penaltyKick / 10)}`)
            takerSpan.textContent = `${taker.name} (${taker.penaltyKick})`
            console.debug('appending takerSpan to otherPenaltyTakers')
            otherPenaltyTakers.appendChild(takerSpan)
        }
        const otherPenaltyTakersHeader = document.createElement("h6");
        otherPenaltyTakersHeader.id = 'proposed-penalty-takers-header'
        otherPenaltyTakersHeader.textContent = "Other penalty takers "
        const questionMarkSpanOther = document.createElement("span")
        questionMarkSpanOther.textContent = "\uf29c "
        questionMarkSpanOther.title = "These are other players with the penalty kick skill above the composure treshold, who didn't make it to the recommended list for some reason - likely other players having positive composure which this extension really favours. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
        otherPenaltyTakersHeader.appendChild(questionMarkSpanOther)
        
        rightPanel.appendChild(otherPenaltyTakersHeader)
        rightPanel.appendChild(otherPenaltyTakers)
    } else {
        const proposedPenaltyTakers = document.createElement("ol");
        proposedPenaltyTakers.id = 'proposed-penalty-takers'
        console.debug('Will iterate takers.recommended: ', takers.recommended)
        for (const taker of takers.recommended) {
            console.debug('creating takerSpan')
            var takerSpan = document.createElement('li')
            takerSpan.classList.add(`denom${Math.floor(taker.penaltyKick / 10)}`)
            takerSpan.textContent = `${taker.name} (${taker.penaltyKick})`
            console.debug('appending takerSpan to proposedPenaltyTakers')
            proposedPenaltyTakers.appendChild(takerSpan)
            
            if (taker.composure) {
                const composureSpan = document.createElement("span");
                composureSpan.classList.add('composure')
                composureSpan.textContent = " ○"
                switch (taker.composure) {
                    case -2:
                        composureSpan.classList.add('doubleNegative');
                        composureSpan.title = "This player has terrible composure, avoid using him as penalty taker";
                        break;
                    case -1:
                        composureSpan.classList.add('negative');
                        composureSpan.title = "This player has bad composure, avoid using him as penalty taker";
                        break;
                    case 1:
                        composureSpan.classList.add('positive');
                        composureSpan.title = "This player has good composure, consider using him as penalty taker";
                        break;
                    case 2:
                        composureSpan.classList.add('doublePositive');
                        composureSpan.title = "This player has excellent composure, use him as penalty taker";
                        break;
                    default:
                        console.warn("Value of taker.composure is unexpected: ", taker.composure);
                }
                takerSpan.appendChild(composureSpan)
            }
        }
        targetHeader.parentNode.after(proposedPenaltyTakers);
        
        const proposedPenaltyTakersHeader = document.createElement("h6");
        proposedPenaltyTakersHeader.id = 'proposed-penalty-takers-header'
        proposedPenaltyTakersHeader.textContent = "Recommended penalty takers "
        const questionMarkSpan = document.createElement("span")
        questionMarkSpan.textContent = "\uf29c "
        questionMarkSpan.title = "The recommended list below is sorted by the penalty kick computed skill, taking into account possible player composure personality trait - players with positive composure will be higher on the list as the chances of them missing the goal is lower. You should have 5 recommended players on the list, if this is not the case consider lowering the composure treshold in the extension options, because chances are there are currently not enough players with the penalty kick skill above the composure treshold to recommend here. If you think a player is missing here, make sure you visit his page first so that the extension can save his data, then reload the lineup page."
        proposedPenaltyTakersHeader.appendChild(questionMarkSpan)
        targetHeader.parentNode.after(proposedPenaltyTakersHeader);
        
        insertComposureTresholdInput(proposedPenaltyTakersHeader)
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
    
    // Optional: load saved value from options storage
    const { tresholds } = await optionsStorage.get("tresholds");
    if (tresholds['composure_treshold']) {
        input.value = tresholds['composure_treshold'];
    }
    
    // Add a listener for changes
    input.addEventListener("change", async (e) => {
        const newValue = e.target.value;
        tresholds['composure_treshold'] = newValue
        
        await optionsStorage.set({ tresholds: tresholds });
        console.debug("Updated tresholds =", tresholds);
        
        if (document.querySelector('.proposed-penalty-takers-container')) {
            document.querySelector('.proposed-penalty-takers-container').remove()
        } else {
            if (document.querySelector('#proposed-penalty-takers-header')) {
                document.querySelector('#proposed-penalty-takers-header').remove()
            }
            if (document.querySelector('#proposed-penalty-takers')) {
                document.querySelector('#proposed-penalty-takers').remove()
            }
        }
    });
    
    // Inject into the page
    parent.appendChild(input);
}

function addNoDataSymbol(container) {
    const hasNoDataSymbol = Array.from(container.children).some(
        child => child.textContent.trim() === "📂"
    );

    if (!hasNoDataSymbol) {
        const statusSpan = document.createElement("span");
        statusSpan.textContent = " 📂";
        statusSpan.title = "No data, visit this player's page to load the necessary data";
        container.appendChild(statusSpan);
    }
}

function removeNoDataSymbol(container) {
    const spans = container.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === "📂") {
            span.remove();
        }
    });
}

async function processLineup() {
    const pLinks = getPlayerLinks('[id^="ngb-nav-"][id$="-panel"] > fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12')
    const hrefs = getHrefList('[id^="ngb-nav-"][id$="-panel"] > fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12');
    console.debug(hrefs);
    const lastParts = hrefs.map(lastPathComponent);
    console.debug(lastParts)
    const profiles = await loadValuesForComponents(lastParts);
    console.debug('Profiles: ', profiles)
    
    // Load tresholds from storage
    const { tresholds = {} } = await optionsStorage.get("tresholds");
    console.debug(`Loaded tresholds from storage: `, tresholds)
    
    var proposedPenaltyTakersArray = {
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
            console.log('Processing player:', name);
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
        
        // compatibility with 1.3.1 and older
        if (isString(personalities)) {
            console.info("Applying compatibility with <1.3.1 extension version, personalities are processed into objects")
            personalities = JSON.parse(personalities)
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
            const composure_treshold = tresholds['composure_treshold'] ?? 50
            if (!tresholds) {
                console.warn("Tresholds could not be loaded from options storage! Using default composure_treshold of ", 50)
            }
            if (composure) {
                console.debug(`${name} - comparing penaltyKick ${penaltyKick} with composure_treshold ${composure_treshold}`)
                if (penaltyKick > composure_treshold) {
                    if (composure > 0) {
                        console.debug(`processing composure, penaltyKick = ${penaltyKick} reasonable, composure ${composure} > 0, setting reasonablePenaltyKick to true`);
                        reasonablePenaltyKick = true
                        proposedPenaltyTakersArray.recommended.push({ name: name, penaltyKick: penaltyKick, composure: composure });
                    } else {
                        console.debug(`processing composure, penaltyKick = ${penaltyKick} reasonable, but composure ${composure} < 0, leaving reasonablePenaltyKick as false`);
                        proposedPenaltyTakersArray.discouraged.push({ name: name, penaltyKick: penaltyKick, composure: composure });
                    }
                } else {
                    console.debug(`processing composure, penaltyKick = ${penaltyKick} below reasonable level, leaving reasonablePenaltyKick as false`);
                }
                

                if (isInAttackZone  || isInMidfieldZone || (isSub && reasonablePenaltyKick)) {
                  console.debug(`applying composure: ${composure} to ${name}`)
                  applyComposure(pLinks[i], composure)
                } else {
                  console.debug('Has composure in profile, but not in the attack or midfield zone or penaltyKick under reasonable level, skipping...');
                }
            } else {
                console.debug(`processing composure, but the player is not an outfielder, leaving reasonablePenaltyKick as false`);
                if (penaltyKick > composure_treshold) {
                    penaltyTakersWithoutComposure.push({ name: name, penaltyKick: penaltyKick, composure: 0 })
                }
            }
        }
        
        if (arrogance && arrogance < 0) { // only bother with this if the arrogance is negative, otherwise there is no impact on offsides
            console.log('Arrogance negative, proceeding...');
            // First check if on a defensive position
            // Get all siblings
            const siblings = Array.from(pLinks[i].parentNode.parentNode.parentNode.parentNode.children)

            // Check if any sibling has a <span> with the class "defence-zone"
            const isInDefenceZone = siblings.some(sib => sib.querySelector('span.defence-zone') !== null);
            const isSub = siblings.some(sib => sib.querySelector('span.substitute') !== null);
            
            // Alternatively check if the defensive skill is reasonable
            const skills = siblings.filter(el => el.querySelector('fw-player-skill') !== null);
            var reasonableDP = false
            const arrogance_treshold = tresholds['arrogance_treshold'] ?? 50
            if (skills.length == 8) { // goalkeepers have only 6 skills
                const DP = skills[7].querySelector('span[class^="denom"]').textContent.trim();
                if (DP > arrogance_treshold) {
                    console.debug(`DP = ${DP} reasonable, setting reasonableDP to true`);
                    reasonableDP = true
                } else {
                    console.debug(`DP = ${DP} below reasonable level, leaving reasonableDP as false`);
                }
            }

            if (isInDefenceZone || (isSub && reasonableDP)) {
              console.debug(`applying arrogance: ${arrogance} to ${name}`)
              applyArrogance(pLinks[i], arrogance)
            } else {
              console.log('Has arrogance in profile, but not in the defence zone or DP under reasonable level, skipping...');
            }
        } else {
            console.log('Arrogance positive or not in profile, skipping');
        }
        
        if (sportsmanship) {
            applySportsmanship(pLinks[i], sportsmanship)
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
    
    // Propose anchors
    const withoutFouls = anchors.filter( player => player.sportsmanship >= 0 )
    withoutFouls.sort((a, b) => {
        const AEDiff = b.AE - a.AE
        if (AEDiff !== 0) return AEDiff
        return b.sportsmanship - a.sportsmanship
    })
    proposeAnchors(withoutFouls.slice(0, 3))
    
    // Propose cross takers
    crossingPlayers.sort((a, b) => {
        return b.cross - a.cross
    })
    proposeCrossTakers(crossingPlayers.slice(0, 3))
    
    // Propose penalty takers
    penaltyTakersWithoutComposure.sort((a, b) => b.penaltyKick - a.penaltyKick);
    console.debug('sorted penaltyTakersWithoutComposure: ', penaltyTakersWithoutComposure)
    const recommendedWithComposure = proposedPenaltyTakersArray.recommended
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
        proposedPenaltyTakersArray.recommended = mergedArray
        
        // add other for the players with high penalty kick skill but for some reason not recommended (e.g. no positive or negative composure etc.)
        const other = penaltyTakersWithoutComposure.slice(5 - recommendedWithComposure.length, penaltyTakersWithoutComposure.length)
        proposedPenaltyTakersArray.other = other
    }
    
    console.debug('passing to proposePenaltyTakers: ', proposedPenaltyTakersArray)
    proposePenaltyTakers(proposedPenaltyTakersArray)
}

function applySportsmanship(element, sportsmanship) {
    const hasSportsmanshipSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
      child => child.textContent.trim() === "⚖\uFE0E"
    );
    if (!hasSportsmanshipSymbol) {
        console.debug(`Applying sportsmanship: ${sportsmanship}`)
        
        const sportsmanshipSpan = document.createElement("span");
        sportsmanshipSpan.classList.add('sportsmanship')
        sportsmanshipSpan.textContent = " ⚖\uFE0E"
        switch (sportsmanship) {
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
                console.warn("Value of sportsmanship is unexpected: ", sportsmanship);
        }
        
        element.parentNode.parentNode.parentNode.appendChild(sportsmanshipSpan)
    }
}

function applyArrogance(element, arrogance) {
    const hasArroganceSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
      child => child.textContent.trim() === "♛"
    );
    if (!hasArroganceSymbol) {
        console.debug(`Applying arrogance: ${arrogance}`)
        
        const arroganceSpan = document.createElement("span");
        arroganceSpan.classList.add('arrogance')
        arroganceSpan.textContent = " ♛"
        switch (arrogance) {
            case -2:
                arroganceSpan.classList.add('doubleNegative');
                arroganceSpan.title = "This player is very arrogant, he will significantly disrupt your offside attempts";
                break;
            case -1:
                arroganceSpan.classList.add('negative');
                arroganceSpan.title = "This player is arrogant, he will disrupt your offside attempts";
                break;
            case 1:
                // not used for offsides
                break;
            case 2:
                // not used for offsides
                break;
            default:
                console.warn("Value of arrogance is unexpected: ", arrogance);
        }
        
        element.parentNode.parentNode.parentNode.appendChild(arroganceSpan)
    }
}

function applyComposure(element, composure) {
    const hasComposureSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
      child => child.textContent.trim() === "○"
    );
    if (!hasComposureSymbol) {
        console.debug(`Applying composure: ${composure}`)
        
        const composureSpan = document.createElement("span");
        composureSpan.classList.add('composure')
        composureSpan.textContent = " ○"
        switch (composure) {
            case -2:
                composureSpan.classList.add('doubleNegative');
                composureSpan.title = "This player has terrible composure, avoid using him as penalty taker";
                break;
            case -1:
                composureSpan.classList.add('negative');
                composureSpan.title = "This player has bad composure, avoid using him as penalty taker";
                break;
            case 1:
                composureSpan.classList.add('positive');
                composureSpan.title = "This player has good composure, consider using him as penalty taker";
                break;
            case 2:
                composureSpan.classList.add('doublePositive');
                composureSpan.title = "This player has excellent composure, use him as penalty taker";
                break;
            default:
                console.warn("Value of composure is unexpected: ", composure);
        }
        
        element.parentNode.parentNode.parentNode.appendChild(composureSpan)
    }
}

function applyLeadership(element, leadership) {
    const hasLeadershipSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
      child => child.textContent.trim() === "✪"
    );
    if (!hasLeadershipSymbol) {
        console.debug(`Applying Leadership: ${leadership}`)
        
        const leadershipSpan = document.createElement("span");
        leadershipSpan.classList.add('leadership')
        leadershipSpan.textContent = " ✪"
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

// Options for the observer (which mutations to observe)
const lineupObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const lineupObservingCallback = (mutationList, observer) => {
    if (hasActiveSetPieces()) {
        try {
            processLineup()
        } catch (err) {
            console.error(err.message);
        }
    } else {
        console.log(`Set Pieces not active, skipping...`)
    }
};

// Create an observer instance linked to the callback function
const lineupObserver = new MutationObserver(lineupObservingCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${new Date().toLocaleString()} ${lineupModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.includes("lineup")) {
        // Start observing the target node for configured mutations
        lineupObserver.observe(alwaysPresentNode, lineupObservingConfig);
        console.debug(`${new Date().toLocaleString()} ${lineupModulePrefix} Started the div.wrapper observation`)
    } else {
        lineupObserver.disconnect()
        console.debug(`${new Date().toLocaleString()} ${lineupModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})

addCSS(`
    span.leadership {
        font-size: 1.4em;
        cursor: help;
    }
    span.leadership.doublePositive {
        color: #228B22;
    }
    span.leadership.positive {
        color: #4CBB17;
    }
    span.leadership.negative {
        color: #FFD700;
    }
    span.leadership.doubleNegative {
        color: #FF4500;
    }

    span.composure {
        font-size: 1.2em;
        cursor: help;
    }
    span.composure.doublePositive {
        color: #228B22;
    }
    span.composure.positive {
        color: #4CBB17;
    }
    span.composure.negative {
        color: #FFD700;
    }
    span.composure.doubleNegative {
        color: #FF4500;
    }

    span.arrogance {
        font-size: 1.2em;
        cursor: help;
    }
    span.arrogance.negative {
        color: #FFD700;
    }
    span.arrogance.doubleNegative {
        color: #FF4500;
    }

    span.sportsmanship {
        font-size: 1.4em;
        cursor: help;
    }
    span.sportsmanship.doublePositive {
        color: #228B22;
    }
    span.sportsmanship.positive {
        color: #4CBB17;
    }
    span.sportsmanship.negative {
        color: #FFD700;
    }
    span.sportsmanship.doubleNegative {
        color: #FF4500;
    }

    ol#proposed-penalty-takers, ol#proposed-corner-takers, ol#proposed-anchors {
        font-size: .8rem;
        text-align: center;

        list-style-type: none; /* removes numbers */
        padding-left: 0;       /* optional: remove indentation */
        margin-left: 0;  
    }

    h6#proposed-penalty-takers-header, h6#proposed-corner-takers-header, h6#proposed-anchors-header {
        text-align: center;
    }

    h6#proposed-penalty-takers-header span, h6#proposed-corner-takers-header span, h6#proposed-anchors-header span {
        cursor: help;
        font: 14px/1 FontAwesome;
    }

    div.proposed-penalty-takers-container {
        display: flex;
    }

    div.proposed-penalty-takers-panel {
        flex: 1;                 /* Equal width */
        display: flex;
        flex-direction: column;  /* 👈 stack children vertically */
        justify-content: flex-start; /* 👈 Align children to top */
        align-items: center;
    }

    input#composure-treshold {
        width: 160px;         /* make it wider */
        height: 26px;         /* control the height */
        padding: 4px 4px;     /* inner spacing */
        border-radius: 8px;   /* rounded corners */
        font-size: 13px;      /* adjust font size */
        box-sizing: border-box;
    }
`)
