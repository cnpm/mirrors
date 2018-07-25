'use strict';

var debug = require('debug')('mirrors:sync:jpegtran-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var Syncer = require('./syncer');
var utils = require('../lib/utils');

module.exports = JpegtranbinSyncer;

function JpegtranbinSyncer(options) {
  if (!(this instanceof JpegtranbinSyncer)) {
    return new JpegtranbinSyncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/jpegtran-bin';
  // https://github.com/imagemin/jpegtran-bin/blob/master/lib/index.js#L6
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/jpegtran-bin';
  this._binaryName = 'jpegtran';
}

util.inherits(JpegtranbinSyncer, Syncer);

var proto = JpegtranbinSyncer.prototype;

proto.check = function() {
  return true;
};

proto._getMinMacOSVersion = function() {
  return '3.1.0';
};

proto._handleFreebsdPlatform = function() {
  return true;
};

proto._downloadLib = function* (items, platform, fileParent, date) {
  // libjpeg-62.dll
  if (platform === 'win') {
    var downloadURL = this._storeUrl + fileParent + 'libjpeg-62.dll';
    debug(downloadURL, fileParent, date);
    items.push({
      name: 'libjpeg-62.dll',
      date: date,
      size: null,
      type: 'file',
      downloadURL: downloadURL,
      parent: fileParent,
    });
  }
};

proto._getPlatforms = function() {
  return [ 'macos', 'linux', 'freebsd', 'sunos', 'win' ];
};

proto._getPlatformArchs = function(platform) {
  return [ 'x64', 'x86' ];
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
    timeout: 120000,
    dataType: 'json',
    gzip: true,
    followRedirect: true,
  });
  var versions = result.data.versions || {};
  var needs = [];
  for (var version in versions) {
    var pkg = versions[version];
    if (semver.lt(version, '1.0.0')) {
      continue;
    }

    pkg.dirname = 'v' + pkg.version + '/';
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

    // v1.0.0/vendor/
    items.push({
      name: 'vendor/',
      date: date,
      size: '-',
      type: 'dir',
      parent: fullname + pkg.dirname,
    });

    var dirParent = fullname + pkg.dirname + 'vendor/';
    var platforms = this._getPlatforms();
    // ${url}macos/jpegtran
    // ${url}linux/x86/jpegtran
    // ${url}linux/x64/jpegtran
    for (var p = 0; p < platforms.length; p++) {
      var platform = platforms[p];
      // dir
      items.push({
        name: platform + '/',
        date: date,
        size: '-',
        type: 'dir',
        parent: dirParent,
      });
      if (this._handleFreebsdPlatform() && platform === 'freebsd' && semver.lt(pkg.version, '3.0.0')) {
        var fileParent = dirParent + platform + '/';
        var downloadURL = this._storeUrl + fileParent + this._binaryName;
        debug(downloadURL, fileParent, date);
        items.push({
          name: this._binaryName,
          date: date,
          size: null,
          type: 'file',
          downloadURL: downloadURL,
          parent: fileParent,
        });
        continue;
      }

      if (platform === 'source') {
        var fileParent = dirParent + platform + '/';
        var downloadURL = this._storeUrl + fileParent + this._binaryName + '.tar.gz';
        debug(downloadURL, fileParent, date);
        items.push({
          name: this._binaryName + '.tar.gz',
          date: date,
          size: null,
          type: 'file',
          downloadURL: downloadURL,
          parent: fileParent,
        });
        continue;
      }

      if (platform === 'macos') {
        if (semver.lt(pkg.version, this._getMinMacOSVersion())) {
          platform = 'osx';
          items.push({
            name: platform + '/',
            date: date,
            size: '-',
            type: 'dir',
            parent: dirParent,
          });
        }
        var fileParent = dirParent + platform + '/';
        var downloadURL = this._storeUrl + fileParent + this._binaryName;
        debug(downloadURL, fileParent, date);
        items.push({
          name: this._binaryName,
          date: date,
          size: null,
          type: 'file',
          downloadURL: downloadURL,
          parent: fileParent,
        });
      } else {
        // win
        // libjpeg-62.dll
        // jpegtran.exe
        var binaryName = this._binaryName;
        if (platform === 'win') {
          binaryName = this._binaryName + '.exe';
        }

        var archs = this._getPlatformArchs(platform);
        if (archs && archs.length > 0) {
          for (var arch of archs) {
            items.push({
              name: arch +  '/',
              date: date,
              size: '-',
              type: 'dir',
              parent: dirParent + platform + '/',
            });

            var fileParent = dirParent + platform + '/' + arch + '/';
            var downloadURL = this._storeUrl + fileParent + binaryName;
            debug(downloadURL, fileParent, date);
            items.push({
              name: binaryName,
              date: date,
              size: null,
              type: 'file',
              downloadURL: downloadURL,
              parent: fileParent,
            });

            yield this._downloadLib(items, platform, fileParent, date);
          }
        } else {
          var fileParent = dirParent + platform + '/';
          var downloadURL = this._storeUrl + fileParent + binaryName;
          debug(downloadURL, fileParent, date);
          items.push({
            name: binaryName,
            date: date,
            size: null,
            type: 'file',
            downloadURL: downloadURL,
            parent: fileParent,
          });

          yield this._downloadLib(items, platform, fileParent, date);
        }
      }
    }
  }

  return items;
};
