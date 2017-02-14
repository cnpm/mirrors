'use strict';

var debug = require('debug')('mirrors:sync:nodegit');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');
var utils = require('../lib/utils');

module.exports = NodeGitSyncer;

function NodeGitSyncer(options) {
  if (!(this instanceof NodeGitSyncer)) {
    return new NodeGitSyncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/nodegit';
  this._storeUrl = 'https://nodegit.s3.amazonaws.com/nodegit/nodegit/';
}

util.inherits(NodeGitSyncer, Syncer);

var proto = NodeGitSyncer.prototype;

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
    if (binaryInfo.host && binaryInfo.host.indexOf(this._storeUrl) === 0) {
      needs.push(pkg);
    }
  }
  debug('listdir %s got %s, %j, new %d versions, exists %d versions',
    this._npmPackageUrl, result.status, result.headers, needs.length, existsCount);

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
    // https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.12.2-node-v46-darwin-x64.tar.gz
    // https://nodegit.s3.amazonaws.com/nodegit/nodegit/nodegit-v0.12.2-node-v46-win32-x64.tar.gz
    for (var p = 0; p < nodePlatforms.length; p++) {
      var nodePlatform = nodePlatforms[p];
      for (var a = 0; a < nodeAbiVersions.length; a++) {
        var nodeAbiVersion = nodeAbiVersions[a];
        var name = 'nodegit-v' + pkg.version + '-node-' + nodeAbiVersion + '-' + nodePlatform + '-x64.tar.gz';
        var downloadURL = this._storeUrl + name;
        debug(downloadURL, name, fileParent, date);
        items.push({
          name: name,
          date: date,
          size: null,
          type: 'file',
          downloadURL: downloadURL,
          parent: fileParent,
        });
      }
    }
  }

  return items;
};
