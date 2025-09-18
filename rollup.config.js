import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import fs from 'fs';
import path from 'path';

const targets = ['chromium', 'firefox'];
const configs = targets.flatMap((target) => 
    createManifestForTarget(target)
)
const copyCommonFiles = targets.flatMap((target) => [
    { src: 'icons/*', dest: `dist/${target}/icons` },
    { src: 'options/*', dest: `dist/${target}/options` },
    { src: 'content-scripts/styles.css', dest: `dist/${target}` },
    { src: 'dist/background-scripts.bundle.js', dest: `dist/${target}`},
    { src: 'dist/background-scripts.bundle.js.map', dest: `dist/${target}`},
    { src: 'dist/content-scripts.bundle.js', dest: `dist/${target}`},
    { src: 'dist/content-scripts.bundle.js.map', dest: `dist/${target}`}
])

export default [
    // Background script (ESM)
    {
        input: "background/background.js",
        output: {
            file: "dist/background-scripts.bundle.js",
            format: "esm",       // ES module for MV3 service_worker
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs(),
            copy({
                targets: copyCommonFiles
            })
        ]
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
        plugins: [
            resolve(),
            commonjs(),
            copy({
                targets: copyCommonFiles
            })
        ]
    },

    ...configs
];

function createManifestForTarget(target) {
    const virtualEntryDescription = "virtual entry - no bundling, just manifest generation"
    return {
        input: virtualEntryDescription,
        output: {
            dir: 'dist',
            format: 'esm'
        },
        plugins: [
            watchManifest(),
            {
                name: 'emit-manifest',

                // Virtual module hooks
                resolveId(source) {
                    if (source === virtualEntryDescription) return source;
                    return null;
                },
                load(id) {
                    if (id === virtualEntryDescription) {
                        return 'export default {};'; // dummy module content
                    }
                    return null;
                },

                buildEnd() {
                    // console.log(`🔧 target: ${target}`);
                    const raw = fs.readFileSync('src/manifest.template.json', 'utf8');

                    let replacement
                    if (target === "firefox") {
                        replacement = `{
                            "scripts": ["../background-scripts.bundle.js"],
                            "type": "module"
                        }`
                    } else {
                        replacement = `{ "service_worker": "../background-scripts.bundle.js", "type": "module" }`
                    }

                    const replaced = raw.replace(/__BACKGROUND_CONTENT__/g, replacement);
                    // console.log(`🔧 replaced: ${replaced}`);
                    const template = JSON.parse(replaced);

                    fs.mkdirSync(`dist/${target}`, { recursive: true });
                    fs.writeFileSync(
                        path.join(`dist/${target}`, 'manifest.json'),
                        JSON.stringify(template, null, 2)
                    );
                }
            }
        ]
    }
}

function watchManifest() {
    return {
        name: 'watch-manifest',
        buildStart() {
            this.addWatchFile(path.resolve('src/manifest.template.json'));
        }
    };
}