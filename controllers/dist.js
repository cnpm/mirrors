'use strict';

var debug = require('debug')('mirrors:controllers:dist');
var Dist = require('../services/dist');
var nfs = require('../common/nfs');
var config = require('../config');
var utility = require('utility');
var mime = require('mime-types');
var fmt = require('util').format;
var ms = require('humanize-ms');
var bytes = require('bytes');
var path = require('path');
var fs = require('fs');
var urlparse = require('url').parse;

module.exports = function* () {
  // TODO will error in windows
  var p = path.normalize(this.path);
  var paths = p.split('/');
  paths.shift();

  var category = paths.shift();
  if (category.startsWith('@')) {
    // @journeyapps/sqlcipher
    category = `${category}/${paths.shift()}`;
  }
  var name = paths.join('/').replace(/^\/?/, '/');

  debug('request %s, normalize to %s, got category: %s, name: %s', this.path, p, category, name);

  var categoryInfo = config.categories[category];
  // if (!categoryInfo) {
  //   debug('requiest %s, category %s not exist', this.path, category);
  //   return this.status = 404;
  // }

  // list dir
  if (name[name.length - 1] === '/') {
    var items = yield Dist.listdir(category, name);
    items = items.map(function (item) {
      if (!item.size) {
        item.size = '-';
      } else {
        item.size = fmt('%s(%s)', item.size, bytes(item.size));
      }
      item.date = item.date || '';
      return item;
    });

    debug('list dir %s:%s, got %j', category, name, items);
    var disturl = '';
    if (config.categories[category]) {
      disturl = config.categories[category].disturl.replace(/\/$/, '') + name.replace(/^\/?/, '/');
    }
    var title = (categoryInfo ? categoryInfo.name : category) + ' Mirror'
    yield this.render('dist', {
      title: title,
      disturl: disturl,
      category: category,
      items: items,
      padding: padding
    });
    return;
  }

  yield download.call(this, category, name);
};

function* download(category, name) {
  // download file
  var info = yield Dist.getfile(category, name);
  if (!info || !info.url) {
    // auto fix /vX.X.X => /X.X.X
    // HTTPError: Response code 404 (Not Found) for http://npmmirror.com/mirrors/electron/v8.2.0/electron-v8.2.0-darwin-x64.zip
    // fix to => http://npmmirror.com/mirrors/electron/8.2.0/electron-v8.2.0-darwin-x64.zip
    if (/^\/v\d+\.\d+\.\d+/.test(name)) {
      info = yield Dist.getfile(category, name.replace('/v', '/'));
    } else if (/^\/\d+\.\d+\.\d+/.test(name)) {
      info = yield Dist.getfile(category, name.replace('/', '/v'));
    }
  }
  if (!info || !info.url) {
    debug('file %s:%s not exist', category, name);
    return this.status = 404;
  }

  if (config.pipeAll) {
    if (info.url.indexOf('http') === 0) {
      info.url = urlparse(info.url).path;
    }
    return yield pipe.call(this, info, false);
  }

  if (/\.(html|js|css|json|txt|tab|txt\.asc|txt\.gpg)$/.test(name) ||
      /RELEASES$/.test(name)) {
    if (info.url.indexOf('http') === 0) {
      info.url = urlparse(info.url).path;
    }
    return yield pipe.call(this, info, false);
  }

  if (info.url.indexOf('http') === 0) {
    // make sure use nfs new domain
    if (typeof nfs.url === 'function') {
      info.url = nfs.url(urlparse(info.url).path);
    }
    return this.redirect(info.url);
  }

  return yield pipe.call(this, info, false);
}

function* pipe(info, attachment) {
  this.type = mime.lookup(info.url);

  if (typeof info.size === 'number' && info.size > 0) {
    this.length = info.size;
  }

  var type = mime.lookup(info.url);
  if (/\.(txt\.asc|txt\.gpg|tab)$/.test(info.name) ||
     (/RELEASES$/.test(info.name))) {
    type = 'text/plain';
  }
  debug('pipe %j, attachment: %s, type: %s', info, attachment, type);
  if (type) {
    this.type = type;
  }

  var etag = info.md5 || info.sha1;
  if (etag) {
    this.etag = etag;
  }

  if (attachment) {
    this.attachment(info.name);
  }

  return this.body = yield downloadAsReadStream(info.url);
}

function* downloadAsReadStream(key) {
  var options = { timeout: ms('10m') };
  if (nfs.createDownloadStream) {
    return yield nfs.createDownloadStream(key, options);
  }

  var tmpPath = path.join(config.uploadDir,
    utility.randomString() + key.replace(/\//g, '-'));
  function cleanup() {
    debug('cleanup %s', tmpPath);
    fs.unlink(tmpPath, utility.noop);
  }
  debug('downloadAsReadStream() %s to %s', key, tmpPath);
  try {
    yield nfs.download(key, tmpPath, options);
  } catch (err) {
    debug('downloadAsReadStream() %s to %s error: %s', key, tmpPath, err.stack);
    cleanup();
    throw err;
  }
  var tarball = fs.createReadStream(tmpPath);
  tarball.once('error', cleanup);
  tarball.once('end', cleanup);
  return tarball;
}

function padding(max, current, pad) {
  pad = pad || ' ';
  var left = max - current;
  var str = '';
  for (var i = 0; i < left; i++) {
    str += pad;
  }
  return str;
}
