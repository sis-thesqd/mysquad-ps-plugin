const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const { aliases } = require('@swc-uxp-wrappers/utils');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './'),
    filename: 'bundle.js',
    clean: false
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html'
    }),
    new Dotenv({
      path: './.env',
      safe: false,
      allowEmptyValues: true,
      systemvars: true,
      silent: false,
      defaults: false
    }),
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: aliases
  },
  externals: {
    'photoshop': 'commonjs2 photoshop',
    'uxp': 'commonjs2 uxp',
    'os': 'commonjs2 os'
  },
  devtool: false,
  optimization: {
    minimize: false,
    splitChunks: false,
    runtimeChunk: false
  },
  performance: {
    hints: false
  }
};
