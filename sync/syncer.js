'use strict';

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
  this.distService = distService;
  this.logger = logger;
}

var proto = Syncer.prototype;

proto.start = function* (name) {
  name = name || '/';
  yield this.syncDir(name, 0);
};

/**
 * Sync all files and dirs in a specific dir
 *
 * @param {String} fullname
 */

proto.syncDir = function* (fullname, dirIndex) {
  var news = yield this.listdiff(fullname, dirIndex);
  var files = [];
  var dirs = [];

  news.forEach(function (item) {
    if (item.type === 'dir') {
      return dirs.push(item);
    }
    files.push(item);
  });

  logger.syncInfo('[%s] sync %s:%s#%s got %d new items, %d dirs, %d files to sync',
    this.category, this.disturl, fullname, dirIndex, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield this.syncFile(files[i]);
  }

  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    // recursive sync dir
    yield this.syncDir(dir.parent + dir.name, dirIndex + 1);

    // save to database
    dir.category = this.category;
    yield this.distService.savedir(dir);
    logger.syncInfo('[%s] Save dir:%s#%s %j to database', this.category, fullname, dirIndex, dir);
  }

  logger.syncInfo('[%s] Sync %s#%s finished, %d dirs, %d files',
    this.category, fullname, dirIndex, dirs.length, files.length);
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
  // https://cnpmjs.org/mirrors/chromium-browser-snapshots/Linux_x64/494755/chrome-linux.zip
  // =>
  // https://cnpmjs.oss-ap-southeast-1.aliyuncs.com/dist/chromium-browser-snapshots/Linux_x64/494755/chrome-linux.zip
  // =>
  // https://cnpmjs.oss-ap-southeast-1-internal.aliyuncs.com/dist/chromium-browser-snapshots/Linux_x64/494755/chrome-linux.zip
  if (typeof config.formatDownloadUrl === 'function') {
    downurl = config.formatDownloadUrl(downurl);
  }
  var filepath = utils.getTarballFilepath(name);
  var ws = fs.createWriteStream(filepath);

  if (config.githubApiProxy) {
    downurl = downurl.replace('https://api.github.com', config.githubApiProxy);
  }
  if (config.githubProxy) {
    downurl = downurl.replace('https://github.com', config.githubProxy);
  }

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
    logger.syncInfo('[%s] downloading %s %s to %s',
      this.category, info.size ? bytes(info.size) : '', downurl, filepath);
    // get tarball
    var r = yield urllib.request(downurl, options);
    var statusCode = r.status || -1;
    logger.syncInfo('[%s] download %s got status %s, headers: %j',
      this.category, downurl, statusCode, r.headers);

    if (statusCode === 404 || statusCode === 403) {
      // 403: https://iojs.org/dist/v1.0.2/doc/doc
      logger.syncInfo('download %s fail, status: %s', downurl, statusCode);
      debug('%s %s', statusCode, downurl);
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

    var checksums = {
      sha1: sha1sum,
      md5: md5sum,
      size: dataSize,
    };

    if (this.check) {
      var equivalent = this.check(checksums, info);

      if (!equivalent) {
        var err = new Error(fmt('Download %s file check not valid', downurl));
        err.data = {
          checksums: checksums,
          info: info
        };
        throw err;
      }
    }

    var args = {
      // /dist/node/lastest/x64/0.11.12.msi
      key: '/dist/' + this.category + info.parent + info.name,
      size: info.size,
      sha1sum: sha1sum,
    };

    // upload to NFS
    logger.syncInfo('[%s] uploading %s to nfs:%s', this.category, filepath, args.key);
    var result = yield nfs.upload(filepath, args);
    debug(result);
    info.url = result.url || result.key;
    info.size = dataSize;
    info.sha1 = sha1sum;
    info.md5 = md5sum;
    info.category = this.category;

    logger.syncInfo('[%s] upload %s to nfs:%s with size:%s, sha1:%s, md5: %s',
      this.category, args.key, info.url, bytes(info.size), info.sha1, info.md5);
  } finally {
    // remove tmp file whatever
    fs.unlink(filepath, utility.noop);
  }

  logger.syncInfo('[%s] Sync dist file: %j done', this.category, info);
  yield distService.savefile(info);
};

/**
 * list the diff files and dirs between remote and database
 *
 * @param {String} fullname
 */

proto.listdiff = function* (fullname, dirIndex) {
  var items = yield this.listdir(fullname, dirIndex);
  if (!items || items.length === 0) {
    return [];
  }
  var exists = yield this.listExists(fullname);
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var item = exists[i];
    map[item.name] = item;
  }
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.name];

    if (item.isNew) {
      news.push(item);
      continue;
    }

    if (!exist || exist.date !== item.date) {
      news.push(item);
      continue;
    }

    if (exist.type === 'file' && !this.check(exist, item)) {
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

proto.listExists = function* listExists(fullname) {
  var exists = yield this.distService.listdir(this.category, fullname);
  debug('listExists %s %s got %s exists items', this.category, fullname, exists.length);
  return exists;
};

// https://nodejs.org/zh-cn/download/releases/
proto.getNodeAbiVersions = function* getNodeAbiVersions() {
  const nodeAbiVersions = [];
  const result = yield urllib.request('https://nodejs.org/dist/index.json', {
    dataType: 'json',
    timeout: 10000,
    gzip: true,
  });
  const versions = result.data;
  for (const version of versions) {
    if (!version.modules) continue;
    const modulesVersion = parseInt(version.modules);
    const nodeAbiVersion = `v${modulesVersion}`;
    // min version: node 0.10
    if (modulesVersion >= 11 && nodeAbiVersions.indexOf(nodeAbiVersion) === -1) {
      nodeAbiVersions.push(nodeAbiVersion);
    }
  }

  return nodeAbiVersions;
};
