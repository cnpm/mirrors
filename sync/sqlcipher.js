'use strict';

var debug = require('debug')('mirrors:sync:sqlcipher');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var logger = require('../common/logger');
var Syncer = require('./syncer');
var utils = require('../lib/utils');

module.exports = SqlcipherSyncer;

function SqlcipherSyncer(options) {
  if (!(this instanceof SqlcipherSyncer)) {
    return new SqlcipherSyncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/@journeyapps/sqlcipher';
}

util.inherits(SqlcipherSyncer, Syncer);

var proto = SqlcipherSyncer.prototype;

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
    timeout: 120000,
    dataType: 'json',
    gzip: true,
    followRedirect: true,
  });
  var versions = result.data.versions || {};
  var needs = [];
  for (var version in versions) {
    if (semver.lt(version, '4.0.0')) {
      continue;
    }
    var pkg = versions[version];
    var binaryInfo = pkg.binary || {};
    pkg.dirname = 'v' + pkg.version + '/';
    pkg.publish_time = result.data.time[pkg.version];
    if (existDirsMap[pkg.dirname]) {
      existsCount++;
      continue;
    }
    needs.push(pkg);
  }
  logger.syncInfo('[%s] listdir %s got %s, %j, total %s versions, new %d versions, exists %d versions',
      this.category, this._npmPackageUrl, result.status, result.headers,
      Object.keys(versions).length, needs.length, existsCount);

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
    for (var p = 0; p < nodePlatforms.length; p++) {
      var nodePlatform = nodePlatforms[p];
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
  // https://journeyapps-node-binary.s3.amazonaws.com/@journeyapps/sqlcipher/v3.1.4-test2/node-v47-darwin-x64.tar.gz
  // https://journeyapps-node-binary.s3.amazonaws.com/@journeyapps/sqlcipher/v4.0.0/node-v72-darwin-x64.tar.gz
  var name = 'node-' + nodeAbiVersion + '-' + nodePlatform + '-x64.tar.gz';
  var downloadURL = this.disturl + fileParent + name;
  return {
    name: name,
    // size: null,
    downloadURL: downloadURL,
  };
};
