const SafeEventEmitter = require('safe-event-emitter')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const ioClient = require('socket.io-client')
const BN = require('ethereumjs-util').BN

const paymentChannel = require("./build/contracts/PaymentChannel.json")
const abi = paymentChannel.abi


class PaymentChannel extends SafeEventEmitter {
  constructor (opts = {}) {
    super()
    // TODO receive state from previous from opts at tracker creation(like balance)
    this.layer2State = ''
    this.nodeUrl = opts.nodeUrl
    this.socket = ioClient(this.nodeUrl)
    const updateLayer2State = this.updateLayer2State.bind(this)
    this.socket.on("updateState", (data)=>{
      console.log("SOCKET UPDATE STATE", data)
      updateLayer2State(data)
    })
    this.address = opts.address
    this.provider = opts.provider
    this.eth = new Eth(this.provider)
    this.contract = new EthContract(this.eth)
    this.Layer2AppContract = this.contract(abi)
    this.owner = opts.owner
    this.contract = this.Layer2AppContract.at(this.address)
    this.blockTracker = opts.blockTracker

    this.networkId = opts.networkId

    this.layer2Abi = {
      actions:[{name: "registerDeposit",
		call:this.registerDeposit.bind(this),
		params:[{name: "depositNonce",
			 type: "uint"},
		       ]
		},
	       {name: "makePayment",
		call:this.makePayment.bind(this),
		params:[{name:"toAddress",
			 type:"address"},
			{name: "value",
			 type: "uint"}
		       ]},
	       {name: "requestWithdrawPayment",
		call:this.withdrawPayment.bind(this),
		params:[{name:"fromAddress",
			 type:"address"},
			{name:"latestMessage",
			 type:"string"}
		       ]
	       },
	       {name: "withdrawPayment",
		call:this.withdrawPayment.bind(this),
		params:[{name:"requestWPNonce",
			 type:"uint"}
		       ]
	       },
	       {name: "requestWithdrawDeposit",
		call:this.withdrawDeposit.bind(this),
	       	params:[{name:"amountWithdrawn",
			 type:"uint"}
		       ]
	       },
	       {name: "withdrawDeposit",
		call:this.withdrawDeposit.bind(this),
	       	params:[{name:"requestWDNonce",
			 type:"uint"
			}]
	       }
	      ],
      state:[{name: "paymentAllowance",
	      call: this.paymentAllowance
	       },
	     {name: "paymentReceived",
	      call: this.paymentReceived
	       }
	    ]
    }

    // EIP 712 data
    this.domain = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" },
      { name: "salt", type: "bytes32" },
    ]

    this.channelMessage = [
      {name: "nonce", type: "uint256"},
      {name: "previousSignature", type: "bytes32"},
      {name: "depositCustomHash", type: "bytes32"},
      {name: "sender", type: "Accounts"},
      {name: "recipient1", type: "Accounts"},
      {name: "recipient2", type: "Accounts"},
    ]
    this.accounts = [
      {name: "address", type: "address"},
      {name: "balance", type: "uint256"}
    ]
    //Todo: chainId use network id
    this.domainData = {
      name: "MetaMask Payment Channel Example",
      version: "1",
      chainId: this.networkId,
      verifyingContract: this.address,
      salt: "0x1"
    }
    
  }

  async registerDeposit(params){
    const socket = this.socket
    console.log("REGISTER DEPOSIT ", params)
    const depositNonce = params[0]
    const depositCustomHash = (await this.contract["depositCustomHashesByAddress"](this.owner, depositNonce))[0]
    const deposit = await this.contract["depositByCustomHash"](depositCustomHash)
    console.log("Custom hash ", depositCustomHash)
    console.log("EVM record ", deposit)
    const value = deposit.value
    console.log("DEBUG DEBUG DEPOSIT", value)
    console.log("DEBUG DEBUG DEPOSIT", value.toString(10))    
    console.log("DEBUG DEBUG DEPOSIT", typeof(value))
  
    
    socket.emit("getLatestMessageInfo", this.owner, async (previousSignature)=>{
      console.log("GETTING PREVIOUS SIG FROM USER")
      console.log(previousSignature)
      let message
      let socketEvent
      if (previousSignature == "0x0"){
	message  = {
	  nonce: 0,
	  previousSignature: "0x0",
	  depositCustomHash,
	  sender: {
	    address: this.owner,
	    balance: value.toJSON(), //add here previous balance
	  }
	}

	this.signMessage(message, (signature)=>{
	    socketEvent = "registerDeposit"
	    console.log(socketEvent + " will be fired ", message, signature)	
	    socket.emit(socketEvent, message, signature, ()=> {
	      console.log(socketEvent + " fired ", message, signature)
	    })
	  })
      }
      
      else {
	
	socket.emit("getMessageBySignature", previousSignature, async (previousMessage)=>{
	  console.log("PREVIOUS MESSAGE FROM USER")
	  console.log(previousMessage)
	  
	  message = previousMessage
	  console.log(message)
	  console.log(message.nonce)
	  console.log(typeof(message.nonce))
	  message.nonce = message.nonce + 1
	  console.log(message.nonce)
	  console.log(typeof(message.nonce))
	  message.previousSignature = previousSignature
	  message.depositCustomHash = depositCustomHash
	  let previousValue = message.sender.balance
	  previousValue = new BN(previousValue, 16)
	  console.log("PREVIOUS VALUE", previousValue)
	  message.sender.balance = previousValue.add(value).toJSON()
	  this.signMessage(message, (signature)=>{
	    socketEvent = "registerDeposit"
	    socket.emit(socketEvent, message, signature, ()=>{
	      console.log(socketEvent + " fired ", message, signature)
	    })
	  })
	})

      }
    })
  }
		
  
  makePayment(params){
    console.log("MAKE PAYMENT")
    console.log(params)
    let toAddress = params[0].toLowerCase()
    let value = params[1]*1e18
    console.log("DEBUGDEBUG before BN")    
    console.log(value)
    value = new BN(value.toString(), 10)
    console.log("DEBUGDEBUG in BN")
    console.log(value)
    console.log(value.toString(10))    
    console.log(typeof(value))    
//    value = value.mul(new BN(10, 10).pow(new BN(18)))
    const socket = this.socket
    socket.emit("getLatestMessageInfo", this.owner, async (previousSignature)=>{
      console.log("GETTING PREVIOUS SIG FROM USER")
      console.log(previousSignature)
      let message
      let socketEvent
      if (previousSignature == "0x0"){
	// first action must be register deposit
	return
      }
      else {
	
	socket.emit("getMessageBySignature", previousSignature, async (previousMessage)=>{
	  console.log("PREVIOUS MESSAGE FROM USER")
	  console.log(previousMessage)

	  // TODO BN nonces
	  message = previousMessage
	  console.log(message)
	  console.log(message.nonce)
	  console.log(typeof(message.nonce))
	  message.nonce = message.nonce + 1
	  console.log(message.nonce)
	  console.log(typeof(message.nonce))
	  message.previousSignature = previousSignature
	  message.depositCustomHash = "0x0"
	  let previousValue = message.sender.balance
	  previousValue = new BN(previousValue, 16)
	  console.log("PREVIOUS VALUE", previousValue)
	  if (previousValue.lt(value)){
	    alert("not enough available deposit")
	    return
	  }
	  message.sender.balance = previousValue.sub(value).toJSON()
	  let previousRecipientValue
	  if (message.recipient1){
	    if (message.recipient1.address == toAddress){
	      previousRecipientValue = new BN(message.recipient1.value, 16)
	      message.recipient1.value = previousRecipientValue.add(value).toJSON()
	    }
	    else{
	      if (message.recipient2 && message.recipient2.address){
		if (message.recipient2.address == toAddress){
		  previousRecipientValue = new BN(message.recipient2.value, 16)
		  message.recipient2.value = previousRecipientValue.add(value).toJSON()
		}
		else {
		  alert("Can't send to more than 2 recipients for now")
		}
	      }
	      else{
		message.recipient2 = {
		  address: toAddress,
		  value: value.toJSON()
		}
	      }
	    }
	  }
	  else {
	    message.recipient1 = {
	      address: toAddress,
	      value: value.toJSON()
	    }
	  }
    	  this.signMessage(message, (signature)=>{
	    socketEvent = "makePayment"
	    console.log(socketEvent + " will be fired ", message, signature)
	    socket.emit(socketEvent, message, signature, ()=> {
	      console.log(socketEvent + " fired ", message, signature)
	    })
	  })
	})
      }
    })
  }

  withdrawPayment(params){
    console.log(params)
    this.socket.emit("withdrawPayment")
  }

  withdrawDeposit(params){
    console.log(params)    
    this.socket.emit("withdrawDeposit")
  }
  
  getLayer2AppContract() {
    return this.contract
  }

  async signMessage(message, cb){
    let socket = this.socket
    console.log(message)
    console.log(typeof(message))
    
    let data = JSON.stringify({
      types: {
	EIP712Domain: this.domain,
	ChannelMessage: this.channelMessage,
	Accounts: this.accounts
      },
      domain: this.domainData,
      primaryType: "ChannelMessage",
      message: message
    })

    await this.eth.rpc.sendAsync(
      {
	method: "eth_signTypedData_v3",
	params: [this.owner, data],
	from: this.owner
      },
      function(err, result) {
    	if (err) {
          return console.error(err);
    	}
	console.log(result)
    	const signature = result
	// signature = signature.substring(2);
    	// const r = "0x" + signature.substring(0, 64);
    	// const s = "0x" + signature.substring(64, 128);
    	// const v = parseInt(signature.substring(128, 130), 16);
	// console.log("r: ", r)
	// console.log("s: ", s)
	// console.log("v: ", v)
	cb(signature)
      }
    )
  }

  async getLayer2State(cb){
    let socket = this.socket
    let owner = this.owner
    console.log("Calling socket GET STATE FOR:", owner)
    socket.emit("getState", owner, async (state)=>{
      this.layer2State = state
      console.log("Got state: ", state)
      cb(state)
    })
  }

  updateLayer2State(state){
    this.layer2State = state
  }
  
  async updateValue(key) {
    console.log("updateValue", key)
    let methodName
    let args = []

    switch (key) {
      case 'balance':
        methodName = 'balanceOf'
        args = [ this.owner ]
        break
      default:
        methodName = key
    }

    let result
    try {
      console.log(args)
      result = await this.contract[methodName](...args)
    } catch (e) {
      console.warn(`failed to load ${key} for layer2App at ${this.address}`)
      if (key === 'balance') {
        throw e
      }
    }

    if (result) {
      const val = result[0]
      this[key] = val
      return val
    }

    return this[key]
  }


  
}

module.exports = PaymentChannel
