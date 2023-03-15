const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackInlineSourcePlugin = require("@effortlessmotion/html-webpack-inline-source-plugin");

module.exports = {
  mode: "development",
  entry: {
    main: "./src-widget/index.tsx",
  },
  devtool: "inline-source-map",
  output: {
    path: path.resolve(__dirname, './build/widget'),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", '.css'],
  },
  module: {
    rules: [
      {
        test: /\.?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      { 
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          configFile: "tsconfig-widget.json",
        },
      },
      {
        test: /\.css$/,
        use: [
          "style-loader",
          "css-loader", // for styles
        ],
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(jpe?g|png)(\?[a-z0-9=&.]+)?$/,
        use: 'base64-inline-loader?limit=1000&name=[name].[ext]'
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src-widget/index.html", // base html
      // inlineSource: '.(js|css)$' 
    }),
    new WebpackInlineSourcePlugin(),
  ],
};
