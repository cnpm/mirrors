'use strict';

var debug = require('debug')('mirrors:sync:canvas-prebuilt');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');
var utils = require('../lib/utils');

module.exports = CanvasPrebuiltSyncer;

function CanvasPrebuiltSyncer (options) {
  if (!(this instanceof CanvasPrebuiltSyncer)) {
    return new CanvasPrebuiltSyncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/canvas-prebuilt';
}

util.inherits(CanvasPrebuiltSyncer, Syncer);

var proto = CanvasPrebuiltSyncer.prototype;

proto.check = function () {
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
    if (binaryInfo.host) {
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
    var packageNameTemplate = pkg.binary.package_name || '{module_name}-v{version}-{node_abi}-{platform}-{arch}.tar.gz';
    // https://github.com/node-gfx/node-canvas-prebuilt/releases/download/v2.0.0-alpha.13/canvas-prebuilt-v2.0.0-alpha.13-node-v59-win32-unknown-x64.tar.gz
    // https://github.com/node-gfx/node-canvas-prebuilt/releases/download/v1.6.5-prerelease.1/canvas-prebuilt-v1.6.5-prerelease.1-node-v51-linux-x64.tar.gz
    for (var p = 0; p < nodePlatforms.length; p++) {
      var nodePlatform = nodePlatforms[p];
      for (var a = 0; a < nodeAbiVersions.length; a++) {
        var nodeAbiVersion = nodeAbiVersions[a];
        var name = utils.template(packageNameTemplate, {
          module_name: pkg.binary.module_name,
          version: pkg.version,
          node_abi: 'node-' + nodeAbiVersion,
          platform: nodePlatform,
          arch: 'x64'
        });
        var downloadURL = pkg.binary.host + 'v' + pkg.version + '/' + name;
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
