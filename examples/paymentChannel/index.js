const SafeEventEmitter = require('safe-event-emitter')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const paymentChannel = require("./build/contracts/PaymentChannel.json")
const abi = paymentChannel.abi

const layer2Abi = {
  actions:[{name: "giftTo",
	    params:"address"},
	   {name: "cancelGift",
	    params: "uint"}
	  ],
  getters:[{name: "received",
	    params: [{name: "account",
		      type: "address"}]
	   },
	   {
	   }
	  ]
}

class PaymentChannel extends SafeEventEmitter {
  constructor (opts = {}) {
    super()

    this.layer2Abi = layer2Abi
    //INTRODUCE HERE A LAYER2TRACKER HOOKED TO THE PROVIDER TO WATCH THE LAYER 2 STATE
    this.address = opts.address
    this.provider = opts.provider
    this.eth = new Eth(this.provider)
    this.contract = new EthContract(this.eth)
    this.Layer2AppContract = this.contract(abi)
    this.owner = opts.owner
    this.contract = this.Layer2AppContract.at(this.address)
    this.blockTracker = opts.blockTracker

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
