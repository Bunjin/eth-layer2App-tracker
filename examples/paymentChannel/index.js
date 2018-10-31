const SafeEventEmitter = require('safe-event-emitter')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')
const BlockTracker = require('eth-block-tracker')

const paymentChannel = require("./build/contracts/PaymentChannel.json")
const abi = paymentChannel.abi


class PaymentChannel extends SafeEventEmitter {
  constructor (opts = {}) {
    super()


    //INTRODUCE HERE A LAYER2TRACKER HOOKED TO THE PROVIDER TO WATCH THE LAYER 2 STATE
    

    this.address = opts.address
    this.provider = opts.provider
    this.eth = new Eth(this.provider)
    this.contract = new EthContract(this.eth)
    this.Layer2AppContract = this.contract(abi)
    this.owner = opts.owner
    this.contract = this.Layer2AppContract.at(this.address)

    const pollingInterval = opts.pollingInterval || 4000
    this.blockTracker = new BlockTracker({
      provider: this.provider,
      pollingInterval,
    })

    this.update()
    .catch((reason) => {
      console.error('layer2App updating failed', reason)
    })

    this.registerContract()
    .catch((reason) => {
      console.error('Register contract failed updating failed', reason)
    })

    this.running = true
    this.blockTracker.on('latest', this.updateBalance.bind(this))
    this.blockTracker.start()
  }

  async registerContract() {
    console.log("RRRRRRRRRRRRRRRRREGIIIISTER", this.contract)
    return this.contract
  }

  async update() {
    const results = await Promise.all([
      this.updateBalance(),
    ])
    this.isLoading = false
    return results
  }

  async updateBalance() {
    const balance = await this.updateValue('balance')
    this.balance = balance
    return this.balance
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
