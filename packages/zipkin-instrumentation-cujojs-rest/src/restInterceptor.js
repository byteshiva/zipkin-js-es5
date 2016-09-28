'use strict';

/* eslint-disable no-param-reassign */
var interceptor = require('rest/interceptor');

var _require = require('zipkin');

var Header = _require.HttpHeaders;
var Annotation = _require.Annotation;


function getRequestMethod(req) {
  var method = 'get';
  if (req.entity) {
    method = 'post';
  }
  if (req.method) {
    method = req.method;
  }
  return method;
}

function request(req, _ref) {
  var _this = this;

  var serviceName = _ref.serviceName;
  var tracer = _ref.tracer;

  tracer.scoped(function () {
    tracer.setId(tracer.createChildId());
    var traceId = tracer.id;
    _this.traceId = traceId;

    req.headers = req.headers || {};
    req.headers[Header.TraceId] = traceId.traceId;
    req.headers[Header.SpanId] = traceId.spanId;
    traceId._parentId.ifPresent(function (psid) {
      req.headers[Header.ParentSpanId] = psid;
    });
    traceId.sampled.ifPresent(function (sampled) {
      req.headers[Header.Sampled] = sampled ? '1' : '0';
    });

    var method = getRequestMethod(req);
    tracer.recordServiceName(serviceName);
    tracer.recordRpc(method.toUpperCase());
    tracer.recordBinary('http.url', req.path);
    tracer.recordAnnotation(new Annotation.ClientSend());
  });

  return req;
}

function response(res, _ref2) {
  var _this2 = this;

  var tracer = _ref2.tracer;

  tracer.scoped(function () {
    tracer.setId(_this2.traceId);
    tracer.recordBinary('http.status_code', res.status.code.toString());
    tracer.recordAnnotation(new Annotation.ClientRecv());
  });
  return res;
}

module.exports = interceptor({
  request: request,
  response: response
});