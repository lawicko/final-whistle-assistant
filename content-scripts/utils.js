// The class for the new nodes inserted by the plugin, so that they can be easily found and managed later
export const pluginNodeClass = "FinalWhistlePlugin"

if (typeof browser == "undefined") {
    // Chrome does not support the browser namespace yet.
    globalThis.browser = chrome;
}

// Use sync or local
export const storage = browser.storage.local;
export const optionsStorage = browser.storage.sync;

export const version = browser.runtime.getManifest().version;

export function isString(value) {
    return typeof value === "string" || value instanceof String
}

/**
 * Recreates the denomination used on the website, used for coloring the numbers
 * @param {number} value The value to get the denomination for (1-99)
 * @returns {number} The denomination (1-9)
 */
export function denomination(value) {
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

export function toCamelCase(str) {
    return str
        .toLowerCase()
        .trim()
        .split(/\s+/) // split by one or more spaces
        .map((word, i) =>
            i === 0 ? word : word[0].toUpperCase() + word.slice(1)
        )
        .join('');
}

export function classFromTalent(talent, advancedDevelopmentFromScout) {
    switch (talent) {
        case 2:
        case 3:
        case 4:
            if (normalizeAdvancedDevelopment(talent, advancedDevelopmentFromScout) === 18) {
                return "good"
            } else {
                return "bad"
            }
        case 5:
        case 6:
            if (normalizeAdvancedDevelopment(talent, advancedDevelopmentFromScout) === 19) {
                return "good"
            } else {
                return "bad"
            }
        case 7:
        case 8:
        case 9:
            switch (normalizeAdvancedDevelopment(talent, advancedDevelopmentFromScout)) {
                case 19:
                    return "very_good"
                case 20:
                    return "good"
                case 21:
                    return "bad"
                case 22:
                    return "very_bad"
            }
    }
}

export function normalizeAdvancedDevelopment(talent, advancedDevelopmentFromScout) {
    switch (talent) {
        case 2:
        case 3:
        case 4:
            if ([18, 19].includes(advancedDevelopmentFromScout)) {
                return advancedDevelopmentFromScout
            } else {
                if (advancedDevelopmentFromScout < 18) return 18
                if (advancedDevelopmentFromScout > 19) return 19
            }
        case 5:
        case 6:
            if ([19, 20].includes(advancedDevelopmentFromScout)) {
                return advancedDevelopmentFromScout
            } else {
                if (advancedDevelopmentFromScout < 19) return 19
                if (advancedDevelopmentFromScout > 20) return 20
            }
        case 7:
        case 8:
        case 9:
            if ([19, 20, 21, 22].includes(advancedDevelopmentFromScout)) {
                return advancedDevelopmentFromScout
            } else {
                if (advancedDevelopmentFromScout < 19) return 19
                if (advancedDevelopmentFromScout > 22) return 22
            }
        default:
            throw new Error(`Invalid input for normalizeAdvancedDevelopment: talent: ${talent}, advancedDevelopmentFromScout: ${advancedDevelopmentFromScout}`)
    }
}

export async function getStoredString(key, defaultValue = undefined) {
    const result = await storage.get(key);
    const value = result[key];

    // Return the value if it's a string, otherwise fallback
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return defaultValue;
}

export function lastPathComponent(path, removeExtension = false) {
    const parts = path.split("/").filter(Boolean);
    let last = parts.pop() || "";

    if (removeExtension && last.includes(".")) {
        last = last.split(".")[0];
    }
    return last;
}

export function dateStorageFormat(date) {
    if (!(date instanceof Date)) {
        throw new Error(`dateStorageFormat called with non-Date argument ${typeof date}: ${date}`);
    }
    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

/**
 * Checks whether a JavaScript object is empty.
 *
 * An object is considered empty if it has no own enumerable properties.
 * 
 * @param {Object} obj - The object to check.
 * @returns {boolean} - Returns true if the object is empty, false otherwise.
 *
 * @example
 * isEmpty({});            // true
 * isEmpty({ a: 1 });      // false
 * isEmpty(Object.create(null)); // true (no inherited keys, no own keys)
 */
export function isEmpty(obj, ignoreList = []) {
    // console.info("👉 checking for emptiness:", obj, "type:", (typeof obj))
    if (obj === null) throw new Error(`Null passed to isEmpty()`)
    if (obj === undefined) throw new Error(`Undefined passed to isEmpty()`)
    if (!Array.isArray(ignoreList)) {
        throw new Error(`ignoreList must be an array, got ${typeof ignoreList} ${ignoreList}, obj: ${JSON.stringify(obj)}`);
    }
    const objectType = typeof obj
    if (ignoreList.includes(objectType)) return false
    if (!(objectType === 'object') && !ignoreList.includes(objectType)) {
        throw new Error(`Object of type ${typeof obj} passed to isEmpty(): ${JSON.stringify(obj)}`);
    }
    return Object.keys(obj).length === 0
}

export function hasEmptyRecursive(obj, ignoreList = []) {
    const type = typeof obj;

    // Stop recursion for primitives or ignored types
    if (obj === null || obj === undefined) return true; // treat as empty
    if (type !== "object" || ignoreList.includes(type)) return false;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.some(v => hasEmptyRecursive(v, ignoreList));
    }

    // Handle objects
    if (Object.keys(obj).length === 0) {
        return true; // empty object found
    }

    return Object.values(obj).some(v => hasEmptyRecursive(v, ignoreList));
}


export function removeEmptyProps(obj, ignoreList = ["string", "number"]) {
    if (obj === null || obj === undefined) return obj; // preserve null/undefined

    if (Array.isArray(obj)) {
        // Clean array elements recursively
        return obj
            .map(item => removeEmptyProps(item, ignoreList))
            .filter(item => !isEmpty(item, ignoreList));
    }

    if (typeof obj === "object") {
        // Clean object properties recursively
        const cleaned = Object.fromEntries(
            Object.entries(obj)
                .map(([key, value]) => [key, removeEmptyProps(value, ignoreList)])
                .filter(([_, value]) => !isEmpty(value, ignoreList))
        );
        return cleaned;
    }

    // Primitive values (string, number, boolean, etc.)
    return obj;
}

export function diffObjects(obj1, obj2) {
    const diff = { added: {}, removed: {}, changed: {} };

    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of keys) {
        const val1 = obj1[key];
        const val2 = obj2[key];

        // Key removed
        if (!(key in obj2)) {
            diff.removed[key] = val1;
            continue;
        }

        // Key added
        if (!(key in obj1)) {
            diff.added[key] = val2;
            continue;
        }

        // Key exists in both
        if (
            typeof val1 === "object" &&
            typeof val2 === "object" &&
            val1 !== null &&
            val2 !== null
        ) {
            const nestedDiff = diffObjects(val1, val2);

            // only record non-empty nested diffs
            if (
                Object.keys(nestedDiff.added).length ||
                Object.keys(nestedDiff.removed).length ||
                Object.keys(nestedDiff.changed).length
            ) {
                diff.changed[key] = nestedDiff;
            }
        } else if (val1 !== val2) {
            diff.changed[key] = { before: val1, after: val2 };
        }
    }

    return diff;
}

/**
 * Merges two objects into one.
 * 
 * @param {Object} obj1 - The first object
 * @param {Object} obj2 - The second object
 * @param {boolean} [preferSecond=true] - If true, keys in obj2 override obj1
 * @returns {Object} The merged object
 */
export function mergeObjects(obj1, obj2, preferSecond = true) {
    if (preferSecond) {
        return { ...obj1, ...obj2 }; // obj2 takes precedence
    } else {
        return { ...obj2, ...obj1 }; // obj1 takes precedence
    }
}

/**
 * Sums minutes from the minutes-played dictionary
 * @param {Object} minutesPlayed in this format { "15 Aug 2025, 18:00": "90" }
 * @returns {Number} Sum of total minutes
 */
export function sumMinutes(minutesPlayed) {
    const sum = Object.values(minutesPlayed)
        .map(Number)              // convert strings like "54" → number 54
        .reduce((a, b) => a + b, 0);
    return sum
}

/**
 * Inject CSS into the page safely without duplicates
 * @param {string} css - The CSS string to inject
 * @param {string} id - Optional unique ID for this style block
 */
export const addCSS = (css, id = "custom-style") => {
    // If style with same ID already exists, skip
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
};

/**
 * Debounce an async function, ensuring it runs only once after the specified delay
 * since the last call.
 * @param {Function} fn - The async function to debounce
 * @param {number} delay - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
export function debounceAsync(fn, delay = 100) {
    let timeout;

    return async (...args) => {
        clearTimeout(timeout);

        timeout = setTimeout(async () => {
            try {
                await fn(...args);
            } catch (e) {
                console.error("Debounced async error:", e);
            }
        }, delay);
    };
}

export function formatError(e, { includeStack = false } = {}) {
    if (e instanceof Error) {
        return includeStack ? `${e.message}\n${e.stack}` : e.message;
    }
    if (typeof e === "string") {
        return e;
    }
    try {
        return JSON.stringify(e);
    } catch {
        return String(e);
    }
}

export function diffInDaysUTC(date1, date2) {
    const d1 = Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate())
    const d2 = Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate())
    return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24))
}

/**
 * Calculates the start date of a future football season.
 * 
 * @param {Date} currentDate - The current date/time.
 * @param {number} currentWeek - The current week of the season (1–12).
 * @param {number} seasonsAhead - How many seasons ahead to calculate (1 = next season).
 * @returns {Date} - The start date of the target season (Monday 00:00).
 * @throws {Error} - If inputs are invalid or calculation fails.
 */
export function getSeasonStartDates(currentDate, currentWeek, seasonsAhead = 1) {
    try {
        // --- Input validation ---
        if (!(currentDate instanceof Date) || isNaN(currentDate)) {
            throw new Error("Invalid currentDate: must be a valid Date object.")
        }
        if (!Number.isInteger(currentWeek) || currentWeek < 1 || currentWeek > 12) {
            throw new Error("Invalid currentWeek: must be an integer between 1 and 12.")
        }
        if (!Number.isInteger(seasonsAhead) || seasonsAhead < 1) {
            throw new Error("Invalid seasonsAhead: must be an integer >= 1.")
        }

        const results = []
        const weeksRemaining = 12 - currentWeek

        for (let k = 1; k <= seasonsAhead; k++) {
            // Total weeks to add for the k-th season ahead (same formula as original)
            const totalWeeksToAdd = weeksRemaining + (k - 1) * 12

            // Start from the original date each time to avoid cumulative snapping drift
            const date = new Date(currentDate.getTime())
            date.setUTCDate(date.getUTCDate() + totalWeeksToAdd * 7)

            // Snap to the NEXT Monday 00:00 UTC
            const day = date.getUTCDay() // Sunday=0, Monday=1, ...
            let daysUntilMonday = (1 - day + 7) % 7
            if (daysUntilMonday === 0) daysUntilMonday = 7

            date.setUTCDate(date.getUTCDate() + daysUntilMonday)
            date.setUTCHours(0, 0, 0, 0)

            results.push(date)
        }

        return results
    } catch (err) {
        throw new Error(`getSeasonStartDates failed: ${err.message}`)
    }
}