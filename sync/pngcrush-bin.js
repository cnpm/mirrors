'use strict';

var debug = require('debug')('mirrors:sync:pngcrush-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = PngcrushSyncer;

function PngcrushSyncer(options) {
  if (!(this instanceof PngcrushSyncer)) {
    return new PngcrushSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/pngcrush-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/pngcrush-bin';
  this._binaryName = 'pngcrush';
}

util.inherits(PngcrushSyncer, JpegtranbinSyncer);

var proto = PngcrushSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return false;
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'osx', 'win' ];
};

proto._getPlatformArchs = function(platform) {
  if (platform === 'win') {
    return [ 'x64', 'x86' ];
  }
};
