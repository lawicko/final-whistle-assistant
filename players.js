if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

const playersModulePrefix = "players"

console.log(`${new Date().toLocaleString()} ${playersModulePrefix}: players.js script loaded...`)

// Recreates the denomination used on the website, used for coloring the numbers
function denomination(value) {
    let den = 0
    if (value > 29) {
        den = Math.trunc(value / 10)
    } else {
        if (value > 15) {
            den = 2
        } else {
            den = 1
        }
    }
    return den
}

// Adds the headers to the players table
function createHeaders() {
    var firstRow = document.querySelector("table > tr:first-of-type");
    
    var thLS = document.createElement('th');
    thLS.className = pluginNodeClass
    thLS.innerHTML = 
                        `<div class="plugin-has-hover-card">LS
                            <div class="plugin-hover-card hovercard-detail">
                                <span>Long Shot</span>
                            </div>
                          </div>`;
    firstRow.appendChild(thLS);
    
    var thMD = document.createElement('th');
    thMD.className = pluginNodeClass
    thMD.innerHTML = 
                        `<div class="plugin-has-hover-card">MD
                            <div class="plugin-hover-card hovercard-detail">
                                <span>Midfield Dominance</span>
                            </div>
                          </div>`;
    firstRow.appendChild(thMD);
    
    var thAMD = document.createElement('th');
    thAMD.className = pluginNodeClass
    thAMD.innerHTML = 
                        `<div class="plugin-has-hover-card">AMD
                            <div class="plugin-hover-card hovercard-detail">
                                <span>Advanced Midfield Dominance</span>
                            </div>
                          </div>`;
    firstRow.appendChild(thAMD);
    
    // var thAMDFlex = document.createElement('th');
    // thAMDFlex.className = pluginNodeClass
    // thAMDFlex.innerHTML = `<div class="plugin-has-hover-card">AMDF
    //                         <div class="plugin-hover-card hovercard-detail">
    //                         <span>Advanced Midfield Dominance Flexible</span>
    //                         </div>
    //                       </div>`;
    // firstRow.appendChild(thAMDFlex);
}

// Calculates and adds the cells with the midfield contribution values for each player
function appendMidfieldContributionForPlayers() {
    console.info(`${new Date().toLocaleString()} ${playersModulePrefix}: appending the midfield contribution...`)
    let rows = document.querySelectorAll("table > tr");
    let longShotMax = (100 + Math.min(2*100, 100)) / 2
    let midfieldDominanceMax = 100 + 200
    let advancedMidfieldDominanceMax = (100 + 200) * 0.5
    let advancedMidfieldDominanceFlexibleMax = 100 + 200
    let constitutionTreshold = 50
    for (let i = 1; i < rows.length; i++) {
        let valueNodes = rows[i].querySelectorAll("fw-player-skill > span > span:first-child");
        
        // Because we are listening to the changes on the insides of the table, it is possible that some updates come in-between when the cells are not yet populated, so for this cases we don't need to do anything
        if (valueNodes.length < 8) {
            return
        }
        
        let SC = Number(valueNodes[0].innerHTML.replace(/\D/g,''));
        let OP = Number(valueNodes[1].innerHTML.replace(/\D/g,''));
        let BC = Number(valueNodes[2].innerHTML.replace(/\D/g,''));
        let PA = Number(valueNodes[3].innerHTML.replace(/\D/g,''));
        let CO = Number(valueNodes[5].innerHTML.replace(/\D/g,''));
        let TA = Number(valueNodes[6].innerHTML.replace(/\D/g,''));
        let DP = Number(valueNodes[7].innerHTML.replace(/\D/g,''));
        
//        console.info(`${new Date().toLocaleString()} ${playersModulePrefix}: SC=${SC} OP=${OP} BC=${BC} PA=${PA} TA=${TA} DP=${DP}`)
        
        let longShot = (SC + Math.min(2 * SC, PA)) / 2
        let longShotDenomination = longShot / longShotMax
        let longShotDenominationNormalized = denomination(longShotDenomination * 100)
        
        let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)
        let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
        let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)
        
        let advancedMidfieldDominanceContribution = midfieldDominanceContribution  * 0.5
        let advancedMidfieldDominanceDenomination = advancedMidfieldDominanceContribution / advancedMidfieldDominanceMax
        let advancedMidfieldDominanceDenominationNormalized = denomination(advancedMidfieldDominanceDenomination * 100)
        
        // let advancedMidfieldDominanceInFlexibleContribution = PA + Math.min(OP + BC, TA + DP) 
        // let advancedMidfieldDominanceInFlexibleDenomination = advancedMidfieldDominanceInFlexibleContribution / advancedMidfieldDominanceFlexibleMax
        // let advancedMidfieldDominanceInFlexibleDenominationNormalized = denomination(advancedMidfieldDominanceInFlexibleDenomination * 100)
        
        //console.info("denomination for row ", i, " = ", midfieldDominanceDenomination, " normalized: ", midfieldDominanceDenominationNormalized, " advanced: ", advancedMidfieldDominanceDenomination, " normalized: ", advancedMidfieldDominanceDenominationNormalized, " advanced in flexible: ", advancedMidfieldDominanceInFlexibleDenomination, " normalized: ", advancedMidfieldDominanceInFlexibleDenominationNormalized);
        
        var tdLS = document.createElement("td");
        tdLS.className = pluginNodeClass
        tdLS.innerHTML = 
                        `<div class="plugin-has-hover-card denom${longShotDenominationNormalized}">${Math.trunc(longShot)}
                            <div class="plugin-hover-card hovercard-detail">
                                <span>formula: (SC + min(2 * SC, PA)) / 2</span>
                                <span>(${SC} + min(2 * ${SC}, ${PA})) / 2</span>
                                <span>(${SC} + ${Math.min(2 * SC, PA)}) / 2</span>
                                <span>${SC + Math.min(2 * SC, PA)} / 2 = ${(SC + Math.min(2 * SC, PA)) / 2}</span>
                            </div>
                          </div>`
        rows[i].appendChild(tdLS);
        
        var tdMD = document.createElement("td");
        tdMD.className = pluginNodeClass
        tdMD.innerHTML =  
                                            `<div class="plugin-has-hover-card denom${midfieldDominanceDenominationNormalized}">${midfieldDominanceContribution}
                                                <div class="plugin-hover-card hovercard-detail">
                                                    <span>formula: PA + min(OP + BC, TA + DP) + max(0, CO - ${constitutionTreshold})</span>
                                                    <span>${PA} + min(${OP} + ${BC}, ${TA} + ${DP}) + max(0, ${CO - constitutionTreshold})</span>
                                                    <span>${PA} + min(${OP + BC}, ${TA + DP}) + ${Math.max(0, CO - constitutionTreshold)}</span>
                                                    <span>${PA} + ${Math.min(OP + BC, TA + DP)} + ${Math.max(0, CO - constitutionTreshold)} = ${PA + Math.min(OP + BC, TA + DP) + Math.max(0, CO - constitutionTreshold)}</span>
                                                </div>
                                            </div>`
        rows[i].appendChild(tdMD);
        
        var tdAMD = document.createElement("td");
        tdAMD.className = pluginNodeClass
        let arrowOff = advancedMidfieldDominanceContribution > midfieldDominanceContribution ? "⇑" : ""
        tdAMD.innerHTML = 
                                            `<div class="plugin-has-hover-card denom${advancedMidfieldDominanceDenominationNormalized}">${Math.trunc(advancedMidfieldDominanceContribution)}
                                                <div class="plugin-hover-card hovercard-detail">
                                                    <span>formula: MD * 0.5</span>
                                                    <span>${midfieldDominanceContribution} * 0.5</span>
                                                </div>
                                            </div>`
         '<span class="denom' + advancedMidfieldDominanceDenominationNormalized + '">' + Math.trunc(advancedMidfieldDominanceContribution) + arrowOff + '</span>';
        rows[i].appendChild(tdAMD);
        
        // var tdAMDF = document.createElement("td");
        // tdAMDF.className = pluginNodeClass
        // let arrowOffflex = advancedMidfieldDominanceInFlexibleContribution > midfieldDominanceContribution ? "⇑" : ""
        // tdAMDF.innerHTML = '<span class="denom' + advancedMidfieldDominanceInFlexibleDenominationNormalized + '">' + Math.trunc(advancedMidfieldDominanceInFlexibleContribution) + arrowOffflex + '</span>';
        // rows[i].appendChild(tdAMDF);
    }
}

function cleanUpNodeForPlayers(tableNode) {
    console.info(`${new Date().toLocaleString()} ${playersModulePrefix}: removing the old cells...`)
    tableNode.querySelectorAll(`td.${pluginNodeClass}`).forEach(el => el.remove());
    tableNode.querySelectorAll(`th.${pluginNodeClass}`).forEach(el => el.remove());
}

function isShowingGoalkeepers() {
    let goalkeeperFilter = document.querySelector("div.lineup-filter > span.goalkeeper > span")
    return (goalkeeperFilter != "undefined" && goalkeeperFilter.innerHTML != "-")
}

// Options for the observer (which mutations to observe)
const playersObservingConfig = { attributes: false, childList: true, subtree: true, characterData: false };

// Callback function to execute when mutations are observed
const playersObservingCallback = (mutationList, observer) => {
    let tableNode = document.querySelector("table.table")
    if (tableNode != undefined && tableNode.rows.length > 1) {
        observer.disconnect() // otherwise we end up in a loop
        
        console.debug(`${new Date().toLocaleString()} ${playersModulePrefix}: Found the following table: `, tableNode)
        console.debug(`${new Date().toLocaleString()} ${playersModulePrefix}: tableNode.rows.length: ${tableNode.rows.length}`)
//        mutationList.forEach(el => console.info(`mutationType: ${el.type}, mutationTarget: ${el.target}, oldValue: ${el.oldValue}, newValue: ${el.data}`))
        
        
        cleanUpNodeForPlayers(tableNode)
        
        if (!isShowingGoalkeepers()) {
            createHeaders()
            appendMidfieldContributionForPlayers()
        } else {
        }
        observer.observe(alwaysPresentNode, playersObservingConfig);
    } else {
        console.debug(`${new Date().toLocaleString()} ${playersModulePrefix}: Could not find the table, or the table is empty, observing...`)
    }
};

// Create an observer instance linked to the callback function
const playersObserver = new MutationObserver(playersObservingCallback);

browser.runtime.onMessage.addListener((request) => {
    console.log(`${new Date().toLocaleString()} ${playersModulePrefix} Message from the background script:`);
    console.log(request.url);
    if (request.url.endsWith("players")) {
        // Start observing the target node for configured mutations
        playersObserver.observe(alwaysPresentNode, playersObservingConfig);
        console.debug(`${new Date().toLocaleString()} ${playersModulePrefix} Started the div.wrapper observation`)
    } else {
        playersObserver.disconnect()
        console.debug(`${new Date().toLocaleString()} ${playersModulePrefix} Skipped (or disconnected) the div.wrapper observation`)
    }
})

addCSS(`
    .plugin-has-hover-card {
        position: relative;
    }
    .plugin-has-hover-card .plugin-hover-card.hovercard-detail {
        display: flex;
        opacity: 0;
        visibility: hidden;
        width: auto;
        height: auto;
        margin: auto;
        padding: 8px;
        flex-direction: column;

        position: absolute;
        left:0;
        transform:translateX(-104%);
        top: -9px;
    }
    .plugin-has-hover-card:hover .plugin-hover-card.hovercard-detail {
        display: flex;
        opacity: 1;
        visibility: visible;
        width: auto;
        height: auto;
        margin: auto;
        padding: 8px;
        flex-direction: column;

        position: absolute;
        left:0;
        transform:translateX(-104%);
        top: -9px;
    }

    .plugin-hover-card.hovercard-detail span {
        white-space: nowrap;
    }
`)
