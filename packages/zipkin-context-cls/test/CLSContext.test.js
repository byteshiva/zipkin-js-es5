'use strict';

var CLSContext = require('../');
describe('CLSContext', function () {
  it('should start with context null', function () {
    var ctx = new CLSContext();
    expect(ctx.getContext()).to.equal(null);
  });

  it('should set an inner context', function () {
    var ctx = new CLSContext();
    ctx.letContext('foo', function () {
      expect(ctx.getContext()).to.equal('foo');
    });
  });

  it('should set an inner context with setContext', function () {
    var ctx = new CLSContext();
    ctx.scoped(function () {
      ctx.setContext('bla');
      expect(ctx.getContext()).to.equal('bla');
    });
    expect(ctx.getContext()).to.equal(null);
  });

  it('should return the inner value', function () {
    var ctx = new CLSContext();
    var returnValue = ctx.letContext('foo', function () {
      return 123;
    });
    expect(returnValue).to.equal(123);
  });

  it('should be reset after the callback', function () {
    var ctx = new CLSContext();
    ctx.letContext('foo', function () {
      // do nothing
    });
    expect(ctx.getContext()).to.equal(null);
  });

  it('support nested contexts', function () {
    var ctx = new CLSContext();
    var finalReturnValue = ctx.letContext('foo', function () {
      expect(ctx.getContext()).to.equal('foo');
      var innerReturnValue = ctx.letContext('bar', function () {
        expect(ctx.getContext()).to.equal('bar');
        return 1;
      });
      expect(ctx.getContext()).to.equal('foo');
      return innerReturnValue + 2;
    });
    expect(ctx.getContext()).to.equal(null);
    expect(finalReturnValue).to.equal(3);
  });

  it('supports CLS contexts (setTimeout etc)', function (done) {
    var ctx = new CLSContext();
    function callback() {
      expect(ctx.getContext()).to.equal('foo');
      done();
    }
    ctx.letContext('foo', function () {
      setTimeout(callback, 10);
    });
  });
});