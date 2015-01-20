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

  syncer.syncing = false;

  if (config.cloneMode) {
    var baseUrl = config.cloneUrl.replace(/\/?$/, '/');
    MirrorsSyncer = MirrorsSyncer || require('./mirrors');
    syncer.Syncer = MirrorsSyncer;
    syncer.disturl = baseUrl + syncer.category;
    continue;
  }

  // sync from github
  if (syncer.githubRepo) {
    GithubSyncer = GithubSyncer || require('./github');
    syncer.Syncer = GithubSyncer;
    continue;
  }

  if (syncer.syncerClass) {
    syncer.Syncer = require('./' + syncer.syncerClass);
    continue;
  }

  syncer.Syncer = require('./' + name);
}

Object.keys(syncers).forEach(function (name) {
  var item = syncers[name];
  if (!item.enable) {
    return;
  }

  var syncInterval = item.interval || config.syncInterval;
  logger.syncInfo('enable sync %s from %s every %dms',
  item.Syncer.name, item.disturl, syncInterval);

  co(function* () {
    while (true) {
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
      }

      yield sleep(syncInterval);
    }
  }).catch(function (err) {
    throw err;
  });

});


function sleep(ms) {
  return function (callback) {
    setTimeout(callback, ms);
  };
}
