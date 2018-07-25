'use strict';

var debug = require('debug')('mirrors:sync:mozjpeg-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = MozjpegSyncer;

function MozjpegSyncer(options) {
  if (!(this instanceof MozjpegSyncer)) {
    return new MozjpegSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/mozjpeg';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/mozjpeg-bin';
  this._binaryName = 'cjpeg';
}

util.inherits(MozjpegSyncer, JpegtranbinSyncer);

var proto = MozjpegSyncer.prototype;

proto._getBinaryName = function(version) {
  if (semver.lt(version, '3.0.0')) {
    return 'jpegtran';
  }
  return this._binaryName;
};

proto._getMinMacOSVersion = function() {
  return '5.0.0';
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'win', 'macos' ];
};

proto._getPlatformArchs = function(platform) {};
