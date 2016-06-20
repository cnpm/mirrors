'use strict';

const urllib = require('urllib');
const logger = require('../../../common/logger');
const config = require('../../../config');

const cache = {
  modified: null,
  data: null,
};

const MAX_AGE = 60000;

module.exports = function*() {
  if (!cache.data) {
    this.body = yield updateCache();
    this.set('X-From-Cache', '0');
    return;
  }

  this.set('X-From-Cache', '1');
  this.body = cache.data;

  if (cache.modified && Date.now() - cache.modified > MAX_AGE) {
    updateCache()(function(err) {
      if (err) {
        return logger.error(err);
      }
    });
  }
};

function updateCache() {
  return function(callback) {
    urllib.request(config.nodesecurity.advisories, {
      dataType: 'json',
      gzip: true,
      timeout: 30000,
    }, function(err, data, res) {
      if (err) {
        return callback(err);
      }
      if (res.statusCode !== 200) {
        return callback(new Error('GET ' + config.nodesecurity.advisories + ' status error: ' + res.statusCode));
      }

      cache.data = data;
      cache.modified = Date.now();
      callback(null, cache.data);
    });
  };
}

module.exports._cacheRef = cache;
