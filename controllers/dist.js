/**!
 * mirrors - controllers/dist.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:controllers:dist');
var Dist = require('../services/dist');
var nfs = require('../common/nfs');
var config = require('../config');
var utility = require('utility');
var mime = require('mime-types');
var ms = require('humanize-ms');
var bytes = require('bytes');
var path = require('path');
var fs = require('fs');

module.exports = function* () {
  //TODO will error in windows
  var p = path.normalize(this.path);
  var paths = p.split('/');
  paths.shift();

  var category = paths.shift();
  var name = paths.join('/') || '/';
  debug('request %s, normalize to %s, got category: %s, name: %s', this.path, p, category, name);

  if (!config.categories[category]) {
    debug('requiest %s, category %s not exist', this.path, category);
    return this.status = 404;
  }

  // list dir
  if (name[name.length - 1] === '/') {
    var items = yield Dist.listdir(category, name);
    items = items.map(function (item) {
      if (!item.size) {
        item.size = '-';
      } else {
        item.size = bytes(item.size);
      }
      return item;
    });

    debug('list dir %s:%s, got %j', category, name, items);
    var disturl = config.categories[category].disturl.replace(/\/$/, '') + name.replace(/^\/?/, '/');
    yield this.render('dist', {
      disturl: disturl,
      category: category,
      items: items,
      padding: padding
    });
    return;
  }

  // download file
  var info = yield Dist.getfile(category, name);
  if (!info || !info.url) {
    debug('file %s:%s not exist', category, name);
    return this.status = 404;
  }

  if (info.url.indexOf('http') === 0) {
    return this.redirect(info.url);
  }
  this.type = mime.lookup(info.url);

  if (typeof info.size === 'number' && info.size > 0) {
    this.length = info.size;
  }
  var type = mime.lookup(info.url);
  if (type) {
    this.type = type;
  }
  var etag = info.md5 || info.sha1;
  if (etag) {
    this.etag = etag;
  }

  this.attachment(info.name);

  return this.body = yield* downloadAsReadStream(info.url);
};

function padding(max, current, pad) {
  pad = pad || ' ';
  var left = max - current;
  var str = '';
  for (var i = 0; i < left; i++) {
    str += pad;
  }
  return str;
}


var DOWNLOAD_TIMEOUT = ms('10m');

function* downloadAsReadStream (key) {
  var tmpPath = path.join(config.uploadDir,
    utility.randomString() + key.replace(/\//g, '-'));
  function cleanup() {
    debug('cleanup %s', tmpPath);
    fs.unlink(tmpPath, utility.noop);
  }
  debug('downloadAsReadStream() %s to %s', key, tmpPath);
  try {
    yield nfs.download(key, tmpPath, {timeout: DOWNLOAD_TIMEOUT});
  } catch (err) {
    debug('downloadAsReadStream() %s to %s error: %s', key, tmpPath, err.stack);
    cleanup();
    throw err;
  }
  var tarball = fs.createReadStream(tmpPath);
  tarball.once('error', cleanup);
  tarball.once('end', cleanup);
  return tarball;
}
