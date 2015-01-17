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
var config = require('../config');
var co = require('co');
var GithubSyncer;

var syncers = config.categories;

for (var name in syncers) {
  if (!syncers[name].enable) {
    continue;
  }
  // sync from github
  if (syncers.githubRepo) {
    GithubSyncer = GithubSyncer || require('./github');
    syncers[name].Syncer = GithubSyncer;
    syncers[name].syncing = false;
    continue;
  }

  syncers[name].Syncer = require('./' + name);
  syncers[name].syncing = false;
}

Object.keys(syncers).forEach(function (name) {
  var item = syncers[name];
  if (!item.enable) {
    return;
  }

  function startSync() {
    return co(function* () {
      if (item.syncing) {
        return;
      }
      item.syncing = true;

      var syncer = new item.Syncer({
        disturl: item.disturl,
        category: item.category,
        repo: item.githubRepo
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
  }

  var syncInterval = item.interval || config.syncInterval;
  logger.syncInfo('enable sync %s from %s every %dms',
    item.Syncer.name, item.disturl, syncInterval);

  startSync().catch(onerror);
  setInterval(function () {
    startSync().catch(onerror);
  }, syncInterval);
});

function onerror(err) {
  delete err.data;
  logger.error(err);
}
