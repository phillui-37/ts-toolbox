import { defineConfig } from "vite";
import path from 'path';

export default defineConfig({
    root: path.resolve(__dirname),
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
        extensions: ['.ts', '.js', '.json']
    },
    build: {
        lib: {
            entry: path.resolve(__dirname, 'src/index.ts'),
            name: 'ts-toolbox', // Global variable name for UMD build
            fileName: (format) => `ts-toolbox.${format}.js`,
        },
        rollupOptions: {
            // Externalize peer dependencies if any
            external: [],
            output: {
                globals: {}, // Define globals for externalized dependencies in UMD
            },
        },
    },
    test: {
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/index.ts'],
        },
    },
});