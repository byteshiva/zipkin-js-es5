'use strict';

var annotation = require('../src/annotation');

describe('Annotation types', function () {
  Object.keys(annotation).forEach(function (key) {
    it('should have annotationType ' + key, function () {
      var ann = new annotation[key]({});
      expect(ann.annotationType).to.equal(key);
    });
  });
});