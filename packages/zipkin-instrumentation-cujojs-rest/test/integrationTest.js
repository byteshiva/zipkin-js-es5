'use strict';

var _require = require('zipkin');

var Tracer = _require.Tracer;
var ExplicitContext = _require.ExplicitContext;

var express = require('express');
var sinon = require('sinon');
var rest = require('rest');
var restInterceptor = require('../src/restInterceptor');

describe('cujojs rest interceptor - integration test', function () {
  it('should add headers to requests', function (done) {
    var app = express();
    app.get('/abc', function (req, res) {
      res.status(202).json({
        traceId: req.header('X-B3-TraceId'),
        spanId: req.header('X-B3-SpanId')
      });
    });

    var server = app.listen(0, function () {
      var record = sinon.spy();
      var recorder = { record: record };
      var ctxImpl = new ExplicitContext();
      var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });

      tracer.scoped(function () {
        var client = rest.wrap(restInterceptor, { tracer: tracer, serviceName: 'service-a' });
        var port = server.address().port;
        var path = 'http://127.0.0.1:' + port + '/abc';
        client(path).then(function (successResponse) {
          var responseData = JSON.parse(successResponse.entity);
          server.close();

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
          expect(annotations[0].annotation.serviceName).to.equal('service-a');

          expect(annotations[1].annotation.annotationType).to.equal('Rpc');
          expect(annotations[1].annotation.name).to.equal('GET');

          expect(annotations[2].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[2].annotation.key).to.equal('http.url');
          expect(annotations[2].annotation.value).to.equal(path);

          expect(annotations[3].annotation.annotationType).to.equal('ClientSend');

          expect(annotations[4].annotation.annotationType).to.equal('BinaryAnnotation');
          expect(annotations[4].annotation.key).to.equal('http.status_code');
          expect(annotations[4].annotation.value).to.equal('202');

          expect(annotations[5].annotation.annotationType).to.equal('ClientRecv');

          var traceIdOnServer = responseData.traceId;
          expect(traceIdOnServer).to.equal(traceId);

          var spanIdOnServer = responseData.spanId;
          expect(spanIdOnServer).to.equal(spanId);

          done();
        }, function (errorResponse) {
          if (errorResponse instanceof Error) {
            done(errorResponse);
          } else {
            server.close();
            done(new Error('The request failed: ' + errorResponse.error.toString()));
          }
        });
      });
    });
  });
});