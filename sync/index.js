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

var syncers = config.categories;

for (var name in syncers) {
  syncers[name].Syncer = require('./' + name);
  syncers[name].syncing = false;
}

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
      category: item.category
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

  var syncInterval = item.interval || config.syncInterval;
  logger.syncInfo('enable sync %s from %s every %dms',
    item.Syncer.name, item.disturl, syncInterval);

  syncDist.catch(onerror);
  setInterval(function () {
    syncDist.catch(onerror);
  }, syncInterval);
});

function onerror(err) {
  logger.error(err);
}
