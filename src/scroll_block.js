console.info("Running scroll blocking logic...")

// Function to "lock" a property
function protectScrollProperty(target, prop) {
    const originalValue = target[prop]

    Object.defineProperty(target, prop, {
        set: (val) => {
            console.debug(`Blocked attempt to set ${prop} to ${val} on`, target)
            // By NOT calling a setter here, the value never updates
        },
        get: () => {
            // Always return the current actual scroll position
            // You might need to store the "frozen" position in a variable
            console.debug(`Returning ${window.scrollY} instead`)
            return window.scrollY
        },
        configurable: true
    })
}

// Trap both common scroll targets
protectScrollProperty(document.documentElement, 'scrollTop')
protectScrollProperty(document.body, 'scrollTop')

window.scrollTo = function() {
    console.debug("Global scrollTo function blocked.")
}
// window.scroll = function() {
//     console.debug("Global scroll function blocked.")
// }
// window.scrollBy = function() {
//     console.debug("Global scrollBy function blocked.")
// }

document.addEventListener('click', (event) => {
    // const originalOverflow = blockScrollWithOverflow()
    const originalSIV = blockScrollWithScrollIntoView()

    console.debug("Scroll locked. Site script running now...")

    setTimeout(() => {
        // unblockScrollWithOverflow(originalOverflow)
        unblockScrollWithScrollIntoView(originalSIV)
        console.debug("Scroll unlocked.")
    }, 150); // 150ms is usually enough to swallow the site's scroll attempt
}, true)

// function blockScrollWithOverflow() {
//     const originalOverflow = document.documentElement.style.overflow
//     document.documentElement.style.overflow = 'hidden'
//     return originalOverflow
// }

// function unblockScrollWithOverflow(originalOverflow) {
//     document.documentElement.style.overflow = originalOverflow
// }

/**
 * Works on triggers page
 * @returns original scrollIntoView implementation that can be used when unblocking
 */
function blockScrollWithScrollIntoView() {
    const originalSIV = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = function () { }
    return originalSIV
}

function unblockScrollWithScrollIntoView(originalSIV) {
    Element.prototype.scrollIntoView = originalSIV
}