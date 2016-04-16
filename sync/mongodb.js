/**
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   nightink <chceyes@gmail.com> (https://github.com/nightink)
 */

'use strict';

/**
 * Module dependencies.
 */

var bytes = require('bytes');
var util = require('util');
var debug = require('debug')('mirrors:sycn:mongodb');
var urllib = require('urllib');
var Syncer = require('./syncer');

module.exports = MongodbSycner;

function MongodbSycner(options) {
  if (!this instanceof MongodbSycner) {
    return new MongodbSycner(options);
  }

  Syncer.call(this, options);
}

util.inherits(MongodbSycner, Syncer);

var proto = MongodbSycner.prototype;

proto.check = function(checksums, info) {
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};

proto.FILE_RE = /<td><ahref="([^"]+)">([^<]+)<\/a>.+?<td>([^<]+).+?<td>(\d+)<\/td>/;

proto._findItems = function(html, platform) {
  var splits = html.split(/<tr>/).map(function (s) {
    // <td><a href="http://downloads.mongodb.org/osx/mongodb-osx-i386-0.9.2.tgz">osx/mongodb-osx-i386-0.9.2.tgz</a></td>
    // <td>2009-05-22 19:38:18</td>
    // <td>13317866</td>
    // <td><a href="http://downloads.mongodb.org/osx/mongodb-osx-i386-0.9.2.tgz.md5">md5</a></td>
    // <td></td>
    // <td></td>
    // <td></td>
    return s.replace(/\s+/g, '');
  });

  var items = [];
  for (var i = 1; i < splits.length; i++) {
    var m = this.FILE_RE.exec(splits[i]);
    if (!m) {
      continue;
    }
    var downloadURL = m[1].trim();
    var name = m[2].trim();
    if (!name || !downloadURL || !/\.(tgz|msi|zip)$/.test(downloadURL)) {
      debug('illegal download url %s', downloadURL);
      continue;
    }

    var date = m[3].trim();
    var size = parseInt(bytes(m[4].toLowerCase()));
    if (size > 1024 * 1024) {
      size -= 1024 * 1024;
    } else if (size > 1024) {
      size -= 1024;
    } else {
      size -= 10;
    }

    items.push({
      name: name, // mongodb tgz name file
      date: date,
      size: size,
      type: 'file',
      downloadURL: downloadURL,
      parent: platform,
    });
  }

  debug('_findItems items length %s', items.length);
  return items;
};

// https://github.com/cnpm/mirrors/issues/93
proto.listdir = function* (fullname, dirIndex) {
  var platforms = [
    'osx',
    'linux',
    'win32',
  ];

  var items = [];
  for (var i = 0, len = platforms.length; i < len; i++) {
    var platform = platforms[i];
    var platformUri = this.disturl + '/' + platform;
    var result = yield urllib.request(platformUri, {
      timeout: 60000,
      gzip: true,
      followRedirect: true,
    });

    var html = result.data && result.data.toString() || '';
    var tmpItems = this._findItems(html, platform);
    items = items.concat(tmpItems);
    debug('mongo current platform: %s, got itmes length', platform, items.length);
  }

  debug('listdiff itmes length %s', items.length);

  return items;
};
