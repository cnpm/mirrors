'use strict';

var debug = require('debug')('mirrors:sync:cypress');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');
var utils = require('../lib/utils');

module.exports = CypressSyncer;

function CypressSyncer(options) {
  if (!(this instanceof CypressSyncer)) {
    return new CypressSyncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/cypress';
  this._storeUrl = 'https://cdn.cypress.io/desktop/';
}

util.inherits(CypressSyncer, Syncer);

var proto = CypressSyncer.prototype;

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
    pkg.dirname = pkg.version + '/';
    pkg.publish_time = result.data.time[pkg.version];
    if (existDirsMap[pkg.dirname]) {
      existsCount++;
      continue;
    }

    needs.push(pkg);
  }
  debug('listdir %s got %s, %j, new %d versions, exists %d versions',
    this._npmPackageUrl, result.status, result.headers, needs.length, existsCount);

  if (result.status !== 200) {
    throw new Error(util.format('get %s resposne %s', this._npmPackageUrl, result.status));
  }

  var nodePlatforms = [ 'osx64', 'win64', 'linux64' ];
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

    var dirParent = fullname + pkg.dirname;
    // https://cdn.cypress.io/desktop/3.0.1/osx64/cypress.zip
    // https://cdn.cypress.io/desktop/3.0.1/win64/cypress.zip
    // https://cdn.cypress.io/desktop/3.0.1/linux64/cypress.zip
    for (var p = 0; p < nodePlatforms.length; p++) {
      var nodePlatform = nodePlatforms[p];
      // dir
      items.push({
        name: nodePlatform + '/',
        date: date,
        size: '-',
        type: 'dir',
        parent: dirParent,
      });

      var fileParent = dirParent + nodePlatform + '/';
      var downloadURL = this._storeUrl + fileParent + 'cypress.zip';
      debug(downloadURL, name, fileParent, date);
      items.push({
        name: 'cypress.zip',
        date: date,
        size: null,
        type: 'file',
        downloadURL: downloadURL,
        parent: fileParent,
      });
    }
  }

  return items;
};
