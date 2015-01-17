/**!
 * mirrors - sync/npm.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:npm');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');

module.exports = NpmSyncer;

function NpmSyncer(options) {
  if (!(this instanceof NpmSyncer)) {
    return new NpmSyncer(options);
  }
  Syncer.call(this, options);
}

util.inherits(NpmSyncer, Syncer);

var proto = NpmSyncer.prototype;

proto.check = function () {
  return true;
};

proto.listdir = function* (fullname) {
  var url = 'https://api.github.com/repos/npm/npm/releases';
  var result = yield urllib.request(url, {
    timeout: 60000,
    dataType: 'json',
    gzip: true,
  });
  var releases = result.data || [];
  debug('listdir %s got %s, %j, releases: %s',
    url, result.status, result.headers, releases.length);
  var items = [];
  if (releases.length) {
    for (var i = 0; i < releases.length; i++) {
      var release = releases[i];
      items.push({
        name: release.tag_name + '.tgz',
        date: release.created_at,
        size: null,
        type: 'file',
        downloadURL: release.tarball_url,
        parent: fullname
      });
      items.push({
        name: release.tag_name + '.zip',
        date: release.created_at,
        size: null,
        type: 'file',
        downloadURL: release.zipball_url,
        parent: fullname
      });
    }
  }
  return items;
};
