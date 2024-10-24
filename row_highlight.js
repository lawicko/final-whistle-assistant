(function() {
    
    const pluginRowHighlightClass = "player-selected"
    const rowHighlightModulePrefix = "row_highlight"
    
    console.log(`${rowHighlightModulePrefix}: row_highlight.js script loaded...`)
    
    function toggleClass(el, className) {
        if (el.className.indexOf(className) >= 0) {
            el.className = el.className.replace(` ${className}`,"");
        } else {
            el.className  += ` ${className}`;
        }
    }
    
    function setOnClickForTableRows(tableNode) {
        for (let i = 1; i < tableNode.rows.length; i++) {
            tableNode.rows[i].onclick = function() { toggleClass(this, pluginRowHighlightClass) }
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
            
            console.debug(`${rowHighlightModulePrefix}: Found the following table: `,tableNode)
            
            setOnClickForTableRows(tableNode)
            
            const c = (mutationList, observer) => {
                console.debug(`${rowHighlightModulePrefix}: table has changed`)
                observer.disconnect()
                
                setOnClickForTableRows(tableNode)
                
                observer.observe(tableNode, { childList: true, subtree: true, characterData: true })
            }
            const o = new MutationObserver(c)
            console.debug(`${rowHighlightModulePrefix}: starting the table observation...`)
            o.observe(tableNode, { childList: true, subtree: true, characterData: true })
        } else {
            console.debug(`${rowHighlightModulePrefix}: Could not find the table, or the table is empty, observing...`)
        }
    };
    
    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback);
    
    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
    
})();
