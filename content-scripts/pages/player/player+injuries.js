import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"

function minutesPlayedBetween(minutesPlayed, injurDatesAsStrings) {
    console.debug("***************** minutesPlayedBetween *****************")
    const dateMap = new Map(
        Object.entries(minutesPlayed).map(([dateStr, value]) => [
            new Date(dateStr),  // key = Date
            parseInt(value, 10) // value = integer
        ])
    );
    console.debug("dateMap: ", dateMap)

    const injuryDates = injurDatesAsStrings.map(str => new Date(str));
    console.debug("injuryDates: ", injuryDates)

    let results = []
    let previousInjuryDate = new Date()
    for (const injuryDate of injuryDates) {
        console.debug("Processing injury date: ", injuryDate)
        let sum = 0

        for (const [date, minutes] of dateMap.entries()) {
            console.debug("Found ", minutes, " played on ", date)
            console.debug("Checking if ", date, " is between ", injuryDate, "and", previousInjuryDate)
            if (date > injuryDate && date <= previousInjuryDate) {
                sum += minutes
                console.debug("It is, new sum: ", sum)
            } else {
                console.debug("It is not, skipping...")
            }
        }
        results.push(sum)
        previousInjuryDate = injuryDate
    }

    const firstKnownInjuryDate = injuryDates[injuryDates.length - 1]
    let sum = 0
    for (const [date, minutes] of dateMap.entries()) {
        if (date <= firstKnownInjuryDate) {
            sum += minutes
        }
    }
    results.push(sum)

    return results
}

/**
 * Adds injuries table to the player page if there is injury information in the storage
 */
export async function showInjuries(currentPlayerData) {
    console.debug('currentPlayerData = ', currentPlayerData)
    const injuries = currentPlayerData['injuries']
    //    const injuries = ["29 Aug 2025, 12:00", "27 Aug 2025, 12:00", "15 Aug 2025, 12:00"]
    const minutesPlayed = currentPlayerData['minutes-played']

    const playerClubMetaTableBody = document.querySelector(`${uiUtils.playerClubMetaTableQuery} > tbody`)
    if (!playerClubMetaTableBody) { return }
    const tableContainer = playerClubMetaTableBody.parentNode
    console.debug("tableContainer: ", tableContainer)
    const minutesSummarySelector = "td#minutes-since-last-injury"
    if (injuries && injuries.length > 0) {
        console.debug("injuries for player: ", injuries)

        // Calculate minutes played since last injury
        const minutes = minutesPlayedBetween(minutesPlayed, injuries)
        console.debug('Minutes played between injuries: ', minutes)

        if (!playerClubMetaTableBody.querySelector(minutesSummarySelector)) {
            const tr = createMinutesSinceInjuryRow(`Minutes since last injury: ${minutes[0]}`)
            playerClubMetaTableBody.appendChild(tr)
        }

        if (!tableContainer.querySelector("table#injury-table")) {
            const table = document.createElement('table')
            table.id = "injury-table"
            table.className = "table table-sm small align-middle mb-0"
            const headerRow = document.createElement('tr')
            headerRow.classList.add('summary-row')
            const headerCellRecentInjuries = document.createElement('th')

            if (injuries.length > 1) {
                headerRow.classList.add('summary-row-clickable')
                const disclosureSpan = document.createElement('span')
                disclosureSpan.classList.add('disclosure')
                disclosureSpan.textContent = '▶'
                headerCellRecentInjuries.appendChild(disclosureSpan)

                // append text without nuking the span
                headerCellRecentInjuries.appendChild(document.createTextNode(' Recent injuries'))

                headerRow.addEventListener('click', () => {
                    const disclosure = headerRow.querySelector('.disclosure');
                    let next = table.querySelector(`tbody > tr`)
                    const isOpen = disclosure.classList.contains('open');

                    // Toggle all subsequent .details-row until another summary-row is found
                    while (next && !next.classList.contains('summary-row')) {
                        if (!next.classList.contains('injuries-first-row')) {
                            console.info("next", next, "className", next.className)
                            if (isOpen) {
                                next.classList.remove("is-visible")
                            } else {
                                next.classList.add("is-visible")
                            }
                        }
                        next = next.nextElementSibling;
                    }

                    disclosure.classList.toggle('open', !isOpen);
                });
            } else {
                headerCellRecentInjuries.appendChild(document.createTextNode('Recent injuries'))
            }
            const headerCellMinutes = document.createElement('th')
            headerCellMinutes.classList.add('table-header-minutes')
            const questionMarkSpan = document.createElement("span")
            questionMarkSpan.textContent = uiUtils.questionMarkSymbol
            questionMarkSpan.title = "Indicates how many minutes player has played until he sustained the injury (if this is his first known injury this number may be smaller than in reality because of the time the extension started collecting data)"
            headerCellMinutes.appendChild(document.createTextNode('Minutes'))
            headerCellMinutes.appendChild(questionMarkSpan)

            headerRow.appendChild(headerCellRecentInjuries)
            headerRow.appendChild(headerCellMinutes)

            const header = document.createElement('thead')
            header.appendChild(headerRow)
            const body = document.createElement('tbody')

            table.appendChild(header)
            table.appendChild(body)

            for (let i = 0; i < injuries.length; i++) {
                const injury = injuries[i]
                const row = document.createElement('tr')
                if (table.querySelector('td')) {
                    row.classList.add('details-row')
                } else {
                    row.classList.add('injuries-first-row')
                }
                const cell = document.createElement('td')
                cell.textContent = injury
                row.appendChild(cell)

                const index = i + 1
                if (index < minutes.length) {
                    console.debug("Value exists:", minutes[index]);
                    const cell = document.createElement('td')
                    cell.textContent = minutes[index]
                    row.appendChild(cell)
                } else {
                    console.debug("No value at this index: ", index);
                }

                body.appendChild(row)
            }
            tableContainer.appendChild(table)
        }
    } else {
        let minutesWithoutInjury = 0
        if (minutesPlayed) {
            console.debug("minutesPlayed", minutesPlayed)
            minutesWithoutInjury = utils.sumMinutes(minutesPlayed)
        }
        if (!tableContainer.querySelector(minutesSummarySelector)) {
            const tr = createMinutesSinceInjuryRow(`Minutes without injury: ${minutesWithoutInjury}`)
            playerClubMetaTableBody.appendChild(tr)
        }
    }
}

function createMinutesSinceInjuryRow(text) {
    const td = document.createElement('td')
    td.id = 'minutes-since-last-injury'
    td.textContent = text
    const tr = document.createElement('tr')
    tr.className = uiUtils.playerMinutesSinceInjuryRowClass
    tr.appendChild(td)
    return tr
}