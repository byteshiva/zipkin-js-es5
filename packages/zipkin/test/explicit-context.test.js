'use strict';

var ExplicitContext = require('../src/explicit-context.js');

describe('ExplicitContext', function () {
  it('should start with context null', function () {
    var ctx = new ExplicitContext();
    expect(ctx.getContext()).to.equal(null);
  });

  it('should set an inner context', function () {
    var ctx = new ExplicitContext();
    ctx.letContext('foo', function () {
      expect(ctx.getContext()).to.equal('foo');
    });
  });

  it('should return the inner value', function () {
    var ctx = new ExplicitContext();
    var returnValue = ctx.letContext('foo', function () {
      return 123;
    });
    expect(returnValue).to.equal(123);
  });

  it('should be reset after the callback', function () {
    var ctx = new ExplicitContext();
    ctx.letContext('foo', function () {
      // do nothing
    });
    expect(ctx.getContext()).to.equal(null);
  });

  it('support nested contexts', function () {
    var ctx = new ExplicitContext();
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

  it('does not support async context', function (done) {
    var ctx = new ExplicitContext();
    function callback() {
      expect(ctx.getContext()).to.equal(null);
      done();
    }
    ctx.letContext('foo', function () {
      setTimeout(callback, 10);
    });
  });
});