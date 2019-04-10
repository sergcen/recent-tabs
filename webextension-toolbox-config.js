// This file is not going through babel transformation.
// So, we write it in vanilla JS
// (But you could use ES2015 features supported by your Node.js version)
const webpack = require('webpack')

module.exports = {
  webpack: (config, { dev, vendor }) => {
    config.module.rules.push({
      rules: [{
          test: /\.scss$/,
          use: [
              "style-loader",
              "css-loader",
              "sass-loader" 
          ]
      }]
    });

    return config;
  }
}