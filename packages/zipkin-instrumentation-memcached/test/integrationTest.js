'use strict';

var sinon = require('sinon');

var _require = require('zipkin');

var Tracer = _require.Tracer;
var ExplicitContext = _require.ExplicitContext;

var zipkinClient = require('../src/zipkinClient');

var membachedConnectionOptions = {
  timeout: 1000,
  idle: 1000,
  failures: 0,
  retries: 0,
  poolsize: 1
};

var Memcached = require('memcached');

function getMemcached(tracer) {
  return new (zipkinClient(tracer, Memcached))('localhost:11211', membachedConnectionOptions);
}

describe('membached interceptor', function () {
  it('should add zipkin annotations', function (done) {
    var ctxImpl = new ExplicitContext();
    var recorder = { record: sinon.spy() };
    // const recorder = new ConsoleRecorder();
    var tracer = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });

    var memcached = getMemcached(tracer);
    memcached.on('error', done);
    tracer.setId(tracer.createRootId());
    var ctx = ctxImpl.getContext();
    memcached.set('ping', 'pong', 10, function () {
      ctxImpl.letContext(ctx, function () {
        memcached.get('ping', function () {
          var annotations = recorder.record.args.map(function (args) {
            return args[0];
          });
          var firstAnn = annotations[0];

          expect(annotations).to.have.length(10);

          function runTest(start, stop) {
            var lastSpanId = void 0;
            annotations.slice(start, stop).forEach(function (ann) {
              if (!lastSpanId) {
                lastSpanId = ann.traceId.spanId;
              }
              expect(ann.traceId.spanId).to.equal(lastSpanId);
            });
          }

          runTest(0, 5);
          runTest(5, 10);

          expect(annotations[0].traceId.spanId).not.to.equal(annotations[5].traceId.spanId);

          annotations.forEach(function (ann) {
            expect(ann.traceId.parentId).to.equal(firstAnn.traceId.traceId);
            expect(ann.traceId.spanId).not.to.equal(firstAnn.traceId.traceId);
            expect(ann.traceId.traceId).to.equal(firstAnn.traceId.traceId);
          });

          done();
        });
      });
    });
  });

  it('should run memcached calls', function (done) {
    var ctxImpl = new ExplicitContext();
    var recorder = { record: function record() {} };
    var tracer = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });
    var memcached = getMemcached(tracer);
    memcached.on('error', done);
    memcached.set('foo', 'bar', 10, function (err) {
      if (err) {
        done(err);
      } else {
        memcached.getMulti(['foo', 'fox'], function (err2, data) {
          if (err2) {
            done(err2);
          } else {
            expect(data).to.deep.equal({ foo: 'bar' });
            done();
          }
        });
      }
    });
  });
});