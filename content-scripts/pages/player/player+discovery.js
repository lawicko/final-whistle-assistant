import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as specialTalentsUtils from "../../special_talents_utils.js"
import * as personalitiesUtils from "../../personalities_utils.js"
import * as playerUtils from "./player+utils.js"
import * as db from "../../db_access.js"
import * as integrationUtils from "../../integrations/integrations_utls.js"

/**
 * Gets the club data of the player.
 * @returns {Object} data object { id: string, name: string}
 */
function getPlayerClubData() {
    const link = document.querySelector('table span fw-club-hover a')
    if (!link) return
    const clubID = utils.lastPathComponent(link.href)
    const clubName = link.querySelector('span.club-name').textContent
    const clubData = {
        id: clubID,
        name: clubName
    }
    return clubData
}

/**
 * Gets the foot data of the player.
 * @returns {string} "L" or "R"
 */
function getPlayerFoot() {
    const playerClubMetaTable = document.querySelector(uiUtils.playerClubMetaTableQuery)
    if (!playerClubMetaTable) return
    const allCells = Array.from(playerClubMetaTable.querySelectorAll('tr > td'))
    const footCell = allCells.findLast(cell => {
        return cell.textContent.trim().endsWith("Footed")
    })
    if (!footCell) return
    const footInfo = footCell.textContent.trim()
    switch (footInfo) {
        case "Right Footed": return "R"
        case "Left Footed": return "L"
        default:
            console.warn("Unknown footInfo:", footInfo)
            return undefined
    }
}

/**
 * Returns the player personalities table if it's present on the page.
 * @returns {Object} player personalities table node.
 */
export function getPersonalitiesTable() {
    const tables = document.querySelectorAll("table");

    const personalityTable = Array.from(tables).find(table =>
        Array.from(table.querySelectorAll("th")).some(
            th => th.textContent.trim() === "Personalities"
        )
    );

    return personalityTable
}

/**
 * Returns the player personalities data from a given table.
 * @param {Object} personalitiesTable as gathered in the getPersonalitiesTable function
 * @returns {Object} player personalities data.
 */
export function getPersonalitiesData(personalitiesTable) {
    if (!personalitiesTable) {
        throw new Error("personalitiesTable is undefined");
    }
    const result = {};

    // Loop over each row
    personalitiesTable.querySelectorAll("tr").forEach(row => {
        const link = row.querySelector("a");
        if (!link) return; // skip rows without <a>

        const name = link.textContent.trim().toLowerCase();

        // Count pluses and minuses
        const plusCount = row.querySelectorAll("i.personality-plus").length;
        const minusCount = row.querySelectorAll("i.personality-minus").length;

        let value = 0;
        if (plusCount > 0) {
            value = plusCount; // 1 or 2
        } else if (minusCount > 0) {
            value = -minusCount; // -1 or -2
        }

        result[name] = value;
    });

    return result
}

/**
 * Returns the player special talents table if it's present on the page.
 * @returns {Object} player special talents table node.
 */
function getSpecialTalentsTable() {
    const table = document.querySelector("table.special-ability-table");
    return table
}

/**
 * Returns the player special talents data from a given table.
 * @param {Object} specialTalentsTable as gathered in the getSpecialTalentsTable function
 * @returns {Object} player special talents data.
 */
function getSpecialTalentsData(specialTalentsTable) {
    if (!specialTalentsTable) {
        throw new Error("specialTalentsTable is undefined");
    }
    const result = [];

    // Loop over each row
    specialTalentsTable.querySelectorAll("tr").forEach(row => {
        const link = row.querySelector("a");
        if (!link) return; // skip rows without <a>

        const name = link.textContent.trim().toLowerCase();
        result.push(name);
    });

    return result
}

/**
 * Returns the player hidden skills table if it's present on the page.
 * @returns {Object} player hidden skills table node.
 */
function getHiddenSkillsTable() {
    const tables = document.querySelectorAll("table");

    const hiddenSkillsTable = Array.from(tables).find(table =>
        Array.from(table.querySelectorAll("th")).some(
            th => th.textContent.trim() === "Hidden"
        )
    );

    return hiddenSkillsTable
}

/**
 * Returns the player hidden skills data from a given table.
 * @param {Object} hiddenSkillsTable as gathered in the getHiddenSkillsTable function
 * @returns {Object} player hidden skills data.
 */
function getHiddenSkillsData(hiddenSkillsTable) {
    if (!hiddenSkillsTable) {
        throw new Error("hiddenSkillsTable is undefined");
    }
    const result = {};

    // Loop over each row
    hiddenSkillsTable.querySelectorAll("tr:has(td.hidden-skill)").forEach(row => {
        const skillLabelElement = row.querySelector("td.hidden-skill")
        const skillLabelText = skillLabelElement.textContent.trim()
        const skillValueElement = skillLabelElement.nextElementSibling

        result[utils.toCamelCase(skillLabelText)] = playerUtils.parseNumbersOnPlayerPage(skillValueElement)
    });

    return result
}

function getPlayerRating() {
    const playerSummaryStatsTable = document.querySelector(uiUtils.playerSummaryStatsTableQuery)
    const playerSummaryHeaders = playerSummaryStatsTable.querySelectorAll("th")
    const ratingHeader = Array.from(playerSummaryHeaders).find(th => th.textContent == "Rating")
    const ratingCell = ratingHeader.nextSibling
    const spans = ratingCell.querySelectorAll('span')
    const rating = spans[0].textContent.trim()
    const talent = spans[2].textContent.trim()
    return { rating: rating, talent: talent }
}

export function getPlayerData() {
    const position = getPlayerPosition()
    const name = getPlayerName()
    const clubData = getPlayerClubData()
    const foot = getPlayerFoot()
    const { rating, talent } = getPlayerRating()
    const experience = getPlayerExperience()
    const timestamp = new Date().toISOString()

    const personalitiesTable = getPersonalitiesTable()
    let personalitiesData
    if (personalitiesTable) {
        personalitiesData = getPersonalitiesData(personalitiesTable)
    }
    console.debug('Result of reading the personalities', personalitiesData)

    const specialTalentsTable = getSpecialTalentsTable()
    let specialTalentsData
    if (specialTalentsTable) {
        specialTalentsData = getSpecialTalentsData(specialTalentsTable)
        console.info('Result of reading the special talents', specialTalentsData)
    } else {
        console.debug(`No special talents table found, skipping...`)
    }

    const hiddenSkillsTable = getHiddenSkillsTable()
    let hiddenSkillsData
    if (hiddenSkillsTable) {
        hiddenSkillsData = getHiddenSkillsData(hiddenSkillsTable)
    }
    console.debug("hiddenSkillsData", hiddenSkillsData)

    const playerID = utils.lastPathComponent(window.location.pathname)

    return {
        id: playerID,
        name: name,
        position: position,
        foot: foot,
        rating: rating,
        talent: talent,
        experience: experience,
        timestamp: timestamp,
        teamId: clubData ? clubData.id : null,
        ...(personalitiesData !== undefined && { personalities: personalitiesData }),
        ...(specialTalentsData !== undefined && { specialTalents: specialTalentsData }),
        ...(hiddenSkillsData != undefined && { hiddenSkills: hiddenSkillsData })
    }
}

export function getBidButton() {
    return document.querySelector("button:has(> i.bi-hammer)")
}

export function getScoutButton() {
    const button = Array.from(document.querySelectorAll('.btn.btn-sm.btn-secondary.me-1'))
        .find(btn => btn.textContent.trim() === 'Scout')
    return button
}

export function isPendingSale() {
    const bidButton = getBidButton()
    return bidButton && bidButton.textContent.trim().startsWith("Place bid")
}

/**
 * Gets the player position e.g. FW.
 * @returns {string} player position.
 */
function getPlayerPosition() {
    const badgeElement = document.querySelector(".badge-position")
    if (!badgeElement) return
    return badgeElement.textContent.trim()
}

/**
 * Gets the player name.
 * @returns {string} player name
 */
function getPlayerName() {
    const headerElement = document.querySelector("fw-player-details div.player-detail-header-title span")
    if (!headerElement) return
    let playerName = headerElement.textContent.trim()
    playerName = playerName.replace(/\s+/g, " ") // removes repeated spaces
    return playerName
}

/**
 * Gets the player experience.
 * @returns {Object} player experience as Object e.g. { value: 5, description: "good" }
 */
function getPlayerExperience() {
    const playerSummaryStatsTable = document.querySelector(uiUtils.playerSummaryStatsTableQuery)
    const tds = playerSummaryStatsTable.querySelectorAll("tr > th")

    // Find the one whose textContent includes "Experience"
    const experienceLabelTH = Array.from(tds).find(th => th.textContent.trim() === "Experience")
    const experienceValueTD = experienceLabelTH.nextElementSibling
    const descriptionSpan = experienceValueTD.querySelector("span")
    const valueSpan = descriptionSpan.nextElementSibling
    let experienceValue = undefined
    if (valueSpan) {
        const numbersOnly = valueSpan.textContent.trim().replace(/\D/g, "")
        experienceValue = parseInt(numbersOnly, 10)
    }
    const denomClass = [...descriptionSpan.classList].find(c => c.includes("denom"))
    const experienceDenomination = parseInt(denomClass.slice(5), 10)
    return { value: experienceDenomination, description: descriptionSpan.textContent.trim(), exactValue: experienceValue }
}

const positionEmoji = {
    // Forwards
    FW: "🎯",

    // Midfielders
    LW: "⚙️",
    LM: "⚙️",
    RW: "⚙️",
    RM: "⚙️",
    OM: "⚙️",
    CM: "⚙️",
    DM: "⚙️",

    // Defenders
    LWB: "🛡️",
    LB: "🛡️",
    RWB: "🛡️",
    RB: "🛡️",
    CB: "🛡️",

    // Goalkeeper
    GK: "🧤",
};

/**
 * Returns the emoji for a given position.
 * Defaults to ⚽ if position is unknown.
 * @param {string} position
 * @returns {string}
 */
function getPositionEmoji(position) {
    return positionEmoji[position] || "⚽";
}

/**
 * Returns the player skills table if it's present on the page.
 * @returns {Object} player skills table node.
 */
function getPlayerSkillsTable() {
    return document.querySelector("table:has(i.fa-user-circle)")
}

/**
 * Returns the player computed skills table if it's present on the page.
 * @returns {Object} player computed skills table node.
 */
function getPlayerComputeSkillsTable() {
    return document.querySelector("table:has(i.fa-calculator)")
}

/**
 * Checks if the site is loaded.
 * @returns {boolean} True if the site is loaded.
 */
export function checkSiteLoaded() {
    const playerPosition = getPlayerPosition()
    if (!playerPosition) {
        console.info("Could not find player position")
        return false
    } else {
        console.info(`${getPositionEmoji(playerPosition)} Found player position`)
    }

    const playerName = getPlayerName()
    if (!playerName) {
        console.info("Could not find player name")
        return false
    } else {
        console.info(`🪪 Found player name`)
    }

    if (getPlayerSkillsTable()) {
        console.info(`🏋️ Found player skills table`)
    }

    if (getPersonalitiesTable()) {
        console.info("🎭 Found personalities table")
    }
    if (getSpecialTalentsTable()) {
        console.info("⚡ Found special talents table")
    }
    if (getHiddenSkillsTable()) {
        console.info("🕵️ Found hidden skills table")
    }
    if (getPlayerComputeSkillsTable()) {
        console.info("🧮 Found computed skills table")
    }
    if (getBidButton()) {
        console.info("🏷️ Found bidding section")
    }

    return true
}

export function getCoreSkillsTable() {
    return document.querySelector("table.table:has(tr th span[ngbpopover='Core Skills'])")
}

function getActiveTab() {
    return document.querySelector(`${uiUtils.navTabsQuery} > li.nav-item > a.nav-link.active[aria-selected='true']`)
}

export function isShowingOverview() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Overview"
}

export function isShowingMatches() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Matches"
}

export function isShowingReports() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Reports"
}

export function isShowingTraining() {
    const activeTab = getActiveTab()
    return activeTab && activeTab.textContent.trim() === "Training"
}