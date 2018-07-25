'use strict';

var debug = require('debug')('mirrors:sync:jpeg-recompress-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = JpegRecompressSyncer;

function JpegRecompressSyncer(options) {
  if (!(this instanceof JpegRecompressSyncer)) {
    return new JpegRecompressSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/jpeg-recompress-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/jpeg-recompress-bin';
  this._binaryName = 'jpeg-recompress';
}

util.inherits(JpegRecompressSyncer, JpegtranbinSyncer);

var proto = JpegRecompressSyncer.prototype;

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

proto._getPlatformArchs = function(platform) {};
