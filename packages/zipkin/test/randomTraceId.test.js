'use strict';

var randomTraceId = require('../src/tracer/randomTraceId');

describe('random trace id', function () {
  it('should never have leading zeroes', function () {
    for (var i = 0; i < 100; i++) {
      var rand = randomTraceId();
      expect(rand.startsWith('0')).to.equal(false);
    }
  });
});