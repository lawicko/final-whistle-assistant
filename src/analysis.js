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

        const formElement = document.createElement('form')
        formElement.id = "filtersForm"
        document.body.appendChild(formElement)

        // Team selector
        const teams = [...new Set(analysisData.map(e => e.team))];
        const select = document.createElement('select');
        select.id = "teamSelect";
        select.name = "teamFilter"; 
        const defaultOption = document.createElement('option');
        defaultOption.value = "";
        defaultOption.textContent = "Both teams";
        select.appendChild(defaultOption);
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team;
            option.textContent = team;
            select.appendChild(option);
        });
        select.addEventListener("change", () => {
            displayOpportunities(analysisData, getFilters())
        });
        formElement.appendChild(select);

        // Creator checkbox
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'showCreatedBy'
        checkbox.checked = false;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(" Show created by"));

        formElement.appendChild(label);

        checkbox.addEventListener("change", () => {
            displayOpportunities(analysisData, getFilters())
        });

        insertBR(document.body)

        displayOpportunities(analysisData, getFilters())
    }
});

function getFilters() {
    const form = document.getElementById("filtersForm");
    console.info("form:",form)
    const fd = new FormData(form);
    console.info("new FormData(form):",fd)
    console.info("will return filters:", Object.fromEntries(fd.entries()))
    return Object.fromEntries(fd.entries());
}

function displayOpportunities(analysisData, config) {

    const containerID = "resultContainer"
    const existingContainer = document.body.querySelector(`#${containerID}`)
    if (existingContainer) {
        existingContainer.remove()
    }

    const container = document.createElement('div')
    container.id = containerID
    document.body.appendChild(container)

    let opportunities = analysisData
    if (config.teamFilter != "") {
        opportunities = analysisData.filter(opportunity => opportunity.team === config.teamFilter)
    }

    for (const opportunity of opportunities) {
        console.info("opportunity:", opportunity)

        const minuteElement = document.createElement('span')
        minuteElement.classList.add('engine-minute')
        minuteElement.textContent = `Minute ${opportunity.minute}`
        container.appendChild(minuteElement)
        insertBR(container)

        const teamElement = document.createElement('span')
        teamElement.classList.add('engine-team')
        teamElement.textContent = opportunity.team
        container.appendChild(teamElement)
        insertBR(container)

        if (config.showCreatedBy) {
            const creatorElement = document.createElement('span')
            creatorElement.textContent = `Created by `
            insertPlayerLink(opportunity.creator, creatorElement)
            creatorElement.append(" [" + opportunity.creator.position + "]")
            container.appendChild(creatorElement)
            insertBR(container)
        }

        const context = opportunity.context
        if (context && context != "block") {
            const contextElement = document.createElement('span')
            contextElement.classList.add("engine-corner")
            contextElement.textContent = titleCase(context)
            container.appendChild(contextElement)
            insertBR(container)
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
        container.appendChild(actionElement)

        insertBR(container)
        insertBR(container)
    }
}

const capitalizeFirst = s => s ? s[0].toUpperCase() + s.slice(1) : "";

function titleCase(str) {
    return str
        .split(" ")
        .map(w => capitalizeFirst(w))
        .join(" ");
}

function insertBR(targetElement) {
    targetElement.appendChild(document.createElement('br'))
}

function insertPlayerLink(player, target) {
    const playerLink = document.createElement('a')
    playerLink.textContent = player.name
    playerLink.href = "https://www.finalwhistle.org/en/player/" + player.id
    playerLink.target = "_blank"
    playerLink.rel = "noopener noreferrer"
    target.appendChild(playerLink)
}