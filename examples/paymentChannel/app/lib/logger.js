let winston = require('winston')
const myFormat = winston.format.printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
})

let Logger = function () {
  return winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.splat(),
      winston.format.timestamp(),
      winston.format.simple(),
      myFormat

    ),
    transports: [
      new winston.transports.Console({handleExceptions: true, timestamp: true}),
      new winston.transports.File({filename: 'logs/broadcast.log', handleExceptions: true})
    ]
  })
}
const logger = new Logger()
module.exports = logger
