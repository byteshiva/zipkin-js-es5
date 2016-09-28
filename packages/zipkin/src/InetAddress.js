'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var networkAddress = require('network-address');

var InetAddress = function () {
  function InetAddress(addr) {
    _classCallCheck(this, InetAddress);

    this.addr = addr;
  }

  _createClass(InetAddress, [{
    key: 'toInt',
    value: function toInt() {
      // e.g. 10.57.50.83
      // should become
      // 171520595
      var parts = this.addr.split('.');

      // The jshint tool always complains about using bitwise operators,
      // but in this case it's actually intentional, so we disable the warning:
      // jshint bitwise: false
      return parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3];
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'InetAddress(' + this.addr + ')';
    }
  }]);

  return InetAddress;
}();

InetAddress.getLocalAddress = function getLocalAddress() {
  return new InetAddress(networkAddress.ipv4());
};

module.exports = InetAddress;