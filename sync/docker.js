'use strict';

var debug = require('debug')('mirrors:sync:docker');
var util = require('util');
var urllib = require('urllib');
var utils = require('../lib/utils');
var Syncer = require('./syncer');
var distService = require('../services/dist');
var logger = require('../common/logger');

module.exports = DockerSyncer;

function DockerSyncer(options) {
  if (!(this instanceof DockerSyncer)) {
    return new DockerSyncer(options);
  }
  Syncer.call(this, options);
  this.url = util.format('https://api.github.com/repos/docker/docker/releases');
  this.authorization = utils.getGithubBasicAuth();
  this.sub1Dirs = {};
  this.sub2Dirs = {};
}

util.inherits(DockerSyncer, Syncer);

var proto = DockerSyncer.prototype;

proto.syncDir = function* (fullname, dirIndex) {
  var news = yield this.listdiff(fullname, dirIndex);
  var files = [];
  var dirs = [];

  news.forEach(function (item) {
    if (item.type === 'dir') {
      return dirs.push(item);
    }
    files.push(item);
  });

  logger.syncInfo('[%s] sync %s:%s#%s got %d new items, %d dirs, %d files to sync',
    this.category, this.disturl, fullname, dirIndex, news.length, dirs.length, files.length);

  for (var i = 0; i < files.length; i++) {
    yield this.syncFile(files[i]);
  }

  for (var i = 0; i < dirs.length; i++) {
    var dir = dirs[i];
    // save to database
    dir.category = this.category;
    yield this.distService.savedir(dir);
    logger.syncInfo('[%s] Save dir:%s#%s %j to database', this.category, fullname, dirIndex, dir);
  }

  logger.syncInfo('[%s] Sync %s#%s finished, %d dirs, %d files',
    this.category, fullname, dirIndex, dirs.length, files.length);
};

proto.listdir = function* () {
  var releases = [];
  // init sync should sync 3 pages
  for (var i = 1; i <= 1; i++) {
    var result = yield urllib.request(this.url + '?page=' + i, {
      timeout: 60000,
      dataType: 'json',
      gzip: true,
      headers: this.authorization ? { authorization: this.authorization } : null,
      followRedirect: true,
    });
    logger.syncInfo('[%s] listdir %s got %s, %j, releases: %s',
      this.category, this.url, result.status, result.headers, result.data.length || '-');

    if (result.status === 200) {
      releases = releases.concat(result.data);
    }
  }

  var items = [];
  for (var i = 0; i < releases.length; i++) {
    var release = releases[i];
    var releaseItems = this.parseRelease(release);
    items = items.concat(releaseItems);
  }

  for (var key in this.sub1Dirs) {
    items.push(this.sub1Dirs[key]);
  }
  for (var key in this.sub2Dirs) {
    items.push(this.sub2Dirs[key]);
  }

  return items;
};

proto.parseRelease = function (release) {
  var items = [];
  var sub1Dirs = this.sub1Dirs;
  var sub2Dirs = this.sub2Dirs;

  // **Linux 64bits tgz**: https://get.docker.com/builds/Linux/x86_64/docker-17.04.0-ce-rc1.tgz\r\n>
  // **Darwin/OSX 64bits client tgz**: https://get.docker.com/builds/Darwin/x86_64/docker-17.04.0-ce-rc1.tgz\r\n>
  // **Linux 32bits arm tgz**: https://get.docker.com/builds/Linux/armel/docker-17.04.0-ce-rc1.tgz\r\n>
  // **Windows 64bits zip**: https://get.docker.com/builds/Windows/x86_64/docker-17.04.0-ce-rc1.zip\r\n>
  // **Windows 32bits client zip**: https://get.docker.com/builds/Windows/i386/docker-17.04.0-ce-rc1.zip\r\n"
  var body = release.body || '';
  var urlRE = /https:\/\/get\.docker.com\/builds\/([^\/]+)\/([^\/]+)\/(.+?\.\w+)$/gm;
  var m = urlRE.exec(body);
  while (m) {
    // [ 'https://get.docker.com/builds/Windows/i386/docker-17.04.0-ce-rc1.zip',
    // 'Windows',
    // 'i386',
    // 'docker-17.04.0-ce-rc1.zip'
    items.push({
      name: m[3],
      date: release.created_at,
      size: null,
      type: 'file',
      downloadURL: m[0],
      parent: '/' + m[1] + '/' + m[2] + '/',
    });

    // Linux/ dir
    if (!sub1Dirs[m[1]]) {
      sub1Dirs[m[1]] = {
        name: m[1] + '/',
        date: release.created_at,
        type: 'dir',
        parent: '/',
      };
    }
    // Linux/armel/ dir
    var sub2DirName = m[1] + '/' + m[2] + '/';
    if (!sub2Dirs[sub2DirName]) {
      sub2Dirs[sub2DirName] = {
        name: m[2] + '/',
        date: release.created_at,
        type: 'dir',
        parent: '/' + m[1] + '/',
      };
    }

    m = urlRE.exec(body);
  }

  return items;
};

proto.listdiff = function* () {
  var items = yield this.listdir();
  debug();
  if (!items || items.length === 0) {
    return [];
  }

  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    if (item.isNew) {
      news.push(item);
      continue;
    }

    var exist = yield distService.get(item.type, this.category, item.parent, item.name);

    if (!exist) {
      news.push(item);
      continue;
    }

    if (exist.type === 'file') {
      if (exist.date !== item.date) {
        news.push(item);
        continue;
      }
    }

    debug('skip %j', item);
  }
  return news;
};
