'use strict'

/**
 * Module Dependencies
 */
const config = require('./config'),
  restify = require('restify'),
  bunyan = require('bunyan'),
  winston = require('winston'),
  bunyanWinston = require('bunyan-winston-adapter'),
  mongoose = require('mongoose')

/**
 * Logging
 */
global.log = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: 'info',
      timestamp: () => {
        return new Date().toString()
      },
      json: true
    }),
  ]
})

/**
 * Initialize Server
 */
global.server = restify.createServer({
  name: config.name,
  version: config.version,
  log: bunyanWinston.createAdapter(log),
})

/**
 * Middleware
 */
server.use(restify.plugins.bodyParser({
  mapParams: true
}))
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser({
  mapParams: true
}));
//server.use(restify.fullResponse())

/**
 * Error Handling
 */
server.on('uncaughtException', (req, res, route, err) => {
  log.error(err.stack)
  res.send(err)
});

/**
 * Lift Server, Connect to DB & Bind Routes
 */
server.listen(config.port, function () {

  mongoose.connection.on('error', function (err) {
    log.error('Mongoose default connection error: ' + err)
    process.exit(1)
  })

  mongoose.connection.on('open', function (err) {

    if (err) {
      log.error('Mongoose default connection error: ' + err)
      process.exit(1)
    }
    log.info(`Database Connected`)
    log.info(`${server.name} ${config.version} ready to accept connections on port ${config.port} in ${config.env} environment.`)

    require('./routes')

  })

  global.db = mongoose.connect(config.db.uri)

})