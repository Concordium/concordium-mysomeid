const path = require("path");
const WebpackInlineSourcePlugin = require("@effortlessmotion/html-webpack-inline-source-plugin");

module.exports = {
  mode: "development",
  entry: {
    main: "./src-background/index.ts",
  },
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, './build/background'),
    filename: 'index.js',
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      { 
        test: /\.ts$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig-background.json",
        },
      }
    ],
  },
  plugins: [
    new WebpackInlineSourcePlugin(),
  ],
};
