'use strict';

var sinon = require('sinon');
var lolex = require('lolex');

var Tracer = require('../src/tracer');
var Annotation = require('../src/annotation');

var _require = require('../src/tracer/sampler');

var Sampler = _require.Sampler;

var ExplicitContext = require('../src/explicit-context');

var _require2 = require('../src/option');

var Some = _require2.Some;


describe('Tracer', function () {
  it('should make parent and child spans', function () {
    var recorder = {
      record: function record() {}
    };
    var ctxImpl = new ExplicitContext();
    var tracer = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });

    ctxImpl.scoped(function () {
      tracer.setId(tracer.createRootId());
      var parentId = tracer.createChildId();
      tracer.setId(parentId);

      ctxImpl.scoped(function () {
        var childId = tracer.createChildId();
        tracer.setId(childId);

        expect(tracer.id.traceId).to.equal(parentId.traceId);
        expect(tracer.id.parentId).to.equal(parentId.spanId);

        ctxImpl.scoped(function () {
          var grandChildId = tracer.createChildId();
          tracer.setId(grandChildId);

          expect(tracer.id.traceId).to.equal(childId.traceId);
          expect(tracer.id.parentId).to.equal(childId.spanId);
        });
      });
    });
  });

  function runTest(bool, done) {
    var recorder = {
      record: sinon.spy()
    };
    var ctxImpl = new ExplicitContext();
    var sampler = new Sampler(function () {
      return bool;
    });
    var tracer = new Tracer({
      sampler: sampler,
      recorder: recorder,
      ctxImpl: ctxImpl
    });
    ctxImpl.scoped(function () {
      var rootTracerId = tracer.createRootId();
      expect(rootTracerId.sampled).to.eql(new Some(bool));
      done();
    });
  }

  it('should set sampled flag when shouldSample is true', function (done) {
    runTest(true, done);
  });

  it('should set sampled flag when shouldSample is false', function (done) {
    runTest(false, done);
  });

  it('should log timestamps in microseconds', function () {
    var record = sinon.spy();
    var recorder = { record: record };
    var ctxImpl = new ExplicitContext();
    var trace = new Tracer({ ctxImpl: ctxImpl, recorder: recorder });

    ctxImpl.scoped(function () {
      var clock = lolex.install(12345678);
      trace.recordAnnotation(new Annotation.ServerSend());
      clock.tick(1); // everything else is beyond this
      trace.recordMessage('error');

      expect(record.getCall(0).args[0].timestamp).to.equal(12345678000);
      expect(record.getCall(1).args[0].timestamp).to.equal(12345679000);

      clock.uninstall();
    });
  });
});