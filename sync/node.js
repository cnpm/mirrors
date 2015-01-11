/**!
 * mirrors - services/syncer.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('mirrors:sync:node');
var config = require('../config');
var Syncer = require('./syncer');
var urllib = require('urllib');
var util = require('util');

/**
 * Module exports.
 */

module.exports = NodeSyncer;

/**
 * A syncer for node dist files.
 *
 * @param {Object} options
 */

function NodeSyncer(options) {
  if (!(this instanceof NodeSyncer)) {
    return new NodeSyncer(options);
  }
  Syncer.call(this, options);
};

util.inherits(NodeSyncer, Syncer);

var proto = NodeSyncer.prototype;

// <a href="latest/">latest/</a>                             02-May-2014 14:45                   -
// <a href="node-v0.4.10.tar.gz">node-v0.4.10.tar.gz</a>     26-Aug-2011 16:22            12410018
var FILE_RE = /^<a[^>]+>([^<]+)<\/a>\s+(\d+\-\w+\-\d+ \d+\:\d+)\s+([\-\d]+)/;

// */docs/api/
var DOC_API_RE = /\/docs\/api\/$/;

// <li><a href="documentation.html">About these Docs</a></li>
// <li><a href="synopsis.html">Synopsis</a></li>
// <li><a href="assert.html">Assertion Testing</a></li>
// <li><a href="buffer.html">Buffer</a></li>
// <li><a href="addons.html">C/C++ Addons</a></li>
// <li><a href="child_process.html">Child Processes</a></li>
// <div id="gtoc">
//   <p>
//     <a href="index.html" name="toc">Index</a> |
//     <a href="all.html">View on single page</a> |
//     <a href="index.json">View as JSON</a>
//   </p>
// </div>
var DOC_API_FILE_ALL_RE = /<a[^"]+\"(\w+\.(?:html|json))\"[^>]*>[^<]+<\/a>/gm;
var DOC_API_FILE_RE = /<a[^"]+\"(\w+\.(?:html|json))\"[^>]*>[^<]+<\/a>/;

/**
 * list all dirs and files in a specific dir
 *
 * @param {String} fullname
 */

proto.listdir = function* (fullname) {
  var url = this.disturl + fullname;

  // if is doc path
  var isDocPath = DOC_API_RE.test(fullname);
  if (isDocPath) {
    url += 'index.html';
  }

  var res = yield urllib.requestThunk(url, {
    timeout: 60 * 1000,
    dataType: 'text'
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);

  return isDocPath
    ? parseDocHtml(res, fullname)
    : parseDistHtml(res, fullname);
};

/**
 * check a file if match remote file's info
 *
 * @param {Object} checksums
 * @param {Object} info
 */

proto.check = function* (checksums, info) {
  return checksums.size === info.size;
};

/**
 * parse node doc html
 *
 * @param {Object} res
 * @return {Array}
 * @api private
 */

function parseDistHtml(res, parent) {
  var html = res.data || '';
  var items = [];

  html.split('\n').forEach(function (line) {
    var m = FILE_RE.exec(line.trim());
    if (!m) {
      return;
    }

    var itemName = m[1].replace(/^\/+/, 0);
    if (!itemName) {
      return;
    }

    if (itemName.indexOf('nightlies/') === 0) {
      return;
    }

    items.push({
      name: itemName,
      date: m[2],
      size: Number(m[3]) || '-',
      type: m[3] === '-' ? 'dir' : 'file',
      parent: parent
    });
  });
  items = items.slice(0, 2);
  return items;
}

function parseDocHtml(res, parent) {
  var html = res.data || '';
  var items = [];
  // "last-modified":"Tue, 11 Mar 2014 22:44:36 GMT"
  var date = res.headers['last-modified'] || res.headers.date || '';

 // add assets/
  items.push({
    name: 'assets/',
    date: date,
    size: '-',
    type: 'dir',
    parent: parent,
  });

  var needJSON = false;
  var htmlfileNames = [];
  var lines = html.match(DOC_API_FILE_ALL_RE) || [];
  for (var i = 0; i < lines.length; i++) {
    var m = DOC_API_FILE_RE.exec(lines[i].trim());
    if (!m) {
      continue;
    }
    var itemName = m[1];
    items.push({
      name: itemName,
      date: date,
      size: 0,
      type: 'file',
      parent: parent,
    });
    if (itemName.indexOf('.json') > 0) {
      needJSON = true;
    }
    if (itemName.indexOf('.html') > 0 && itemName !== 'index.html') {
      htmlfileNames.push(itemName);
    }
  }
  debug('listdir %s got %j', parent, htmlfileNames);
  if (needJSON) {
    // node >= 0.8.0
    htmlfileNames.forEach(function (itemName) {
      items.push({
        name: itemName.replace('.html', '.json'), // download *.json format
        date: date,
        size: 0,
        type: 'file',
        parent: parent,
      });
    });
  }

  return items;
}
