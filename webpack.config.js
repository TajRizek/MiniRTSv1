const path = require('path'); // Import the path module
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development', // Set to 'production' for production builds
  entry: './src/game.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Use the path module here
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'src/assets'), // Use the path module here
      publicPath: '/assets/', // Serve assets from /assets/
    },
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
  ],
  performance: {
    hints: false, // Disable performance warnings (optional)
  },
};
