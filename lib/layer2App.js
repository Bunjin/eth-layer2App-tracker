const BN = require('ethjs').BN
const util = require('./util')


// Import here the specific script of the layer2App
// Should be secured and into an iframe with a given api for communication with metamask
const Layer2AppScript = require('../examples/paymentChannel/index')


class Layer2App {

  constructor (opts = {}) {
    const { address, name, nodeUrl, balance, owner, provider, blockTracker } = opts
    this.blockTracker = blockTracker
    this.provider = provider
    this.isLoading = !address || !balance
    this.address = address || '0x0'
    this.name = name
    this.nodeUrl = nodeUrl
    this.balance = new BN(balance || '0', 16)
    this.owner = owner
    this.script = new Layer2AppScript({
      blockTracker: this.blockTracker,
      provider: this.provider,
      address: this.address,
      nodeUrl: this.nodeUrl,
      owner: this.owner,
    })
    this.update()
    .catch((reason) => {
      console.error('layer2App updating failed', reason)
    })
  }

  serialize() {
    return {
      address: this.address,
      name: this.name,
      nodeUrl: this.nodeUrl,
      balance: this.balance.toString(10),
      string: this.stringify(),
    }
  }

  stringify() {
    //    return util.stringifyBalance(this.balance, this.decimals || new BN(0))
    return util.stringifyBalance(this.balance, 18 || new BN(0))    
  }

  async update() {
    const results = await Promise.all([
      this.updateBalance(),
    ])
    this.isLoading = false
    return results
  }
  

  async updateBalance() {
    const balance = await this.script.updateValue("balance")
    this.balance = balance
    return this.balance
  }


}

module.exports = Layer2App
