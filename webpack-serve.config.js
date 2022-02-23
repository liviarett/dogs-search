const config = require('./webpack.config')[0]
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve')

const options = {
  client: {
    address: 'localhost:3001'
  },
  static: [process.cwd(), require('path').resolve('./bin')],
  port: 3001
}

config.plugins = [new Serve(options)]
config.watch = true

module.exports = config
