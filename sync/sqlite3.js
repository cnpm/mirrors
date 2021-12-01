'use strict';

var debug = require('debug')('mirrors:sync:sqlite3');
var util = require('util');
var urllib = require('urllib');
var logger = require('../common/logger');
var Syncer = require('./syncer');
var utils = require('../lib/utils');

module.exports = Sqlite3Syncer;

function Sqlite3Syncer(options) {
  if (!(this instanceof Sqlite3Syncer)) {
    return new Sqlite3Syncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/sqlite3';
  this._storeUrl = 'https://mapbox-node-binary.s3.amazonaws.com';
  this._detectBinaryHost = true;
}

util.inherits(Sqlite3Syncer, Syncer);

var proto = Sqlite3Syncer.prototype;

proto.check = function check() {
  return true;
};

proto.listdiff = function* listdiff(fullname, dirIndex) {
  if (dirIndex !== 0) {
    return [];
  }

  var existsCount = 0;
  var existDirs = yield this.listExists('/');
  var existDirsMap = {};
  for (var i = 0; i < existDirs.length; i++) {
    var item = existDirs[i];
    existDirsMap[item.name] = true;
  }
  var result = yield urllib.request(this._npmPackageUrl, {
    timeout: 60000,
    dataType: 'json',
    gzip: true,
    followRedirect: true,
  });
  var versions = result.data.versions || {};
  var needs = [];
  for (var version in versions) {
    var pkg = versions[version];
    var binaryInfo = pkg.binary || {};
    pkg.dirname = 'v' + pkg.version + '/';
    pkg.publish_time = result.data.time[pkg.version];
    if (existDirsMap[pkg.dirname]) {
      existsCount++;
      continue;
    }
    if (!this._detectBinaryHost) {
      needs.push(pkg);
    } else if (binaryInfo.host === this._storeUrl) {
      needs.push(pkg);
    }
  }
  logger.syncInfo('[%s] listdir %s got %s, %j, new %d versions, exists %d versions',
      this.category, this._npmPackageUrl, result.status, result.headers, needs.length, existsCount);

  if (result.status !== 200) {
    throw new Error(util.format('get %s resposne %s', this._npmPackageUrl, result.status));
  }

  var nodePlatforms = utils.nodePlatforms;
  var nodeAbiVersions = yield this.getNodeAbiVersions();
  var items = [];
  for (var i = 0; i < needs.length; i++) {
    var pkg = needs[i];
    var date = pkg.publish_time;
    // dir
    items.push({
      name: pkg.dirname,
      date: date,
      size: '-',
      type: 'dir',
      parent: fullname,
    });

    var fileParent = fullname + pkg.dirname + '/';
    fileParent = fileParent.replace('//', '/');
    var napiVersions = pkg.binary && pkg.binary.napi_versions || [];
    for (var p = 0; p < nodePlatforms.length; p++) {
      var nodePlatform = nodePlatforms[p];
      if (napiVersions.length > 0) {
        for (var a = 0; a < napiVersions.length; a++) {
          var napiVersion = napiVersions[a];
          var downloadItem = this.formatDownloadItemWithNAPI(fileParent, pkg, napiVersion, nodePlatform);
          debug(downloadItem);
          if (!downloadItem) continue;
          items.push({
            date: date,
            size: null,
            type: 'file',
            parent: fileParent,
            downloadURL: downloadItem.downloadURL,
            name: downloadItem.name,
          });
        }
        continue;
      }
      for (var a = 0; a < nodeAbiVersions.length; a++) {
        var nodeAbiVersion = nodeAbiVersions[a];
        var downloadItem = this.formatDownloadItem(fileParent, pkg, nodeAbiVersion, nodePlatform);
        debug(downloadItem);
        if (!downloadItem) continue;
        if (Array.isArray(downloadItem)) {
          downloadItem.forEach(function(oneItem) {
            items.push({
              date: date,
              size: null,
              type: 'file',
              parent: fileParent,
              downloadURL: oneItem.downloadURL,
              name: oneItem.name,
            });
          });
        } else {
          items.push({
            date: date,
            size: null,
            type: 'file',
            parent: fileParent,
            downloadURL: downloadItem.downloadURL,
            name: downloadItem.name,
          });
        }
      }
    }
  }

  return items;
};

proto.formatDownloadItem = function(fileParent, pkg, nodeAbiVersion, nodePlatform) {
  var name = 'node-' + nodeAbiVersion + '-' + nodePlatform + '-x64.tar.gz';
  var downloadURL = this._storeUrl + '/sqlite3' + fileParent + name;
  if (this.formatDownloadUrl) {
    downloadURL = this.formatDownloadUrl(pkg, nodeAbiVersion, nodePlatform, name);
  }

  return {
    name: name,
    // size: null,
    downloadURL: downloadURL,
  };
};

proto.formatDownloadItemWithNAPI = function(fileParent, pkg, napiVersion, nodePlatform) {
  // >= 5.0.0
  // "package_name": "napi-v{napi_build_version}-{platform}-{arch}.tar.gz",
  // https://oss.npmmirror.com/dist/sqlite3/v5.0.0/napi-v3-linux-x64.tar.gz
  // https://github.com/mapbox/node-sqlite3/blob/29debf3ad7d052427541503d871d6c69ed8588a7/package.json#L16
  // "napi_versions": [
  //   3
  // ]
  var name = 'napi-v' + napiVersion + '-' + nodePlatform + '-x64.tar.gz';
  var downloadURL = this._storeUrl + '/sqlite3' + fileParent + name;
  if (this.formatDownloadUrl) {
    downloadURL = this.formatDownloadUrl(pkg, napiVersion, nodePlatform, name);
  }

  return {
    name: name,
    // size: null,
    downloadURL: downloadURL,
  };
};
