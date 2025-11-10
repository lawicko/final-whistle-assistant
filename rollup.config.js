import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import fs from 'fs';
import path from 'path';

const targets = ['chromium', 'firefox', 'firefox_dev'];
const configs = targets.flatMap((target) =>
    createManifestForTarget(target)
)
const copyCommonFiles = targets.flatMap((target) => [
    { src: 'icons/*', dest: `dist/${target}/icons` },
    { src: 'content-scripts/styles.css', dest: `dist/${target}` },
    { src: 'src/analysis.html', dest: `dist/${target}` },
    { src: 'src/analysis.js', dest: `dist/${target}` },
    { src: 'dist/background-scripts.bundle.js', dest: `dist/${target}` },
    { src: 'dist/background-scripts.bundle.js.map', dest: `dist/${target}` },
    { src: 'dist/content-scripts.bundle.js', dest: `dist/${target}` },
    { src: 'dist/content-scripts.bundle.js.map', dest: `dist/${target}` }
])

const copyOptions = targets.flatMap((target) => [
    { src: 'dist/options.bundle.js', dest: `dist/${target}/options` },
    { src: 'dist/options.bundle.js.map', dest: `dist/${target}/options` },
    { src: 'options/options.html', dest: `dist/${target}/options` },
    { src: 'options/options.css', dest: `dist/${target}/options` }
])

export default [
    // Background script (ESM)
    {
        input: "background/background.js",
        output: {
            file: "dist/background-scripts.bundle.js",
            format: "esm", // ES module for MV3 service_worker
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs(),
            copy({
                targets: copyCommonFiles,
                hook: 'writeBundle'
            }),
            watchStylesheet()
        ]
    },

    // Content script (IIFE)
    {
        input: "content-scripts/main.js",
        output: {
            file: "dist/content-scripts.bundle.js",
            format: "iife", // classic script
            name: "ContentScriptBundle", // required for IIFE
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs(),
            copy({
                targets: copyCommonFiles,
                hook: 'writeBundle'
            }),
            watchStylesheet(),
            watchAnalyser()
        ]
    },

    // options
    {
        input: 'options/options.js',
        output: {
            file: 'dist/options.bundle.js',
            format: 'iife',
            sourcemap: true
        },
        plugins: [
            resolve(),
            commonjs(),
            watchOptions(),
            copy({
                targets: copyOptions,
                hook: 'writeBundle'
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
                    if (target.includes("firefox")) {
                        replacement = `{
                            "scripts": ["../background-scripts.bundle.js"],
                            "type": "module"
                        }`
                    } else {
                        replacement = `{ "service_worker": "../background-scripts.bundle.js", "type": "module" }`
                    }

                    const replaced = raw.replace(/__BACKGROUND_CONTENT__/g, replacement);
                    // console.log(`🔧 replaced: ${replaced}`);
                    const manifest = JSON.parse(replaced);
                    if (target === 'firefox_dev') {
                        manifest.name += " (DEV)"
                        manifest.browser_specific_settings = {
                            gecko: {
                                id: 'lawicko@gmail.com'
                            }
                        };
                    }
                    if (target === 'firefox') {
                        manifest.browser_specific_settings = {
                            gecko: {
                                id: '{ced6d24e-3379-4594-be2f-af52229c80f2}'
                            }
                        };
                    }

                    fs.mkdirSync(`dist/${target}`, { recursive: true });
                    fs.writeFileSync(
                        path.join(`dist/${target}`, 'manifest.json'),
                        JSON.stringify(manifest, null, 2)
                    );
                }
            }
        ]
    }
}

function watchAnalyser() {
    return {
        name: 'watch-analyser',
        buildStart() {
            this.addWatchFile(path.resolve('src/analysis.html'));
            this.addWatchFile(path.resolve('src/analysis.js'));
        }
    };
}

function watchManifest() {
    return {
        name: 'watch-manifest',
        buildStart() {
            this.addWatchFile(path.resolve('src/manifest.template.json'));
        }
    };
}

function watchStylesheet() {
    return {
        name: 'watch-stylesheet',
        buildStart() {
            this.addWatchFile(path.resolve('content-scripts/styles.css'));
        }
    };
}

function watchOptions() {
    return {
        name: 'watch-options',
        buildStart() {
            this.addWatchFile(path.resolve('options/options.css'));
            this.addWatchFile(path.resolve('options/options.html'));
        }
    };
}