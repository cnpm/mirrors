/**!
 * mirrors - test/sync/phantomjs.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var path = require('path');
var fs = require('fs');
var config = require('../../config');
var PhantomjsSyncer = require('../../sync/phantomjs');

describe('sync/phantomjs.test.js', function () {
  var syncer = new PhantomjsSyncer(config.categories.phantomjs);

  describe('_findItems()', function () {
    it('should find out all download items', function () {
      var html = fs.readFileSync(path.join(__dirname, 'phantomjs.txt'), 'utf8');
      var items = syncer._findItems(html);
      items.should.length(24);
      items.forEach(function (item) {
        item.should.have.keys('name', 'date', 'size', 'downloadURL', 'type');
        item.downloadURL.should.startWith('https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-');
        item.type.should.equal('file');
      });
    });
  });
});
