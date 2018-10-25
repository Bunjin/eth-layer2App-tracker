const BN = require('ethjs').BN
const util = require('./util')


// Import here the specific script of the layer2App
// Should be secured and into an iframe with a given api for communication with metamask
const Layer2AppScript = require('../examples/paymentChannel/index')


class Layer2App {

  constructor (opts = {}) {
    const { address, balance, owner, provider } = opts
    this.provider = provider
    this.isLoading = !address || !balance
    this.address = address || '0x0'
    this.balance = new BN(balance || '0', 16)
    this.owner = owner
    this.script = new Layer2AppScript({
      provider: this.provider,
      address: this.address,
    })
    this.update()
    .catch((reason) => {
      console.error('layer2App updating failed', reason)
    })
  }

  async update() {
    const results = await Promise.all([
      this.updateBalance(),
    ])
    this.isLoading = false
    return results
  }

  serialize() {
    return {
      address: this.address,
      balance: this.balance.toString(10),
      string: this.stringify(),
    }
  }

  stringify() {
    //    return util.stringifyBalance(this.balance, this.decimals || new BN(0))
    return util.stringifyBalance(this.balance, 18 || new BN(0))    
  }


  async updateBalance() {
    // const balance = await this.updateValue('balance')
    // this.balance = balance
    // return this.balance
  }

  async updateValue(key) {
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

module.exports = Layer2App
