import * as utils from "../../utils.js"
import * as integrationUtils from "../../integrations/integrations_utls.js"

const trainingSimulationButtonClass = utils.pluginNodeClass + "TrainingSimulation"

export async function processAcademyPage() {
    console.info(`${utils.version} 🎓 Processing academy page`)
    const academyDraftContainers = getAcademyDraftContainers()
    for (const academyDraftContainer of academyDraftContainers) {
        const successButton = academyDraftContainer.querySelector(`div button.btn-success`)
        const dangerButton = academyDraftContainer.querySelector(`div button.btn-danger`)
        const revealButton = academyDraftContainer.querySelector(`div button.btn-secondary`)

        const existingTrainingSimulationButton = academyDraftContainer.querySelector(`div button.${trainingSimulationButtonClass}`)
        if (existingTrainingSimulationButton) continue

        const trainingSimulationButton = document.createElement("button")
        trainingSimulationButton.title = "Simulate the training progress with Badger"
        trainingSimulationButton.disabled = revealButton != undefined
        trainingSimulationButton.className = successButton.className
        trainingSimulationButton.classList.add(trainingSimulationButtonClass)
        trainingSimulationButton.textContent = "Training Simulation"
        trainingSimulationButton.addEventListener("click", async () => {
            const text = integrationUtils.selectNodeAsText(academyDraftContainer)
            const compressed = await integrationUtils.compressAndBase64(text, 'gzip')
            window.open(`https://www.abelfw.org/badgerpaste?pp=${compressed}`, '_blank');
        })

        revealButton.after(trainingSimulationButton)
    }
}

function getAcademyDraftContainers() {
    return document.querySelectorAll(`fw-academy-draft > div.row`)
}

const observer = new MutationObserver(() => {
    // console.info("observer fired!")
    const academyDraftContainers = getAcademyDraftContainers()
    for (const academyDraftContainer of academyDraftContainers) {
        const revealButton = academyDraftContainer.querySelector(`div button.btn-secondary`)
        const existingTrainingSimulationButton = academyDraftContainer.querySelector(`div button.${trainingSimulationButtonClass}`)
        if (existingTrainingSimulationButton) {
            existingTrainingSimulationButton.disabled = revealButton != undefined
        }
    }
});

// Watch the parent container (or document.body) for changes to its children
observer.observe(document.body, { childList: true, subtree: true });