if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome
}

browser.runtime.onMessage.addListener((msg) => {
    if (msg.type === "render") {
        document.getElementById("activity-indicator").remove()

        const analysisData = msg["analysisData"]
        if (!analysisData) {
            const element = document.createElement('span')
            element.textContent = `No analysisData in message: ${msg}`
            document.body.appendChild(element)
            return
        }

        for (opportunity of analysisData) {
            console.info("opportunity:", opportunity)

            const minuteElement = document.createElement('span')
            minuteElement.classList.add('engine-minute')
            minuteElement.textContent = `Minute ${opportunity.minute}`
            document.body.appendChild(minuteElement)
            insertBR()

            const teamElement = document.createElement('span')
            teamElement.classList.add('engine-team')
            teamElement.textContent = opportunity.team
            document.body.appendChild(teamElement)
            insertBR()

            const creatorElement = document.createElement('span')
            creatorElement.textContent = `Created by `
            insertPlayerLink(opportunity.creator, creatorElement)
            creatorElement.append(" [" + opportunity.creator.position + "]")
            document.body.appendChild(creatorElement)
            insertBR()

            const context = opportunity.context
            if (context && context != "block") {
                const contextElement = document.createElement('span')
                contextElement.classList.add("engine-corner")
                contextElement.textContent = titleCase(context)
                document.body.appendChild(contextElement)
                insertBR()
            }

            const actionElement = document.createElement('span')
            insertPlayerLink(opportunity.potentialAssistant, actionElement)
            actionElement.append(" [" + opportunity.potentialAssistant.position + "]")
            actionElement.append(` tried ${opportunity.passType} pass to `)
            insertPlayerLink(opportunity.intendedReceiver, actionElement)
            actionElement.append(" [" + opportunity.intendedReceiver.position + "]")

            switch (opportunity.outcome) {
                case "cleared":
                    let potentialBlock = ""
                    if (context && context === "block") {
                        potentialBlock = "blocked and later "
                    }
                    actionElement.append(`, but the ball was ${potentialBlock}cleared by `)
                    insertPlayerLink(opportunity.stopper, actionElement)
                    actionElement.append(" [" + opportunity.stopper.position + "]")
                    break;
                case "caught":
                    actionElement.append(`, but the ball was caught by `)
                    insertPlayerLink(opportunity.stopper, actionElement)
                    actionElement.append(" [" + opportunity.stopper.position + "]")
                    break;
                case "corner":
                    actionElement.append(`, but the ball was sent to corner by `)
                    insertPlayerLink(opportunity.stopper, actionElement)
                    actionElement.append(" [" + opportunity.stopper.position + "]")
                    break;
                case "offensiveFoul":
                    actionElement.append(`, but he committed an offensive foul in the process.`)
                    break;
                case "interception":
                    actionElement.append(`, but `)
                    insertPlayerLink(opportunity.stopper, actionElement)
                    actionElement.append(" [" + opportunity.stopper.position + "] intercepted the ball.")
                    break;
                case "goal":
                    actionElement.append(`, and he successfully scored a goal.`)
                    break;
                default:
                    actionElement.append(`, UNKNOWN STOPPAGE ACTION `)
                    break;
            }
            document.body.appendChild(actionElement)

            insertBR()
            insertBR()
        }
    }
});

const capitalizeFirst = s => s ? s[0].toUpperCase() + s.slice(1) : "";

function titleCase(str) {
  return str
    .split(" ")
    .map(w => capitalizeFirst(w))
    .join(" ");
}

function insertBR() {
    document.body.appendChild(document.createElement('br'))
}

function insertPlayerLink(player, target) {
    const playerLink = document.createElement('a')
    playerLink.textContent = player.name
    playerLink.href = "https://www.finalwhistle.org/en/player/" + player.id
    playerLink.target = "_blank"
    playerLink.rel = "noopener noreferrer"
    target.appendChild(playerLink)
}