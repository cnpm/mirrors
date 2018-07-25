'use strict';

var debug = require('debug')('mirrors:sync:advpng-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = AdvpngSyncer;

function AdvpngSyncer(options) {
  if (!(this instanceof AdvpngSyncer)) {
    return new AdvpngSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/advpng-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/advpng-bin';
  this._binaryName = 'advpng';
}

util.inherits(AdvpngSyncer, JpegtranbinSyncer);

var proto = AdvpngSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return false;
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'linux', 'osx', 'win32' ];
};

proto._getPlatformArchs = function(platform) {};
