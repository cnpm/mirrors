'use strict';

var debug = require('debug')('mirrors:sync:atom-shell');
var urllib = require('urllib');
var util = require('util');
var Syncer = require('./syncer');

module.exports = AtomShellSyncer;

function AtomShellSyncer(options) {
  if (!(this instanceof AtomShellSyncer)) {
    return new AtomShellSyncer(options);
  }
  Syncer.call(this, options);
}

util.inherits(AtomShellSyncer, Syncer);

var proto = AtomShellSyncer.prototype;

proto.listdir = function* (fullname) {
  var PADDING = 'atom-shell/dist/';
  var prefix = PADDING + fullname.substring(1);
  var url = this.disturl + '/?max-keys=10000&delimiter=/&prefix=' + prefix;
  var res = yield urllib.request(url, {
    timeout: 60 * 1000,
    dataType: 'text',
    followRedirect: true,
  });
  debug('listdir %s got %s, %j', url, res.status, res.headers);

  var html = res.data || '';
  var items = [];
  // https://gh-contractor-zcbenz.s3.amazonaws.com/?max-keys=10000&delimiter=/&prefix=atom-shell/dist/
  // <CommonPrefixes><Prefix>atom-shell/dist/0.23.0/</Prefix></CommonPrefixes><CommonPrefixes><Prefix>atom-shell/dist/1.1.0/</Prefix></CommonPrefixes><CommonPrefixes><Prefix>atom-shell/dist/1.4.5/</Prefix></CommonPrefixes>
  // <CommonPrefixes>
  // <Prefix>atom-shell/dist/v1.6.3/</Prefix>
  // </CommonPrefixes>
  var dirRe = /<CommonPrefixes><Prefix>([^<]+)<\/Prefix><\/CommonPrefixes>/g;
  while (true) {
    var match = dirRe.exec(html);
    if (!match) {
      break;
    }
    var name = match[1].replace(PADDING, '');
    if (name[0] === '.' || name[0] !== 'v') {
      // <Prefix>0.23.0/</Prefix>
      // <Prefix>.tmp/</Prefix>
      continue;
    }

    if (!this.versionsMap) {
      // make sure version exists on https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist/index.json
      var indexJSONUrl = 'https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist/index.json';
      var versions = yield urllib.request(indexJSONUrl, {
        dataType: 'json',
        timeout: 20000,
      });
      this.versionsMap = {};
      for (var i = 0; i < versions.length; i++) {
        var item = versions[i];
        this.versionsMap[item.version] = item;
      }
    }

    // skip not finished version, wait for all files upload success
    var version = name.split('/')[0].substring(1);
    if (!this.versionsMap[version]) {
      continue;
    }

    if (name.indexOf('/x64/') > 0) {
      // <Prefix>v0.16.0/x64/</Prefix>
      name = 'x64/';
    } else if (name.indexOf('/win-x64/') > 0) {
      name = 'win-x64/';
    } else if (name.indexOf('/win-x86/') > 0) {
      name = 'win-x86/';
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

  // <Contents><Key>atom-shell/dist/index.json</Key><LastModified>2017-01-24T18:20:12.000Z</LastModified><ETag>&quot;baefa31b950a47a94980399566ecda77&quot;</ETag><Size>40810</Size><StorageClass>STANDARD</StorageClass></Contents><Contents><Key>atom-shell/dist/nan-1.6.1.tgz</Key><LastModified>2015-04-23T02:29:23.000Z</LastModified><ETag>&quot;13ddf39ad45e4371e92a0157db3b2e61&quot;</ETag><Size>36819</Size><StorageClass>STANDARD</StorageClass></Contents>
  var fileRe = /<Contents><Key>([^<]+)<\/Key><LastModified>([^<]+)<\/LastModified><ETag>([^<]+)<\/ETag><Size>(\d+)<\/Size><StorageClass>[^<]+<\/StorageClass><\/Contents>/g;
  while (true) {
    var match = fileRe.exec(html);
    if (!match) {
      break;
    }
    var names = match[1].split('/');
    var name = names[names.length - 1].trim();
    // <Key>atom-shell/dist/index.json</Key>
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
      downloadURL: this.disturl + '/atom-shell/dist' + fullname + name,
    });
  }

  return items;
};

proto.check = function (checksums, info) {
  if (!info.size) {
    return true;
  }
  return checksums.size === info.size;
};
