'use strict';

const parseString = require('xml2js').parseString;
const util = require('util');
const urllib = require('urllib');
const debug = require('debug')('mirrors:sync:SourceForgeSyncer');
const Syncer = require('./syncer');

module.exports = SourceForgeSyncer;

// https://github.com/cnpm/mirrors/issues/114
function SourceForgeSyncer(options) {
  if (!(this instanceof SourceForgeSyncer)) {
    return new SourceForgeSyncer(options);
  }
  Syncer.call(this, options);
}

util.inherits(SourceForgeSyncer, Syncer);

const proto = SourceForgeSyncer.prototype;

proto.syncDir = function* (fullname) {
  var news = yield this.listdiff(fullname);
  var files = [];
  var dirs = [];

  news.forEach(function (item) {
    if (item.type === 'dir') {
      dirs.push(item);
    } else if (item.type === 'file') {
      files.push(item);
    }
  });

  this.logger.syncInfo('[%s] sync %s:%s got %d new items, %d dirs, %d files to sync',
    this.category, this.disturl, fullname, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield this.syncFile(files[i]);
  }

  // save new dirs
  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    dir.category = this.category;
    yield this.distService.savedir(dir);
  }

  this.logger.syncInfo('[%s] Sync %s finished, %d dirs, %d files',
    this.category, fullname, dirs.length, files.length);
};

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
    followRedirect: true,
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);
  if (res.status !== 200) {
    var msg = util.format('request %s error, got %s', url, res.status);
    throw new Error(msg);
  }

  var parsed = yield this._parseRSS(res.data.toString());
  // var parsed = yield this._parseRSS(require('fs').readFileSync(__dirname + '/sourceforge_test.rss', 'utf8'));
  var entries = parsed && parsed.rss && parsed.rss.channel && parsed.rss.channel[0].item || [];

  var items = [];
  var dirMap = {};
  for (const entry of entries) {
    // {
    //   "title": [
    //     "/1.5.1/README.md"
    //   ],
    //   "link": [
    //     "https://sourceforge.net/projects/libjpeg-turbo/files/1.5.1/README.md/download"
    //   ],
    //   "guid": [
    //     "https://sourceforge.net/projects/libjpeg-turbo/files/1.5.1/README.md/download"
    //   ],
    //   "pubDate": [
    //     "Sat, 08 Oct 2016 01:21:31 UT"
    //   ],
    //   "description": [
    //     "/1.5.1/README.md"
    //   ],
    //   "files:sf-file-id": [
    //     {
    //       "_": "25805987",
    //       "$": {
    //         "xmlns:files": "https://sourceforge.net/api/files.rdf#"
    //       }
    //     }
    //   ],
    //   "files:extra-info": [
    //     {
    //       "_": "English text",
    //       "$": {
    //         "xmlns:files": "https://sourceforge.net/api/files.rdf#"
    //       }
    //     }
    //   ],
    //   "media:content": [
    //     {
    //       "$": {
    //         "xmlns:media": "http://video.search.yahoo.com/mrss/",
    //         "type": "text/plain; charset=us-ascii",
    //         "url": "https://sourceforge.net/projects/libjpeg-turbo/files/1.5.1/README.md/download",
    //         "filesize": "6024"
    //       },
    //       "media:hash": [
    //         {
    //           "_": "6779d55dbcfdf468ee428f1af78f122e",
    //           "$": {
    //             "algo": "md5"
    //           }
    //         }
    //       ]
    //     }
    //   ]
    // }
    var name = entry.title && entry.title[0];
    if (!name) {
      continue;
    }
    name = name.replace(/^\/+/, '');
    var date = entry.pubDate && entry.pubDate[0];
    if (!date) {
      continue;
    }
    var meta = entry['media:content'] && entry['media:content'][0];
    var filesize = meta && meta.$ && meta.$.filesize;
    var size = parseInt(filesize);
    if (!filesize) {
      continue;
    }
    var md5 = meta && meta['media:hash'] && meta['media:hash'][0];
    md5 = md5 && md5._;
    if (!md5) {
      continue;
    }

    var downloadURL = entry.link && entry.link[0];
    if (!downloadURL) {
      continue;
    }

    var parent = '/';
    if (name.indexOf('/') > 0) {
      var names = name.split('/');
      // 1.5.1/README.md
      // 1.5.0/libjpeg-turbo-1.5.0.tar.gz
      var lastIndex = names.length - 1;
      name = names[lastIndex].trim();
      if (!name) {
        continue;
      }
      for (var j = 0; j < lastIndex; j++) {
        var dir = names[j] + '/';
        if (dir !== '/' && !dirMap[parent + dir]) {
          dirMap[parent + dir] = true;

          // dir
          items.push({
            name: dir,
            size: '-',
            date: date,
            type: 'dir',
            parent: parent,
          });
        }
        parent += dir;
      }
    }
    if (parent[0] !== '/') {
      parent = '/' + parent;
    }
    // file
    items.push({
      name: name,
      size: size,
      md5: md5,
      date: date,
      type: 'file',
      parent: parent,
      downloadURL: downloadURL
    });
  }
  return items;
};

proto.listdiff = function* () {
  var items = yield this.listdir();
  if (!items || items.length === 0) {
    return [];
  }
  var exists = yield this.listExists();
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var exist = exists[i];
    map[exist.parent + exist.name] = exist;
  }
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.parent + item.name];

    if (!exist) {
      news.push(item);
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
  return news;
};

proto.check = function (checksums, newItem) {
  return checksums.size === newItem.size && checksums.md5 === newItem.md5;
};

proto.listExists = function* () {
  var exists = yield this.distService.listdir(this.category);
  debug('listdiff %s got %s exists items', this.category, exists.length);
  return exists;
};

proto._parseRSS = function (rss) {
  return function(callback) {
    parseString(rss, callback);
  };
};
