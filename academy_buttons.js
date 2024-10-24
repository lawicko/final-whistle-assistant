(function() {
    
    const academyButtonsModulePrefix = "academy_buttons"
    
    console.log(`${academyButtonsModulePrefix}: academy_buttons.js script loaded...`)
    
    // Select the node that will be observed for mutations
    const targetNode = document.querySelector("table > button.btn-danger");
    
    const addCSS = css => document.head.appendChild(document.createElement("style")).innerHTML=css;
    addCSS("div > button.btn-danger { margin-left: 50px !important; }")
})();
