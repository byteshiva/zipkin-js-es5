'use strict';

var _require = require('zipkin');

var Tracer = _require.Tracer;
var ExplicitContext = _require.ExplicitContext;
var createNoopTracer = _require.createNoopTracer;

var express = require('express');
var nodeFetch = require('node-fetch');
var sinon = require('sinon');
var wrapFetch = require('../src/wrapFetch');

describe('wrapFetch', function () {
  before(function (done) {
    var _this = this;

    var app = express();
    app.post('/user', function (req, res) {
      return res.status(202).json({
        traceId: req.header('X-B3-TraceId') || '?',
        spanId: req.header('X-B3-SpanId') || '?'
      });
    });
    app.get('/user', function (req, res) {
      return res.status(202).json({});
    });
    this.server = app.listen(0, function () {
      _this.port = _this.server.address().port;
      done();
    });
  });

  after(function (done) {
    this.server.close(done);
  });

  it('should add instrumentation to "fetch"', function (done) {
    var _this2 = this;

    var record = sinon.spy();
    var recorder = { record: record };
    var ctxImpl = new ExplicitContext();
    var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });

    var fetch = wrapFetch(nodeFetch, { serviceName: 'user-service', tracer: tracer });

    ctxImpl.scoped(function () {
      var id = tracer.createChildId();
      tracer.setId(id);

      var path = 'http://127.0.0.1:' + _this2.port + '/user';
      fetch(path, { method: 'post' }).then(function (res) {
        return res.json();
      }).then(function (data) {
        var annotations = record.args.map(function (args) {
          return args[0];
        });

        // All annotations should have the same trace id and span id
        var traceId = annotations[0].traceId.traceId;
        var spanId = annotations[0].traceId.spanId;
        annotations.forEach(function (ann) {
          return expect(ann.traceId.traceId).to.equal(traceId);
        });
        annotations.forEach(function (ann) {
          return expect(ann.traceId.spanId).to.equal(spanId);
        });

        expect(annotations[0].annotation.annotationType).to.equal('ServiceName');
        expect(annotations[0].annotation.serviceName).to.equal('user-service');

        expect(annotations[1].annotation.annotationType).to.equal('Rpc');
        expect(annotations[1].annotation.name).to.equal('POST');

        expect(annotations[2].annotation.annotationType).to.equal('BinaryAnnotation');
        expect(annotations[2].annotation.key).to.equal('http.url');
        expect(annotations[2].annotation.value).to.equal(path);

        expect(annotations[3].annotation.annotationType).to.equal('ClientSend');

        expect(annotations[4].annotation.annotationType).to.equal('BinaryAnnotation');
        expect(annotations[4].annotation.key).to.equal('http.status_code');
        expect(annotations[4].annotation.value).to.equal('202');

        expect(annotations[5].annotation.annotationType).to.equal('ClientRecv');

        var traceIdOnServer = data.traceId;
        expect(traceIdOnServer).to.equal(traceId);

        var spanIdOnServer = data.spanId;
        expect(spanIdOnServer).to.equal(spanId);
      }).then(done).catch(done);
    });
  });

  it('should not throw when using fetch without options', function (done) {
    var tracer = createNoopTracer();
    var fetch = wrapFetch(nodeFetch, { serviceName: 'user-service', tracer: tracer });

    var path = 'http://127.0.0.1:' + this.port + '/user';
    fetch(path).then(function (res) {
      return res.json();
    }).then(function () {
      done();
    }).catch(done);
  });
});