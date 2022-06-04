/* eslint-disable import/no-extraneous-dependencies */

const path = require('path');

module.exports = {
    entry: {
        main: './src/index.ts',
    },
    target: 'node',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'pomment.min.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: 'ts-loader' },
        ],
    },

    plugins: [
    ],
    node: {
        global: false,
        __filename: false,
        __dirname: false,
    },
};
