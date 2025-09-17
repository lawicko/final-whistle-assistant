import { storage, version, lastPathComponent } from './utils.js';

export async function processFixturesPage() {
    console.info(`${version} 📅 Processing fixtures page`);
    await processMatchIndicators()

    const playedMatchesContainers = document.querySelectorAll("table.table > tbody > tr.finished-match")
    console.debug("playedMatchesContainers", playedMatchesContainers)
    if (playedMatchesContainers.length > 0) {
        await processPlayedMatches(playedMatchesContainers)
    } else {
        console.info("Did not find any played matches, skipping")
    }
}

async function processPlayedMatches(playedMatchesContainers) {
    console.info(`⚽ Processing played matches`);

    const { matches = {} } = await storage.get("matches");

    try {
        for (const tr of playedMatchesContainers) {
            const lastTD = tr.querySelector("td:has(a i.fa-file-text-o")

            const existingIndicator = lastTD.querySelector("span.final-whistle-assistant-played-match-indicator")
            if (existingIndicator) {
                existingIndicator.remove()
            }

            const matchLinkElement = lastTD.querySelector("a")
            const matchID = lastPathComponent(matchLinkElement.href)

            const matchDataFromStorage = matches[matchID] ?? {};
            const progress = calculateDataGatheringProgressForMatch(matchDataFromStorage)
            const dotSpan = createProgressDot(progress)

            lastTD.appendChild(dotSpan)
        }
    } catch (e) {
        console.error(e.message)
    }
    console.info(`🔴🟠🟡🟢 Played matches processed, missing data indicators added`);
}

function calculateDataGatheringProgressForMatch(matchDataFromStorage) {
    let progress = 0
    if (
        matchDataFromStorage.tactics &&
        matchDataFromStorage.startingLineups &&
        matchDataFromStorage.startingLineups["home"] &&
        matchDataFromStorage.startingLineups["away"]
    ) {
        progress += 25
    } else {
        return progress
    }

    if (
        matchDataFromStorage.finishingLineups &&
        matchDataFromStorage.finishingLineups["home"] &&
        matchDataFromStorage.finishingLineups["away"]
    ) {
        progress += 25
    } else {
        return progress
    }

    return progress
}

function createProgressDot(value) {
    if (value > 100) {
        throw new Error("Values > 100 are invalid")
    }
    const span = document.createElement('span');
    span.classList.add("final-whistle-assistant-played-match-indicator")
    span.style.display = 'inline-block';
    span.style.marginLeft = '10px';
    span.style.position = 'relative';
    span.style.top = '2.3px';
    span.style.width = '14px';
    span.style.height = '14px';
    span.style.borderRadius = '50%';
    span.style.cursor = 'help';

    let tooltipText = "Final Whistle Assistant has no data for this match."
    let fillColor = 'rgb(184, 165, 182)'
    if (value >= 25 && value < 50) {
        fillColor = "red"
        tooltipText = "Final Whistle Assistant only has the basic data for this match, like tactics and starting lineups. It still needs finishing lineups for injuries and minutes played information, statistics and full match report."
    } else if (value >= 50 && value < 75) {
        fillColor = "orange"
        tooltipText = "Final Whistle Assistant has some data for this match like tactics, starting and finishing lineups as well as injury and minutes played information for each player taking part. Only statistics and the full match report are missing."
    } else if (value >= 75 && value < 100) {
        fillColor = "yellow"
        tooltipText = "Final Whistle Assistant has most data for this match like tactics, starting and finishing lineups as well as injury and minutes played information for each player taking part and the statistics. Only the full match report is missing."
    } else if (value === 100) {
        fillColor = "green"
        tooltipText = "Final Whistle Assistant has all possible data for this match, including the full match report."
    }
    span.style.background = `conic-gradient(${fillColor} 0% ${value}%, rgb(184, 165, 182) ${value}% 100%)`;
    span.title = tooltipText

    return span;
}

async function processMatchIndicators() {
    console.info(`Processing match indicators for 🇸enior and 🇾outh matches`);
    // 🆂🆈 fallback if the above renders bad on Mac or Chromium Windows

    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.tBodies[0] && tableNode.tBodies[0].rows.length > 1) {
        console.debug(`Found the following table for processing match indicators: `, tableNode)

        // This is for the future, when we will check for matches missing in storage
        const { matchesInStorage = {} } = await storage.get("matches");
        console.debug("matchesInStorage:", matchesInStorage)

        const tbody = tableNode.tBodies[0]; // first tbody
        Array.from(tbody.rows).forEach(row => {
            // Add Y and S to the badges on the left
            let targetNodesYouth = row.querySelectorAll("span.badge-youth");
            targetNodesYouth.forEach((element) => {
                element.textContent = "Y";
            });

            let targetNodesSenior = row.querySelectorAll("span.badge-senior");
            targetNodesSenior.forEach((element) => {
                element.textContent = "S";
            });
        });
    }
}
