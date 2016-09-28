'use strict';

var sinon = require('sinon');

var _require = require('zipkin');

var Tracer = _require.Tracer;
var ExplicitContext = _require.ExplicitContext;

var fetch = require('node-fetch');
var express = require('express');
var middleware = require('../src/expressMiddleware');

describe('express middleware - integration test', function () {
  it.skip('should create traceId', function () {});
  it('should receive trace info from the client', function (done) {
    var record = sinon.spy();
    var recorder = { record: record };
    var ctxImpl = new ExplicitContext();
    var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });

    ctxImpl.scoped(function () {
      var app = express();
      app.use(middleware({
        tracer: tracer,
        serviceName: 'service-a'
      }));
      app.post('/foo', function (req, res) {
        // Use setTimeout to test that the trace context is propagated into the callback
        var ctx = ctxImpl.getContext();
        setTimeout(function () {
          ctxImpl.letContext(ctx, function () {
            tracer.recordBinary('message', 'hello from within app');
            res.status(202).json({ status: 'OK' });
          });
        }, 10);
      });
      var server = app.listen(0, function () {
        var port = server.address().port;
        var url = 'http://127.0.0.1:' + port + '/foo';
        fetch(url, {
          method: 'post',
          headers: {
            'X-B3-TraceId': 'aaa',
            'X-B3-SpanId': 'bbb',
            'X-B3-Flags': '1'
          }
        }).then(function (res) {
          return res.json();
        }).then(function () {
          server.close();

          var annotations = record.args.map(function (args) {
            return args[0];
          });

          annotations.forEach(function (ann) {
            return expect(ann.traceId.traceId).to.equal('aaa');
          });
          annotations.forEach(function (ann) {
            return expect(ann.traceId.spanId).to.equal('bbb');
          });

          expect(annotations[0].annotation.annotationType).to.equal('ServiceName');
          expect(annotations[0].annotation.serviceName).to.equal('service-a');

          expect(annotations[1].annotation.annotationType).to.equal('Rpc');
          expect(annotations[1].annotation.name).to.equal('POST');

          expect(annotations[2].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[2].annotation.key).to.equal('http.url');
          expect(annotations[2].annotation.value).to.equal(url);

          expect(annotations[3].annotation.annotationType).to.equal('ServerRecv');

          expect(annotations[4].annotation.annotationType).to.equal('LocalAddr');

          expect(annotations[5].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[5].annotation.key).to.equal('X-B3-Flags');
          expect(annotations[5].annotation.value).to.equal('1');

          expect(annotations[6].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[6].annotation.key).to.equal('message');
          expect(annotations[6].annotation.value).to.equal('hello from within app');

          expect(annotations[7].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[7].annotation.key).to.equal('http.status_code');
          expect(annotations[7].annotation.value).to.equal('202');

          expect(annotations[8].annotation.annotationType).to.equal('ServerSend');
          done();
        }).catch(function (err) {
          server.close();
          done(err);
        });
      });
    });
  });

  it('should properly report the URL with a query string', function (done) {
    var record = sinon.spy();
    var recorder = { record: record };
    var ctxImpl = new ExplicitContext();
    var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });

    ctxImpl.scoped(function () {
      var app = express();
      app.use(middleware({
        tracer: tracer,
        serviceName: 'service-a'
      }));
      app.get('/foo', function (req, res) {
        // Use setTimeout to test that the trace context is propagated into the callback
        var ctx = ctxImpl.getContext();
        setTimeout(function () {
          ctxImpl.letContext(ctx, function () {
            tracer.recordBinary('message', 'hello from within app');
            res.status(202).json({ status: 'OK' });
          });
        }, 10);
      });
      var server = app.listen(0, function () {
        var port = server.address().port;
        var url = 'http://127.0.0.1:' + port + '/foo?abc=123';
        fetch(url, {
          method: 'get'
        }).then(function (res) {
          return res.json();
        }).then(function () {
          server.close();

          var annotations = record.args.map(function (args) {
            return args[0];
          });

          expect(annotations[2].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[2].annotation.key).to.equal('http.url');
          expect(annotations[2].annotation.value).to.equal(url);
          done();
        }).catch(function (err) {
          server.close();
          done(err);
        });
      });
    });
  });

  // Once zipkin supports it, we can add a flag to propagate and report 128-bit
  // trace identifiers. Until then, tolerantly read them.
  // https://github.com/openzipkin/zipkin/issues/1298
  it('should drop high bits of a 128bit X-B3-TraceId', function (done) {
    var record = sinon.spy();
    var recorder = { record: record };
    var ctxImpl = new ExplicitContext();
    var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });

    ctxImpl.scoped(function () {
      var app = express();
      app.use(middleware({
        tracer: tracer,
        serviceName: 'service-a'
      }));
      app.post('/foo', function (req, res) {
        // Use setTimeout to test that the trace context is propagated into the callback
        var ctx = ctxImpl.getContext();
        setTimeout(function () {
          ctxImpl.letContext(ctx, function () {
            tracer.recordBinary('message', 'hello from within app');
            res.status(202).json({ status: 'OK' });
          });
        }, 10);
      });
      var server = app.listen(0, function () {
        var port = server.address().port;
        var url = 'http://127.0.0.1:' + port + '/foo';
        fetch(url, {
          method: 'post',
          headers: {
            'X-B3-TraceId': '863ac35c9f6413ad48485a3953bb6124',
            'X-B3-SpanId': '48485a3953bb6124',
            'X-B3-Flags': '1'
          }
        }).then(function (res) {
          return res.json();
        }).then(function () {
          server.close();

          var annotations = record.args.map(function (args) {
            return args[0];
          });

          annotations.forEach(function (ann) {
            return expect(ann.traceId.traceId).to.equal('48485a3953bb6124');
          });
          done();
        }).catch(function (err) {
          server.close();
          done(err);
        });
      });
    });
  });
});