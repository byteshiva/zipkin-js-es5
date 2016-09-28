'use strict';

var option = require('./src/option');

var Annotation = require('./src/annotation');
var Tracer = require('./src/tracer');
var createNoopTracer = require('./src/tracer/noop');
var TraceId = require('./src/tracer/TraceId');
var sampler = require('./src/tracer/sampler');

var HttpHeaders = require('./src/httpHeaders');
var InetAddress = require('./src/InetAddress');

var BatchRecorder = require('./src/batch-recorder');
var ConsoleRecorder = require('./src/console-recorder');

var serializeSpan = require('./src/serializeSpan');
var ExplicitContext = require('./src/explicit-context');

module.exports = {
  Tracer: Tracer,
  createNoopTracer: createNoopTracer,
  TraceId: TraceId,
  option: option,
  Annotation: Annotation,
  InetAddress: InetAddress,
  HttpHeaders: HttpHeaders,
  BatchRecorder: BatchRecorder,
  ConsoleRecorder: ConsoleRecorder,
  serializeSpan: serializeSpan,
  ExplicitContext: ExplicitContext,
  sampler: sampler
};