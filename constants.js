// The class for the new nodes inserted by the plugin, so that they can be easily found and managed later
const pluginNodeClass = "FinalWhistlePlugin"

// The node that will be observed for mutations
const alwaysPresentNode = document.querySelector("div.wrapper");

const constantsModulePrefix = "constants"

const addCSS = css => document.head.appendChild(document.createElement("style")).innerHTML=css

console.log(`${new Date().toLocaleString()} ${constantsModulePrefix}: constants.js script loaded...`)
