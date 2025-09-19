import * as utils from "../content-scripts/utils"

export function calculateDataGatheringProgressForMatch(matchDataFromStorage) {
    let progress = 0
    if (
        matchDataFromStorage.tactics &&
        !utils.isEmpty(matchDataFromStorage.tactics) &&
        matchDataFromStorage.startingLineups &&
        !utils.isEmpty(matchDataFromStorage.startingLineups) &&
        matchDataFromStorage.startingLineups["home"] &&
        !utils.isEmpty(matchDataFromStorage.startingLineups["home"]) &&
        matchDataFromStorage.startingLineups["away"] &&
        !utils.isEmpty(matchDataFromStorage.startingLineups["away"])
    ) {
        progress += 25
    } else {
        return progress
    }

    if (
        matchDataFromStorage.finishingLineups &&
        !utils.isEmpty(matchDataFromStorage.finishingLineups) &&
        matchDataFromStorage.finishingLineups["home"] &&
        !utils.isEmpty(matchDataFromStorage.finishingLineups["home"]) &&
        matchDataFromStorage.finishingLineups["away"] &&
        !utils.isEmpty(matchDataFromStorage.finishingLineups["away"])
    ) {
        progress += 25
    } else {
        return progress
    }

    return progress
}

export function createProgressDot(value) {
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