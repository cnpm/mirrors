'use strict';

var debug = require('debug')('mirrors:sync:pngout-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = PngoutSyncer;

function PngoutSyncer(options) {
  if (!(this instanceof PngoutSyncer)) {
    return new PngoutSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/pngout-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/pngout-bin';
  this._binaryName = 'pngout';
}

util.inherits(PngoutSyncer, JpegtranbinSyncer);

var proto = PngoutSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return false;
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'osx', 'win32', 'freebsd' ];
};

proto._getPlatformArchs = function(platform) {
  if (platform === 'linux' || platform === 'freebsd') {
    return [ 'x86', 'x64' ];
  }
};
