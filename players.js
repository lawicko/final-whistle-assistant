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
    thLS.innerHTML = "LS";
    firstRow.appendChild(thLS);
    
    var thMD = document.createElement('th');
    thMD.className = pluginNodeClass
    thMD.innerHTML = "MD";
    firstRow.appendChild(thMD);
    
    var thOMD = document.createElement('th');
    thOMD.className = pluginNodeClass
    thOMD.innerHTML = "OMD";
    firstRow.appendChild(thOMD);
    
    var thOMDFlex = document.createElement('th');
    thOMDFlex.className = pluginNodeClass
    thOMDFlex.innerHTML = "OMDF";
    firstRow.appendChild(thOMDFlex);
}

// Calculates and adds the cells with the midfield contribution values for each player
function appendMidfieldContribution() {
    console.info(`${new Date().toLocaleString()} ${playersModulePrefix}: appending the midfield contribution...`)
    let rows = document.querySelectorAll("table > tr");
    let longShotMax = (100 + Math.min(2*100, 100)) / 2
    let midfieldDominanceMax = 100 + 200
    let offensiveMidfieldDominanceMax = (100 + 200 + 200) * 0.5
    let offensiveMidfieldDominanceFlexibleMax = (100 + 200 + 200) * 0.8
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
        let TA = Number(valueNodes[6].innerHTML.replace(/\D/g,''));
        let DP = Number(valueNodes[7].innerHTML.replace(/\D/g,''));
        
//        console.info(`${new Date().toLocaleString()} ${playersModulePrefix}: SC=${SC} OP=${OP} BC=${BC} PA=${PA} TA=${TA} DP=${DP}`)
        
        let longShot = (SC + Math.min(2 * SC, PA)) / 2
        let longShotDenomination = longShot / longShotMax
        let longShotDenominationNormalized = denomination(longShotDenomination * 100)
        
        let midfieldDominanceContribution = PA + Math.min(OP + BC, TA + DP)
        let midfieldDominanceDenomination = midfieldDominanceContribution / midfieldDominanceMax
        let midfieldDominanceDenominationNormalized = denomination(midfieldDominanceDenomination * 100)
        
        let offensiveMidfieldDominanceContribution = (PA + Math.min(OP + BC, TA + DP) + OP + BC) * 0.5
        let offensiveMidfieldDominanceDenomination = offensiveMidfieldDominanceContribution / offensiveMidfieldDominanceMax
        let offensiveMidfieldDominanceDenominationNormalized = denomination(offensiveMidfieldDominanceDenomination * 100)
        
        let offensiveMidfieldDominanceInFlexibleContribution = (PA + Math.min(OP + BC, TA + DP) + OP + BC) * 0.8
        let offensiveMidfieldDominanceInFlexibleDenomination = offensiveMidfieldDominanceInFlexibleContribution / offensiveMidfieldDominanceFlexibleMax
        let offensiveMidfieldDominanceInFlexibleDenominationNormalized = denomination(offensiveMidfieldDominanceInFlexibleDenomination * 100)
        
        //console.info("denomination for row ", i, " = ", midfieldDominanceDenomination, " normalized: ", midfieldDominanceDenominationNormalized, " offensive: ", offensiveMidfieldDominanceDenomination, " normalized: ", offensiveMidfieldDominanceDenominationNormalized, " offensive in flexible: ", offensiveMidfieldDominanceInFlexibleDenomination, " normalized: ", offensiveMidfieldDominanceInFlexibleDenominationNormalized);
        
        var tdLS = document.createElement("td");
        tdLS.className = pluginNodeClass
        tdLS.innerHTML = `<div class="plugin-has-hover-card denom${longShotDenominationNormalized}">${Math.trunc(longShot)}
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
        tdMD.innerHTML = '<span class="denom' + midfieldDominanceDenominationNormalized + '">' + midfieldDominanceContribution + '</span>';
        rows[i].appendChild(tdMD);
        
        var tdOMD = document.createElement("td");
        tdOMD.className = pluginNodeClass
        let arrowOff = offensiveMidfieldDominanceContribution > midfieldDominanceContribution ? "⇑" : ""
        tdOMD.innerHTML = '<span class="denom' + offensiveMidfieldDominanceDenominationNormalized + '">' + Math.trunc(offensiveMidfieldDominanceContribution) + arrowOff + '</span>';
        rows[i].appendChild(tdOMD);
        
        var tdOMDF = document.createElement("td");
        tdOMDF.className = pluginNodeClass
        let arrowOffflex = offensiveMidfieldDominanceInFlexibleContribution > midfieldDominanceContribution ? "⇑" : ""
        tdOMDF.innerHTML = '<span class="denom' + offensiveMidfieldDominanceInFlexibleDenominationNormalized + '">' + Math.trunc(offensiveMidfieldDominanceInFlexibleContribution) + arrowOffflex + '</span>';
        rows[i].appendChild(tdOMDF);
    }
}

function cleanUpNode(tableNode) {
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
        
        
        cleanUpNode(tableNode)
        
        if (!isShowingGoalkeepers()) {
            createHeaders()
            appendMidfieldContribution()
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
