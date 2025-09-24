import * as utils from "../../utils.js"

export function getPlayerAge() {
    const ageElement = document.querySelector("fw-player-age > span > span")
    if (!ageElement) return undefined

    const regex = /(?:(?<years>\d+)\s*y)?(?:,\s*)?(?:(?<months>\d+)\s*m)?(?:,\s*)?(?:(?<days>\d+)\s*d)?/;

    const { groups } = ageElement.textContent.trim().match(regex);

    const years = parseInt(groups.years || 0, 10)
    const months = parseInt(groups.months || 0, 10)
    const days = parseInt(groups.days || 0, 10)

    return { years: years, months: months, days: days }
}

export function getSeasonsLeftAsYouth() {
    const seasonsLeftElement = document.querySelector("fw-player-age > span:last-of-type")
    if (!seasonsLeftElement) return undefined
    return parseNumbersOnPlayerPage(seasonsLeftElement)
}

export function getFutureBirthdays(currentDate, years, months, days, count = 1) {
    if (!(currentDate instanceof Date) || isNaN(currentDate)) {
        throw new Error("Invalid currentDate: must be a Date object")
    }
    if (![years, months, days].every(Number.isInteger)) {
        throw new Error("Age values must be integers")
    }
    if (!Number.isInteger(count) || count < 1) {
        throw new Error("Count must be a positive integer")
    }

    const birthdays = []
    const daysInYear = 336           // 4 seasons × 12 weeks
    const daysInMonth = 28           // 12 × 28 = 336
    const gameDaysPerRealDay = 4     // 4 game days = 1 real day

    let baseDate = new Date(currentDate.getTime())
    let y = years, m = months, d = days

    for (let i = 0; i < count; i++) {
        // Days since last birthday in the 336/28 calendar
        const daysPassed = m * daysInMonth + d
        const remainingGameDays = daysInYear - daysPassed

        // Real days until birthday
        const realDaysRemaining = Math.round(remainingGameDays / gameDaysPerRealDay)

        // Compute next birthday and normalize to midnight UTC
        const nextBirthday = new Date(baseDate.getTime())
        nextBirthday.setUTCDate(nextBirthday.getUTCDate() + realDaysRemaining)
        nextBirthday.setUTCHours(0, 0, 0, 0)

        birthdays.push({ age: y + 1 + i, date: nextBirthday })

        // Prepare for next iteration: at birthday, months/days reset
        baseDate = nextBirthday
        m = 0
        d = 0
    }

    return birthdays
}

/**
 * Processes the value node of a hidden skills table or a scout report and returns the numbers that are useful, e.g. 5 if the potential value is 5, 19 if the advanced development is 19y and 3 if the injury resistance is 3/5
 * @param {Object} node to process
 * @returns a number that is the result of the processing
 */
export const parseNumbersOnPlayerPage = (node) => {
    const text = node.textContent.trim();

    // Check for "x/y" style fractions
    const fractionMatch = text.match(/^(\d+)\s*\/\s*\d+$/);
    if (fractionMatch) {
        return Number(fractionMatch[1]); // take the numerator
    }

    // Otherwise, strip non-digits and parse normally
    const digits = text.replace(/\D/g, '');
    return digits ? Number(digits) : NaN;
}

export function parseScoutReport(reportElement) {
    let parsedNumbers = {}
    reportElement.querySelectorAll("table.table > tr").forEach(row => {
        const skillLabelElement = row.querySelector("td")
        const skillLabelText = skillLabelElement.textContent.trim()
        const skillValueElement = skillLabelElement.nextElementSibling

        parsedNumbers[utils.toCamelCase(skillLabelText)] = parseNumbersOnPlayerPage(skillValueElement)
    })

    const filtered = Object.fromEntries(
        Object.entries(parsedNumbers).filter(([key, value]) => !Number.isNaN(value))
    )

    const hiddenSkills = {
        adaptability: filtered.adaptability,
        advancedDev: filtered.developmentType,
        estimatedPotential: filtered.estimatedPotential,
        injuryResistance: filtered.injuryResistance,
        retirementPlan: filtered.retirementPlan
    }

    const personalitiesCollection = reportElement.querySelectorAll("table.table > tr td fw-player-personality")
    const personalities = parsePersonalitiesCollection(personalitiesCollection)

    return { hiddenSkills: hiddenSkills, personalities: personalities }
}

export function parsePersonalitiesCollection(personalitiesCollection) {
    const personalities = {}
    personalitiesCollection.forEach(personality => {
        const link = personality.querySelector("a")
        if (!link) return; // skip rows without <a>

        const name = link.textContent.trim().toLowerCase()

        // Count pluses and minuses
        const plusCount = personality.querySelectorAll("i.personality-plus").length
        const minusCount = personality.querySelectorAll("i.personality-minus").length

        let value = 0;
        if (plusCount > 0) {
            value = plusCount; // 1 or 2
        } else if (minusCount > 0) {
            value = -minusCount; // -1 or -2
        }

        personalities[name] = value
    })
    return personalities
}