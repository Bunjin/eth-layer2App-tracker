const SafeEventEmitter = require('safe-event-emitter')
const Eth = require('ethjs-query')
const EthContract = require('ethjs-contract')

const paymentChannel = require("./build/contracts/PaymentChannel.json")
const abi = paymentChannel.abi


class PaymentChannel extends SafeEventEmitter {
  constructor (opts = {}) {
    super()
  //   this.userAddress = opts.userAddress || '0x0'
  //   this.provider = opts.provider
  //   const pollingInterval = opts.pollingInterval || 4000
  //   this.blockTracker = new BlockTracker({
  //     provider: this.provider,
  //     pollingInterval,
    //   })
    this.address = opts.address
    this.provider = opts.provider
    this.eth = new Eth(this.provider)
    this.contract = new EthContract(this.eth)
    this.Layer2AppContract = this.contract(abi)
    const contract = this.Layer2AppContract.at(this.address)
    console.log("DEBUG DEBUG DEBUG LAYER 2 APP CONTRACT")
    console.log(contract)
  //   this.eth = new Eth(this.provider)
  //   this.contract = new EthContract(this.eth)
  //   this.Layer2AppContract = this.contract(abi)

  //   const layer2Apps = opts.layer2Apps || []

  //   this.layer2Apps = layer2Apps.map((layer2AppOpts) => {
  //     return this.createLayer2AppFrom(layer2AppOpts)
  //   })

  //   this.running = true
  //   this.blockTracker.on('latest', this.updateBalances.bind(this))
  //   this.blockTracker.start()
  }

}

module.exports = PaymentChannel
