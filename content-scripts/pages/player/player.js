import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as playerUtils from "./player+utils.js"
import * as db from "../../db_access.js"
import { processPlayerMatchesTab } from "./player+matches.js"
import { processPlayerReports } from "./player+reports.js"
import { processPlayerTraining } from "./player+training.js"
import { showInjuries } from "./player+injuries.js"
import * as discovery from "./player+discovery.js"
import { prepareNodeAndAppendComputedSkills } from "./player+skill.js"
import { addTrainingSimulationButtonIfNeeded, showBuyingGuide } from "./player+management.js"

export async function processPlayerPage() {
    console.info(`⏳ ${utils.version} Processing player page for ${utils.lastPathComponent(window.location.pathname)}...`)

    const siteLoaded = discovery.checkSiteLoaded()
    if (siteLoaded) {
        console.info("✅ Site fully loaded")
    } else {
        console.info("📄 Site not ready, skipping update...")
        return
    }

    let playerDataFromPage = discovery.getPlayerData()
    console.debug("playerDataFromPage", playerDataFromPage)

    let currentPlayerRepresentationInStorage = await db.getPlayer(playerDataFromPage.id) || {}
    console.debug('currentPlayerRepresentationInStorage = ', currentPlayerRepresentationInStorage)

    await showInjuries(currentPlayerRepresentationInStorage)

    // If the player is on sale, add buying summary
    if (discovery.isPendingSale()) {
        showBuyingGuide(playerDataFromPage)
    }

    const coreSkillsTable = discovery.getCoreSkillsTable()
    if (coreSkillsTable && coreSkillsTable.rows && coreSkillsTable.rows.length > 1) {
        prepareNodeAndAppendComputedSkills(coreSkillsTable)
        addTrainingSimulationButtonIfNeeded()
    }

    if (discovery.isShowingMatches()) {
        await processPlayerMatchesTab(playerDataFromPage)
    }

    if (discovery.isShowingReports()) {
        currentPlayerRepresentationInStorage = await processPlayerReports(currentPlayerRepresentationInStorage)
    }

    if (discovery.isShowingTraining()) {
        await processPlayerTraining()
    }

    if (discovery.isShowingOverview() || discovery.isShowingReports()) { // only save for Overview or Reports
        // console.info(`fromStorage:`,currentPlayerRepresentationInStorage)
        // console.info(`fromPage:`,playerDataFromPage)
        currentPlayerRepresentationInStorage = utils.mergeObjects(currentPlayerRepresentationInStorage, playerDataFromPage)

        // Bug? Skills Calculations/Special Talent #48
        if (discovery.isShowingOverview() && !playerDataFromPage.specialTalents) {
            delete currentPlayerRepresentationInStorage['specialTalents']
        }

        // console.info(`Will save player data to storage`, currentPlayerRepresentationInStorage)
        await db.putPlayer(currentPlayerRepresentationInStorage)

        console.info(`📥 Saved player data to storage (${playerDataFromPage.id} ${currentPlayerRepresentationInStorage.name})`, currentPlayerRepresentationInStorage)
    }

    // TODO: develop this further
    const currentWeek = uiUtils.getCurrentWeekNumber()
    if (currentWeek) {
        try {
            const formatter = new Intl.DateTimeFormat("ch-DE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short"
            })
            const currentSeasonNumber = uiUtils.getCurrentSeasonNumber()
            const now = new Date() // current date/time

            const playerAge = playerUtils.getPlayerAge()
            const lookAheadBy = 21 - playerAge.years
            const birthdaysArray = playerUtils.getFutureBirthdays(now, playerAge.years, playerAge.months, playerAge.days, lookAheadBy)

            const seasonStartDates = utils.getSeasonStartDates(now, currentWeek, lookAheadBy)
            // console.info(`Current season: ${currentSeasonNumber}, season ${currentSeasonNumber + seasonsAhead} starts on:`, formatter.format(targetSeasonStart), `(${targetSeasonStart.toUTCString()})`)

            // console.info(`Player age: ${playerAge.years}y ${playerAge.months}m ${playerAge.days}d, seasons left as youth: ${playerUtils.getSeasonsLeftAsYouth()}, next birthday: `, formatter.format(birthdaysArray[0].date), `(${birthdaysArray[0].date.toUTCString()})`)
            for (let i = 0; i < birthdaysArray.length; i++) {
                const birthday = birthdaysArray[i]
                const seasonStartDate = seasonStartDates[i]
                console.info(`Birthday ${birthday.age} on ${formatter.format(birthday.date)} (${birthday.date.toUTCString()}) is ${utils.diffInDaysUTC(seasonStartDate, birthday.date)} days after season ${currentSeasonNumber + i + 1} starts (${seasonStartDate})`)
            }
        } catch (error) {
            console.error(error)
        }
    }
}