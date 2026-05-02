import * as utils from "../../utils.js"
import * as uiUtils from "../../ui_utils.js"
import * as playerUtils from "./player+utils.js"
import { getScoutButton, getBidButton } from "./player+discovery.js"
import * as integrationUtils from "../../integrations/integrations_utls.js"
import * as personalitiesUtils from "../../personalities_utils.js"

export function addTrainingSimulationButtonIfNeeded() {
    if (document.getElementById("TRAINING-SIMULATION-BUTTON")) return

    const scoutButton = getScoutButton()
    // Create the new button
    const newButton = document.createElement('button')
    newButton.id = "TRAINING-SIMULATION-BUTTON"
    newButton.title = "Simulate the training progress with Badger"
    newButton.className = 'btn btn-sm btn-secondary me-1'
    newButton.textContent = 'Training simulation'; // Change this to whatever you want
    newButton.addEventListener('click', async () => {
        const text = integrationUtils.selectAllAsText()
        const compressed = await integrationUtils.compressAndBase64(text, 'gzip')
        window.open(`https://www.abelfw.org/badgerpaste?pp=${compressed}`, '_blank');
        // For dev environment
        // window.open(`https://dev.abelfw.org/badgerpaste?pp=${compressed}`, '_blank');

        // The clipboard workaround
        // const result = integrationUtils.copyRenderedPageToClipboard();
        // if (result) {
        //     console.debug("Page copied to clipboard!");
        // } else {
        //     console.error("Could not copy rendered page to clipboard :(");
        // }
    });

    // Insert as a sibling (after the Scout button)
    scoutButton?.insertAdjacentElement('afterend', newButton)
}

/**
 * Checks if the buying guide is displayed, if not it calls the assembleBuyingGuide() and attaches the result after the bid button.
 * @param {Object} playerData Data as gathered in the getPlayerData function
 */
export function showBuyingGuide(playerData) {
    const bidButton = getBidButton()

    const buyingGuideIdentifier = `${utils.pluginNodeClass}-buying-guide`
    if (document.getElementById(buyingGuideIdentifier)) {
        console.debug("Buying guide already present")
        return
    }

    console.info("Adding buying guide")
    const buyingGuide = assembleBuyingGuide(buyingGuideIdentifier, playerData)
    bidButton.after(buyingGuide)
}

/**
 * Assemble buying guide ready to be attached to DOM.
 * @param {string} identifier - identifier to be used for the buying guide
 * @param {Object} playerData Data as gathered in the getPlayerData function
 * @returns {Object} buying guide node.
 */
function assembleBuyingGuide(identifier, playerData) {
    const position = playerData.position
    const experience = playerData.experience
    const playerAge = playerUtils.getPlayerAge().years
    const buyingGuideList = document.createElement("ol")
    buyingGuideList.id = identifier

    let personalitiesData = playerData.personalities
    const buyingGuideDescriptions = []
    if (personalitiesData) {
        Object.entries(personalitiesData).forEach(([personality, value]) => {
            try {
                const description = personalitiesUtils.personalityDescription(
                    personality,
                    value,
                    position,
                    experience.value
                )
                if (!description) return
                buyingGuideDescriptions.push(description)
            } catch (e) {
                console.error(e.message)
            }
        })
    }

    let specialTalentsData = playerData.specialTalents
    if (specialTalentsData) {
        console.info("Appending special talents info to buying guide")
        for (const talent of specialTalentsData) {
            // console.info("Appending special talent:", talent, ", position:", position)
            const description = specialTalentsUtils.specialTalentDescription(talent, position)
            // console.info("Appending special talent description:", description)
            buyingGuideDescriptions.push(description)
        }
    }

    let hiddenSkillsData = playerData.hiddenSkills
    if (playerAge < 21 && hiddenSkillsData) {
        const youthSpecificDescriptions = []
        // this can be "very_good", "good", "bad" or "very_bad"
        const advancedDevelopmentAssesment = utils.classFromTalent(hiddenSkillsData.estimatedPotential, hiddenSkillsData.advancedDev)
        if (["good", "very_good"].includes(advancedDevelopmentAssesment)) {
            const description = "👍 His advanced development starts early in relation to his estimated potential, which means his development will speed up while he is still eligible to play in youths"
            youthSpecificDescriptions.push(description)
        }

        if (youthSpecificDescriptions.length > 0) {
            youthSpecificDescriptions.unshift("If you plan to improve your youth team:")
        }
        buyingGuideDescriptions.push(...youthSpecificDescriptions)
    }

    console.debug("buyingGuideDescriptions", buyingGuideDescriptions)

    const processed = buyingGuideDescriptions
        .filter(str => !str.startsWith("🤔")) // remove 🤔
        .sort((a, b) => {
            if (a.startsWith("👍") && b.startsWith("👎")) return -1; // 👍 before 👎
            if (a.startsWith("👎") && b.startsWith("👍")) return 1;
            return 0; // keep relative order otherwise
        });

    console.debug("buyingGuideDescriptions after", processed);

    for (const description of processed) {
        const li = document.createElement("li");
        li.textContent = description;
        buyingGuideList.appendChild(li);
    }

    return buyingGuideList
}