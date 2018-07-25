'use strict';

var debug = require('debug')('mirrors:sync:optipng-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = OptipngSyncer;

function OptipngSyncer(options) {
  if (!(this instanceof OptipngSyncer)) {
    return new OptipngSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/optipng-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/optipng-bin';
  this._binaryName = 'optipng';
}

util.inherits(OptipngSyncer, JpegtranbinSyncer);

var proto = OptipngSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return '3.1.3';
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'macos', 'linux', 'freebsd', 'win', 'sunos' ];
};

proto._getPlatformArchs = function(platform, version) {
  if (platform === 'macos' || platform === 'osx') {
    return;
  }
  if (platform === 'win') {
    return;
  }
  if (platform === 'freebsd' && semver.lt(version, '3.1.0')) {
    return;
  }
  return [ 'x64', 'x86' ];
};
