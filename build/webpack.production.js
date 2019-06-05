'use strict';
const merge = require('webpack-merge');
const common = require('./webpack.base.js');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: "production",
  devtool: '#source-map',
  // Turn off default minification, since it hoses buttplug.
  optimization: {
    minimize: false,
  },
  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
});
