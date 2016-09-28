'use strict';

var TraceId = require('../src/tracer/TraceId');
var serializeSpan = require('../src/serializeSpan');

var _require = require('../src/internalRepresentations');

var MutableSpan = _require.MutableSpan;
var Endpoint = _require.Endpoint;
var ZipkinAnnotation = _require.ZipkinAnnotation;
var BinaryAnnotation = _require.BinaryAnnotation;

var _require2 = require('../src/option');

var Some = _require2.Some;
var None = _require2.None;


describe('Serialising a span', function () {
  // The Thrift IDL has camel_cased variable names, so we need camel-casing
  // jshint camelcase: false

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

  var expected = 'CgABAAAAAAAAAAoLAAMAAAADR0VUCgAEAAAAAAAAAAwKAAUAA' + 'AAAAAAACw8ABgwAAAACCgABAAAAAAAAAAELAAIAAAACc3IMAA' + 'MIAAEKOTJTBgACH5ALAAMAAAANUG9ydGFsU2VydmljZQAACgA' + 'BAAAAAAAAAAILAAIAAAACc3MMAAMIAAEKOTJTBgACH5ALAAMA' + 'AAANUG9ydGFsU2VydmljZQAADwAIDAAAAAELAAEAAAAHd2Fyb' + 'mluZwsAAgAAABFUaGUgY2FrZSBpcyBhIGxpZQgAAwAAAAYMAA' + 'QIAAEKOTJTBgACH5ALAAMAAAANUG9ydGFsU2VydmljZQAAAgA' + 'JAAA=';

  it('should serialize correctly from MutableSpan to base64 encoded representation', function () {
    var serialized = serializeSpan(ms);
    expect(serialized).to.equal(expected);
  });
});