const SafeEventEmitter = require('safe-event-emitter')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const ioClient = require('socket.io-client')


const paymentChannel = require("./build/contracts/PaymentChannel.json")
const abi = paymentChannel.abi


class PaymentChannel extends SafeEventEmitter {
  constructor (opts = {}) {
    super()
    this.nodeUrl = opts.nodeUrl
    this.socket = ioClient(this.nodeUrl)
    console.log("connecting to layer2 node:" + this.nodeUrl)
    //INTRODUCE HERE A LAYER2TRACKER HOOKED TO THE PROVIDER TO WATCH THE LAYER 2 STATE
    this.address = opts.address
    this.provider = opts.provider
    this.eth = new Eth(this.provider)
    this.contract = new EthContract(this.eth)
    this.Layer2AppContract = this.contract(abi)
    this.owner = opts.owner
    this.contract = this.Layer2AppContract.at(this.address)
    this.blockTracker = opts.blockTracker

    this.layer2Abi = {
      actions:[{name: "registerDeposit",
		call:this.registerDeposit.bind(this),
		params:[{name: "txHash",
			 type: "address"},
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
		params:[]
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

    
  }

  registerDeposit(){
    let message = "0xTxHash"
    let sig = "0xSig"
    this.socket.emit("registerDeposit", message, sig, ()=> {
      console.log("deposit registered")
    })
  }

  makePayment(){
    let toAddress = "0xb"
    this.socket.emit("makePayment", toAddress)
  }

  withdrawPayment(){
    this.socket.emit("withdrawPayment")
  }

  withdrawDeposit(){
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
