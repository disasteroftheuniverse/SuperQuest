/*jshint esversion: 8*/
const path = require('path');
//const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
//var AppCachePlugin = require('appcache-webpack-plugin');
//const CompressionPlugin = require('compression-webpack-plugin');
//var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
   mode: 'production',
   entry: {
		//'SuperQuest.full': path.join(__dirname, 'index'),
		'physics-lite': path.join(__dirname, 'src/physics-lite/index'),
		'SuperQuest.slim': path.join(__dirname, 'slim'),
		'SuperQuest.full': path.join(__dirname, 'index'),
   },
   output: {
      path: __dirname + '/dist',
      filename: '[name].min.js',
      //chunkFilename: 'js/vendor/[name].js'
   },
   module: {
      rules: [{
         test: /.jsx?$/,
         include: [
            path.resolve(__dirname, 'src')
         ],
         exclude: [
            path.resolve(__dirname, 'node_modules')
         ],
         loader: 'babel-loader',
         query: {
            presets: [
               ['@babel/env', {
                  'targets': {
                     'browsers': 'last 2 chrome versions'
                  }
               }]
            ]
         }
      },
		{
			test: /\.worker\.js$/,
			use: {
				loader: 'worker-loader',
				options: {
					inline: true,
					fallback: true,
					name: '[name].min.js'
				}
			},
		},
      ]
   },
   plugins: [
    
   ],
   resolve: {
      extensions: ['.json', '.js', '.jsx']
   },
   optimization: {
      minimizer: [
         new TerserPlugin({
            extractComments: 'all',
            terserOptions: {
               drop_console: false,
               ecma: undefined,
               warnings: false,
               parse: {},
               compress: {},
               mangle: true, 
               module: true,
               output: null,
               toplevel: false,
               nameCache: null,
               ie8: false,
               keep_classnames: undefined,
               keep_fnames: false,
               safari10: false,
            },
            test: /\.js(\?.*)?$/i,
         }),
      ],
   }
};