'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('zipkin');

var Annotation = _require.Annotation;


module.exports = function zipkinClient(tracer, Memcached) {
  var serviceName = arguments.length <= 2 || arguments[2] === undefined ? 'memcached' : arguments[2];

  function mkZipkinCallback(callback, id) {
    return function zipkinCallback() {
      tracer.scoped(function () {
        tracer.setId(id);
        tracer.recordAnnotation(new Annotation.ClientRecv());
      });

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      callback.apply(this, args);
    };
  }
  function commonAnnotations(rpc) {
    tracer.recordAnnotation(new Annotation.ClientSend());
    tracer.recordServiceName(serviceName);
    tracer.recordRpc(rpc);
  }

  var ZipkinMemcached = function (_Memcached) {
    _inherits(ZipkinMemcached, _Memcached);

    function ZipkinMemcached() {
      _classCallCheck(this, ZipkinMemcached);

      return _possibleConstructorReturn(this, (ZipkinMemcached.__proto__ || Object.getPrototypeOf(ZipkinMemcached)).apply(this, arguments));
    }

    return ZipkinMemcached;
  }(Memcached);

  function defaultAnnotator(key) {
    tracer.recordBinary('memcached.key', key);
  }
  function multiAnnotator(keys) {
    tracer.recordBinary('memcached.keys', keys.join(','));
  }

  var methodsToWrap = [{ key: 'touch' }, { key: 'get' }, { key: 'gets' }, { key: 'getMulti', annotator: multiAnnotator }, { key: 'set' }, { key: 'replace' }, { key: 'add' }, { key: 'cas' }, { key: 'append' }, { key: 'prepend' }, { key: 'incr' }, { key: 'decr' }, { key: 'del' }];
  methodsToWrap.forEach(function (_ref) {
    var key = _ref.key;
    var annotator = _ref.annotator;

    var actualFn = ZipkinMemcached.prototype[key];
    ZipkinMemcached.prototype[key] = function () {
      var _this2 = this;

      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      var callback = args.pop();
      var id = void 0;
      tracer.scoped(function () {
        id = tracer.createChildId();
        tracer.setId(id);
        commonAnnotations(key);
        if (annotator) {
          annotator.apply(_this2, args);
        } else {
          defaultAnnotator.apply(_this2, args);
        }
      });
      var wrapper = mkZipkinCallback(callback, id);
      var newArgs = [].concat(args, [wrapper]);
      actualFn.apply(this, newArgs);
    };
  });

  return ZipkinMemcached;
};