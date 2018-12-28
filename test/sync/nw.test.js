'use strict'

var assert = require('assert');
var config = require('../../config');
var mm = require('mm');
var NWSyncer = require('../../sync/nw.js');

describe('test/sync/nw.test.js', function () {
  var syncer = new NWSyncer(config.categories.nwjs);

  describe('listdir()', function () {
    it('should list versions ', function *() {
      var items = yield syncer.listdir('/v0.35.0/');
      assert(items[1].name == 'SHASUMS256.txt')
      assert(items[1].downloadURL.indexOf('https://dl.nwjs.io') !== -1)
    });
  });
});
