'use strict'

var assert = require('assert');
var config = require('../../config');
var mm = require('mm');
var CanvasPrebuiltSyncer = require('../../sync/canvas-prebuilt');

describe('sync/canvas-prebuilt.test.js', function () {
  var syncer = new CanvasPrebuiltSyncer(config.categories['canvas-prebuilt']);

  describe('listdiff()', function () {
    it('should list exists between original sources', function *() {
      mm(syncer, 'listExists', function *() {
        return []
      });
      /**
       * versions: [
       *   "1.4.0",
       *   "1.5.0",
       *   ...
       * ]
       */
      var items = yield syncer.listdiff('canvas-prebuilt', 0);
      assert(items.length > 2);
      assert(items[0].name === 'v1.4.0/');
      assert(items[1].downloadURL === 'https://github.com/chearon/node-canvas-prebuilt/releases/download/v1.4.0/canvas-prebuilt-v1.4.0-node-v64-linux-x64.tar.gz');
    });
  });
});
