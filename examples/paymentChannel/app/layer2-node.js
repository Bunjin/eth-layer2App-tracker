let logger = require('./lib/logger')

let args = process.argv
let os = require('os')
let path = require('path')
let mkdirp = require('mkdirp')

var io = require('socket.io')()
var ioRemoteWallet = require('socket.io')()
var ioClient = require('socket.io-client')
var MongoClient = require('mongodb').MongoClient

logger.debug('mode is %s', args[2])
logger.debug('version-path is %s', args[3])
// Operator / Clients networking
logger.debug('ws layer2 operator/client port is %s', args[4])
// Wallet / Client networking
logger.debug('ws layer2 node/wallet (remote wallet) is active: %s', args[5])
logger.debug('ws layer2 node/wallet port is %s', args[6])

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
  if (args[5] === 'true') {
    startRemoteWallet()
  }
});

function operator(){
  logger.debug("starting operator node on port: " + args[4])
  io.listen(args[4])
  io.on('connection', function (client) {
    logger.debug('operator node: client %s node connnected:', client)
    client.on('message', async function (message, cb) {
      logger.debug('operator node: received: %s , from client: %s', message, client) 
    })
  })
}

function client(){
  logger.debug("starting client node on port: " + args[4])
  socketUrl = 'ws://localhost:' + args[4]
  var socket = ioClient(socketUrl)
}

function startRemoteWallet(){
  logger.debug("starting remote wallet for node on port: " + args[6])
  ioRemoteWallet.listen(args[6])  
  ioRemoteWallet.on('connection', function (client) {
    logger.debug('wsRemoteWallet: client connnected:')
    client.on('message', async function (message, cb) {
        logger.debug('wsWallet: received: %s', message)
    })
  })
}
