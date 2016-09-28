'use strict';

var _require = require('../src/option');

var Some = _require.Some;

var TraceId = require('../src/tracer/TraceId');

describe('TraceId', function () {
  it('should leave 64bit trace ids alone', function () {
    var traceId = new TraceId({
      traceId: new Some('48485a3953bb6124'),
      spanId: '48485a3953bb6124'
    });
    expect(traceId.traceId).to.equal('48485a3953bb6124');
  });

  it('should drop high bits of a 128bit trace id', function () {
    var traceId = new TraceId({
      traceId: new Some('863ac35c9f6413ad48485a3953bb6124'),
      spanId: '48485a3953bb6124'
    });
    expect(traceId.traceId).to.equal('48485a3953bb6124');
  });
});