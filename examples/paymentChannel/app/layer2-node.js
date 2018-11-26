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
logger.debug('layer2 node DBNAME is %s', args[7])

var url = "mongodb://localhost:27017/"
var DBNAME = args[7]

if (args[2] === 'operator') {
  operator()
} else if (args[2] === 'client') {
  client()
}
if (args[5] === 'true') {
  startRemoteWallet()
}
// MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
//   if (err) throw err
//   logger.debug("Database created! " + url)
//   db.close()
// });


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
  logger.debug("starting remote wallet for node on url: ws://localhost:" + args[6])
  ioRemoteWallet.listen(args[6])  
  ioRemoteWallet.on('connection', function (client) {
    logger.debug('wsRemoteWallet: client connnected:')
    client.on('registerDeposit', async function (message, signature, cb) {
      logger.debug('wsWallet: received registerDeposit:')
      logger.debug('message: %s', JSON.stringify(message))
      logger.debug('signature: %s', signature)

      //TODO verify signature
      subsignature = signature.substring(2)
      const r = "0x" + subsignature.substring(0, 64);
      const s = "0x" + subsignature.substring(64, 128);
      const v = parseInt(subsignature.substring(128, 130), 16);
      console.log(r)
      console.log(s)
      console.log(v)
      // TODO verify message validity
      // Rules and deposit not already registered
      // TODO update Balances
      // TODO make this process atomic
      processDepositMessage(message, ()=>{
	recordMessageInDB(message, signature, cb)
      })

    })
    client.on('makePayment', async function (message, signature, cb) {
      logger.debug('wsWallet: received makePayment:')
      logger.debug('message: %s', JSON.stringify(message))
      logger.debug('signature: %s', signature)
      subsignature = signature.substring(2)
      const r = "0x" + subsignature.substring(0, 64);
      const s = "0x" + subsignature.substring(64, 128);
      const v = parseInt(subsignature.substring(128, 130), 16);
      console.log(r)
      console.log(s)
      console.log(v)
      processPaymentMessage(message, ()=>{
	recordMessageInDB(message, signature, cb)
      })
    })
    client.on('requestWithdrawPayment', async function (message, cb) {
      logger.debug('wsWallet: received withdrawPayment:')
      logger.debug('message: %s', message)
      cb()
    })
    client.on('withdrawPayment', async function (message, cb) {
      logger.debug('wsWallet: received withdrawPayment:')
      logger.debug('message: %s', message)
      cb()
    })
    client.on('withdrawDeposit', async function (message, signature, cb) {
      logger.debug('wsWallet: received withdrawDeposit:')
      logger.debug('message: %s', message)
      logger.debug('signature: %s', signature)
      cb()
    })
    client.on('requestWithdrawDeposit', async function (message, signature, cb) {
      logger.debug('wsWallet: received withdrawDeposit:')
      logger.debug('message: %s', message)
      logger.debug('signature: %s', signature)
      cb()
    })
    client.on("getLatestMessageInfo", async function (address, cb) {
      logger.debug('wsWallet: received getLatestMessage:')
      logger.debug('address: %s', address)
      getLatestMessageInfoFromDB(address, (document)=>{
	logger.debug("latest message is: %s", JSON.stringify(document))
	cb(document)
      })
    })
    client.on("getMessageBySignature", async function (signature, cb) {
      logger.debug('wsWallet: received getMessageBySignature:')
      logger.debug('signature: %s', JSON.stringify(signature))
      getMessageFromDB(signature, (document)=>{
	logger.debug("Message is: %s", JSON.stringify(document))
	cb(document)
      })

    })
    client.on("getState", async function (address, cb) {
      //logger.debug('wsWallet: received getState:')
      //logger.debug('address: %s', address)
      getState(address, (document)=>{
	//logger.debug("account state is: %s", JSON.stringify(document))
	cb(document)
      })
    })
    
  })
}



function recordMessageInDB(message, signature, cb){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)
    var document = { message: message,
		     signature: signature}
    logger.debug("Saving in DB %s", JSON.stringify(document))
    dbo.collection("messagesBySignature").insertOne(document, ()=>{
      var document = { address: message.sender.address,
		       nonce: message.nonce,
		       signature: signature}
      logger.debug("Saving in DB %s", JSON.stringify(document))      
      dbo.collection("signaturesByAddress").insertOne(document, cb)
    })
  })
}

function processDepositMessage(message, cb){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)
    var document = { account: message.sender.address,
		     deposited: message.sender.balance}
    logger.debug("Saving in DB %s", JSON.stringify(document))
    dbo.collection("accounts").updateOne({"address":document.account}, {$set: {"deposited": document.deposited}}, {upsert: true}, ()=>{
      cb()
    })
  })
}

function processPaymentMessage(message, cb){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)
    var document = { account: message.sender.address,
		     deposited: message.sender.balance,
		     paid: {"recipient1": message.recipient1,
			    "recipient2": message.recipient2
			   }
		   }
    logger.debug("Saving in DB %s", JSON.stringify(document))
    dbo.collection("accounts").updateOne({"address":document.account}, {$set: {"deposited": document.deposited, "paid": message.recipient1}}, {upsert: true}, ()=>{
      cb()
    })
  })
}

function getLatestMessageInfoFromDB(address, cb){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)

      dbo.collection("signaturesByAddress").findOne({address: address}, {'sort': [["nonce", "desc"]]}, function(err, document){
	if (document){
	  //logger.debug("Fetching in DB %s", JSON.stringify(document))
	  cb(document.signature)
	}
	else {
	  logger.debug("No previous signature, New user")
	  cb('0x0')
	}
    })
  })
}

function getMessageFromDB(signature, cb){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)

    dbo.collection("messagesBySignature").findOne({signature: signature}, function(err, document){
      if (document){
	//logger.debug("Fetching in DB %s", JSON.stringify(document))
	cb(document.message)
      }
      else{
	logger.debug("Fetching Message in DB: no document found")	
      }
    })
  })
}


function getState(address, cb){
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)

      dbo.collection("accounts").findOne({address: address}, function(err, document){
	if (document){
	  //logger.debug("Fetching in DB %s", JSON.stringify(document))
	  cb(document)
	}
	else {
	  //logger.debug("User not found")
	  cb('User not found')
	}
    })
  })
}
