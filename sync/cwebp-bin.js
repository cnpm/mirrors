'use strict';

var debug = require('debug')('mirrors:sync:cwebp-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = CwebpSyncer;

function CwebpSyncer(options) {
  if (!(this instanceof CwebpSyncer)) {
    return new CwebpSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/cwebp-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/cwebp-bin';
  this._binaryName = 'cwebp';
}

util.inherits(CwebpSyncer, JpegtranbinSyncer);

var proto = CwebpSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return false;
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'win', 'osx' ];
};

proto._getPlatformArchs = function(platform, version) {
  if (platform === 'osx') return;

  if (semver.gte(version, '3.1.0')) {
    return [ 'x86', 'x64' ];
  }
};
