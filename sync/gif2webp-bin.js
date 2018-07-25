'use strict';

var debug = require('debug')('mirrors:sync:gif2webp-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = Gif2webpSyncer;

function Gif2webpSyncer(options) {
  if (!(this instanceof Gif2webpSyncer)) {
    return new Gif2webpSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/gif2webp-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/gif2webp-bin';
  this._binaryName = 'gif2webp';
}

util.inherits(Gif2webpSyncer, JpegtranbinSyncer);

var proto = Gif2webpSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return false;
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'macos', 'win' ];
};

proto._getPlatformArchs = function(platform) {};
