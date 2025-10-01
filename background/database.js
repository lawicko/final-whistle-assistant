import Dexie from "dexie"

let database

export function getDB() {
  return database
}

export function setDB(newDb) {
  database = newDb
}

export function initDB() {
  const db = new Dexie("FinalWhistleAssistant")
  db.version(1).stores({
    // all expected fields: id, teamId, name, position, rating, talent, personalities, hiddenSkills, specialTalents, injuries, minutesPlayed
    players: "id, teamId, position, rating, talent",
    // all expected fields: id, date, homeTeam, awayTeam, tactics, startingLineups, finishingLineups
    matches: "id, date, competition, homeTeamID, homeTeamName, awayTeamID, awayTeamName"
  })

  db.on("blocked", ev => {
    console.warn("Database open is blocked by another connection", ev);
  })

  database = db
}
initDB()