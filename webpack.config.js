const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  target: 'node',
  mode: 'production',
  
  entry: {
    app: './src/app.js',
    'standalone-runner': './standalone-runner.js'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2'
  },
  
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { node: '14' }
              }]
            ]
          }
        }
      }
    ]
  },
  
  plugins: [
    new CleanWebpackPlugin(),
    
    // Add shebang to standalone-runner
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true,
      include: 'standalone-runner.js'
    }),
    
    new CopyWebpackPlugin({
      patterns: [
        // Documentation
        { from: 'README.md', to: 'README.md' },
        { from: 'QUICKSTART.md', to: 'QUICKSTART.md' },
        { from: 'INTEGRATION_GUIDE.md', to: 'INTEGRATION_GUIDE.md' },
        { from: 'LICENSE', to: 'LICENSE' },
        
        // Configuration
        { from: '.env.example', to: '.env.example' },
        { from: 'web.config', to: 'web.config' },
        
        // Examples and setup
        
        
        // Views
        { from: 'src/views/', to: 'views/' }
      ]
    })
  ],
  
  resolve: {
    extensions: ['.js', '.json']
  },
  
  optimization: {
    minimize: true,
    moduleIds: 'deterministic'
  },
  
  node: {
    __dirname: false,
    __filename: false
  },
  
  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }
};
