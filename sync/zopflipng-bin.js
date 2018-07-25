'use strict';

var debug = require('debug')('mirrors:sync:zopflipng-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = ZopflipngSyncer;

function ZopflipngSyncer(options) {
  if (!(this instanceof ZopflipngSyncer)) {
    return new ZopflipngSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/zopflipng-bin';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/zopflipng-bin';
  this._binaryName = 'zopflipng';
}

util.inherits(ZopflipngSyncer, JpegtranbinSyncer);

var proto = ZopflipngSyncer.prototype;

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
