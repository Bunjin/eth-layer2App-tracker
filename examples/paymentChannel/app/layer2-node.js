let logger = require('./lib/logger')
const assert = require('assert');

let args = process.argv
let os = require('os')
let path = require('path')
let mkdirp = require('mkdirp')

var io = require('socket.io')()
var ioRemoteWallet = require('socket.io')()
var ioClient = require('socket.io-client')
var MongoClient = require('mongodb').MongoClient

const BN = require('ethereumjs-util').BN

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
	recordMessageInDB(message, signature, ()=>{
	  getState(message.sender.address, (state)=>{
	    client.emit("updateState", state, cb)
	  })
	})
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
	recordMessageInDB(message, signature, ()=>{
	  getState(message.sender.address, (state)=>{	  
	    client.emit("updateState", state, cb)
	    //need to emit also to recipient of payment (should have a mapping client/address)
	  })
	})
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
    // Client request states on load or block changes
    client.on("getState", async function (address, cb) {
      logger.debug('wsWallet: received getState:')
      logger.debug('address: %s', address)
      getState(address, (document)=>{
    	logger.debug("After db, account is: %s", address)
    	logger.debug("After db, document is: %s", document)	
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
    var document = { address: message.sender.address,
		     deposited: message.sender.balance}
    logger.debug("Saving in DB %s", JSON.stringify(document))
    dbo.collection("accounts").updateOne({"address":document.address}, {$set: {"deposited": document.deposited}}, {upsert: true}, ()=>{
      cb()
    })
  })
}

function processPaymentMessage(message, cb){
  MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db(DBNAME)

//     { "_id" : ObjectId("5bfc39d6c813cf256ff7d31d"), "address" : "0x6ccb1def4ff8c4b953b084a220ec51817b65fd87", "deposited" : "0", "paid" : { "recipient1" : { "address" : "0x3af763d5c93165a13778a4904e60d00193973c15", "value" : "de0b6b3a7640000" }, "recipient2" : {  } } }
// { "_id" : ObjectId("5bfc39dfc813cf256ff7d31e"), "address" : "0x3af763d5c93165a13778a4904e60d00193973c15", "totalReceived" : "de0b6b3a7640000", "received" : { "from" : "" } }

    let totalReceivedFrom
    let recipient
    console.log(message.sender)
    dbo.collection("accounts").findOne({address: message.sender.address}, (err, previousSenderDocument)=>{
      console.log(previousSenderDocument)
      if (!previousSenderDocument.paid){
	totalReceivedFrom = new BN(message.recipient1.value, 16)
	recipient = message.recipient1.address
      }
      else {
	if (message.recipient1.address == previousSenderDocument.paid.recipient1.address){
	  if (message.recipient1.value == previousSenderDocument.paid.recipient1.value){
	    if (!previousSenderDocument.paid.recipient2){
	      totalReceivedFrom = new BN(message.recipient2.value, 16)
	      recipient = message.recipient2.address
	    }
	    else {
	      if (message.recipient2.address == previousSenderDocument.paid.recipient2.address){
		if (message.recipient2.value == previousSenderDocument.paid.recipient2.value){
		  logger.error("Payment made but no recipient value changed ??")
		}
		else {
		  // this is the recipient
		  try{
		    assert.strictEqual((new BN(message.recipient2.value, 16)).gt(new BN(previousSenderDocument.paid.recipient2.value)), true)
		  }
		  catch (err){
		    logger.error("can't decrease recipient value ")
		    logger.error(err)
		  }
		  totalReceivedFrom = new BN(message.recipient2.value, 16)
		  recipient = message.recipient2.address
		}
	      }
	      else {
		logger.error("Error recipient address changed")
		cb("Error recipient address changed")
	      }
	    }
	  }
	  else {
	    // this is the recipient
	    try{
	      assert.strictEqual((new BN(message.recipient1.value, 16)).gt(new BN(previousSenderDocument.paid.recipient1.value)), true)	    
	    }
	    catch (err){
	      logger.error("can't decrease recipient value ")
	      logger.error(err)
	    }
	    totalReceivedFrom = new BN(message.recipient1.value, 16)
	    recipient = message.recipient1.address
	    
	  }
	}
	else {
	  logger.error("Error recipient address changed")
	  cb("Error recipient address changed")
	}
      }
      dbo.collection("accounts").updateOne({"address": message.sender.address}, {$set: {"deposited": message.sender.balance, "paid": {"recipient1": message.recipient1, "recipient2": message.recipient2}}}, {upsert: true}, ()=>{
	// TODO search balance of recipient in Json message
	dbo.collection("accounts").findOne({"address": recipient}, (err, previousRecipientDocument)=>{
	  let totalReceived
	  if (previousRecipientDocument){
	    totalReceived = new BN(previousRecipientDocument.totalReceived, 16)
	    totalReceived = totalReceived.add(totalReceivedFrom)
	  }
	  else {
	    totalReceived = totalReceivedFrom
	  }
	  let receivedPaymentsList
	  if (previousRecipientDocument && previousRecipientDocument.received){
	    const previousFromIndex = previousRecipientDocument.received.map((a)=>a.from).indexOf(message.sender.address)
	    console.log("previous from index")
	    console.log(previousFromIndex)
	    if (previousFromIndex != -1){
	      receivedPaymentsList = previousRecipientDocument.received
	      receivedPaymentsList[previousFromIndex].value = totalReceivedFrom.toJSON()
	    }
	    else {
	      receivedPaymentsList.append({"from": message.sender.address, "value": totalReceivedFrom.toJson()})
	    }
	  }
	  else {
	    receivedPaymentsList = [{"from": message.sender.address, "value": totalReceivedFrom.toJSON()}]	    
	  }

	  dbo.collection("accounts").updateOne({"address": recipient}, {$set: {"totalReceived": totalReceivedFrom.toJSON(), "received": receivedPaymentsList}}, {upsert: true}, ()=>{
	    cb()
	  })
	})
      })
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
  logger.debug("get state for address: " + address)
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
