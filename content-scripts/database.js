import Dexie from "dexie"

export const database = new Dexie("FinalWhistleAssistant")

database.version(1).stores({
    // all expected fields: id, teamId, name, position, rating, talent, personalities, hiddenSkills, specialTalents, injuries, minutesPlayed
    players: "id, teamId, position, rating, talent",
    // all expected fields: id, date, homeTeam, awayTeam, tactics, startingLineups, finishingLineups
    matches: "id, date, competition, homeTeamID, homeTeamName, awayTeamID, awayTeamName"
})

database.on("blocked", ev => {
    console.warn("Database open is blocked by another connection", ev);
})