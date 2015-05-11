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

global.Promise = require('bluebird');
var logger = require('../common/logger');
var config = require('../config');
var co = require('co');
var GithubSyncer;
var MirrorsSyncer;

var syncers = config.categories;

for (var key in syncers) {
  var syncer = syncers[key];
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

  if (syncer.syncerClass) {
    syncer.Syncer = require('./' + syncer.syncerClass);
    continue;
  }

  // sync from github
  if (syncer.githubRepo) {
    GithubSyncer = GithubSyncer || require('./github');
    syncer.Syncer = GithubSyncer;
    continue;
  }

  syncer.Syncer = require('./' + key);
}

Object.keys(syncers).forEach(function (name) {
  var item = syncers[name];
  if (!item.enable) {
    return;
  }

  var syncInterval = item.interval || config.syncInterval;
  logger.syncInfo('enable sync %s from %s every %dms',
  item.Syncer.name, item.disturl, syncInterval);

  var fn = co.wrap(function* () {
    if (item.syncing) {
      return;
    }
    item.syncing = true;
    logger.syncInfo('Start sync task for %s', item.category);
    var syncer = new item.Syncer({
      disturl: item.disturl,
      category: item.category,
      repo: item.githubRepo,
      max: item.max,
      alwayNewDirIndex: item.alwayNewDirIndex,
    });

    try {
      yield* syncer.start();
    } catch (err) {
      err.message += ' (sync ' + item.category + ' dist error)';
      logger.syncError(err);
      console.error(err.stack);
    }
    item.syncing = false;
  });

  fn().catch(onerror);
  setInterval(function () {
    fn().catch(onerror);
  }, syncInterval);
});

function onerror(err) {
  logger.error(err);
}
