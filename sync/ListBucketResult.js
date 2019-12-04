'use strict';

var debug = require('debug')('mirrors:sync:ListBucketResult');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');

module.exports = ListBucketResult;

// http://selenium-release.storage.googleapis.com/
// http://chromedriver.storage.googleapis.com/

function ListBucketResult(options) {
  if (!(this instanceof ListBucketResult)) {
    return new ListBucketResult(options);
  }
  Syncer.call(this, options);
}

util.inherits(ListBucketResult, Syncer);

var proto = ListBucketResult.prototype;

proto.syncDir = function* (fullname) {
  var news = yield this.listdiff(fullname);
  var files = [];
  var dirs = [];

  news.forEach(function (item) {
    if (item.type === 'dir') {
      dirs.push(item);
    } else if (item.type === 'file') {
      files.push(item);
    }
  });

  this.logger.syncInfo('[%s] sync %s:%s got %d new items, %d dirs, %d files to sync',
    this.category, this.disturl, fullname, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield this.syncFile(files[i]);
  }

  // save new dirs
  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    dir.category = this.category;
    yield this.distService.savedir(dir);
  }

  this.logger.syncInfo('[%s] Sync %s finished, %d dirs, %d files',
    this.category, fullname, dirs.length, files.length);
};

proto.check = function (checksums, info) {
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};

proto.listdir = function* () {
  var url = this.disturl;
  var res = yield urllib.request(url, {
    timeout: 60 * 1000,
    followRedirect: true,
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);
  if (res.status !== 200) {
    var msg = util.format('request %s error, got %s', url, res.status);
    throw new Error(msg);
  }

  // <Contents><Key>2.0/chromedriver_linux32.zip</Key><Generation>1380149859530000</Generation><MetaGeneration>2</MetaGeneration><LastModified>2013-09-25T22:57:39.349Z</LastModified><ETag>"c0d96102715c4916b872f91f5bf9b12c"</ETag><Size>7262134</Size><Owner/></Contents><Contents>
  var splits = res.data.toString().split('<Contents><Key>');
  var items = [];
  var re = /([^<]+).+?<LastModified>([^<]+)<\/LastModified>.+?<Size>(\d+)<\/Size>/;
  var dirMap = {};
  for (var i = 1; i < splits.length; i++) {
    var m = re.exec(splits[i]);
    if (!m) {
      continue;
    }
    var name = m[1].trim();
    var date = m[2];
    var size = parseInt(m[3]);
    var downloadURL = this.disturl + '/' + name;
    var parent = '/';
    if (name.indexOf('/') > 0) {
      var names = name.split('/');
      // 2.0/chromedriver_linux32.zip
      // debug/v0.3.1/node-v11-win32-ia32.tar.gz
      var lastIndex = names.length - 1;
      name = names[lastIndex].trim();
      if (!name) {
        continue;
      }
      for (var j = 0; j < lastIndex; j++) {
        var dir = names[j] + '/';
        if (dir !== '/' && !dirMap[parent + dir]) {
          dirMap[parent + dir] = true;

          // dir
          items.push({
            name: dir,
            size: '-',
            date: date,
            type: 'dir',
            parent: parent,
          });
        }
        parent += dir;
      }
    }
    if (parent[0] !== '/') {
      parent = '/' + parent;
    }
    // file
    // [2019-12-04 20:27:46.926][16698] [node-inspector] download https://node-inspector.s3.amazonaws.com/AWSLogs/077447786745/CloudTrail/us-west-2/2015/12/10/077447786745_CloudTrail_us-west-2_20151210T1015Z_JNWlbeBTILiSzPCq.json.gz got status 403, headers: {"x-amz-request-id":"7A95FC5713F0E446","x-amz-id-2":"vXPN5jaCmaq2lxEPzsACF9dyzo1xM9ATZqEDKnv794tqlvXYATrBZd6Xol/KgXPN93feyx18ttU=","content-type":"application/xml","transfer-encoding":"chunked","date":"Wed, 04 Dec 2019 12:27:46 GMT","server":"AmazonS3"}
    if (downloadURL.indexOf('/AWSLogs/') > 0) continue;

    items.push({
      name: name,
      size: size,
      date: date,
      type: 'file',
      parent: parent,
      downloadURL: downloadURL
    });
  }
  return items;
};

proto.listdiff = function* () {
  var items = yield* this.listdir();
  if (!items || items.length === 0) {
    return [];
  }
  var exists = yield* this.listExists();
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var exist = exists[i];
    map[exist.parent + exist.name] = exist;
  }
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.parent + item.name];

    if (!exist) {
      news.push(item);
      continue;
    }

    if (item.type !== 'file') {
      continue;
    }

    if (exist.date !== item.date) {
      news.push(item);
      continue;
    }

    if (!this.check(exist, item)) {
      news.push(item);
      continue;
    }

    debug('skip %s', item.name);
  }
  return news;
};

proto.listExists = function* () {
  var exists = yield this.distService.listdir(this.category);
  debug('listdiff %s got %s exists items', this.category, exists.length);
  return exists;
};
