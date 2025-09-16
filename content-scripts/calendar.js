import { storage, version } from './utils.js';

export async function processMatchIndicators() {
    console.info(`${version} Processing match indicators...`);

    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.tBodies[0] && tableNode.tBodies[0].rows.length > 1) {
        console.debug(`Found the following table for processing match indicators: `, tableNode)

        // This is for the future, when we will check for matches missing in storage
        const { matchesInStorage = {} } = await storage.get("matches");
        console.debug("matchesInStorage:", matchesInStorage)

        const tbody = tableNode.tBodies[0]; // first tbody
        Array.from(tbody.rows).forEach(row => {
            // Add Y and S to the badges on the left
            let targetNodesYouth = row.querySelectorAll("span.badge-youth");
            targetNodesYouth.forEach((element) => {
                element.textContent = "Y";
            });

            let targetNodesSenior = row.querySelectorAll("span.badge-senior");
            targetNodesSenior.forEach((element) => {
                element.textContent = "S";
            });
        });
    }
}
