'use strict';

var debug = require('debug')('mirrors:sync:github');
var util = require('util');
var urllib = require('urllib');
var urlutil = require('url');
var sleep = require('mz-modules/sleep');
var config = require('../config');
var utils = require('../lib/utils');
var Syncer = require('./syncer');

module.exports = GithubSyncer;

function GithubSyncer(options) {
  if (!(this instanceof GithubSyncer)) {
    return new GithubSyncer(options);
  }
  Syncer.call(this, options);
  this.url = util.format('https://api.github.com/repos/%s/releases', options.repo);
  if (config.githubApiProxy) {
    this.url = this.url.replace('https://api.github.com', config.githubApiProxy);
  }
  this.archiveUrl = util.format('https://github.com/%s/archive/', options.repo);
  if (config.githubProxy) {
    this.archiveUrl = this.archiveUrl.replace('https://github.com', config.githubProxy);
  }
  // download tgz source or not, default is false
  if (options.needSourceCode === undefined) {
    options.needSourceCode = false;
  }
  this.needSourceCode = options.needSourceCode;
  this.authorization = utils.getGithubBasicAuth();
  this._retryOn403 = !!options.retryOn403;
  this.max = options.max;
  // 200 MB
  this.maxFileSize = options.maxFileSize || 1024 * 1024 * 200;
  this._result = null;
}

util.inherits(GithubSyncer, Syncer);

var proto = GithubSyncer.prototype;

proto.check = function (checksums, info) {
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};

function formatRedirectUrl(url, location) {
  url = urlutil.resolve(url, location);
  if (config.githubApiProxy) {
    url = url.replace('https://api.github.com', config.githubApiProxy);
  }
  if (config.githubProxy) {
    url = url.replace('https://github.com', config.githubProxy);
  }
  return url;
}

proto.listdir = function* (fullname) {
  var result = this._result;
  if (!result) {
    result = yield urllib.request(this.url, {
      timeout: 60000,
      dataType: 'json',
      gzip: true,
      headers: { authorization: this.authorization },
      followRedirect: true,
      formatRedirectUrl: formatRedirectUrl,
    });
    debug('listdir %s got %s, %j, releases: %s',
      this.url, result.status, result.headers, result.data.length || '-');

    if ((result.status === 403 || result.status === 429) && this._retryOn403) {
      this.logger.syncInfo('[%s] request %s status: %s, retry after 20s, headers: %j',
        this.category, this.url, result.status, result.headers);
      yield sleep(20000);
      result = yield urllib.request(this.url, {
        timeout: 60000,
        dataType: 'json',
        gzip: true,
        followRedirect: true,
        formatRedirectUrl: formatRedirectUrl,
      });
      debug('listdir %s got %s, %j, releases: %s',
        this.url, result.status, result.headers, result.data.length || '-');
    }
    if (result.status !== 200) {
      throw new Error(util.format('get %s resposne %s', this.url, result.status));
    }
  }

  var releases = this.max
    ? result.data.slice(0, this.max)
    : result.data;

  var that = this;
  return releases.map(function (release) {
    return that.parseRelease(fullname, release);
  }).reduce(function (prev, curr) {
    return prev.concat(curr);
  });
};

proto.parseRelease = function (fullname, release) {
  var items = [];
  var name;
  if (this.needSourceCode) {
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
  return {
    name: asset.name,
    date: asset.updated_at || asset.created_at,
    size: asset.size,
    type: 'file',
    downloadURL: asset.browser_download_url,
    parent: fullname
  };
};
