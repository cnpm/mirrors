/**!
 * mirrors - services/syncer.js
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:syncer');
var distService = require('../services/dist');
var logger = require('../common/logger');
var thunkify = require('thunkify-wrap');
var utils = require('../lib/utils');
var urlParse = require('url').parse;
var nfs = require('../common/nfs');
var config = require('../config');
var fmt = require('util').format;
var utility = require('utility');
var crypto = require('crypto');
var urllib = require('urllib');
var bytes = require('bytes');
var fs = require('fs');


/**
 * Module Exports.
 */

module.exports = Syncer;

/**
 * A basic syncer, all other syncers need inherits from it.
 * And implement tow methods:
 *
 *   - listdir(fullname): list all dirs and files in a specific dir
 *   - check(checksums, info): check a file if match remote file's info
 *
 * @param {Object} options
 *   - {String} disturl
 *   - {String} category
 */

function Syncer(options) {
  if (!(this instanceof Syncer)) {
    return new Syncer(options);
  }

  var disturl = options.disturl || '/';
  disturl = disturl.replace(/(\/+)$/, '');
  this.disturl = disturl;
  this.category = options.category;
}

var proto = Syncer.prototype;

proto.start = function* (name) {
  name = name || '/';
  name.replace(/\/?$/, '/');
  yield* this.syncDir(name);
};

/**
 * Sync all files and dirs in a specific dir
 *
 * @param {String} fullname
 */

proto.syncDir = function* (fullname) {
  var news = yield* this.listdiff(fullname);
  var files = [];
  var dirs = [];

  news.forEach(function (item) {
    if (item.type === 'dir') {
      return dirs.push(item);
    }
    files.push(item);
  });

  logger.syncInfo('sync %s:%s got %d new items, %d dirs, %d files to sync',
    this.disturl, fullname, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield* this.syncFile(files[i]);
  }

  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    // recursive sync dir
    yield* this.syncDir(dir.parent + dir.name);

    // save to database
    dir.category = this.category;
    yield* distService.savedir(dir);
    logger.syncInfo('Save dir:%s %j to database', fullname, dir);
  }

  logger.syncInfo('Sync %s finished, %d dirs, %d files',
    fullname, dirs.length, files.length);
};

/**
 * sync a specific file
 *
 * @param {Object} info
 */

proto.syncFile = function* (info) {
  debug('start sync file %j', info);
  var name = '/' + this.category + info.parent + info.name;
  name = process.pid + name.replace(/\//g, '_'); // make sure no parent dir
  var downurl = this.disturl + info.parent + info.name;
  if (info.downloadURL) {
    downurl = info.downloadURL;
  }
  var filepath = utils.getTarballFilepath(name);
  var ws = fs.createWriteStream(filepath);

  var options = {
    writeStream: ws,
    followRedirect: true,
    timeout: 6000000, // 100 minutes download
    headers: {
      'user-agent': config.ua
    }
  };

  if (urlParse(downurl).host === 'api.github.com') {
    options.headers.authorization = utils.getGithubBasicAuth();
  }

  try {
    logger.syncInfo('downloading %s %s to %s',
      info.size ? bytes(info.size) : '', downurl, filepath);
    // get tarball
    var r = yield urllib.requestThunk(downurl, options);
    var statusCode = r.status || -1;
    logger.syncInfo('download %s got status %s, headers: %j',
      downurl, statusCode, r.headers);

    if (statusCode === 404) {
      logger.syncInfo('download %s fail, status: %s', downurl, statusCode);
      return;
    }

    if (statusCode !== 200) {
      var err = new Error(fmt('Download %s fail, status: %s', downurl, statusCode));
      err.name = 'DownloadDistFileError';
      throw err;
    }

    var sha1sum = crypto.createHash('sha1');
    var md5sum = crypto.createHash('md5');
    var dataSize = 0;
    var rs = fs.createReadStream(filepath);
    rs.on('data', function (data) {
      sha1sum.update(data);
      md5sum.update(data);
      dataSize += data.length;
    });
    var end = thunkify.event(rs);
    yield end(); // after end event emit

    if (dataSize === 0) {
      var err = new Error(fmt('Download %s file is empty', downurl));
      err.name = 'DownloadDistFileZeroSizeError';
      throw err;
    }

    if (r.headers['Content-Length']) {
      var contentLength = parseInt(r.headers['Content-Length']);
      if (dataSize !== contentLength) {
        var err = new Error(fmt('Download %s file real size: %s, not match Content-Length: %s',
          downurl, dataSize, contentLength));
        err.name = 'DownloadDistFileInvalidSizeError';
        throw err;
      }
    }

    sha1sum = sha1sum.digest('hex');
    md5sum = md5sum.digest('hex');

    var equivalent = this.check({
      sha1: sha1sum,
      md5: md5sum,
      size: dataSize
    }, info);

    if (!equivalent) {
      throw new Error(fmt('Download %s file check not valid', downurl));
    }

    var args = {
      // /dist/node/lastest/x64/0.11.12.msi
      key: '/dist/' + this.category + info.parent + info.name,
      size: info.size,
      sha1sum: sha1sum,
    };

    // upload to NFS
    logger.syncInfo('uploading %s to nfs:%s', filepath, args.key);
    var result = yield nfs.upload(filepath, args);
    info.url = result.url || result.key;
    info.size = dataSize;
    info.sha1 = sha1sum;
    info.md5 = md5sum;
    info.category = this.category;

    logger.syncInfo('upload %s to nfs:%s with size:%s, sha1:%s, md5: %s',
      args.key, info.url, bytes(info.size), info.sha1, info.md5);
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  logger.syncInfo('Sync dist file: %j done', info);
  yield* distService.savefile(info);
};

/**
 * list the diff files and dirs between remote and database
 *
 * @param {String} fullname
 */

proto.listdiff = function* (fullname) {
  var items = yield* this.listdir(fullname);
  if (!items || items.length === 0) {
    return [];
  }
  var exists = yield* this.listExists(fullname);
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var item = exists[i];
    map[item.name] = item;
  }
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.name];
    var equivalent = this.check(exist, item);

    if (!exist || exist.date !== item.date || !equivalent) {
      news.push(item);
      continue;
    }

    if (item.size && item.size !== '-' && item.size !== exist.size) {
      news.push(item);
      continue;
    }

    debug('skip %s', item.name);
  }
  return news;
};

proto.listExists = function* (fullname) {
  var exists = yield* distService.listdir(this.category, fullname);
  debug('listdiff %s %s got %s exists items', this.category, fullname, exists.length);
  return exists;
};
