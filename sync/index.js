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
var MirrorsSyncer;

var syncers = config.categories;

for (var name in syncers) {
  var syncer = syncers[name];
  if (!config.enableSync) {
    syncer.enable = false;
  }

  if (!syncer.enable) {
    continue;
  }

  if (config.cloneMode) {
    var baseUrl = config.cloneUrl.replace(/\/?$/, '/');
    MirrorsSyncer = MirrorsSyncer || require('./mirrors');
    syncer.Syncer = MirrorsSyncer;
    syncer.syncing = false;
    syncer.disturl = baseUrl + syncer.category;
    continue;
  }

  // sync from github
  if (syncer.githubRepo) {
    GithubSyncer = GithubSyncer || require('./github');
    syncer.Syncer = GithubSyncer;
    syncer.syncing = false;
    continue;
  }

  syncer.Syncer = require('./' + name);
  syncer.syncing = false;
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
        repo: item.githubRepo,
        max: item.max
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
