const path = require('path');
const Dotenv = require('dotenv-webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const devMode = process.env.NODE_ENV !== 'production';

const opts = {
  'LOG_NORMAL': devMode || process.env.LOG_NORMAL || process.env.LOG_DEBUG,
  'LOG_INFO': devMode || process.env.LOG_INFO || process.env.LOG_DEBUG,
  'LOG_WARN': devMode || process.env.LOG_WARN || process.env.LOG_DEBUG,
  'LOG_VERBOSE': devMode || process.env.LOG_VERBOSE || process.env.LOG_DEBUG,
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
    // Webpack 5
    clean: {
    }
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
