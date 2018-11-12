const Layer2App = require('./layer2App')
const BlockTracker = require('eth-block-tracker')
const SafeEventEmitter = require('safe-event-emitter')
const deepEqual = require('deep-equal')

class Layer2AppTracker extends SafeEventEmitter {

  constructor (opts = {}) {
    super()
    this.userAddress = opts.userAddress || '0x0'
    this.provider = opts.provider
    const pollingInterval = opts.pollingInterval || 4000
    this.blockTracker = new BlockTracker({
      provider: this.provider,
      pollingInterval,
    })


    const layer2Apps = opts.layer2Apps || []

    console.log("Layer2AppTracker: ", layer2Apps)

    this.layer2Apps = layer2Apps.map((layer2AppOpts) => {
      const app = this.createLayer2AppFrom(layer2AppOpts)
      return app
    })

    console.log("Layer2AppTracker after create: ", layer2Apps)
    
    this.running = true
    this.blockTracker.on('latest', this.updateBalances.bind(this))
    this.blockTracker.start()
  }

  serialize() {
    return this.layer2Apps.map(layer2App => layer2App.serialize())
  }

  async updateBalances() {
    const oldBalances = this.serialize()
    try {
      await Promise.all(this.layer2Apps.map((layer2App) => {
        return layer2App.updateBalance()
      }))

      const newBalances = this.serialize()
      if (!deepEqual(newBalances, oldBalances)) {
        if (this.running) {
          this.emit('update', newBalances)
        }
      }
    } catch (reason) {
      this.emit('error', reason)
    }
  }

  createLayer2AppFrom (opts) {
    console.log(opts)
    const owner = this.userAddress
    const { address, name, balance } = opts
    const provider = this.provider
    const blockTracker = this.blockTracker
    return new Layer2App({ address, name, balance, owner, provider, blockTracker })
  }

  add(opts) {
    const layer2App = this.createLayer2AppFrom(opts)
    this.layer2Apps.push(layer2App)
  }

  stop(){
    this.running = false
    this.blockTracker.stop()
  }
}

module.exports = Layer2AppTracker
