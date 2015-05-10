/**!
 * mirrors - sync/Operadriver.js
 *
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 *   dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var util = require('util');
var GithubSyncer = require('./github');

module.exports = OperadriverSyncer;

function OperadriverSyncer(options) {
  if (!(this instanceof OperadriverSyncer)) {
    return new OperadriverSyncer(options);
  }
  GithubSyncer.call(this, options);
}

util.inherits(OperadriverSyncer, GithubSyncer);

var proto = OperadriverSyncer.prototype;

proto.formatAssetItem = function (fullname, asset) {
  // "browser_download_url": "https://github.com/operasoftware/operachromiumdriver/releases/download/v0.2.0/operadriver_mac64.zip"
  var version = asset.browser_download_url.split('/');
  version = version[version.length - 2];
  var name = asset.name;
  if (name.indexOf(version) === -1) {
    name = name.replace('_', '_' + version + '_');
  }
  console.log(name, asset, fullname)
  return {
    name: name,
    date: asset.updated_at || asset.created_at,
    size: asset.size,
    type: 'file',
    downloadURL: asset.browser_download_url,
    parent: fullname
  };
};
