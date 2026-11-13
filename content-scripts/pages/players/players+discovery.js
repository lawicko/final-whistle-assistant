const attackersSelector = "div.player-filter__zones button[aria-label=\"Attack\"]"
const midfieldersSelector = "div.player-filter__zones button[aria-label=\"Midfield\"]"
const defendersSelector = "div.player-filter__zones button[aria-label=\"Defence\"]"
const goalkeepersSelector = "div.player-filter__zones button[aria-label=\"Goalkeeper\"]"
const positionFilterUnselectedClass = "fw-position-zones__zone--off"

const playersTableSelector = "table.table"

export function getPlayersTable() {
    return document.querySelector("table.table")
}

export function isPageReadyForProcessing() {
    const tableNode = getPlayersTable()
    return tableNode && tableNode.rows.length > 1
}

export function isShowingAttackers() {
    let attackerFilter = document.querySelector(attackersSelector)
    return (attackerFilter && !attackerFilter.classList.contains(positionFilterUnselectedClass))
}

export function isShowingMidfielders() {
    let midfielderFilter = document.querySelector(midfieldersSelector)
    return (midfielderFilter && !midfielderFilter.classList.contains(positionFilterUnselectedClass))
}

export function isShowingDefenders() {
    let defenderFilter = document.querySelector(defendersSelector)
    return (defenderFilter && !defenderFilter.classList.contains(positionFilterUnselectedClass))
}

export function isShowingGoalkeepers() {
    let goalkeeperFilter = document.querySelector(goalkeepersSelector)
    return (goalkeeperFilter && !goalkeeperFilter.classList.contains(positionFilterUnselectedClass))
}