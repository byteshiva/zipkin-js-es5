'use strict';

var _require = require('thrift');

var TBufferedTransport = _require.TBufferedTransport;
var TBinaryProtocol = _require.TBinaryProtocol;

var _require2 = require('base64-js');

var base64encode = _require2.fromByteArray;


var serialized = void 0;
var transport = new TBufferedTransport(null, function (res) {
  serialized = res;
});

var protocol = new TBinaryProtocol(transport);

module.exports = function serializeSpan(span) {
  var format = arguments.length <= 1 || arguments[1] === undefined ? 'base64' : arguments[1];

  span.toThrift().write(protocol);
  protocol.flush();
  if (format === 'base64') {
    return base64encode(serialized);
  } else {
    return serialized;
  }
};