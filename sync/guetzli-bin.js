'use strict';

var debug = require('debug')('mirrors:sync:guetzli-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = GuetzliSyncer;

function GuetzliSyncer(options) {
  if (!(this instanceof GuetzliSyncer)) {
    return new GuetzliSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/guetzli';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/guetzli-bin';
  this._binaryName = 'guetzli';
}

util.inherits(GuetzliSyncer, JpegtranbinSyncer);

var proto = GuetzliSyncer.prototype;

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
