'use strict';

var debug = require('debug')('mirrors:sync:webp');
var util = require('util');
var urllib = require('urllib');
var NodeSyncer = require('./node');

module.exports = WebpSyncer;

function WebpSyncer(options) {
  if (!(this instanceof WebpSyncer)) {
    return new WebpSyncer(options);
  }
  NodeSyncer.call(this, options);
}

util.inherits(WebpSyncer, NodeSyncer);

var proto = WebpSyncer.prototype;

proto.listdir = function* (fullname) {
  var url = this.disturl;
  var res = yield urllib.request(url, {
    timeout: 60 * 1000,
    dataType: 'text',
    followRedirect: true,
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);

  return this.parseDistHtml(res, fullname);
};

// <a href="//storage.googleapis.com/downloads.webmproject.org/releases/webp/libwebp-0.4.1-linux-x86-32.tar.gz">libwebp-0.4.1-linux-x86-32.tar.gz</a>                           2014-09-20T01:01:44Z     1.29MiB
proto.FILE_RE = /^<a[^>]+?href=\"([^\"]+)\"[^>]*>([^<]+)<\/a>\s+([^\s]+)\s+([\-\.\w]+)/;

proto.parseDistHtml = function (res, parent) {
  var html = res.data || '';
  var items = [];
  var that = this;
  html.split('\n').forEach(function (line) {
    var m = that.FILE_RE.exec(line.trim());
    if (!m) {
      return;
    }

    var downloadURL = m[1];
    if (/^\/\//.test(downloadURL)) {
      downloadURL = 'http:' + downloadURL;
    }
    var itemName = m[2].replace(/^\/+/, 0);
    if (!itemName) {
      return;
    }

    var type = m[4] === '-' ? 'dir' : 'file';
    var date = m[3];

    debug(itemName, date, type, m[4], parent);

    items.push({
      name: itemName,
      date: date,
      type: type,
      parent: parent,
      downloadURL: downloadURL,
    });
  });
  return items;
};
