/**
 * Calculates the start date of a future football season.
 * 
 * @param {Date} currentDate - The current date/time.
 * @param {number} currentWeek - The current week of the season (1–12).
 * @param {number} seasonsAhead - How many seasons ahead to calculate (1 = next season).
 * @returns {Date} - The start date of the target season (Monday 00:00).
 * @throws {Error} - If inputs are invalid or calculation fails.
 */
export function getSeasonStartDate(currentDate, currentWeek, seasonsAhead) {
    try {
        // Validate inputs
        if (!(currentDate instanceof Date) || isNaN(currentDate)) {
            throw new Error("Invalid currentDate: must be a valid Date object.");
        }
        if (!Number.isInteger(currentWeek) || currentWeek < 1 || currentWeek > 12) {
            throw new Error("Invalid currentWeek: must be an integer between 1 and 12.");
        }
        if (!Number.isInteger(seasonsAhead) || seasonsAhead < 1) {
            throw new Error("Invalid seasonsAhead: must be an integer >= 1.");
        }

        // Clone date to avoid mutating the original
        const dateCopy = new Date(currentDate.getTime());

        // Calculate how many weeks remain in the current season
        const weeksRemaining = 12 - currentWeek + 1; // +1 ensures we move to the *next* season start

        // Total weeks to jump = remaining weeks in current season + full seasons ahead
        const totalWeeksToAdd = weeksRemaining + (seasonsAhead - 1) * 12;

        // Move forward by the calculated weeks
        dateCopy.setDate(dateCopy.getDate() + totalWeeksToAdd * 7);

        // Align to the next Monday 00:00
        const day = dateCopy.getDay(); // Sunday=0, Monday=1, ...
        const daysUntilMonday = (1 - day + 7) % 7; 
        dateCopy.setDate(dateCopy.getDate() + daysUntilMonday);
        dateCopy.setHours(0, 0, 0, 0);

        return dateCopy;

    } catch (err) {
        throw new Error(`getSeasonStartDate failed: ${err.message}`);
    }
}


/**
 * Processes the value node of the hidden skills table and returns the numbers that are useful, e.g. 5 if the potential value is 5, 19 if the advanced development is 19y and 3 if the injury resistance is 3/5
 * @param {Object} node to process
 * @returns a number that is the result of the processing
 */
export const parseNumbersInHiddenSkillsTable = (node) => {
    const text = node.textContent.trim();

    // Check for "x/y" style fractions
    const fractionMatch = text.match(/^(\d+)\s*\/\s*\d+$/);
    if (fractionMatch) {
        return Number(fractionMatch[1]); // take the numerator
    }

    // Otherwise, strip non-digits and parse normally
    const digits = text.replace(/\D/g, '');
    return digits ? Number(digits) : NaN;
};