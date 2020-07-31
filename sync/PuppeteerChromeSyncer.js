'use strict';

const debug = require('debug')('mirrors:sync:PuppeteerChromeSyncer');
const util = require('util');
const urllib = require('urllib');
const Syncer = require('./syncer');
const utils = require('../lib/utils');

module.exports = PuppeteerChromeSyncer;

function PuppeteerChromeSyncer(options) {
  if (!(this instanceof PuppeteerChromeSyncer)) {
    return new PuppeteerChromeSyncer(options);
  }
  Syncer.call(this, options);
  this._npmPackageUrl = 'https://registry.npmjs.com/puppeteer';
  this._storeUrl = 'https://storage.googleapis.com';
}

util.inherits(PuppeteerChromeSyncer, Syncer);

var proto = PuppeteerChromeSyncer.prototype;

proto.check = function check() {
  return true;
};

proto.listdiff = function* listdiff(fullname, dirIndex) {
  if (dirIndex !== 0) {
    return [];
  }

  // https://github.com/GoogleChrome/puppeteer/blob/7f00860abd3c1efbca21351a8bdb12422dbe7aa2/lib/BrowserFetcher.js#L32
  const parentDirs = [
    'Linux_x64',
    'Mac',
    'Win',
    'Win_x64',
  ];

  // const downloadURLs = {
  //   linux: '%s/chromium-browser-snapshots/Linux_x64/%d/%s.zip',
  //   mac: '%s/chromium-browser-snapshots/Mac/%d/%s.zip',
  //   win32: '%s/chromium-browser-snapshots/Win/%d/%s.zip',
  //   win64: '%s/chromium-browser-snapshots/Win_x64/%d/%s.zip',
  // };

  let existsCount = 0;
  const existDirResults = yield parentDirs.map(name => this.listExists('/' + name + '/'));
  const existDirsMap = {};
  for (const rows of existDirResults) {
    for (const row of rows) {
      existDirsMap[row.parent + row.name] = true;
    }
  }
  const result = yield urllib.request(this._npmPackageUrl, {
    timeout: 60000,
    dataType: 'json',
    gzip: true,
    followRedirect: true,
  });
  const versions = result.data.versions || {};
  const chromium_revisions = {};
  for (var version in versions) {
    const pkg = versions[version];
    const puppeteerInfo = pkg.puppeteer || {};
    if (!puppeteerInfo.chromium_revision) continue;
    if (chromium_revisions[puppeteerInfo.chromium_revision]) continue;

    const publish_time = result.data.time[pkg.version];
    chromium_revisions[puppeteerInfo.chromium_revision] = publish_time;
  }
  // https://unpkg.com/puppeteer@5.1.0/lib/cjs/revisions.js
  // https://unpkg.com/puppeteer@latest/lib/cjs/puppeteer/revisions.js
  // exports.PUPPETEER_REVISIONS = {
  //   chromium: '768783',
  //   firefox: 'latest',
  // };
  const unpkgURL = 'https://unpkg.com/puppeteer@latest/lib/cjs/puppeteer/revisions.js';
  const unpkgResult = yield urllib.request(unpkgURL, {
    timeout: 60000,
    gzip: true,
    followRedirect: true,
  });
  const m = /chromium:\s+\'(\d+)\'\,/.exec(unpkgResult.data.toString());
  if (m && !chromium_revisions[m[1]]) {
    chromium_revisions[m[1]] = new Date();
  }

  const needs = [];
  for (var chromium_revision in chromium_revisions) {
    const publish_time = chromium_revisions[chromium_revision];
    for (const parentDir of parentDirs) {
      const dirname = '/' + parentDir + '/' + chromium_revision + '/';

      if (existDirsMap[dirname]) {
        existsCount++;
        continue;
      }

      // files
      const filename = archiveName(parentDir, chromium_revision);
      needs.push({
        date: publish_time,
        size: null,
        type: 'file',
        parent: dirname,
        downloadURL: this._storeUrl + '/chromium-browser-snapshots' + dirname + filename,
        name: filename,
      });

      // dir
      needs.push({
        name: chromium_revision + '/',
        parent: '/' + parentDir + '/',
        date: publish_time,
        size: '-',
        type: 'dir',
      });
      needs.push({
        name: parentDir + '/',
        parent: '/',
        date: publish_time,
        size: '-',
        type: 'dir',
      });
    }
  }
  debug('listdir %s got %s, %j, new %d versions, exists %d versions',
    this._npmPackageUrl, result.status, result.headers, needs.length, existsCount);

  if (result.status !== 200) {
    throw new Error(util.format('get %s resposne %s', this._npmPackageUrl, result.status));
  }
  return needs;
};

  /**
   * https://github.com/GoogleChrome/puppeteer/blob/7f00860abd3c1efbca21351a8bdb12422dbe7aa2/lib/BrowserFetcher.js#L45
   * @param {string} platform
   * @param {string} revision
   * @return {string}
   */
  function archiveName(platform, revision) {
    if (platform === 'Linux_x64')
      return 'chrome-linux.zip';
    if (platform === 'Mac')
      return 'chrome-mac.zip';
    if (platform === 'Win' || platform === 'Win_x64') {
      // Windows archive name changed at r591479.
      return parseInt(revision, 10) > 591479 ? 'chrome-win.zip' : 'chrome-win32.zip';
    }
    return null;
  }
