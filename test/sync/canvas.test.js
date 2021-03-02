'use strict';

var assert = require('assert');
var config = require('../../config');
var mm = require('mm');
var GithubWithVersion = require('../../sync/GithubWithVersion');

describe('test/sync/canvas-prebuilt-v2.test.js', function () {
  var syncer = new GithubWithVersion(config.categories['canvas']);

  describe('listdiff()', function () {
    it('should list exists between original sources', function *() {
      mm(syncer, 'listExists', function *() {
        return [];
      });
      var items = yield syncer.listdiff('/v2.7.0/', 0);
      const diff = items.find(item => item.name === 'canvas-v2.7.0-node-v57-darwin-unknown-x64.tar.gz');
      assert.deepStrictEqual(diff, {
        name: 'canvas-v2.7.0-node-v57-darwin-unknown-x64.tar.gz',
        date: '2020-08-01T21:25:27Z',
        size: 10009583,
        type: 'file',
        downloadURL: 'https://github.com/Automattic/node-canvas/releases/download/v2.7.0/canvas-v2.7.0-node-v57-darwin-unknown-x64.tar.gz',
        parent: '/v2.7.0/'
      });
    });
  });
});
