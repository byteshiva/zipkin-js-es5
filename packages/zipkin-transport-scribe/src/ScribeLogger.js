'use strict';

/* eslint-disable no-console */
var _require = require('scribe');

var Scribe = _require.Scribe;

var _require2 = require('zipkin');

var serializeSpan = _require2.serializeSpan;


function ScribeLogger(_ref) {
  var _this = this;

  var scribeHost = _ref.scribeHost;
  var _ref$scribePort = _ref.scribePort;
  var scribePort = _ref$scribePort === undefined ? 9410 : _ref$scribePort;
  var _ref$scribeInterval = _ref.scribeInterval;
  var scribeInterval = _ref$scribeInterval === undefined ? 1000 : _ref$scribeInterval;

  var scribeClient = new Scribe(scribeHost, scribePort, { autoReconnect: true });
  scribeClient.on('error', function () {});

  this.queue = [];

  setInterval(function () {
    if (_this.queue.length > 0) {
      try {
        scribeClient.open(function (err) {
          if (err) {
            console.error('Error writing Zipkin data to Scribe', err);
          } else {
            _this.queue.forEach(function (span) {
              scribeClient.send('zipkin', serializeSpan(span));
            });
            scribeClient.flush();
            _this.queue.length = 0;
          }
        });
      } catch (err) {
        console.error('Error writing Zipkin data to Scribe', err);
      }
    }
  }, scribeInterval);
}
ScribeLogger.prototype.logSpan = function logSpan(span) {
  this.queue.push(span);
};

module.exports = ScribeLogger;