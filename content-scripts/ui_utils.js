import { addCSS, optionsStorage } from "./utils"

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

export function toggleClass(el, className) {
    if (el.className.indexOf(className) >= 0) {
        el.className = el.className.replace(` ${className}`, "");
    } else {
        el.className += ` ${className}`;
    }
}

/**
 * Recreates the denomination used on the website, used for coloring the numbers
 * @param {number} value The value to get the denomination for (1-99)
 * @returns {number} The denomination (1-9)
 */
export function denomination(value) {
    let den = 0
    if (value > 29) {
        den = Math.trunc(value / 10)
    } else {
        if (value > 15) {
            den = 2
        } else {
            den = 1
        }
    }
    return den
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
    const offensiveAssistanceDenominationNormalized = denomination((offensiveAssistance / offensiveAssistanceMax) * 100);
    const defensiveAssistanceDenominationNormalized = denomination((defensiveAssistance / defensiveAssistanceMax) * 100);

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
    let defensiveAssistanceDenominationNormalized = denomination(defensiveAssistanceDenomination * 100)

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
    const hasSportsmanshipSymbol = Array.from(element.parentNode.parentNode.parentNode.children).some(
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

        element.parentNode.parentNode.parentNode.appendChild(sportsmanshipSpan)
    }
}

export function hasActiveSetPieces() {
    const link = document.querySelector('ul.nav-tabs > li.nav-item > a.nav-link.active');
    if (!link) {
        console.debug(`hasActiveSetPieces: No link element`)
    } else {
        console.debug(`hasActiveSetPieces: Found link element: ${link.href}`)
        console.debug(`hasActiveSetPieces: Link text content: ${link.textContent.trim()}`)
    }

    return link && link.textContent.trim() === "Set Pieces";
}

async function applyCustomColorsLineupSymbols() {
    try {
        // Load colors from storage (with defaults)
        const { colors = {} } = await optionsStorage.get("colors");
        const personalitiesColors = `
            span.leadership.doublePositive {
                color: ${colors["color-setting-sportsmanship++"]};
            }
            span.leadership.positive {
                color: ${colors["color-setting-sportsmanship+"]};
            }
            span.leadership.negative {
                color: ${colors["color-setting-sportsmanship-"]};
            }
            span.leadership.doubleNegative {
                color: ${colors["color-setting-sportsmanship--"]};
            }
            
            span.composure.doublePositive {
                color: ${colors["color-setting-composure++"]};
            }
            span.composure.positive {
                color: ${colors["color-setting-composure+"]};
            }
            span.composure.negative {
                color: ${colors["color-setting-composure-"]};
            }
            span.composure.doubleNegative {
                color: ${colors["color-setting-composure--"]};
            }

            span.arrogance.negative {
                color: ${colors["color-setting-arrogance-"]};
            }
            span.arrogance.doubleNegative {
                color: ${colors["color-setting-arrogance--"]};
            }

            span.sportsmanship.doublePositive {
                color: ${colors["color-setting-sportsmanship++"]};
            }
            span.sportsmanship.positive {
                color: ${colors["color-setting-sportsmanship+"]};
            }
            span.sportsmanship.negative {
                color: ${colors["color-setting-sportsmanship-"]};
            }
            span.sportsmanship.doubleNegative {
                color: ${colors["color-setting-sportsmanship--"]};
            }

            span.teamwork.doublePositive {
                color: ${colors["color-setting-teamwork++"]};
            }
            span.teamwork.positive {
                color: ${colors["color-setting-teamwork+"]};
            }
            span.teamwork.negative {
                color: ${colors["color-setting-teamwork-"]};
            }
            span.teamwork.doubleNegative {
                color: ${colors["color-setting-teamwork--"]};
            }
        `
        addCSS(personalitiesColors, "final-whistle-players-personalities-colors");
    } catch (err) {
        console.error("Failed to apply custom colors for player personalities:", err);
    }
}

// Run the function
applyCustomColorsLineupSymbols();