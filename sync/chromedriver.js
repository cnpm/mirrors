/**!
* mirrors - sync/chromedriver.js
*
* Authors:
*   fengmk2 <fengmk2@gmail.com> (https://github.com/fengmk2)
*/

'use strict';

/**
* Module dependencies.
*/

var debug = require('debug')('mirrors:sync:chromedriver');
var util = require('util');
var urllib = require('urllib');
var Syncer = require('./syncer');

module.exports = ChromeDriverSyncer;

function ChromeDriverSyncer(options) {
  if (!(this instanceof ChromeDriverSyncer)) {
    return new ChromeDriverSyncer(options);
  }
  Syncer.call(this, options);
}

util.inherits(ChromeDriverSyncer, Syncer);

var proto = ChromeDriverSyncer.prototype;

proto.check = function (checksums, info) {
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};

proto.listdir = function* () {
  var url = this.disturl;
  var res = yield urllib.request(url, {
    timeout: 60 * 1000,
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);
  if (res.status !== 200) {
    var msg = util.format('request %s error, got %s', url, res.status);
    throw new Error(msg);
  }

  // <Contents><Key>2.0/chromedriver_linux32.zip</Key><Generation>1380149859530000</Generation><MetaGeneration>2</MetaGeneration><LastModified>2013-09-25T22:57:39.349Z</LastModified><ETag>"c0d96102715c4916b872f91f5bf9b12c"</ETag><Size>7262134</Size><Owner/></Contents><Contents>
  var splits = res.data.toString().split('<Contents><Key>');
  var items = [];
  var re = /([^<]+).+?<LastModified>([^<]+)<\/LastModified>.+?<Size>(\d+)<\/Size>/;
  var dirMap = {};
  for (var i = 1; i < splits.length; i++) {
    var m = re.exec(splits[i]);
    if (!m) {
      continue;
    }
    var name = m[1];
    var date = m[2];
    var size = parseInt(m[3]);
    var downloadURL = this.disturl + '/' + name;
    var parent = '/';
    if (name.indexOf('/') > 0) {
      var names = name.split('/');
      parent = names[0] + '/';
      name = names[1];
    }
    // file
    items.push({
      name: name,
      size: size,
      date: date,
      type: 'file',
      parent: parent,
      downloadURL: downloadURL
    });

    if (parent !== '/' && !dirMap[parent]) {
      dirMap[parent] = true;

      // dir
      items.push({
        name: parent,
        size: '-',
        date: date,
        type: 'dir',
        parent: '/',
      });
    }
  }

  return items;
};

proto.listdiff = function* () {
  var items = yield* this.listdir();
  if (!items || items.length === 0) {
    return [];
  }
  var exists = yield* this.listExists();
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var exist = exists[i];
    map[exist.parent + exist.name] = exist;
  }
  var newDirs = [];
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.parent + item.name];

    if (!exist) {
      if (item.type === 'dir') {
        newDirs.push(item);
      } else {
        news.push(item);
      }
      continue;
    }

    if (item.type !== 'file') {
      continue;
    }

    if (exist.date !== item.date) {
      news.push(item);
      continue;
    }

    if (!this.check(exist, item)) {
      news.push(item);
      continue;
    }

    debug('skip %s', item.name);
  }
  // save new dirs
  for (var i = 0; i < newDirs.length; i++) {
    var dir = newDirs[i];
    dir.category = this.category;
    yield* this.distService.savedir(dir);
    this.logger.syncInfo('Save dir:%s %j to database', dir.name, dir);
  }

  return news;
};

proto.listExists = function* () {
  var exists = yield* this.distService.listdir(this.category);
  debug('listdiff %s got %s exists items', this.category, exists.length);
  return exists;
};
