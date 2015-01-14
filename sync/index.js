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

var logger = require('../common/logger');
var NodeSyncer = require('./node');
var IojsSyncer = require('./iojs');
var config = require('../config');
var co = require('co');

var syncers = {
  'NodeDist': {
    Syncer: NodeSyncer,
    syncing: false,
    enable: config.syncNodeDist,
    disturl: config.nodeDistUrl,
    syncInterval: config.syncNodeDistInterval,
  },
  'IojsDist': {
    Syncer: IojsSyncer,
    syncing: false,
    enable: config.syncIojsDist,
    disturl: config.iojsDistUrl,
    syncInterval: config.syncIojsDistInterval,
  },
};

Object.keys(syncers).forEach(function (name) {
  var item = syncers[name];
  if (!item.enable) {
    return;
  }

  item.syncing = false;
  var syncDist = co(function* () {
    if (item.syncing) {
      return;
    }
    item.syncing = true;

    var syncer = new item.Syncer({
      disturl: item.disturl,
      category: 'node'
    });

    try {
      yield* syncer.start();
    } catch (err) {
      err.message += ' (sync node dist error)';
      logger.syncError(err);
    } finally {
      item.syncing = false;
    }
  });

  var syncInterval = item.syncInterval || config.syncInterval;
  logger.syncInfo('enable sync %s from %s every %dms',
    item.Syncer.name, item.disturl, syncInterval);

  syncDist();
  setInterval(syncDist, syncInterval);
});
