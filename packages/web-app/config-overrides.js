const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")

module.exports = function override (config, env) {
    config.plugins = [
        ...config.plugins,
        new NodePolyfillPlugin({
            excludeAliases: ['console']
        })
    ];

    config.module.rules.unshift({
      test: /\.m?js$/,
      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        fullySpecified: false, // disable the behaviour
      },
    });

    config.module.rules[1].oneOf.unshift({
      test: /\.bin$/i,
      loader: 'base64-inline-loader',
    });

    config.module.rules.unshift({
      test: /\.bin$/i,
      loader: 'base64-inline-loader',
    });

    // console.log(JSON.stringify(config.module.rules, null, '  '));
    // process.exit(-1);

    // console.log('config.plugins ', config.plugins );
    return config
}
