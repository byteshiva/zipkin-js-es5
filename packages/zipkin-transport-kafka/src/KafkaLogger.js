'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var kafka = require('kafka-node');

var _require = require('zipkin');

var serializeSpan = _require.serializeSpan;


module.exports = function () {
  function KafkaLogger(options) {
    var _this = this;

    _classCallCheck(this, KafkaLogger);

    var clientDefaults = {
      clientId: 'zipkin-transport-kafka',
      zkOpts: {}
    };
    var clientOpts = Object.assign({}, clientDefaults, options.clientOpts || {});
    var producerDefaults = {
      requireAcks: 0
    };
    var producerOpts = Object.assign({}, producerDefaults, options.producerOpts || {});
    this.producerPromise = new Promise(function (resolve, reject) {
      _this.topic = options.topic || 'zipkin';
      _this.client = new kafka.Client(clientOpts.connectionString, clientOpts.clientId, clientOpts.zkOpts);
      var producer = new kafka.HighLevelProducer(_this.client, producerOpts);
      producer.on('ready', function () {
        return resolve(producer);
      });
      producer.on('error', reject);
    });
  }

  _createClass(KafkaLogger, [{
    key: 'logSpan',
    value: function logSpan(span) {
      var _this2 = this;

      this.producerPromise.then(function (producer) {
        var data = serializeSpan(span, 'binary');
        producer.send([{
          topic: _this2.topic,
          messages: data
        }], function () {});
      });
    }
  }, {
    key: 'close',
    value: function close() {
      var _this3 = this;

      return new Promise(function (resolve) {
        return _this3.client.close(resolve);
      });
    }
  }]);

  return KafkaLogger;
}();