import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'content-scripts/main.js',       // entry point
    output: {
        file: 'dist/content-scripts.bundle.js',
        format: 'iife',                     // safe for content scripts
        sourcemap: true
    },
    plugins: [
        resolve(),
        commonjs()
    ]
};
