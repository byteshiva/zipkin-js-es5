'use strict';

var sinon = require('sinon');
var lolex = require('lolex');
var Tracer = require('../src/tracer');
var BatchRecorder = require('../src/batch-recorder');
var TraceId = require('../src/tracer/TraceId');
var Annotation = require('../src/annotation');
var InetAddress = require('../src/InetAddress');

var _require = require('../src/option');

var Some = _require.Some;
var None = _require.None;

var ExplicitContext = require('../src/explicit-context');

describe('Batch Recorder', function () {
  it('should accumulate annotations into MutableSpans', function () {
    var logSpan = sinon.spy();

    var ctxImpl = new ExplicitContext();
    var logger = { logSpan: logSpan };
    var recorder = new BatchRecorder({ logger: logger });
    var trace = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });

    ctxImpl.scoped(function () {
      trace.setId(new TraceId({
        traceId: None,
        parentId: new Some('a'),
        spanId: 'c',
        sampled: new Some(true)
      }));

      trace.recordServiceName('SmoothieStore');
      trace.recordRpc('buySmoothie');
      trace.recordBinary('taste', 'banana');
      trace.recordAnnotation(new Annotation.ServerRecv());
      trace.recordAnnotation(new Annotation.LocalAddr({
        host: new InetAddress('127.0.0.1'),
        port: 7070
      }));

      // Should only log after the span is complete
      expect(logSpan.calledOnce).to.equal(false);
      trace.recordAnnotation(new Annotation.ServerSend());
      expect(logSpan.calledOnce).to.equal(true);

      var loggedSpan = logSpan.getCall(0).args[0];

      expect(loggedSpan.traceId.traceId).to.equal('a');
      expect(loggedSpan.traceId.parentId).to.equal('a');
      expect(loggedSpan.traceId.spanId).to.equal('c');
      expect(loggedSpan.complete).to.equal(true);
      expect(loggedSpan.name).to.eql(new Some('buySmoothie'));
      expect(loggedSpan.service).to.eql(new Some('SmoothieStore'));
      expect(loggedSpan.endpoint.host).to.equal(2130706433);
      expect(loggedSpan.endpoint.port).to.equal(7070);
      expect(loggedSpan.binaryAnnotations[0].key).to.equal('taste');
      expect(loggedSpan.binaryAnnotations[0].value).to.equal('banana');
      expect(loggedSpan.annotations[0].value).to.equal('sr');
      expect(loggedSpan.annotations[1].value).to.equal('ss');
    });
  });

  it('should set MutableSpan.started to first record', function () {
    var logSpan = sinon.spy();

    var ctxImpl = new ExplicitContext();
    var logger = { logSpan: logSpan };
    var recorder = new BatchRecorder({ logger: logger });
    var trace = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });

    ctxImpl.scoped(function () {
      trace.setId(new TraceId({
        traceId: None,
        parentId: new Some('a'),
        spanId: 'c',
        sampled: new Some(true)
      }));
      var clock = lolex.install(12345678);
      trace.recordServiceName('SmoothieStore');

      clock.tick(1); // everything else is beyond this
      trace.recordRpc('buySmoothie');
      trace.recordBinary('taste', 'banana');
      trace.recordAnnotation(new Annotation.ServerRecv());
      trace.recordAnnotation(new Annotation.ServerSend());

      var loggedSpan = logSpan.getCall(0).args[0];

      expect(loggedSpan.started).to.equal(12345678000);

      clock.uninstall();
    });
  });

  it('should flush Spans not finished within a minute timeout', function () {
    var clock = lolex.install();

    var logSpan = sinon.spy();
    var ctxImpl = new ExplicitContext();
    var logger = { logSpan: logSpan };
    var recorder = new BatchRecorder({ logger: logger });
    var trace = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });

    ctxImpl.scoped(function () {
      trace.setId(new TraceId({
        traceId: None,
        parentId: new Some('a'),
        spanId: 'c',
        sampled: new Some(true)
      }));

      trace.recordServiceName('SmoothieStore');

      clock.tick('02'); // polling interval is every second
      expect(logSpan.calledOnce).to.equal(false);

      clock.tick('01:00'); // 1 minute is the default timeout
      expect(logSpan.calledOnce).to.equal(true);
    });

    clock.uninstall();
  });
});