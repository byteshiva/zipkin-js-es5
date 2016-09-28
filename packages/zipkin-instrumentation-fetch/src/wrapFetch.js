'use strict';

var _require = require('zipkin');

var HttpHeaders = _require.HttpHeaders;
var Annotation = _require.Annotation;


function getHeaders(traceId, opts) {
  var headers = opts.headers || {};
  headers[HttpHeaders.TraceId] = traceId.traceId;
  headers[HttpHeaders.SpanId] = traceId.spanId;

  traceId._parentId.ifPresent(function (psid) {
    headers[HttpHeaders.ParentSpanId] = psid;
  });
  traceId.sampled.ifPresent(function (sampled) {
    headers[HttpHeaders.Sampled] = sampled ? '1' : '0';
  });

  return headers;
}

function wrapFetch(fetch, _ref) {
  var serviceName = _ref.serviceName;
  var tracer = _ref.tracer;

  return function zipkinfetch(url) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    return new Promise(function (resolve, reject) {
      tracer.scoped(function () {
        tracer.setId(tracer.createChildId());
        var traceId = tracer.id;

        var method = opts.method || 'GET';
        tracer.recordServiceName(serviceName);
        tracer.recordRpc(method.toUpperCase());
        tracer.recordBinary('http.url', url);
        tracer.recordAnnotation(new Annotation.ClientSend());

        var headers = getHeaders(traceId, opts);
        var zipkinOpts = Object.assign({}, opts, { headers: headers });

        fetch(url, zipkinOpts).then(function (res) {
          tracer.scoped(function () {
            tracer.setId(traceId);
            tracer.recordBinary('http.status_code', res.status.toString());
            tracer.recordAnnotation(new Annotation.ClientRecv());
          });
          resolve(res);
        }).catch(function (err) {
          tracer.scoped(function () {
            tracer.setId(traceId);
            tracer.recordBinary('request.error', err.toString());
            tracer.recordAnnotation(new Annotation.ClientRecv());
          });
          reject(err);
        });
      });
    });
  };
}

module.exports = wrapFetch;