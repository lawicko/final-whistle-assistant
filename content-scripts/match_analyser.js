export async function analyseMatch(matchReportAsString) {
    const textTrim = s => (s || '').trim();
    const playerIdFromHref = href => {
        const m = href && href.match(/player\/(\d+)/);
        return m ? m[1] : null;
    };
    const positionFromSub = (anchor) => {
        const sub = anchor.nextElementSibling && anchor.nextElementSibling.tagName === 'SUB'
            ? anchor.nextElementSibling.textContent
            : null;
        return sub ? sub.replace(/[\[\]]/g, '').trim() : null;
    };
    const nearestPreviousAnchor = (node, doc) => {
        let n = node;
        while (n && n !== doc.body) {
            // walk previous siblings
            let prev = n.previousSibling;
            while (prev) {
                if (prev.nodeType === Node.ELEMENT_NODE) {
                    if (prev.tagName === 'A' && prev.getAttribute('href') && /player\/\d+/.test(prev.getAttribute('href'))) return prev;
                    const innerA = prev.querySelector && prev.querySelector('a[href^="/en/player/"]');
                    if (innerA) return innerA;
                }
                prev = prev.previousSibling;
            }
            n = n.parentNode;
        }
        return null;
    };
    const nearestNextAnchor = (node, doc) => {
        let n = node;
        while (n && n !== doc.body) {
            let next = n.nextSibling;
            while (next) {
                if (next.nodeType === Node.ELEMENT_NODE) {
                    if (next.tagName === 'A' && next.getAttribute('href') && /player\/\d+/.test(next.getAttribute('href'))) return next;
                    const innerA = next.querySelector && next.querySelector('a[href^="/en/player/"]');
                    if (innerA) return innerA;
                }
                next = next.nextSibling;
            }
            n = n.parentNode;
        }
        return null;
    };

    let opportunities = matchReportAsString.replace(
        /(<span\s+class=['"]?engine-minute['"]?>Minute\s*\d+<\/span>)/g,
        "<hr>$1"
    );
    opportunities = opportunities.split("<hr>")
        .filter(str => !str.includes("Half Time, players are  heading back to the locker rooms to rest a bit"))
        .filter(str => str.includes("Opportunity for"))

    let results = []
    const parser = new DOMParser()
    for (const opportunity of opportunities) {
        console.info("opportunity:", opportunity)
        const doc = parser.parseFromString(opportunity, 'text/html');

        // minute
        const minuteEl = doc.querySelector('.engine-minute');
        const minute = minuteEl ? (minuteEl.textContent.match(/(\d+)/) || [null, null])[1] : null;

        // team
        const teamEl = doc.querySelector('.engine-team');
        const team = teamEl ? textTrim(teamEl.textContent) : null;

        // all player anchors in DOM order
        const anchors = Array.from(doc.querySelectorAll('a[href^="/en/player/"]'));

        // creator is first player anchor
        const creatorAnchor = anchors[0] || null;
        const creator = creatorAnchor ? {
            name: textTrim(creatorAnchor.textContent),
            id: playerIdFromHref(creatorAnchor.getAttribute('href')),
            position: positionFromSub(creatorAnchor)
        } : null;

        // potentialAssistant: find all .engine-pass-type elements and map to nearest previous anchor (the passer)
        const passTypeEls = Array.from(doc.querySelectorAll('.engine-pass-type'));
        const passAnchors = passTypeEls.map(el => nearestPreviousAnchor(el, doc)).filter(Boolean);
        const potentialAssistantAnchor = passAnchors.length ? passAnchors[passAnchors.length - 1] : null;
        const potentialAssistant = potentialAssistantAnchor ? {
            name: textTrim(potentialAssistantAnchor.textContent),
            id: playerIdFromHref(potentialAssistantAnchor.getAttribute('href')),
            position: positionFromSub(potentialAssistantAnchor)
        } : null;

        // intendedReceiver: last "pass to" occurrence -> nearest next anchor after that text
        let intendedReceiver = null;
        const passToNodes = [];
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        while (walker.nextNode()) {
            if (/pass to/i.test(walker.currentNode.nodeValue)) passToNodes.push(walker.currentNode);
        }
        if (passToNodes.length) {
            const lastPassTo = passToNodes[passToNodes.length - 1];
            const found = nearestNextAnchor(lastPassTo, doc);
            if (found) {
                intendedReceiver = {
                    name: textTrim(found.textContent),
                    id: playerIdFromHref(found.getAttribute('href')),
                    position: positionFromSub(found)
                };
            }
        }

        // passType: prefer the last .engine-pass-type text, default to 'low'
        const passType = passTypeEls.length ? textTrim(passTypeEls[passTypeEls.length - 1].textContent) : 'low';

        // stopper: look for several outcome phrases and map to outcome
        const outcomePatterns = [
            { regex: /cleared the ball to safety/i, how: 'cleared' },
            { regex: /managed to get hold of the ball/i, how: 'caught' },
            { regex: /sent ball to corner/i, how: 'corner' },
            { regex: /committed a foul/i, how: 'offensiveFoul' },
            { regex: /intercepted the ball/i, how: 'interception' },
            { regex: /was blocked by the opponent player!/i, how: 'block' },
            { regex: /GOAL!/i, how: 'goal' },
            // add more patterns here if needed
        ];
        let stopper = null;
        let outcome = null;
        let context = null;
        const walker2 = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        const matchedOutcomeNodes = [];
        while (walker2.nextNode()) {
            const txt = walker2.currentNode.nodeValue;
            for (const pat of outcomePatterns) {
                if (pat.regex.test(txt)) matchedOutcomeNodes.push({ node: walker2.currentNode, how: pat.how });
            }
        }
        if (matchedOutcomeNodes.length) {
            const last = matchedOutcomeNodes[matchedOutcomeNodes.length - 1];
            const possibleBlock = matchedOutcomeNodes[matchedOutcomeNodes.length - 2];
            switch (last) {
                case "goal":
                    // No need to do anything for goals
                    break;
                default:
                    const foundAnchor = nearestPreviousAnchor(last.node, doc);
                    if (foundAnchor) {
                        stopper = {
                            name: textTrim(foundAnchor.textContent),
                            id: playerIdFromHref(foundAnchor.getAttribute('href')),
                            position: positionFromSub(foundAnchor)
                        };
                    }
                    if (possibleBlock && possibleBlock.how === "block") {
                        context = "block"
                    }
                    break;
            }
            outcome = last.how;
        }

        // detect context markers (Corner, Goal Attempt, etc.)
        const contextMarkers = Array.from(doc.querySelectorAll('.engine-corner, .engine-free-kick, .engine-goal-attempt'))
            .map(el => textTrim(el.textContent.toLowerCase()))

        if (contextMarkers.includes('corner')) {
            // if both potentialAssistant and stopper appear after a Corner marker, set context
            const cornerEl = doc.querySelector('.engine-corner')
            if (cornerEl) {
                const cornerIndex = anchors.findIndex(a => a.compareDocumentPosition(cornerEl) & Node.DOCUMENT_POSITION_FOLLOWING)
                const paIndex = anchors.indexOf(potentialAssistantAnchor)
                const stIndex = stopper ? anchors.indexOf(doc.querySelector(`a[href*="${stopper.id}"]`)) : -1
                if (paIndex > cornerIndex && stIndex > cornerIndex) {
                    context = 'corner'
                }
            }
        }

        if (contextMarkers.includes('free kick')) {
            // if both potentialAssistant and stopper appear after a free kick marker, set context
            const freeKickEl = doc.querySelector('.engine-free-kick')
            if (freeKickEl) {
                const freeKickIndex = anchors.findIndex(a => a.compareDocumentPosition(freeKickEl) & Node.DOCUMENT_POSITION_FOLLOWING)
                const paIndex = anchors.indexOf(potentialAssistantAnchor)
                const stIndex = stopper ? anchors.indexOf(doc.querySelector(`a[href*="${stopper.id}"]`)) : -1
                if (paIndex > freeKickIndex && stIndex > freeKickIndex) {
                    context = 'free kick'
                }
            }
        }

        results.push({
            minute,
            team,
            context,
            creator,
            potentialAssistant,
            intendedReceiver,
            passType,
            stopper,
            outcome
        })
    }
    return results
}
