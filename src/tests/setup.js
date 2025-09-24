// test/setup.js
import { vi } from 'vitest'

vi.stubGlobal("chrome", {
    runtime: {
        sendMessage: vi.fn(),
        onMessage: { addListener: vi.fn() }
    },
    tabs: {
        sendMessage: vi.fn()
    }
})

vi.stubGlobal("browser", {
    storage: {
        local: {
            get: vi.fn(async (keys) => {
                // optionally return a mock object
                return {};
            }),
            set: vi.fn(async (obj) => {
                // no-op
            }),
            remove: vi.fn(async (keys) => { }),
        }
    },
    runtime: {
        sendMessage: vi.fn(),
        onMessage: {
            addListener: vi.fn(),
        },
        getManifest: vi.fn( obj => { return {} } )
    },
    tabs: {
        sendMessage: vi.fn(),
    }
})
