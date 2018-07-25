'use strict';

var debug = require('debug')('mirrors:sync:pngquant-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = PngquantSyncer;

function PngquantSyncer(options) {
  if (!(this instanceof PngquantSyncer)) {
    return new PngquantSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/pngquant-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/pngquant-bin';
  this._binaryName = 'pngquant';
}

util.inherits(PngquantSyncer, JpegtranbinSyncer);

var proto = PngquantSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return '3.1.1';
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'macos', 'linux', 'freebsd', 'win', 'source' ];
};

proto._getPlatformArchs = function(platform) {
  if (platform === 'linux') {
    return [ 'x64', 'x86' ];
  }
  if (platform === 'freebsd') {
    return [ 'x64' ];
  }
};
