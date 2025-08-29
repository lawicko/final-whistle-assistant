const lineupModulePrefix = "lineup"

console.log(`${new Date().toLocaleString()} ${lineupModulePrefix}: lineup.js script loaded...`)

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
        
        try {
            return JSON.parse(raw); // parse JSON string
        } catch (e) {
            console.warn(`Failed to parse JSON for key "${key}":`, raw);
            return null; // fallback if JSON invalid
        }
    });
}

async function processLineup() {
    const pLinks = getPlayerLinks('#ngb-nav-2-panel > fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12')
    const hrefs = getHrefList('#ngb-nav-2-panel > fw-set-pieces > div.row > div.col-md-6 > div.row > div.col-md-12');
    console.debug(hrefs);
    const lastParts = hrefs.map(lastPathComponent);
    console.debug(lastParts)
    const profiles = await loadValuesForComponents(lastParts);
    console.debug(profiles)
    
    // Load tresholds from storage
    const { tresholds = {} } = await storage.get("tresholds");
    console.debug(`Loaded tresholds from storage: `, tresholds)
    
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
            console.warning('No non-empty span found - unable to determine the player name :(');
        }
        
        if (profile === null) {
            console.debug(`No profile saved in storage for ${name}, skipping...`)
            
            const hasNoDataSymbol = Array.from(pLinks[i].parentNode.parentNode.parentNode.children).some(
              child => child.textContent.trim() === "📂"
            );
            
            if (!hasNoDataSymbol) {
                const statusSpan = document.createElement("span");
                statusSpan.textContent = " 📂"
                statusSpan.title = "No data, visit this players page to load the necessary data";
                pLinks[i].parentNode.parentNode.parentNode.appendChild(statusSpan)
            }
            
            continue
        } else {
            const spans = pLinks[i].parentNode.parentNode.parentNode.querySelectorAll("span");
            
            spans.forEach(span => {
                if (span.textContent.trim() === "📂") {
                    span.remove();
                }
            });
        }
        console.debug(`Found profile for ${name}, applying...`)
        const leadership = profile['personalities']['leadership']
        const composure = profile['personalities']['composure']
        const arrogance = profile['personalities']['arrogance']
        const sportsmanship = profile['personalities']['sportsmanship']
        
        if (leadership) {
            applyLeadership(pLinks[i], profile['personalities']['leadership'])
        }
        
        if (composure) {
            // First check if on FW position
            // Get all siblings
            const siblings = Array.from(pLinks[i].parentNode.parentNode.parentNode.parentNode.children)

            // Check if any sibling has a <span> with the class "attack-zone"
            const hasSiblingWithSpan = siblings.some(sib => sib.querySelector('span.attack-zone') !== null);
            const isSub = siblings.some(sib => sib.querySelector('span.substitute') !== null);
            
            // Alternatively check if the effective penalty kick skill is reasonable
            const skills = siblings.filter(el => el.querySelector('fw-player-skill') !== null);
            var reasonablePenaltyKick = false
            const composure_treshold = tresholds['composure_treshold'] ?? 50
            if (skills.length == 8) { // goalkeepers have only 6 skills
                const SC = skills[0].querySelector('span[class^="denom"]').textContent.trim();
                const PA = skills[3].querySelector('span[class^="denom"]').textContent.trim();
                const penaltyKick = Math.floor(Math.max(1.2 * SC, 0.8 * PA))
                if (penaltyKick > composure_treshold) {
                    console.debug(`processing composure, penaltyKick = ${penaltyKick} reasonable, setting reasonablePenaltyKick to true`);
                    reasonablePenaltyKick = true
                } else {
                    console.debug(`processing composure, penaltyKick = ${penaltyKick} below reasonable level, leaving reasonablePenaltyKick as false`);
                }
            } else {
                console.debug(`processing composure, but the player is not an outfielder, leaving reasonablePenaltyKick as false`);
            }

            if (hasSiblingWithSpan || (isSub && reasonablePenaltyKick)) {
              console.debug(`applying composure: ${composure} to ${name}`)
              applyComposure(pLinks[i], composure)
            } else {
              console.log('Has composure in profile, but not in the attack zone or penaltyKick under reasonable level, skipping...');
            }
        }
        
        if (arrogance && arrogance < 0) { // only bother with this if the arrogance is negative, otherwise there is no impact on offsides
            console.log('Arrogance negative, proceeding...');
            // First check if on a defensive position
            // Get all siblings
            const siblings = Array.from(pLinks[i].parentNode.parentNode.parentNode.parentNode.children)

            // Check if any sibling has a <span> with the class "defence-zone"
            const hasSiblingWithSpan = siblings.some(sib => sib.querySelector('span.defence-zone') !== null);
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

            if (hasSiblingWithSpan || (isSub && reasonableDP)) {
              console.debug(`applying arrogance: ${arrogance} to ${name}`)
              applyArrogance(pLinks[i], arrogance)
            } else {
              console.log('Has arrogance in profile, but not in the defence zone or DP under reasonable level, skipping...');
            }
        } else {
            console.log('Arrogance positive or not in profile, skipping');
        }
        
        if (sportsmanship) {
//            // First check if on a defensive position
//            // Get all siblings
//            const siblings = Array.from(pLinks[i].parentNode.parentNode.parentNode.parentNode.children)
//
//            // Check if any sibling has a <span> with the class "defence-zone"
//            const hasSiblingWithSpan = siblings.some(sib => sib.querySelector('span.defence-zone') !== null);
//            const isSub = siblings.some(sib => sib.querySelector('span.substitute') !== null);
//            
//            if (hasSiblingWithSpan || isSub) {
//              console.debug(`applying sportsmanship: ${sportsmanship} to ${name}`)
              applySportsmanship(pLinks[i], sportsmanship)
//            } else {
//              console.log('Has sportsmanship in profile, but not in the defence zone and not a substitute, skipping...');
//            }
        }
    }
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
                console.warn("Value is unexpected");
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
                console.warn("Value is unexpected");
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
                console.warn("Value is unexpected");
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
                console.warn("Value is unexpected");
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
    }
    span.arrogance.negative {
        color: #FFD700;
    }
    span.arrogance.doubleNegative {
        color: #FF4500;
    }

    span.sportsmanship {
        font-size: 1.4em;
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
`)
