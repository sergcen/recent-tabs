const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const isDevelopment = true;

const distPath = path.resolve(__dirname, 'dist');

module.exports = {
    mode: 'production',
    entry: {
        popup: './src/popup.js',
        background: './src/background.js',
        settings: './src/settings.js'
    },
    output: {
        path: distPath,
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin({}),
        new MiniCssExtractPlugin({
            filename: "[name].css",
            chunkFilename: "[id].css"
        }),
        new CopyPlugin([
            { from: path.resolve(__dirname, './src/manifest.json'), to: distPath },
            { from: path.resolve(__dirname, './src/popup.html'), to: distPath },
            { from: path.resolve(__dirname, './src/settings.html'), to: distPath },
            {
                from: path.resolve(__dirname, './src/icons/*'),
                to: distPath,
                flatten: true
            },
        ]),
    ],
};
