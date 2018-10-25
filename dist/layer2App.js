'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

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
        balance = opts.balance,
        owner = opts.owner,
        provider = opts.provider;

    this.provider = provider;
    this.isLoading = !address || !balance;
    this.address = address || '0x0';
    this.balance = new BN(balance || '0', 16);
    this.owner = owner;
    this.script = new Layer2AppScript({
      provider: this.provider,
      address: this.address
    });
    this.update().catch(function (reason) {
      console.error('layer2App updating failed', reason);
    });
  }

  (0, _createClass3.default)(Layer2App, [{
    key: 'update',
    value: function () {
      var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
        var results;
        return _regenerator2.default.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return _promise2.default.all([this.updateBalance()]);

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
    key: 'serialize',
    value: function serialize() {
      return {
        address: this.address,
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
    key: 'updateBalance',
    value: function () {
      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
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
    key: 'updateValue',
    value: function () {
      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(key) {
        var methodName, args, result, _contract, val;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                methodName = void 0;
                args = [];
                _context3.t0 = key;
                _context3.next = _context3.t0 === 'balance' ? 5 : 8;
                break;

              case 5:
                methodName = 'balanceOf';
                args = [this.owner];
                return _context3.abrupt('break', 9);

              case 8:
                methodName = key;

              case 9:
                result = void 0;
                _context3.prev = 10;
                _context3.next = 13;
                return (_contract = this.contract)[methodName].apply(_contract, (0, _toConsumableArray3.default)(args));

              case 13:
                result = _context3.sent;
                _context3.next = 21;
                break;

              case 16:
                _context3.prev = 16;
                _context3.t1 = _context3['catch'](10);

                console.warn('failed to load ' + key + ' for layer2App at ' + this.address);

                if (!(key === 'balance')) {
                  _context3.next = 21;
                  break;
                }

                throw _context3.t1;

              case 21:
                if (!result) {
                  _context3.next = 25;
                  break;
                }

                val = result[0];

                this[key] = val;
                return _context3.abrupt('return', val);

              case 25:
                return _context3.abrupt('return', this[key]);

              case 26:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this, [[10, 16]]);
      }));

      function updateValue(_x2) {
        return _ref3.apply(this, arguments);
      }

      return updateValue;
    }()
  }]);
  return Layer2App;
}();

module.exports = Layer2App;