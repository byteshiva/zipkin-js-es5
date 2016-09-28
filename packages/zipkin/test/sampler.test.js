'use strict';

var TraceId = require('../src/tracer/TraceId');

var _require = require('../src/tracer/sampler');

var Sampler = _require.Sampler;
var CountingSampler = _require.CountingSampler;

var _require2 = require('../src/option');

var Some = _require2.Some;
var None = _require2.None;


var T = new Some(true);
var F = new Some(false);

function makeTestTraceId(_ref) {
  var _ref$flags = _ref.flags;
  var flags = _ref$flags === undefined ? 0 : _ref$flags;
  var _ref$sampled = _ref.sampled;
  var sampled = _ref$sampled === undefined ? None : _ref$sampled;

  return new TraceId({
    traceId: new Some('abc'),
    parentId: new Some('123'),
    spanId: 'fab',
    sampled: sampled,
    flags: flags
  });
}

describe('Sampler', function () {
  it('should respect the debug flag', function () {
    var neverSample = function neverSample() {
      return false;
    };
    var sampler = new Sampler(neverSample);
    expect(sampler.shouldSample(makeTestTraceId({ flags: 1 }))).to.eql(T);
  });
  it('should respect the "sampled" property when true', function () {
    var neverSample = function neverSample() {
      return false;
    };
    var sampler = new Sampler(neverSample());
    expect(sampler.shouldSample(makeTestTraceId({ sampled: T }))).to.eql(T);
  });
  it('should respect the "sampled" property when false', function () {
    var alwaysSample = function alwaysSample() {
      return true;
    };
    var sampler2 = new Sampler(alwaysSample());
    expect(sampler2.shouldSample(makeTestTraceId({ sampled: F }))).to.eql(F);
  });
});

describe('CountingSampler', function () {
  it('should have a toString method', function () {
    var sampler = new CountingSampler(0.42);
    expect(sampler.toString()).to.equal('Sampler(countingSampler: sampleRate=0.42)');
  });

  it('should show "never sample" in toString when sampleRate is 0', function () {
    var sampler = new CountingSampler(0);
    expect(sampler.toString()).to.equal('Sampler(never sample)');
  });

  it('should count, and sample every fourth sample (sample rate 0.25)', function () {
    var sampler = new CountingSampler(0.25);
    var s = function s() {
      return sampler.shouldSample(makeTestTraceId({}));
    };

    var sampled = [s(), s(), s(), s(), s(), s(), s(), s(), s()];
    var expected = [T, F, F, F, T, F, F, F, T];

    expect(sampled).to.deep.equal(expected);
  });

  it('should count, and sample every second sample (sample rate 0.5)', function () {
    var sampler = new CountingSampler(0.5);
    var s = function s() {
      return sampler.shouldSample(makeTestTraceId({}));
    };

    var sampled = [s(), s(), s(), s(), s(), s(), s(), s(), s()];
    var expected = [T, F, T, F, T, F, T, F, T];

    expect(sampled).to.deep.equal(expected);
  });

  it('should not sample when sample rate is 0', function () {
    var sampler = new CountingSampler(0);
    var s = function s() {
      return sampler.shouldSample(makeTestTraceId({}));
    };

    var sampled = [s(), s(), s(), s(), s(), s(), s(), s(), s()];
    var expected = [F, F, F, F, F, F, F, F, F];

    expect(sampled).to.deep.equal(expected);
  });

  it('sample rate >= 1 should always sample', function () {
    expect(new CountingSampler(5).toString()).to.equal('Sampler(always sample)');
  });
});