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
    yield updateCache();
    this.body = cache.data;
    this.set('X-From-Cache', '0');
    this.set('X-Cache-DateTime', String(cache.modified));
    this.type = 'json';
    return;
  }

  this.body = cache.data;
  this.set('X-From-Cache', '1');
  this.set('X-Cache-DateTime', String(cache.modified));
  this.type = 'json';

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

      // 避免在每次请求的时候做这么大量的 JSON 操作
      cache.data = new Buffer(JSON.stringify(data));
      cache.modified = Date.now();
      callback();
    });
  };
}

module.exports._cacheRef = cache;
