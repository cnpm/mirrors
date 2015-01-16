/**!
* mirrors - sync/phantomjs.js
*
* Copyright(c) fengmk2 and other contributors.
* MIT Licensed
*
* Authors:
*   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
*/

'use strict';

/**
* Module dependencies.
*/

var debug = require('debug')('mirrors:sync:phantomjs');
var util = require('util');
var urllib = require('urllib');
var cheerio = require('cheerio');
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

proto.listdir = function* (fullname) {
  var url = 'https://bitbucket.org/ariya/phantomjs/downloads';
  var result = yield urllib.request(url, {
    timeout: 60000,
  });
  debug('listPhantomjsDir %s got %s, %j', url, result.status, result.headers);
  var html = result.data && result.data.toString() || '';
  var $ = cheerio.load(html);
  var items = [];
  $('tr.iterable-item').each(function (_, el) {
    var $el = $(this);
    var $link = $el.find('.name a');
    var name = $link.text();
    var downloadURL = $link.attr('href');
    if (!name || !downloadURL || !/\.(zip|bz2|gz)$/.test(downloadURL)) {
      return;
    }
    downloadURL = urlResolve(url, downloadURL);
    var size = parseInt(bytes($el.find('.size').text().toLowerCase().replace(/\s/g, '')));
    if (size > 1024 * 1024) {
      size -= 1024 * 1024;
    } else if (size > 1024) {
      size -= 1024;
    } else {
      size -= 10;
    }
    var date = $el.find('.date time').text();
    items.push({
      name: name, // 'SHASUMS.txt', 'x64/'
      date: date,
      size: size,
      type: 'file',
      parent: fullname,
      downloadURL: downloadURL,
    });
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
