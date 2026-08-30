// This file is not going through babel transformation.
// So, we write it in vanilla JS
// (But you could use ES2015 features supported by your Node.js version)
const webpack = require('webpack');

module.exports = {
    webpack: (config) => {
        const getEntries = config.entry;

        config.output.globalObject = 'globalThis';
        config.plugins.push(
            new webpack.DefinePlugin({
                global: 'globalThis',
            }),
        );

        config.entry = async () => {
            const entries = await getEntries();

            return Object.fromEntries(
                Object.entries(entries).filter(([name]) =>
                    name.startsWith('scripts/'),
                ),
            );
        };

        config.module.rules.push({
            test: /\.scss$/,
            use: ['style-loader', 'css-loader', 'sass-loader'],
        });

        return config;
    },
};
