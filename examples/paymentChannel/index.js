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

    this.nodeUrl = opts.nodeUrl
    this.socket = ioClient(this.nodeUrl)
    this.address = opts.address
    this.provider = opts.provider
    this.eth = new Eth(this.provider)
    console.log(eth)
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
	       {name: "withdrawPayment",
		call:this.withdrawPayment.bind(this),
		params:[{name:"fromAddress",
			 type:"address"},
			{name:"latestMessage",
			 type:"string"}
		       ]
	       },
	       {name: "withdrawDeposit",
		call:this.withdrawDeposit.bind(this),
	       	params:[]
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
      {name: "recipient3", type: "Accounts"},
      {name: "recipient4", type: "Accounts"},
      {name: "recipient5", type: "Accounts"}
    ]
    this.accounts = [
      {name: "address", type: "address"},
      {name: "balance", type: "uint256"}
    ]

    console.log(eth)
    console.log(this.state)
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
    let socket = this.socket
    console.log("REGISTER DEPOSIT ", params)
    const depositNonce = params[0]
    const depositCustomHash = (await this.contract["depositCustomHashesByAddress"](this.owner, depositNonce))[0]
    const deposit = await this.contract["depositByCustomHash"](depositCustomHash)
    console.log("Custom hash ", depositCustomHash)
    console.log("EVM record ", deposit)
    const value = deposit.value
    
    socket.emit("getLatestMessageInfo", this.owner, async (previousSignature)=>{
      console.log("GETTING PREVIOUS SIG FROM USER")
      console.log(previousSignature)
      let message
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

	this.signMessage(message)
	
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
	  this.signMessage(message)
	})

      }
    })
  }
		
  async signMessage(message){
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
	socket.emit("registerDeposit", message, signature, ()=> {
	  console.log("deposit registered")
	})
      }
    )
  }
  
  makePayment(params){
    console.log("MAKE PAYMENT")
    console.log(params)
    let toAddress = params[0]
    let value = params[1]
    this.socket.emit("makePayment", toAddress)
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
