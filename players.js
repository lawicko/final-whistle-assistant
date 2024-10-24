(function() {
    const playersModulePrefix = "players"
    
    console.log(`${playersModulePrefix}: players.js script loaded...`)
    
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
        thLS.innerHTML = "LS";
        firstRow.appendChild(thLS);
        
        var thMD = document.createElement('th');
        thMD.innerHTML = "MD";
        firstRow.appendChild(thMD);
        
        var thOMD = document.createElement('th');
        thOMD.innerHTML = "OMD";
        firstRow.appendChild(thOMD);
        
        var thOMDFlex = document.createElement('th');
        thOMDFlex.innerHTML = "OMDF";
        firstRow.appendChild(thOMDFlex);
    }
    
    // Calculates and adds the cells with the midfield contribution values for each player
    function appendMidfieldContribution() {
        console.info(`${playersModulePrefix}: appending the midfield contribution...`)
        let rows = document.querySelectorAll("table > tr");
        let longShotMax = (100 + Math.min(2*100, 100)) / 2
        let midfieldDominanceMax = 100 + 200
        let offensiveMidfieldDominanceMax = (100 + 200 + 200) * 0.5
        let offensiveMidfieldDominanceFlexibleMax = (100 + 200 + 200) * 0.8
        for (let i = 1; i < rows.length; i++) {
            let valueNodes = rows[i].querySelectorAll("fw-player-skill > span");
            
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
            tdLS.innerHTML = '<span class="denom' + longShotDenominationNormalized + '">' + Math.trunc(longShot) + '</span>';
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
    
    // Select the node that will be observed for mutations
    const targetNode = document.querySelector("div.wrapper");
    
    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };
    
    // Callback function to execute when mutations are observed
    const callback = (mutationList, observer) => {
        let tableNode = document.querySelector("table.table")
        if (tableNode != undefined && tableNode.rows.length > 1) {
            observer.disconnect()
            
            console.debug(`${playersModulePrefix}: Found the following table: ${tableNode}`)
            console.debug(`${playersModulePrefix}: tableNode.rows.length: tableNode.rows.length`)
            
            tableNode.querySelectorAll(`td.${pluginNodeClass}`).forEach(el => el.remove());
            createHeaders()
            appendMidfieldContribution()
            
            const c = (mutationList, observer) => {
                console.debug(`${playersModulePrefix}: table has changed`)
                observer.disconnect()
                
                console.info(`${playersModulePrefix}: removing the old cells...`)
                tableNode.querySelectorAll(`td.${pluginNodeClass}`).forEach(el => el.remove());
                
                appendMidfieldContribution()
                observer.observe(tableNode, { childList: true, subtree: true, characterData: true })
            }
            const o = new MutationObserver(c)
            console.debug(`${playersModulePrefix}: starting the table observation...`)
            o.observe(tableNode, { childList: true, subtree: true, characterData: true })
        } else {
            console.debug(`${playersModulePrefix}: Could not find the table, or the table is empty, observing...`)
        }
    };
    
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
})();
