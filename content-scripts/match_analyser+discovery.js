const minuteSelector = `.engine-minute`
const allPlayersAnchorsSelector = `a[href^="/en/player/"]`

const opportunityToken = `Opportunity for`
const halfTimeToken = `Half Time`
const orderToken = `Issued order`
const tiredToken = `looks tired`
const veryTiredToken = `looks very tired`
const fullTimeToken = `The referee blew the final whistle`

export function getMinute(event) {
    const minuteElement = event.querySelector(minuteSelector)
    if (!minuteElement) {
        throw new Error(`No minute element in event:`, event)
    }
    const digitMatch = minuteElement.textContent.match(/(\d+)/)
    if (!digitMatch || digitMatch.length < 2) {
        throw new Error(`No digit match in minuteElement`, minuteElement)
    }
    return digitMatch[1]
}

export const eventTypes = {
    opportunity: "OPPORTUNITY",
    order: "ORDER",
    tired: "TIRED",
    veryTired: "VERY_TIRED",
    halfTime: "HALFTIME",
    fullTime: "FULLTIME"
}

export function getEventType(eventString) {
    switch (true) {
        case eventString.includes(opportunityToken):
        return eventTypes.opportunity
        case eventString.includes(halfTimeToken):
        return eventTypes.halfTime
        case eventString.includes(orderToken):
        return eventTypes.order
        case eventString.includes(tiredToken):
        return eventTypes.tired
        case eventString.includes(veryTiredToken):
        return eventTypes.veryTired
        case eventString.includes(fullTimeToken):
        return eventTypes.fullTime
        default:
        throw new Error(`Unknown event type encountered in eventString: `, eventString)
    }
}

export const opportunityPhases = {
    creation: "CREATION",
    advance: "ADVANCE",
    attempt: "ATTEMPT",
    penalty: "PENALTY",
    corner: "CORNER",
    freeKick: "FREEKICK"
}

export function getAllPlayersWhoPlayed(matchReportAsString, parser) {
    const matchReport = parser.parseFromString(matchReportAsString, 'text/html')
    const allPlayerAnchors = Array.from(matchReport.querySelectorAll(allPlayersAnchorsSelector))
    const allPlayersWhoPlayed = playersFromAnchorsArray(allPlayerAnchors)
    return allPlayersWhoPlayed
}

function playersFromAnchorsArray(anchorsArray) {
    let players = []
    for (const anchor of anchorsArray) {
        let player = {
            name: anchor.textContent.trim(),
            id: getPlayerIdFromHref(anchor.getAttribute('href')),
            position: getPlayerPosition(anchor)
        }
        players.push(player)
    }
    const unique = [...new Map(players.map(item => [item.id, item])).values()]
    return unique
}

/**
 * 
 * @param {Document} event 
 * @param {[Player]} allPlayersWhoPlayed 
 * @returns [Player] involved players array - can be empty for tactical orders that don't mention any players
 */
export function getInvolvedPlayers(event, allPlayersWhoPlayed) {
    const eventPlayerAnchors = Array.from(event.querySelectorAll(allPlayersAnchorsSelector))
    if (eventPlayerAnchors.length > 0) {
        let involvedPlayers = playersFromAnchorsArray(eventPlayerAnchors)
        return involvedPlayers
    } else {
        // Try finding players by name because conditional orders and tired events don't use links
        const textualRepresentation = getTextualRepresentation(event)
        let involvedPlayers = []
        for (const player of allPlayersWhoPlayed) {
            if (textualRepresentation.includes(player.name)) {
                involvedPlayers.push(player)
            }
        }
        return involvedPlayers
    }
}

function getTextualRepresentation(event) {
    const brs = [...event.querySelectorAll('br')]
    
    // Find the <br> that comes right after the engine-minute span
    const startBr = brs.find(br => br.previousElementSibling?.classList.contains('engine-minute'))
    
    let textualRepresentation = ''
    let node = startBr.nextSibling
    
    while (node && node.nodeName !== 'BR' && node.nodeName !== 'HR') {
        if (node.nodeType === Node.TEXT_NODE) {
            textualRepresentation += node.textContent
        }
        node = node.nextSibling
    }
    return textualRepresentation
}

function getPlayerIdFromHref(href) {
    if (!href) {
        throw new Error(`Null passed to getPlayerIdFromHref`)
    }
    const match = href.match(/player\/(\d+)/)
    if (!match || match.length < 2) {
        throw new Error(`No match for player ID in href: `, href)
    }
    return match[1]
}

function getPlayerPosition(anchor) {
    if (!anchor) {
        throw new Error(`Null passed to getPlayerPosition`)
    }
    const hasSub = anchor.nextElementSibling && anchor.nextElementSibling.tagName === 'SUB'
    if (!hasSub) {
        throw new Error(`Could not find SUB element when trying to determine player position for player: `, anchor)
    }
    const sub = anchor.nextElementSibling.textContent
    return sub.replace(/[\[\]]/g, '').trim()
}