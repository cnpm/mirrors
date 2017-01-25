'use strict';

var debug = require('debug')('mirrors:sync:phantomjs');
var util = require('util');
var urllib = require('urllib');
var bytes = require('bytes');
var urlResolve = require('url').resolve;
var Syncer = require('./syncer');

module.exports = PhtantomjsSyncer;

function PhtantomjsSyncer(options) {
  if (!(this instanceof PhtantomjsSyncer)) {
    return new PhtantomjsSyncer(options);
  }
  Syncer.call(this, options);
}

util.inherits(PhtantomjsSyncer, Syncer);

var proto = PhtantomjsSyncer.prototype;

proto.check = function () {
  return true;
};

// <tr class="iterable-item" id="download-301626">
//   <td class="name"><a class="execute" href="/ariya/phantomjs/downloads/phantomjs-1.9.7-windows.zip">phantomjs-1.9.7-windows.zip</a></td>
//   <td class="size">6.7 MB</td>
//   <td class="uploaded-by"><a href="/Vitallium">Vitallium</a></td>
//   <td class="count">122956</td>
//   <td class="date">
//     <div>
//       <time datetime="2014-01-27T18:29:53.706942" data-title="true">2014-01-27</time>
//     </div>
//   </td>
//   <td class="delete">
//
//   </td>
// </tr>

// <tr class="iterable-item" id="download-468654">
//   <td class="name"><a class="execute" href="/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-x86_64.tar.bz2">phantomjs-1.9.8-linux-x86_64.tar.bz2</a></td>
//   <td class="size">12.6&nbsp;MB</td>
//   <td class="uploaded-by"><a href="/ariya">ariya</a></td>
//   <td class="count">1507662</td>
//   <td class="date">
//   <div>
//   <time datetime="2014-10-25T01:45:09.810443" data-title="true" title="25 October 2014 09:45">2014-10-25</time>
//   </div>
//   </td>
//   <td class="delete">
//
//   </td>
// </tr>

proto.FILE_RE = /<aclass="execute"href="([^"]+)">([^<]+)<\/a>.+?<tdclass="size">([^<]+).+?<timedatetime="([^"]+)"/;

proto._findItems = function (html) {
  var splits = html.split(/<tr class="iterable\-item" id="download\-\d+">/).map(function (s) {
    // <tdclass="name"><aclass="execute"href="/ariya/phantomjs/downloads/phantomjs-1.9.8-linux-i686.tar.bz2">phantomjs-1.9.8-linux-i686.tar.bz2</a></td><tdclass="size">12.9MB</td><tdclass="uploaded-by"><ahref="/ariya">ariya</a></td><tdclass="count">33384</td><tdclass="date"><div><timedatetime="2014-10-24T03:15:51.534299"data-title="true">2014-10-24</time></div></td><tdclass="delete"></td></tr>
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
    if (!name || !downloadURL || !/\.(zip|bz2|gz)$/.test(downloadURL)) {
      return;
    }
    downloadURL = urlResolve(this.disturl, downloadURL);
    var size = parseInt(bytes(m[3].toLowerCase()));
    if (size > 1024 * 1024) {
      size -= 1024 * 1024;
    } else if (size > 1024) {
      size -= 1024;
    } else {
      size -= 10;
    }
    var date = m[4].trim();
    items.push({
      name: name, // 'SHASUMS.txt', 'x64/'
      date: date,
      size: size,
      type: 'file',
      downloadURL: downloadURL,
    });
  }
  return items;
};

proto.listdir = function* (fullname) {
  var url = this.disturl;
  var result = yield urllib.request(url, {
    timeout: 60000,
    followRedirect: true,
  });
  debug('listdir %s got %s, %j', url, result.status, result.headers);
  var html = result.data && result.data.toString() || '';
  var items = this._findItems(html);
  items.forEach(function (item) {
    item.parent = fullname;
  });
  return items;
};

proto.listdiff = function* (fullname) {
  var items = yield* this.listdir(fullname);
  if (items.length === 0) {
    return items;
  }
  var exists = yield* this.listExists(fullname);
  var map = {};
  for (var i = 0; i < exists.length; i++) {
    var item = exists[i];
    map[item.name] = item;
  }
  var news = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var exist = map[item.name];
    if (!exist || exist.date !== item.date) {
      news.push(item);
      continue;
    }

    // if (item.size !== exist.size) {
    //   news.push(item);
    //   continue;
    // }

    debug('skip %s', item.name);
  }
  return news;
};
