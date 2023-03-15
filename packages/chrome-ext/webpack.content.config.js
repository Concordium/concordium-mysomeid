//webpack.config.js
const path = require('path');

module.exports = {
  mode: "development",
  devtool: "inline-source-map",
  entry: {
    main: "./src-content/index.ts",
  },
  output: {
    path: path.resolve(__dirname, './build/content'),
    filename: "index.js",
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".html"],
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          // transpileOnly: true,
          configFile: "tsconfig-content.json",
        },
      },
      {
          test: /\.html$/,
          loader: 'base64-inline-loader'
      },
      {
        test: /\.png$/,
        loader: 'base64-inline-loader'
      },
      {
        test: /\.(jpe?g|png|svg|ttf|eot|woff(2)?)(\?[a-z0-9=&.]+)?$/,
        use: 'base64-inline-loader?limit=1000&name=[name].[ext]'
      }
    ]
  }
};
