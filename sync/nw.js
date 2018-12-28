'use strict';

var debug = require('debug')('mirrors:sync:nw');
var urllib = require('urllib');
var util = require('util');
var Syncer = require('./syncer');

module.exports = NWSyncer;

/**
 * A syncer for node dist files.
 *
 * @param {Object} options
 */

function NWSyncer(options) {
  if (!(this instanceof NWSyncer)) {
    return new NWSyncer(options);
  }
  Syncer.call(this, options);
  this.downloadHost = 'https://dl.nwjs.io';
}

util.inherits(NWSyncer, Syncer);

var proto = NWSyncer.prototype;

/**
 * list all dirs and files in a specific dir
 *
 * @param {String} fullname
 */

proto.listdir = function* (fullname) {
  var prefix = fullname.substring(1);
  var url = this.disturl + '/?delimiter=/&prefix=' + prefix;
  var res = yield urllib.request(url, {
    timeout: 60 * 1000,
    dataType: 'text',
    followRedirect: true,
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);

  var html = res.data || '';
  var items = [];
  // https://nwjs2.s3.amazonaws.com/?delimiter=/&prefix=
  // https://nwjs2.s3.amazonaws.com/?delimiter=/&prefix=v0.12.3/
  // https://nwjs2.s3.amazonaws.com/?delimiter=/&prefix=v0.16.0/x64/
  // <CommonPrefixes><Prefix>v0.13.0/</Prefix></CommonPrefixes><CommonPrefixes><Prefix>v0.13.1/</Prefix></CommonPrefixes>
  var dirRe = /<CommonPrefixes><Prefix>([^<]+)<\/Prefix><\/CommonPrefixes>/g;
  while (true) {
    var match = dirRe.exec(html);
    if (!match) {
      break;
    }
    var name = match[1];
    if (name[0] === '.' || name[0] !== 'v') {
      // <Prefix>.tmp/</Prefix>
      // <Prefix>live-build/</Prefix>
      // <Prefix>sample/</Prefix>
      continue;
    }
    var splits = name.split('.');
    // only sync version >= 0.12.0
    if (splits.length === 3 && splits[0] === 'v0' && parseInt(splits[1]) < 12) {
      // <Prefix>v0.11.6/</Prefix>
      // <Prefix>v0.8.4/</Prefix>
      continue;
    }
    if (name.indexOf('/x64/') > 0) {
      // <Prefix>v0.16.0/x64/</Prefix>
      name = 'x64/';
    }

    debug(name, fullname);

    items.push({
      name: name,
      date: '-',
      size: '-',
      type: 'dir',
      parent: fullname,
    });
  }

  // <Contents><Key>nwjs.html</Key><LastModified>2015-11-02T02:34:18.000Z</LastModified><ETag>&quot;b1b7a52928e9f874bad0cabf7f74ba8e&quot;</ETag><Size>22842</Size><StorageClass>STANDARD</StorageClass></Contents>
  var fileRe = /<Contents><Key>([^<]+)<\/Key><LastModified>([^<]+)<\/LastModified><ETag>([^<]+)<\/ETag><Size>(\d+)<\/Size><StorageClass>[^<]+<\/StorageClass><\/Contents>/g;
  while (true) {
    var match = fileRe.exec(html);
    if (!match) {
      break;
    }
    var names = match[1].split('/');
    var name = names[names.length - 1].trim();
    // <Key>v0.13.0-alpha5/</Key>
    if (!name) {
      continue;
    }
    var date = match[2];
    var size = Number(match[4]);
    // ignore file > 100MB
    if (size > 104857600) {
      continue;
    }

    debug(name, date, size, fullname);

    items.push({
      name: name,
      date: date,
      size: size,
      type: 'file',
      parent: fullname,
      downloadURL: this.downloadHost + fullname + name
    });
  }

  return items;
};

/**
 * check a file if match remote file's info
 *
 * @param {Object} checksums
 * @param {Object} info
 */

proto.check = function (checksums, info) {
  // file: detect date and size
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};
