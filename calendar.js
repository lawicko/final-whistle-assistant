 (function() {
     
     const calendarModulePrefix = "calendar"
     
     console.log(`${calendarModulePrefix}: calendar.js script loaded...`)
     
     // Select the node that will be observed for mutations
     const targetNode = document.querySelector("div.wrapper");
     
     // Options for the observer (which mutations to observe)
     const config = { attributes: false, childList: true, subtree: true };
     
     // Callback function to execute when mutations are observed
     const callback = (mutationList, observer) => {
         let tableNode = document.querySelector("table.table")
         if (tableNode != undefined && tableNode.rows.length > 1) {
             observer.disconnect()
             
             console.debug(`${calendarModulePrefix}: Found the following table: `,tableNode)
             
             let targetNodesYouth = document.querySelectorAll("span.badge-youth");
             targetNodesYouth.forEach((element) => element.innerHTML = "Y");
             
             let targetNodesSenior = document.querySelectorAll("span.badge-senior");
             targetNodesSenior.forEach((element) => element.innerHTML = "S");
         } else {
             console.debug(`${calendarModulePrefix}: Could not find the table, or the table is empty, observing...`)
         }
     };
     
     // Create an observer instance linked to the callback function
     const observer = new MutationObserver(callback);
     
     // Start observing the target node for configured mutations
     observer.observe(targetNode, config);
 })();
