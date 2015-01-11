/**!
 * mirrors - sync/index.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:index.js');
var logger = require('../common/logger');
var NodeSyncer = require('./node');
var config = require('../config');
var co = require('co');

var syncingNodeDist = false;
var syncNodeDist = co(function* () {
  if (syncingNodeDist) {
    return;
  }
  syncingNodeDist = true;

  var nodeSyncer = NodeSyncer({
    disturl: config.nodeDistUrl,
    category: 'node'
  });

  try {
    yield* nodeSyncer.start();
  } catch (err) {
    err.message += ' (sync node dist error)';
    logger.syncError(err);
  } finally {
    syncingNodeDist = false;
  }
});

if (config.syncNodeDist) {
  debug('enable sync node dist from %s', config.nodeDistUrl);
  syncNodeDist();
  setInterval(syncNodeDist, config.syncNodeDistInterval || config.syncInterval);
}
