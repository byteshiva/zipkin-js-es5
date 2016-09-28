'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('./time');

var now = _require.now;

var thriftTypes = require('./gen-nodejs/zipkinCore_types');

var _require2 = require('./internalRepresentations');

var MutableSpan = _require2.MutableSpan;
var Endpoint = _require2.Endpoint;
var ZipkinAnnotation = _require2.ZipkinAnnotation;
var BinaryAnnotation = _require2.BinaryAnnotation;

var BatchRecorder = function () {
  function BatchRecorder(_ref) {
    var _this = this;

    var logger = _ref.logger;
    var _ref$timeout = _ref.timeout;
    var timeout = _ref$timeout === undefined ? 60 * 1000000 : _ref$timeout;

    _classCallCheck(this, BatchRecorder);

    this.logger = logger;
    this.timeout = timeout;
    this.partialSpans = new Map();

    // read through the partials spans regularly
    // and collect any timed-out ones
    var timer = setInterval(function () {
      _this.partialSpans.forEach(function (span, id) {
        if (_this._timedOut(span)) {
          _this._writeSpan(id);
        }
      });
    }, 1000);
    if (timer.unref) {
      // unref might not be available in browsers
      timer.unref(); // Allows Node to terminate instead of blocking on timer
    }
  }

  _createClass(BatchRecorder, [{
    key: '_writeSpan',
    value: function _writeSpan(id) {
      var spanToWrite = this.partialSpans.get(id);
      // ready for garbage collection
      this.partialSpans.delete(id);
      this.logger.logSpan(spanToWrite);
    }
  }, {
    key: '_updateSpanMap',
    value: function _updateSpanMap(id, updater) {
      var span = void 0;
      if (this.partialSpans.has(id)) {
        span = this.partialSpans.get(id);
      } else {
        span = new MutableSpan(id);
      }
      updater(span);
      if (span.complete) {
        this._writeSpan(id);
      } else {
        this.partialSpans.set(id, span);
      }
    }
  }, {
    key: '_timedOut',
    value: function _timedOut(span) {
      return span.started + this.timeout < now();
    }
  }, {
    key: '_annotate',
    value: function _annotate(span, _ref2, value) {
      var timestamp = _ref2.timestamp;

      span.addAnnotation(new ZipkinAnnotation({
        timestamp: timestamp,
        value: value
      }));
    }
  }, {
    key: '_binaryAnnotate',
    value: function _binaryAnnotate(span, key, value) {
      span.addBinaryAnnotation(new BinaryAnnotation({
        key: key,
        value: value,
        annotationType: thriftTypes.AnnotationType.STRING
      }));
    }
  }, {
    key: 'record',
    value: function record(rec) {
      var _this2 = this;

      var id = rec.traceId;

      this._updateSpanMap(id, function (span) {
        switch (rec.annotation.annotationType) {
          case 'ClientSend':
            _this2._annotate(span, rec, thriftTypes.CLIENT_SEND);
            break;
          case 'ClientRecv':
            _this2._annotate(span, rec, thriftTypes.CLIENT_RECV);
            break;
          case 'ServerSend':
            _this2._annotate(span, rec, thriftTypes.SERVER_SEND);
            break;
          case 'ServerRecv':
            _this2._annotate(span, rec, thriftTypes.SERVER_RECV);
            break;
          case 'Message':
            _this2._annotate(span, rec, rec.annotation.message);
            break;
          case 'Rpc':
            span.setName(rec.annotation.name);
            break;
          case 'ServiceName':
            span.setServiceName(rec.annotation.serviceName);
            break;
          case 'BinaryAnnotation':
            _this2._binaryAnnotate(span, rec.annotation.key, rec.annotation.value);
            break;
          case 'LocalAddr':
            span.setEndpoint(new Endpoint({
              host: rec.annotation.host.toInt(),
              port: rec.annotation.port
            }));
            break;
          default:
            break;
        }
      });
    }
  }, {
    key: 'toString',
    value: function toString() {
      return 'BatchRecorder()';
    }
  }]);

  return BatchRecorder;
}();

module.exports = BatchRecorder;