const path = require('path');
const Dotenv = require('dotenv-webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const devMode = process.env.NODE_ENV !== 'production';

const opts = {
  'LOG_INFO': ['info', 'debug'].indexOf(process.env.LOG_LEVEL) >= 0 || process.env.DEBUG,
  'LOG_WARN': ['warn', 'debug'].indexOf(process.env.LOG_LEVEL) >= 0 || process.env.DEBUG,
  'LOG_VERBOSE': ['verbose', 'debug'].indexOf(process.env.LOG_LEVEL) >= 0 || process.env.DEBUG,
};

module.exports = {
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: "tsconfig.json"
            }
          },
          {
            loader: 'ifdef-loader',
            options: opts
          },
        ],
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  },
  entry: './src/index.ts',

  output: {
    globalObject: 'this',
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.js',
    libraryTarget: 'umd',
    library: 'chrome-ext-shared',
    umdNamedDefine: true
  },

  plugins: [
    devMode ? undefined : new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      generateStatsFile: false,
      defaultSizes: 'gzip'
    }),
    new Dotenv(),
  ].filter(Boolean)
};
