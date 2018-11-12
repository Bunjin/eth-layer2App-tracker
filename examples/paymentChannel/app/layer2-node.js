let logger = require('./lib/logger')

let args = process.argv
let os = require('os')
let path = require('path')
let mkdirp = require('mkdirp')

var io = require('socket.io')()
var ioClient = require('socket.io-client')
var MongoClient = require('mongodb').MongoClient

logger.debug('mode is %s', args[2])
logger.debug('version-path is %s', args[3])
logger.debug('ws port is %s', args[4])

var url = "mongodb://localhost:27017/metamask-layer-2-unilateral-payment-channel-" + args[2] + "-"+ args[3]

MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
  if (err) throw err
  logger.debug("Database created! " + url)
  db.close()
  if (args[2] === 'operator') {
    operator()
  } else if (args[2] === 'client') {
    client()
  }
  
});

function operator(){
  logger.debug("starting operator node")
  io.listen(args[4])
  io.on('connection', function (client) {
    logger.debug('wsWallet: client connnected:')
    client.on('message', async function (message, cb) {
        logger.debug('wsWallet: received: %s', message)
    })
  })
}

function client(){
  logger.debug("starting client node")
  socketUrl = 'ws://localhost:'+args[4]
  var socket = ioClient(socketUrl)
}
