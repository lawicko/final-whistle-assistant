import * as discovery from "./lineup+discovery.js"
import * as utils from "../../utils.js"

export function fixHeader(config) {
    const formationContainer = document.querySelector(config.formationContainerSelector)

    const header = formationContainer.querySelector(config.oldHeaderSelector)
    // See if we already fixed it
    const fixedClass = utils.pluginNodeClass + "LineupHeaderFixed"
    if (header.classList.contains(fixedClass)) {
        return
    }
    console.info("👨‍🔧 Fixing header")

    let columnNames = [...header.querySelectorAll("div.header-skill")].map(div => div.textContent.trim())
    columnNames.unshift(...config.columnLabels)
    columnNames.reverse()
    // console.info("columnNames:", columnNames)

    const columnSizes = config.columnSizes

    // Remove the unnecessary lead element
    const leadSpacingElement = header.querySelector("div.formation-skill-header__lead")
    if (leadSpacingElement) {
        leadSpacingElement.remove()
    }
    const innerHeaderContainer = header.querySelector("div.formation-skill-header__skills")
    for (const columnName of config.columnLabels.reverse()) {
        const headerCell = document.createElement("div")
        headerCell.classList.add("header-skill")
        headerCell.classList.add("ng-star-inserted")
        headerCell.textContent = columnName
        innerHeaderContainer.prepend(headerCell)
    }
    Array.from(innerHeaderContainer.children).forEach((headerCell, index, array) => {
        const desiredWidth = columnSizes[headerCell.textContent]
        headerCell.style.width = `${desiredWidth}px`
        headerCell.style.textAlign = "center"
        if (headerCell.textContent == "SC") {
            headerCell.style.marginLeft = "6px"
        } else {
            headerCell.style.marginLeft = "0px"
        }
        console.debug("Adding header cell for", headerCell.textContent, "with width:", desiredWidth)
    })
    header.classList.add(fixedClass)
}

export function updateFormIndicators() {
    const playerRows = document.querySelectorAll(`fw-player-card`)
    for (const row of playerRows) {
        // const nameSpan = row.querySelector(`div.p-name a > span:nth-of-type(2)`)
        // console.info("Player name: ", nameSpan.textContent)

        const formIndicator = row.querySelector(`div.${discovery.formIndicatorclass}`)

        let skillDescription = "dec"
        if (formIndicator) {
            const match = Array.from(formIndicator.classList).find(cls => /^form-\d+$/.test(cls))
            const formValue = match ? parseInt(match.split('-')[1]) : "40"
            skillDescription = utils.skillDescriptionFromClass(formValue)
            // console.info("skillDescription:", skillDescription, "for match:", match)
            const container = createContainerForFormDescription(skillDescription, formValue)

            formIndicator.replaceWith(container)
        } else {
            const newFormIndicator = row.querySelector(`.${newFormIndicatorClass}`)
            if (newFormIndicator) {
                // console.info("Found newFormIndicator: ", newFormIndicator)
            } else {
                // console.info("Did not find newFormIndicatorClass")
                const container = createContainerForFormDescription(skillDescription, 40)
                const nameElement = row.querySelector("div.p-name")
                nameElement.parentElement.insertBefore(container, nameElement)
            }
        }
    }
}

const newFormIndicatorClass = utils.pluginNodeClass + "NewFormIndicator"

function createContainerForFormDescription(skillDescription, formValue) {
    const span = document.createElement('span')
    span.textContent = skillDescription
    span.classList.add(`denom${formValue / 10}`)
    span.classList.add(newFormIndicatorClass)
    span.style.transform = 'translate(-50%, -50%) rotate(90deg)'
    span.style.fontSize = '.7rem'
    span.style.position = 'absolute'
    span.style.display = 'inline-block'
    span.style.left = '50%'
    span.style.top = '50%'

    // Replace formIndicator with a container that maintains the original space
    const container = document.createElement('div')
    container.style.position = 'relative'
    container.style.display = 'inline-block'
    container.style.width = '16px'
    container.style.height = '16px'
    container.appendChild(span)

    return container
}