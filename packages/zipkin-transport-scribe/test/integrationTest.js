'use strict';

var _require = require('zipkin');

var Tracer = _require.Tracer;
var TraceId = _require.TraceId;
var BatchRecorder = _require.BatchRecorder;
var Annotation = _require.Annotation;
var ExplicitContext = _require.ExplicitContext;
var Some = _require.option.Some;

var thrift = require('thrift');
var sinon = require('sinon');
var ScribeLogger = require('../src/ScribeLogger');
var Scribe = require('./gen-nodejs/scribe');

var _require2 = require('./gen-nodejs/scribeServer_types');

var ResultCode = _require2.ResultCode;


describe('Scribe transport - integration test', function () {
  it('should send trace data to Scribe', function (done) {
    var logSpy = sinon.spy();
    var scribeHandler = {
      Log: function Log(messages, result) {
        logSpy(messages, result);
        result(ResultCode.OK);
      }
    };

    var server = thrift.createServer(Scribe, scribeHandler, {
      transport: thrift.TFramedTransport,
      protocol: thrift.TBinaryProtocol
    });
    var scribeServer = server.listen(0, function () {
      var port = scribeServer.address().port;
      var logger = new ScribeLogger({
        scribeHost: '127.0.0.1',
        scribePort: port,
        scribeInterval: 1
      });

      var ctxImpl = new ExplicitContext();
      var recorder = new BatchRecorder({ logger: logger });
      var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });
      ctxImpl.scoped(function () {
        var id = new TraceId({
          traceId: new Some('abc'),
          parentId: new Some('def'),
          spanId: '123',
          sampled: new Some(true),
          flags: 0
        });
        tracer.setId(id);
        tracer.recordAnnotation(new Annotation.ClientSend());
        tracer.recordAnnotation(new Annotation.ClientRecv());
        setTimeout(function () {
          scribeServer.close();
          expect(logSpy.getCall(0).args[0][0].message).to.include('CgABAAAAAAAACrwLAAMAAAAHVW5rbm93bgoABAAAAAAAAAEj');
          done();
        }, 50);
      });
    });
  });
});