'use strict';

var debug = require('debug')('mirrors:sync:gifsicle-bin');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var JpegtranbinSyncer = require('./jpegtran-bin');
var utils = require('../lib/utils');

module.exports = GifsicleSyncer;

function GifsicleSyncer(options) {
  if (!(this instanceof GifsicleSyncer)) {
    return new GifsicleSyncer(options);
  }
  JpegtranbinSyncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/gifsicle';
  this._storeUrl = 'https://raw.githubusercontent.com/imagemin/gifsicle-bin';
  this._binaryName = 'gifsicle';
}

util.inherits(GifsicleSyncer, JpegtranbinSyncer);

var proto = GifsicleSyncer.prototype;

proto._getMinMacOSVersion = function() {
  return '3.0.4';
};

proto._handleFreebsdPlatform = function() {
  return false;
};

proto._downloadLib = function* () {};

proto._getPlatforms = function() {
  return [ 'macos', 'linux', 'freebsd', 'win', 'sunos' ];
};

proto._getPlatformArchs = function(platform) {
  if (platform === 'macos' || platform === 'osx') {
    return;
  }
  return [ 'x64', 'x86' ];
};
