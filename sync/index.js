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

for (var category in config.categories) {
  var syncer = config.categories[category];
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

  syncer.Syncer = require('./' + syncer.category);
}

var syncers = [];
for (var category in config.categories) {
  var item = config.categories[category];
  if (!item.enable) {
    continue;
  }
  // var syncInterval = item.interval || config.syncInterval;
  logger.syncInfo('enable sync %s from %s every %dms',
    item.Syncer.name, item.disturl, config.syncInterval);
  var syncer = new item.Syncer({
    disturl: item.disturl,
    category: item.category,
    repo: item.githubRepo,
    max: item.max
  });
  syncers.push(syncer);
}

co(function* () {
  while (true) {
    for (var i = 0; i < syncers.length; i++) {
      var syncer = syncers[i];
      try {
        yield syncer.start();
      } catch (err) {
        err.message += ' (sync node dist error)';
        logger.syncError(err);
      }
    }

    yield sleep(config.syncInterval);
  }
})(function (err) {
  throw err;
});
// }).catch(function (err) {
//   throw err;
// });


function sleep(ms) {
  return function (callback) {
    setTimeout(callback, ms);
  };
}
