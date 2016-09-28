'use strict';

var TraceId = require('../src/tracer/TraceId');

var _require = require('../src/internalRepresentations');

var MutableSpan = _require.MutableSpan;
var Endpoint = _require.Endpoint;
var ZipkinAnnotation = _require.ZipkinAnnotation;
var BinaryAnnotation = _require.BinaryAnnotation;

var _require2 = require('../src/option');

var Some = _require2.Some;
var None = _require2.None;


describe('JSON Formatting', function () {
  var ms = new MutableSpan(new TraceId({
    traceId: new Some('a'),
    parentId: new Some('b'),
    spanId: 'c',
    sampled: None
  }));
  ms.setName('GET');
  ms.setServiceName('PortalService');

  var here = new Endpoint({ host: 171520595, port: 8080 });

  ms.setEndpoint(here);
  ms.addBinaryAnnotation(new BinaryAnnotation({
    key: 'warning',
    value: 'The cake is a lie',
    endpoint: here
  }));
  ms.addAnnotation(new ZipkinAnnotation({
    timestamp: 1,
    endpoint: here,
    value: 'sr'
  }));
  ms.addAnnotation(new ZipkinAnnotation({
    timestamp: 2,
    endpoint: here,
    value: 'ss'
  }));
  ms.started = 1468441525803803;

  var expected = {
    traceId: 'a',
    name: 'GET',
    id: 'c',
    parentId: 'b',
    timestamp: 1468441525803803,
    annotations: [{
      endpoint: {
        serviceName: 'PortalService',
        ipv4: '10.57.50.83',
        port: 8080
      },
      timestamp: 1,
      value: 'sr'
    }, {
      endpoint: {
        serviceName: 'PortalService',
        ipv4: '10.57.50.83',
        port: 8080
      },
      timestamp: 2,
      value: 'ss'
    }],
    binaryAnnotations: [{
      key: 'warning',
      value: 'The cake is a lie',
      endpoint: {
        serviceName: 'PortalService',
        ipv4: '10.57.50.83',
        port: 8080
      }
    }]
  };

  it('should transform correctly from MutableSpan to JSON representation', function () {
    var spanJson = ms.toJSON();
    expect(spanJson.traceId).to.equal(expected.traceId);
    expect(spanJson.name).to.equal(expected.name);
    expect(spanJson.id).to.equal(expected.id);
    expect(spanJson.parentId).to.equal(expected.parentId);
    expect(spanJson.annotations).to.deep.equal(expected.annotations);
    expect(spanJson.binaryAnnotations).to.deep.equal(expected.binaryAnnotations);
  });
});