import * as utils from "./utils.js"
import * as db from './db_access.js'

// The node that will be observed for mutations
export const alwaysPresentNode = document.querySelector("div.wrapper")

export function nextMatching(el, selector) {
    let sib = el.nextElementSibling
    while (sib) {
        if (sib.matches(selector)) return sib
        sib = sib.nextElementSibling
    }
    return null
}

export const PositionsKeys = {
    CB: "CB",
    CM: "CM",
    DM: "DM",
    FW: "FW",
    GK: "GK",
    LB: "LB",
    LM: "LM",
    LW: "LW",
    LWB: "LWB",
    OM: "OM",
    RB: "RB",
    RM: "RM",
    RW: "RW",
    RWB: "RWB"
}

/**
 * Normalize a symbol/emoji to text or emoji presentation.
 *
 * @param {string} char - The base character (emoji-capable).
 * @param {"text"|"emoji"} [style="text"] - Force text (monochrome) or emoji (colorful).
 * @returns {string} The normalized string with variation selector applied.
 */
function normalizeEmoji(char, style = "text") {
    const VS15 = "\uFE0E"; // text presentation selector
    const VS16 = "\uFE0F"; // emoji presentation selector

    // Remove any existing variation selector to avoid duplication
    const base = char.replace(/[\uFE0E\uFE0F]/g, "");

    return style === "emoji" ? base + VS16 : base + VS15;
}

export const personalitiesSymbols = {
    "arrogance": normalizeEmoji("♛", "text"),
    "composure": normalizeEmoji("○", "text"),
    "leadership": normalizeEmoji("✪", "text"),
    "sportsmanship": normalizeEmoji("⚖", "text"),
    "teamwork": normalizeEmoji("⬡", "text")
}

export const specialTalentSymbol = "⚡︎"

export function toggleClass(el, className) {
    if (el.className.indexOf(className) >= 0) {
        el.className = el.className.replace(` ${className}`, "");
    } else {
        el.className += ` ${className}`;
    }
}

export function getCurrentSeasonNumber() {
    const seasonElement = document.querySelector("div.nav-item.season > span.status-value")
    return parseInt(seasonElement.textContent.trim())
}

export function getCurrentWeekNumber() {
    const weekElement = document.querySelector("div.popover-body > div.popover-content span.week-value")
    if (!weekElement) return undefined
    return parseInt(weekElement.textContent.trim())
}

export function removeNoDataSymbol(container) {
    const spans = container.querySelectorAll("span");
    spans.forEach(span => {
        if (span.textContent.trim() === "📂") {
            span.remove();
        }
    });
}

export function calculateAssistance({ OP, BC, TA, DP, teamwork = 0 }) {
    // Base values
    const offensiveAssistanceNoModifiers = OP + BC;
    const defensiveAssistanceNoModifiers = TA + DP;

    const offensiveAssistanceMax = 200; // 100 + 100
    const defensiveAssistanceMax = 200; // 100 + 100

    // Determine teamwork multiplier and description
    let twp = 0;
    let teamworkDescription = '';
    switch (teamwork) {
        case -2:
            twp = -0.25;
            teamworkDescription = '--';
            break;
        case -1:
            twp = -0.15;
            teamworkDescription = '-';
            break;
        case 1:
            twp = 0.15;
            teamworkDescription = '+';
            break;
        case 2:
            twp = 0.25;
            teamworkDescription = '++';
            break;
        case 0:
            twp = 0;
            teamworkDescription = '';
            break;
        default:
            console.warn("Unexpected teamwork value:", teamwork);
            twp = 0;
            teamworkDescription = '';
    }

    // Apply teamwork modifier
    const offensiveAssistance = Math.floor(offensiveAssistanceNoModifiers * (1 + twp));
    const defensiveAssistance = Math.floor(defensiveAssistanceNoModifiers * (1 + twp));

    // Denominations
    const offensiveAssistanceDenominationNormalized = utils.denomination((offensiveAssistance / offensiveAssistanceMax) * 100);
    const defensiveAssistanceDenominationNormalized = utils.denomination((defensiveAssistance / defensiveAssistanceMax) * 100);

    // Offensive assistance details
    const offensiveAssistanceModifierDifference = offensiveAssistance - offensiveAssistanceNoModifiers
    var offensiveAssistanceModifierDetails = ``
    if (offensiveAssistanceModifierDifference !== 0) {
        const sign = offensiveAssistanceModifierDifference > 0 ? '+' : '-'
        offensiveAssistanceModifierDetails = ` (${offensiveAssistanceNoModifiers} ${sign} ${Math.abs(offensiveAssistanceModifierDifference)} from Teamwork${teamworkDescription} personality)`
    }

    // Defensive assistance details
    const defensiveAssistanceModifierDifference = defensiveAssistance - defensiveAssistanceNoModifiers
    var defensiveAssistanceModifierDetails = ``
    if (defensiveAssistanceModifierDifference !== 0) {
        const sign = defensiveAssistanceModifierDifference > 0 ? '+' : '-'
        defensiveAssistanceModifierDetails = ` (${defensiveAssistanceNoModifiers} ${sign} ${Math.abs(defensiveAssistanceModifierDifference)} from Teamwork${teamworkDescription} personality)`
    }

    return {
        offensiveAssistance,
        defensiveAssistance,
        offensiveAssistanceModifierDetails,
        defensiveAssistanceModifierDetails,
        offensiveAssistanceDenominationNormalized,
        defensiveAssistanceDenominationNormalized,
        teamworkDescription
    };
}

export function calculateDefensiveAssistanceGK({ OR, teamwork = 0 }) {
    var defensiveAssistanceNoModifiers = OR
    var defensiveAssistance = defensiveAssistanceNoModifiers
    var defensiveAssistanceMax = 100

    if (teamwork) {
        switch (teamwork) {
            case -2:
                var twp = -0.25
                var teamworkDescription = `--`
                break;
            case -1:
                var twp = -0.15
                var teamworkDescription = `-`
                break;
            case 1:
                var twp = 0.15
                var teamworkDescription = `+`
                break;
            case 2:
                var twp = 0.25
                var teamworkDescription = `++`
                break;
            default:
                console.warn("Value of teamwork is unexpected: ", teamwork);
                var twp = 0
        }
        defensiveAssistance = Math.floor(defensiveAssistanceNoModifiers + defensiveAssistanceNoModifiers * twp)
    }
    let defensiveAssistanceDenomination = defensiveAssistance / defensiveAssistanceMax
    let defensiveAssistanceDenominationNormalized = utils.denomination(defensiveAssistanceDenomination * 100)

    const defensiveAssistanceModifierDifference = defensiveAssistance - defensiveAssistanceNoModifiers
    var defensiveAssistanceModifierDetails = ``
    if (defensiveAssistanceModifierDifference !== 0) {
        const sign = defensiveAssistanceModifierDifference > 0 ? '+' : '-'
        defensiveAssistanceModifierDetails = ` (${defensiveAssistanceNoModifiers} ${sign} ${Math.abs(defensiveAssistanceModifierDifference)} from Teamwork${teamworkDescription} personality)`
    }

    return {
        defensiveAssistance,
        defensiveAssistanceModifierDetails,
        defensiveAssistanceDenominationNormalized,
        teamworkDescription
    };
}

export function addNoDataSymbol(container) {
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

export function applySportsmanship(element, sportsmanship) {
    const hasSportsmanshipSymbol = Array.from(element.children).some(
        child => child.textContent.trim() === personalitiesSymbols["sportsmanship"]
    );
    if (!hasSportsmanshipSymbol) {
        console.debug(`Applying sportsmanship: ${sportsmanship}`)

        const sportsmanshipSpan = document.createElement("span");
        sportsmanshipSpan.classList.add('sportsmanship')
        sportsmanshipSpan.textContent = " " + personalitiesSymbols["sportsmanship"]
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

        element.appendChild(sportsmanshipSpan)
    }
}

export function applyComposure(element, composure) {
    const hasComposureSymbol = Array.from(element.children).some(
        child => child.textContent.trim() === personalitiesSymbols["composure"]
    );
    if (!hasComposureSymbol) {
        console.debug(`Applying composure: ${composure}`)

        const composureSpan = document.createElement("span");
        composureSpan.classList.add('composure')
        composureSpan.textContent = " " + personalitiesSymbols["composure"]
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

        element.appendChild(composureSpan)
    }
}

export function applyArrogance(element, arrogance) {
    if (arrogance > 0) {
        console.warn("Tried to apply positive arrogance - currently positive arrogance is not supported")
        return
    }
    const hasArroganceSymbol = Array.from(element.children).some(
        child => child.textContent.trim() === personalitiesSymbols["arrogance"]
    );
    if (!hasArroganceSymbol) {
        console.debug(`Applying arrogance: ${arrogance}`)

        const arroganceSpan = document.createElement("span");
        arroganceSpan.classList.add('arrogance')
        arroganceSpan.textContent = " " + personalitiesSymbols["arrogance"]
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

        element.appendChild(arroganceSpan)
    }
}

export function updateDetailedProperty(element, propertyDescription, propertyValue, config) {
    const normalizedDescription = utils.pluginNodeClass + propertyDescription.replace(/\s+/g, "_")
    const containerClass = utils.pluginNodeClass + "_detailedPropertyContainer"
    const container = Array.from(element.children).find(
        child =>
            child.classList.contains(containerClass) &&
            child.classList.contains(normalizedDescription)
    )
    if (propertyValue && config) {
        if (!container) {
            const container = document.createElement("span")
            container.classList.add(containerClass)
            container.classList.add(normalizedDescription)

            const topSpan = document.createElement("span")
            topSpan.classList.add("top")
            if (config && config.valueElementClass) {
                topSpan.classList.add(config.valueElementClass)
            }
            topSpan.textContent = propertyValue
            container.appendChild(topSpan)

            const bottomSpan = document.createElement("span")
            bottomSpan.classList.add("bottom")
            bottomSpan.textContent = propertyDescription
            container.appendChild(bottomSpan)

            if (config && config.tooltip) {
                container.title = config.tooltip
            }
            element.appendChild(container)
        }
    } else if (container) {
        container.remove()
    }
}

export function hasActiveFormation() {
    const link = document.querySelector('ul.nav-tabs > li.nav-item > a.nav-link.active');
    if (!link) {
        console.debug(`hasActiveFormation: No link element`)
    }

    return link && link.textContent.trim() === "Formation";
}

export function hasActiveSetPieces() {
    const link = document.querySelector('ul.nav-tabs > li.nav-item > a.nav-link.active');
    if (!link) {
        console.debug(`hasActiveSetPieces: No link element`)
    }

    return link && link.textContent.trim() === "Set Pieces";
}

export function applyTeamwork(element, teamwork) {
    const hasTeamworkSymbol = Array.from(element.children).some(
        child => child.textContent.trim() === personalitiesSymbols["teamwork"]
    );
    if (!hasTeamworkSymbol) {
        console.debug(`Applying Teamwork: ${teamwork}`)

        const teamworkSpan = document.createElement("span");
        teamworkSpan.classList.add('teamwork')
        teamworkSpan.textContent = " " + personalitiesSymbols["teamwork"]
        switch (teamwork) {
            case -2:
                teamworkSpan.classList.add('doubleNegative');
                teamworkSpan.title = "This player is a terrible team player, he will not assist his team mates as much as his skills would indicate (assistance decreased by 25%)";
                break;
            case -1:
                teamworkSpan.classList.add('negative');
                teamworkSpan.title = "This player is not a team player, he will not assist his team mates as much as his skills would indicate (assistance decreased by 15%)";
                break;
            case 1:
                teamworkSpan.classList.add('positive');
                teamworkSpan.title = "This player is a team player, he will assist his team mates more than his skills would indicate (assistance increased by 15%)";
                break;
            case 2:
                teamworkSpan.classList.add('doublePositive');
                teamworkSpan.title = "This player is a fantastic team player, he will assist his team mates much more than his skills would indicate (assistance increased by 25%)";
                break;
            default:
                console.warn("Value of teamwork is unexpected: ", teamwork);
        }

        element.appendChild(teamworkSpan)
    }
}

async function applyCustomColorsLineupSymbols() {
    try {
        // Load colors from storage (with defaults)
        const colors = await db.getColors()
        if (!colors) return
        const personalitiesColors = `
            span.leadership.doublePositive {
                color: ${colors.leadershipVeryGood};
            }
            span.leadership.positive {
                color: ${colors.leadershipGood};
            }
            span.leadership.negative {
                color: ${colors.leadershipBad};
            }
            span.leadership.doubleNegative {
                color: ${colors.leadershipVeryBad};
            }
            
            span.composure.doublePositive {
                color: ${colors.composureVeryGood};
            }
            span.composure.positive {
                color: ${colors.composureGood};
            }
            span.composure.negative {
                color: ${colors.composureBad};
            }
            span.composure.doubleNegative {
                color: ${colors.composureVeryBad};
            }

            span.arrogance.negative {
                color: ${colors.arroganceBad};
            }
            span.arrogance.doubleNegative {
                color: ${colors.arroganceVeryBad};
            }

            span.sportsmanship.doublePositive {
                color: ${colors.sportsmanshipVeryGood};
            }
            span.sportsmanship.positive {
                color: ${colors.sportsmanshipGood};
            }
            span.sportsmanship.negative {
                color: ${colors.sportsmanshipBad};
            }
            span.sportsmanship.doubleNegative {
                color: ${colors.sportsmanshipVeryBad};
            }

            span.teamwork.doublePositive {
                color: ${colors.teamworkVeryGood};
            }
            span.teamwork.positive {
                color: ${colors.teamworkGood};
            }
            span.teamwork.negative {
                color: ${colors.teamworkBad};
            }
            span.teamwork.doubleNegative {
                color: ${colors.teamworkVeryBad};
            }
        `
        utils.addCSS(personalitiesColors, "final-whistle-players-personalities-colors");
    } catch (err) {
        console.error("Failed to apply custom colors for player personalities:", err);
    }
}
applyCustomColorsLineupSymbols()