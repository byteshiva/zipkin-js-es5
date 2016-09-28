'use strict';

/* eslint-disable no-console */
var kafka = require('kafka-node');

var _require = require('zipkin');

var Tracer = _require.Tracer;
var BatchRecorder = _require.BatchRecorder;
var Annotation = _require.Annotation;
var ExplicitContext = _require.ExplicitContext;

var KafkaLogger = require('../src/KafkaLogger');
var makeKafkaServer = require('kafka-please');

function waitPromise(length) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve();
    }, length);
  });
}

describe('Kafka transport - integration test', function () {
  it('should send trace data to Kafka', function (done) {
    this.slow(10 * 1000);
    this.timeout(60 * 1000);
    return makeKafkaServer().then(function (kafkaServer) {
      var producerClient = new kafka.Client('localhost:' + kafkaServer.zookeeperPort, 'zipkin-integration-test-producer');
      var producer = new kafka.Producer(producerClient);
      var client = void 0;
      var kafkaLogger = void 0;
      function finish(arg) {
        /* eslint-disable arrow-body-style */

        var closeProducerClient = function closeProducerClient() {
          return new Promise(function (resolve) {
            return producerClient.close(resolve);
          });
        };
        var closeClient = function closeClient() {
          return client ? new Promise(function (resolve) {
            return client.close(resolve);
          }) : Promise.resolve();
        };

        var closeKafkaLogger = function closeKafkaLogger() {
          return kafkaLogger ? kafkaLogger.close() : Promise.resolve();
        };

        closeKafkaLogger().then(closeProducerClient()).then(closeClient()).then(function () {
          return kafkaServer.close().then(function () {
            return done(arg);
          });
        });
      }

      return new Promise(function (resolve) {
        console.log('creating topic...');
        producer.on('ready', function () {
          producer.createTopics(['zipkin'], true, function (err) {
            if (err) {
              finish(err);
            } else {
              console.log('topic was created');
              resolve();
            }
          });
        });
      }).then(function () {
        return waitPromise(1000);
      }).then(function () {
        client = new kafka.Client('localhost:' + kafkaServer.zookeeperPort, 'zipkin-integration-test-consumer');
        var consumer = new kafka.HighLevelConsumer(client, [{ topic: 'zipkin' }], {
          groupId: 'zipkin'
        });
        consumer.on('message', function (message) {
          console.log('Received Zipkin data from Kafka');
          expect(message.topic).to.equal('zipkin');
          expect(message.value).to.contain('http://example.com');
          consumer.close(true, finish);
        });

        client.on('error', function (err) {
          console.log('client error', err);
          finish(err);
        });
        consumer.on('error', function (err) {
          console.log('consumer error', err);
          consumer.close(true, function () {
            return finish(err);
          });
        });

        kafkaLogger = new KafkaLogger({
          clientOpts: {
            connectionString: 'localhost:' + kafkaServer.zookeeperPort
          }
        });

        var ctxImpl = new ExplicitContext();
        var recorder = new BatchRecorder({ logger: kafkaLogger });
        var tracer = new Tracer({ recorder: recorder, ctxImpl: ctxImpl });

        ctxImpl.scoped(function () {
          tracer.recordAnnotation(new Annotation.ServerRecv());
          tracer.recordServiceName('my-service');
          tracer.recordRpc('GET');
          tracer.recordBinary('http.url', 'http://example.com');
          tracer.recordBinary('http.response_code', '200');
          tracer.recordAnnotation(new Annotation.ServerSend());
        });
      });
    }).catch(function (err) {
      console.error('Big err', err);
      done(err);
    });
  });
});