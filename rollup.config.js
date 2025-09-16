import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
    // Background script (ESM)
    {
        input: "background/background.js",
        output: {
            file: "dist/background-scripts.bundle.js",
            format: "esm",       // ES module for MV3 service_worker
            sourcemap: true
        },
        plugins: [resolve(), commonjs()]
    },

    // Content script (IIFE)
    {
        input: "content-scripts/main.js",
        output: {
            file: "dist/content-scripts.bundle.js",
            format: "iife",      // classic script
            name: "ContentScriptBundle", // required for IIFE
            sourcemap: true
        },
        plugins: [resolve(), commonjs()]
    }
];
