//webpack.config.js
const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src-injected/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './build/injected'),
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".html"],
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "path": require.resolve("path-browserify"),
      "buffer": require.resolve("buffer/"),
      "stream": require.resolve("stream-browserify"),
    },
  },

  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          // transpileOnly: true,
          configFile: "tsconfig-injected.json",
        },
      },
      {
          test: /\.html$/,
          loader: 'base64-inline-loader'
      },
      {
        test: /\.svgtest$/,
        loader: 'svg-inline-loader'
      },
      {
        test: /\.(jpe?g|png|svg|ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: 'base64-inline-loader?limit=1000&name=[name].[ext]'
      }
    ]
  }
};
