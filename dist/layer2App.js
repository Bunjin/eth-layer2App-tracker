'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var BN = require('ethjs').BN;
var util = require('./util');

// Import here the specific script of the layer2App
// Should be secured and into an iframe with a given api for communication with metamask
var Layer2AppScript = require('../examples/paymentChannel/index');

var Layer2App = function () {
  function Layer2App() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck3.default)(this, Layer2App);
    var address = opts.address,
        name = opts.name,
        nodeUrl = opts.nodeUrl,
        balance = opts.balance,
        owner = opts.owner,
        provider = opts.provider,
        blockTracker = opts.blockTracker,
        networkId = opts.networkId;

    this.blockTracker = blockTracker;
    this.provider = provider;
    this.isLoading = !address || !balance;
    this.address = address || '0x0';
    this.name = name;
    this.nodeUrl = nodeUrl;
    this.balance = new BN(balance || '0', 16);
    this.owner = owner;
    this.script = new Layer2AppScript({
      blockTracker: this.blockTracker,
      provider: this.provider,
      address: this.address,
      nodeUrl: this.nodeUrl,
      owner: this.owner,
      networkId: this.networkId
    });
    // TODO: make updates event based
    var updateLayer2State = this.updateLayer2State.bind(this);
    setInterval(updateLayer2State, 1000);
    this.update().catch(function (reason) {
      console.error('layer2App updating failed', reason);
    });
  }

  (0, _createClass3.default)(Layer2App, [{
    key: 'serialize',
    value: function serialize() {
      return {
        address: this.address,
        name: this.name,
        nodeUrl: this.nodeUrl,
        balance: this.balance.toString(10),
        string: this.stringify()
      };
    }
  }, {
    key: 'stringify',
    value: function stringify() {
      //    return util.stringifyBalance(this.balance, this.decimals || new BN(0))
      return util.stringifyBalance(this.balance, 18 || new BN(0));
    }
  }, {
    key: 'update',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        var results;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _promise2.default.all([this.updateBalance(), this.updateLayer2State()]);

              case 2:
                results = _context.sent;

                this.isLoading = false;
                return _context.abrupt('return', results);

              case 5:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function update() {
        return _ref.apply(this, arguments);
      }

      return update;
    }()
  }, {
    key: 'updateBalance',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        var balance;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this.script.updateValue("balance");

              case 2:
                balance = _context2.sent;

                this.balance = balance;
                return _context2.abrupt('return', this.balance);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function updateBalance() {
        return _ref2.apply(this, arguments);
      }

      return updateBalance;
    }()
  }, {
    key: 'updateLayer2State',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
        var _this = this;

        var state;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.script.updateLayer2State(function (state) {
                  _this.layer2State = state;
                  //console.log("layer 2 state ", state)
                  return _this.layer2State;
                });

              case 2:
                state = _context3.sent;

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function updateLayer2State() {
        return _ref3.apply(this, arguments);
      }

      return updateLayer2State;
    }()
  }]);
  return Layer2App;
}();

module.exports = Layer2App;