import { describe, it, expect } from "vitest"
import { isEmpty, getSeasonStartDates } from "../../content-scripts/utils.js"

function makeDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day));
}

// isEmpty
describe("isEmpty()", () => {
    it("returns true for empty object", () => {
        expect(isEmpty({})).toBe(true)
    })

    it("returns false for non-empty object", () => {
        expect(isEmpty({ a: 1 })).toBe(false)
    })
})

// getSeasonStartDate
describe("getSeasonStartDate", () => {
    it("throws for seasonsAhead < 1", () => {
        expect(() => getSeasonStartDates(new Date("2025-09-24"), 1, 0)).toThrow("Invalid seasonsAhead: must be an integer >= 1.")
    })

    it("should return the next season start date when in the middle of a season", () => {
        const currentDate = new Date(Date.UTC(2025, 0, 15)) // Jan 15, 2025 (Wednesday)
        const result = getSeasonStartDates(currentDate, 5, 1)[0] // week 5, 1 season ahead

        // Expect a Monday at 00:00 UTC
        expect(result.getUTCDay()).toBe(1)
        expect(result.getUTCHours()).toBe(0)
        expect(result.getUTCMinutes()).toBe(0)
    })

    it("should correctly handle jumping multiple seasons ahead", () => {
        const currentDate = new Date(Date.UTC(2025, 2, 1)) // Mar 1, 2025
        const result = getSeasonStartDates(currentDate, 10, 3)[0] // week 10, 3 seasons ahead

        expect(result.getUTCDay()).toBe(1)
        expect(result.getUTCHours()).toBe(0)
    })

    it("should move to the NEXT Monday if baseline date is already Monday", () => {
        const currentDate = new Date(Date.UTC(2025, 0, 6)) // Monday, Jan 6, 2025
        const result = getSeasonStartDates(currentDate, 2, 1)[0]

        // Ensure it's not the same Monday, but the following one
        expect(result.getUTCDate()).not.toBe(currentDate.getUTCDate())
        expect(result.getUTCDay()).toBe(1)
    })

    it("should throw on invalid currentDate", () => {
        expect(() => getSeasonStartDates("2025-01-01", 1, 1)).toThrow()
    })

    it("should throw on invalid currentWeek", () => {
        const currentDate = new Date()
        expect(() => getSeasonStartDates(currentDate, 0, 1)).toThrow()
        expect(() => getSeasonStartDates(currentDate, 13, 1)).toThrow()
    })

    it("should throw on invalid seasonsAhead", () => {
        const currentDate = new Date()
        expect(() => getSeasonStartDates(currentDate, 5, 0)).toThrow()
    })

    const season28Start = makeDate(2025, 11, 3)
    it("returns the date of season 28 start if we look 1 season ahead from week 7", () => {
        const currentDate = makeDate(2025, 9, 24)
        const result = getSeasonStartDates(currentDate, 7, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 start midnight", () => {
        const season27start = makeDate(2025, 8, 11)
        const result = getSeasonStartDates(season27start, 1, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 start at noon", () => {
        const season27StartNoon = new Date("2025-08-11T12:00:00.000Z")
        const result = getSeasonStartDates(season27StartNoon, 1, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 day 2 at noon", () => {
        const season27StartDay2Noon = new Date("2025-08-12T12:00:00.000Z")
        const result = getSeasonStartDates(season27StartDay2Noon, 1, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 day 7 at noon", () => {
        const season27StartDay7Noon = new Date("2025-08-17T12:00:00.000Z")
        const result = getSeasonStartDates(season27StartDay7Noon, 1, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 week 7 at midnight", () => {
        const season27week7 = new Date("2025-09-22T00:00:00.000Z")
        const result = getSeasonStartDates(season27week7, 7, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 week 7 at noon", () => {
        const season27week7Noon = new Date("2025-09-22T12:00:00.000Z")
        const result = getSeasonStartDates(season27week7Noon, 7, 1)[0]

        expect(result.toISOString()).toBe(season28Start.toISOString())
    })
    it("returns the date of season 28 start if we look 1 season ahead from season 27 week 7 at noon", () => {
        const season27week7Day2Noon = new Date("2025-09-23T12:00:00.000Z")
        const result = getSeasonStartDates(season27week7Day2Noon, 7, 1)[0]
        expect(result.toISOString()).toBe(season28Start.toISOString())
    })

    const season29start = makeDate(2026, 1, 26)
    it("returns the date of season 29 start if we look 2 seasons ahead from season 27 week 7", () => {
        const currentDate = makeDate(2025, 9, 24)
        const result = getSeasonStartDates(currentDate, 7, 2)[1]

        expect(result.toISOString()).toBe(season29start.toISOString())
    })
})