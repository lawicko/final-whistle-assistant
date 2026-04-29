import * as db from "../../db_access.js"
import * as utils from "../../utils.js"
import { processPlayedMatches } from '../../match_data_gathering_indicators.js'
import { addYAndSLabelsForMatchBadges } from '../../y_and_s_labels_for_match_badges.js'

export async function processPlayerMatchesTab(playerDataFromPage) {
    console.info(`⏳ ${utils.version} Processing player matches tab...`)
    const detailsHeaderID = utils.pluginNodeClass + "DetailsHeader"
    const tableHeaderRow = document.querySelector("table.player-detail-matches-table > thead > tr")
    if (!tableHeaderRow) return // site not loaded yet
    const exitingDetails = tableHeaderRow.querySelector(`th#${detailsHeaderID}`)
    if (!exitingDetails) {
        const tableHeaderLastTH = tableHeaderRow.querySelector("th:last-child")
        const detailsTH = tableHeaderLastTH.cloneNode()
        detailsTH.textContent = "Details"
        detailsTH.id = detailsHeaderID
        tableHeaderRow.appendChild(detailsTH)
    }

    const matchPlayers = await db.getMatchPlayersForPlayer(playerDataFromPage.id)
    // console.info("matchPlayers", matchPlayers.map(m => `https://www.finalwhistle.org/en/match/${m.matchId}`))

    const playedMatchesContainers = document.querySelectorAll("table.player-detail-matches-table > tbody > tr")
    // console.info("playedMatchesContainers", playedMatchesContainers)

    if (playedMatchesContainers.length > 0) {
        formatDates(playedMatchesContainers)

        const lastVisibleMatchRow = playedMatchesContainers[playedMatchesContainers.length - 1]
        const lastVisibleMatchDateElement = lastVisibleMatchRow.querySelector("td:has(i.bi.bi-calendar3)")
        // console.info("lastVisibleMatchDateElement", lastVisibleMatchDateElement)
        const lastVisibleMatchDateString = lastVisibleMatchDateElement.textContent.trim()
        // console.info("lastVisibleMatchDateString", lastVisibleMatchDateString)
        const lastVisibleMatchDate = new Date(lastVisibleMatchDateString)
        // console.info("lastVisibleMatchDate", lastVisibleMatchDate.toISOString())

        const sortedMP = matchPlayers.sort((a, b) => new Date(b.date) - new Date(a.date))
        if (sortedMP.length > 0) {
            console.log("There are matches in the DB that don't have a date property - these matches likely come from earlier version of the extension and they will not be visible in the table. I will print the links to those matches below so you can click through them and complete your match data. Remember to switch to the finishing lineup for each match. After that reload the page and all matches should show on the list.")
        }
        for (const mp of sortedMP) {
            if (!mp.date) {
                console.log(`https://www.finalwhistle.org/en/match/${mp.matchId}`)
            }
        }
        const olderRecordedMatchPlayers = matchPlayers.filter(mp => new Date(mp.date) < lastVisibleMatchDate).sort((a, b) => new Date(b.date) - new Date(a.date))
        // console.info("olderRecordedMatchPlayers", olderRecordedMatchPlayers)

        const tBody = document.querySelector("table.player-detail-matches-table > tbody")
        // console.info("tbody to append new cells", tBody)
        for (const matchPlayer of olderRecordedMatchPlayers) {
            const cloneID = utils.pluginNodeClass + `_${matchPlayer.matchId}`
            if (tBody.querySelector(`tr#${cloneID}`)) continue
            const rowClone = lastVisibleMatchRow.cloneNode(true)
            rowClone.id = cloneID

            // Going from left to right
            // Insert proper date
            const dateElement = rowClone.querySelector("td:has(i.bi.bi-calendar3)")
            if (dateElement) {
                const dateSpan = dateElement.querySelector("span span")
                dateSpan.textContent = stringFromDate(new Date(matchPlayer.date))
                console.debug("appending row clone", rowClone)
                tBody.appendChild(rowClone)
            }

            // Opponent name and link
            const opponentCell = rowClone.querySelector("td:has(fw-club-hover)")
            const opponentLinkElement = opponentCell.querySelector("fw-club-hover > div.hovercard > a")
            const newOpponentHref = opponentLinkElement.getAttribute("href").replace(/\/\d+$/, `/${matchPlayer.opponentId}`)
            opponentLinkElement.setAttribute("href", newOpponentHref)
            const opponentNameSpan = opponentLinkElement.querySelector("span.club-name")
            opponentNameSpan.textContent = matchPlayer.opponentName

            // The flag and the national team links
            const flagSpanContainer = opponentLinkElement.querySelector("span:has(fw-flag)")
            const nationalDetails = matchPlayer.opponentDetails
            if (nationalDetails) {
                const flagLinkElement = flagSpanContainer.querySelector("fw-flag > a")
                if (nationalDetails.nationalTeamLink) {
                    flagLinkElement.href = nationalDetails.nationalTeamLink
                } else {
                    flagLinkElement.removeAttribute("href")
                }
                const flagSpan = flagSpanContainer.querySelector("fw-flag > a > span")
                flagSpan.classList.remove(...flagSpan.classList)
                if (nationalDetails.flagClasses) {
                    flagSpan.classList.add(...nationalDetails.flagClasses)
                }
            } else {
                flagSpanContainer.remove()
            }

            const matchLink = opponentCell.querySelector("span > a")
            const newMatchHref = matchLink.getAttribute("href").replace(/\/[^/]+$/, `/${matchPlayer.matchId}`)
            matchLink.setAttribute("href", newMatchHref)

            // Existing match data indicator
            const possibleMatchDataIndicator = opponentCell.querySelector("span.final-whistle-assistant-played-match-indicator")
            if (possibleMatchDataIndicator) {
                possibleMatchDataIndicator.remove()
            }

            const competitionCell = opponentCell.nextElementSibling
            // console.info("competition:", matchPlayer.competition, matchPlayer.competitionBadge)
            const badgeSpan = competitionCell.querySelector("span.player-matches-squad-dot")
            if (matchPlayer.competitionBadge) {
                switch (matchPlayer.competitionBadge) {
                    case "S":
                        badgeSpan.classList.remove("player-matches-squad-dot--youth")
                        badgeSpan.classList.add("player-matches-squad-dot--senior")
                        break
                    case "Y":
                        badgeSpan.classList.remove("player-matches-squad-dot--senior")
                        badgeSpan.classList.add("player-matches-squad-dot--youth")
                        break
                    default:
                        console.warn("Unknown competition badge in DB:", matchPlayer.competitionBadge)
                }
            } else {
                badgeSpan.remove()
            }
            const competitionNameSpan = badgeSpan.nextElementSibling
            if (competitionNameSpan) { // matches not loaded yet?
                const classes = competitionNameSpan.classList;

                if (classes.length > 0) {
                    const lastClass = classes[classes.length - 1];
                    competitionNameSpan.classList.remove(lastClass);
                }
                competitionNameSpan.textContent = " " + matchPlayer.competition
                competitionNameSpan.classList.add(toSnakeCase(matchPlayer.competition))
            }

            if (playerDataFromPage.position === "GK") {
                const savesCell = competitionCell.nextElementSibling
                savesCell.textContent = "-"

                const cardsCell = savesCell.nextElementSibling
                if (matchPlayer.cards) {
                    cardsCell.textContent = [...matchPlayer.cards].length
                } else {
                    cardsCell.textContent = "0"
                }

                const manOfTheMatchCell = cardsCell.nextElementSibling
                manOfTheMatchCell.textContent = "-"

                const ratingCell = manOfTheMatchCell.nextElementSibling
                ratingCell.textContent = "-"
            } else {
                const goalsCell = competitionCell.nextElementSibling
                goalsCell.textContent = matchPlayer.goals ?? "0"

                const assistsCell = goalsCell.nextElementSibling
                assistsCell.textContent = "-"

                const tacklesCell = assistsCell.nextElementSibling
                tacklesCell.textContent = "-"

                const cardsCell = tacklesCell.nextElementSibling
                if (matchPlayer.cards) {
                    cardsCell.textContent = [...matchPlayer.cards].length
                } else {
                    cardsCell.textContent = "0"
                }

                const manOfTheMatchCell = cardsCell.nextElementSibling
                manOfTheMatchCell.textContent = "-"

                const ratingCell = manOfTheMatchCell.nextElementSibling
                ratingCell.textContent = "-"
            }
        }

        const updatedMatchesContainers = document.querySelectorAll("table.player-detail-matches-table > tbody > tr")
        updateRecentStatistics(updatedMatchesContainers, {
            matchPlayers: matchPlayers,
            matchLinkContainerQuery: "td:has(fw-club-hover)",
            matchLinkElementQuery: "span > a"
        })

        await addYAndSLabelsForMatchBadges(updatedMatchesContainers, {
            youthNodeQuery: "span.player-matches-squad-dot--youth",
            seniorNodeQuery: "span.player-matches-squad-dot--senior",
            commentStart: "Processing match badges for 🇸enior and 🇾outh matches",
            commentFinished: "Match badges for 🇸enior and 🇾outh matches processed"
        })

        await processPlayedMatches(updatedMatchesContainers, {
            matchLinkContainerQuery: "td:has(fw-club-hover)",
            matchLinkElementQuery: "span > a",
            commentStart: `⚽ Processing matches payed by the player`,
            commentFinished: `🔴🟠🟡🟢 Matches payed by the player, missing data indicators added`
        })
    } else {
        console.info("Did not find any played matches, skipping")
    }
}

function formatDates(rows) {
    const dateFormattedClass = `${utils.pluginNodeClass}_dateFormatted`
    for (const row of rows) {
        const dateElement = row.querySelector("td:has(i.bi.bi-calendar3)")
        const date = dateFromDateString(dateElement.textContent.trim())
        if (dateElement && !dateElement.classList.contains(dateFormattedClass)) {
            const dateSpan = dateElement.querySelector("span span")
            dateSpan.textContent = stringFromDate(date)
            // dateElement.insertAdjacentText("beforeend", stringFromDate(date))
            dateElement.classList.add(dateFormattedClass)
        }
    }
}

function stringFromDate(date) {
    if (!(date instanceof Date)) {
        throw new Error(`dateStorageFormat called with non-Date argument ${typeof date}: ${date}`);
    }
    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    })
}

function dateFromDateString(dateString) {
    const [monthDay, year] = dateString.split(" ");  // ["07/30", "2025"]
    const [month, day] = monthDay.split("/"); // ["07", "30"]

    return new Date(Date.UTC(year, month - 1, day)); // month is 0-based
}

function toSnakeCase(str) {
    return str
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");  // replace one or more spaces with underscore
}

async function updateRecentStatistics(playedMatchesContainers, config) {
    if (!playedMatchesContainers) {
        throw new Error(`processPlayedMatches was called with invalid playedMatchesContainers (empty)`)
    }

    if (!config) {
        throw new Error(`processPlayedMatches was called with invalid config (empty)`)
    }

    if (!config.matchPlayers || !config.matchLinkContainerQuery || !config.matchLinkElementQuery) {
        throw new Error(`processPlayedMatches was called with invalid config, matchPlayers or query element(s) missing: ${JSON.stringify(config, null, 2)}`)
    }

    const detailsTDClass = utils.pluginNodeClass + "DetailsTD"

    try {
        for (const tr of playedMatchesContainers) {
            const existingDetailsTD = tr.querySelector(`td.${detailsTDClass}`)
            if (existingDetailsTD) {
                existingDetailsTD.remove()
            }

            const matchLinkContainer = tr.querySelector(config.matchLinkContainerQuery)
            const matchLinkElement = matchLinkContainer.querySelector(config.matchLinkElementQuery)
            const matchID = utils.lastPathComponent(matchLinkElement.href)

            const matchPlayer = config.matchPlayers.find(matchPlayer => matchPlayer.matchId === matchID)
            const detailsTD = document.createElement("td")
            detailsTD.classList.add(detailsTDClass)

            let text = ""
            if (!matchPlayer) {
                text = "📂 no data"
            } else {
                const goals = matchPlayer.goals
                if (goals) {
                    const goalsContainer = document.createElement("span")
                    goalsContainer.classList.add("status-item")

                    const goalsCountElement = document.createElement("span")
                    goalsCountElement.classList.add("goal-count")
                    goalsCountElement.textContent = goals
                    goalsContainer.appendChild(goalsCountElement)

                    const football = document.createElement("i")
                    football.classList.add("fa")
                    football.classList.add("fa-futbol-o")
                    goalsContainer.appendChild(football)

                    detailsTD.appendChild(goalsContainer)
                }

                const cards = matchPlayer.cards
                if (cards) {
                    switch (cards) {
                        case "🟨":
                            const cardsContainer = document.createElement("span")
                            cardsContainer.classList.add("status-item")

                            const yellowCardImg = document.createElement("img")
                            yellowCardImg.classList.add("img-fluid")
                            yellowCardImg.classList.add("status-icon")
                            yellowCardImg.src = "assets/images/yellow.png"

                            cardsContainer.appendChild(yellowCardImg)
                            detailsTD.appendChild(cardsContainer)
                            break
                        case "🟥":
                            break
                        default:
                            console.warn("Unknown card:", cards)
                    }
                }

                const injury = matchPlayer.injury
                if (injury) {
                    const injuryContainer = document.createElement("span")
                    injuryContainer.classList.add("status-item")
                    switch (injury) {
                        case "light":
                            const lightInjury = document.createElement("i")
                            lightInjury.classList.add("bi")
                            lightInjury.classList.add("bi-capsule")
                            injuryContainer.appendChild(lightInjury)
                            break
                        case "severe":
                            const severeInjury = document.createElement("img")
                            severeInjury.classList.add("img-fluid")
                            severeInjury.src = "assets/images/injury.png"
                            injuryContainer.appendChild(severeInjury)
                            break
                        default:
                            console.warn("Unknown injury type:", injury)
                    }
                    detailsTD.appendChild(injuryContainer)
                }

                if (detailsTD.children.length > 0) {
                    text += " in "
                }
                text += matchPlayer.minutesPlayed + "'"
            }
            detailsTD.insertAdjacentText("beforeend", text)

            tr.appendChild(detailsTD)
        }
    } catch (e) {
        console.error(e.message)
    }
}