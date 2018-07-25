'use strict';

var debug = require('debug')('mirrors:sync:jpegoptim-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = JpegoptimSyncer;

function JpegoptimSyncer(options) {
  if (!(this instanceof JpegoptimSyncer)) {
    return new JpegoptimSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/jpegoptim-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/jpegoptim-bin';
  this._binaryName = 'jpegoptim';
}

util.inherits(JpegoptimSyncer, JpegtranbinSyncer);

var proto = JpegoptimSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return true;
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'win32', 'osx' ];
};

proto._getPlatformArchs = function(platform) {};
