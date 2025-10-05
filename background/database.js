import Dexie from "dexie"

let database

export function getDB() {
  return database
}

export function setDB(newDb) {
  database = newDb
}

export function initDB(context) {
  const db = new Dexie("FinalWhistleAssistant")
  db.version(2).stores({
    // all expected fields: id, teamId, name, position, rating, talent, personalities, hiddenSkills, specialTalents, injuries, minutesPlayed
    players: "id, teamId, position, rating, talent",
    // all expected fields: id, date, homeTeam, awayTeam, tactics, startingLineups, finishingLineups
    matches: "id, date, competition, homeTeamID, homeTeamName, awayTeamID, awayTeamName",
    // settings
    settings: "category",
    // participation table, expected fields minutesPlayed, injury, goals, cards
    matchPlayers: "[matchId+playerId], matchId, playerId, teamId"
  }).upgrade(async tx => {
    console.info("🗄️ Migrating to version 2")
    const matches = await tx.table("matches").toArray()
    const rows = []
    function getMatchPlayer(matchId, teamId, player) {
      let mPlayer = { matchId: matchId, playerId: player.id, teamId: teamId, name: player.name, minutesPlayed: parseInt(player.minutes) }
      if (player.injury) mPlayer["injury"] = player.injury
      return mPlayer
    }

    for (const m of matches) {
      if (!m.finishingLineups) continue
      for (const p of m.finishingLineups.home) {
        let mPlayer = getMatchPlayer(m.id, m.homeTeamID, p)
        rows.push(mPlayer)
      }
      for (const p of m.finishingLineups.away) {
        let mPlayer = getMatchPlayer(m.id, m.awayTeamID, p)
        rows.push(mPlayer)
      }
    }

    await tx.table("matchPlayers").bulkAdd(rows)
    console.info("🗄️ Migration to version 2 finished")
  })

  db.on("blocked", ev => {
    console.warn("Database open is blocked by another connection", ev);
  })

  db.on("close", () => console.info("🗄️ Database was closed"));

  db.on("ready", (vipDB) => { console.info("🗄️ Database ready"); });

  database = db
  console.info("🗄️ initDB:", context)
}