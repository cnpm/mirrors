/**
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:sqlite3');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');

module.exports = Sqlite3Syncer;

function Sqlite3Syncer(options) {
  if (!(this instanceof Sqlite3Syncer)) {
    return new Sqlite3Syncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/sqlite3';
  this._storeUrl = 'https://mapbox-node-binary.s3.amazonaws.com';
}

util.inherits(Sqlite3Syncer, Syncer);

var proto = Sqlite3Syncer.prototype;

proto.check = function() {
  return true;
};

proto.listdiff = function* (fullname, dirIndex) {
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
    if (binaryInfo.host === this._storeUrl) {
      needs.push(pkg);
    }
  }
  debug('listdir %s got %s, %j, new %d versions, exists %d versions',
    this._npmPackageUrl, result.status, result.headers, needs.length, existsCount);

  if (result.status !== 200) {
    throw new Error(util.format('get %s resposne %s', this._npmPackageUrl, result.status));
  }

  var nodePlatforms = [
    'linux',
    'darwin',
    'win32',
  ];
  // https://github.com/cnpm/mirrors/issues/56
  var nodeAbiVersions = [
    // for the future
    'v50', // 8
    'v49', // 7
    'v48', // 6
    // current versions
    'v47', // 5
    'v46', // 4
    'v45', // 3
    'v44', // 2
    'v43', // 1
    'v14', // 0.12
    'v11', // 0.10
  ];
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
    for (var p = 0; p < nodePlatforms.length; p++) {
      var nodePlatform = nodePlatforms[p];
      for (var a = 0; a < nodeAbiVersions.length; a++) {
        var nodeAbiVersion = nodeAbiVersions[a];
        var name = 'node-' + nodeAbiVersion + '-' + nodePlatform + '-x64.tar.gz';
        items.push({
          name: name,
          date: date,
          size: null,
          type: 'file',
          downloadURL: this._storeUrl + '/sqlite3' + fileParent + name,
          parent: fileParent,
        });
      }
    }
  }

  return items;
};
