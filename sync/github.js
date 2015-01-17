/**!
 * mirrors - sync/github.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com>
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:github');
var util = require('util');
var urllib = require('urllib');
var utils = require('../lib/utils');
var Syncer = require('./syncer');
var config = require('../config');

module.exports = GithubSyncer;

function GithubSyncer(options) {
  if (!(this instanceof GithubSyncer)) {
    return new GithubSyncer(options);
  }
  Syncer.call(this, options);
  this.url = util.format('https://api.github.com/repos/%s/releases', options.repo);
  this.authorization = utils.getGithubBasicAuth();
}

util.inherits(GithubSyncer, Syncer);

var proto = GithubSyncer.prototype;

proto.check = function () {
  return true;
};

proto.listdir = function* (fullname) {
  var result = yield urllib.request(this.url, {
    timeout: 60000,
    dataType: 'json',
    gzip: true,
    headers: { authorization: this.authorization }
  });
  debug('listdir %s got %s, %j, releases: %s',
    this.url, result.status, result.headers, result.data.length || '-');

  if (result.status !== 200) {
    throw new Error(util.format('get %s resposne %s', this.url, result.status));
  }

  return result.data.map(parseRelease).reduce(function (prev, curr) {
    return prev.concat(curr);
  });

  function parseRelease(release) {
    var items = [];
    if (release.tarball_url) {
      items.push({
        name: release.tag_name + '.tgz',
        date: release.created_at,
        size: null,
        type: 'file',
        downloadURL: release.tarball_url,
        parent: fullname
      });
    }

    if (release.zipball_url) {
      items.push({
        name: release.tag_name + '.zip',
        date: release.created_at,
        size: null,
        type: 'file',
        downloadURL: release.zipball_url,
        parent: fullname
      });
    }

    if (release.assets) {
      release.assets.forEach(function (asset) {
        items.push({
          name: asset.name,
          date: asset.updated_at || asset.created_at,
          size: asset.size,
          type: 'file',
          downloadURL: asset.browser_download_url,
          parent: fullname
        });
      });
    }

    return items;
  }

};
