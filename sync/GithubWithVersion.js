/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var util = require('util');
var GithubSyncer = require('./github');

module.exports = GtihubWithVersionSyncer;

function GtihubWithVersionSyncer(options) {
  if (!(this instanceof GtihubWithVersionSyncer)) {
    return new GtihubWithVersionSyncer(options);
  }
  GithubSyncer.call(this, options);
  if (options.needFormatTagName === undefined) {
    options.needFormatTagName = true;
  }
  this.needFormatTagName = options.needFormatTagName;
}

util.inherits(GtihubWithVersionSyncer, GithubSyncer);

var proto = GtihubWithVersionSyncer.prototype;

proto.parseRelease = function (fullname, release) {
  var items = [];
  var version = release.tag_name;
  if (this.needFormatTagName) {
    version = version.replace(/^v/, '');
  }
  if (fullname === '/') {
    items.push({
      name: version + '/',
      date: release.published_at || release.created_at,
      size: '-',
      type: 'dir',
      parent: fullname,
      isNew: true,
    });
    return items;
  }

  var name;
  var parent = '/' + version + '/';
  if (parent !== fullname) {
    return items;
  }

  if (release.tarball_url) {
    name = release.tag_name + '.tar.gz';
    items.push({
      name: name,
      date: release.created_at,
      size: null,
      type: 'file',
      downloadURL: this.archiveUrl + name,
      parent: fullname
    });
  }

  if (release.zipball_url) {
    name = release.tag_name + '.zip';
    items.push({
      name: name,
      date: release.created_at,
      size: null,
      type: 'file',
      downloadURL: this.archiveUrl + name,
      parent: fullname
    });
  }

  if (release.assets) {
    var that = this;
    release.assets.forEach(function (asset) {
      var item = that.formatAssetItem(fullname, asset);
      if (item) {
        if (!item.size || item.size <= that.maxFileSize) {
          items.push(item);
        }
      }
    });
  }

  return items;
};

proto.formatAssetItem = function (fullname, asset) {
  // "browser_download_url": "https://github.com/atom/atom/releases/download/v0.198.0/atom-0.198.0-delta.nupkg"
  // "browser_download_url": "https://github.com/atom/atom/releases/download/v0.198.0/atom-mac.zip"
  // if (asset.name !== 'RELEASES') {
  //   return;
  // }
  return {
    name: asset.name,
    date: asset.updated_at || asset.created_at,
    size: asset.size,
    type: 'file',
    downloadURL: asset.browser_download_url,
    parent: fullname
  };
};
