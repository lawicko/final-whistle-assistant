/**
 * Adds Y and S characters to the match badges in the provided match tables
 * @param {Object} matchContainers match elements on the page, usually a result of querySelectorAll that return a collection of tr elements
 * @param {Object} config configuration object
 * 
 * @example
 * const config = {
 *     youthNodeQuery: "span.badge-youth",
 *     seniorNodeQuery: "span.badge-senior",
 *     commentStart: `Processing match badges for 🇸enior and 🇾outh matches`,
 *     commentFinished: `Match badges for 🇸enior and 🇾outh matches processed`
 * }
 */
export async function addYAndSLabelsForMatchBadges(matchContainers, config) {
    if (!matchContainers) {
        throw new Error(`addYAndSLabelsForMatchBadges was called with invalid matchContainers (empty)`)
    }

    if (!config) {
        throw new Error(`addYAndSLabelsForMatchBadges was called with invalid config (empty)`)
    }

    if (!config.youthNodeQuery || !config.seniorNodeQuery) {
        throw new Error(`addYAndSLabelsForMatchBadges was called with invalid config, query element(s) missing: ${JSON.stringify(config, null, 2)}`)
    }

    const commentStart = config.commentStart || `Processing match badges for 🇸enior and 🇾outh matches`
    console.info(commentStart)
    // 🆂🆈 fallback if the above renders bad on Mac or Chromium Windows

    try {
        for (const row of matchContainers) {
            // Add Y and S to the badges
            let targetNodesYouth = row.querySelectorAll(config.youthNodeQuery)
            targetNodesYouth.forEach((element) => {
                element.textContent = "Y"
            });

            let targetNodesSenior = row.querySelectorAll(config.seniorNodeQuery)
            targetNodesSenior.forEach((element) => {
                element.textContent = "S"
            })
        }
        const commentFinished = config.commentFinished || "Match badges for 🇸enior and 🇾outh matches processed"
        console.info(commentFinished)
    } catch (e) {
        console.error(e.message)
    }
}