console.log("EXTERNAL ANALYZER TREVOR")

const observer = new MutationObserver((mutations, obs) => {
    const element = document.getElementById('trevorng_input-text');
    if (element) {
        console.log("Found it!", element);
        process(element)
        
        // Stop watching once found to save resources
        obs.disconnect();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

function process(element) {
    if (element) { pasteToElement(element); }
}

async function pasteToElement(element) {
  try {
    // 1. Request the text from the clipboard
    const text = await navigator.clipboard.readText();

    // 2. Insert the text based on the element type
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.value = text;
    } else {
      // For contenteditable divs
      element.innerText = text;
    }

    // 3. Optional: Manually trigger an 'input' event 
    // This tells the website (React/Vue) that the value changed
    element.dispatchEvent(new Event('input', { bubbles: true }));

    console.log("Clipboard content pasted successfully!");
  } catch (err) {
    console.error("Failed to read clipboard: ", err);
  }
}