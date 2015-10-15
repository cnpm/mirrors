/**!
 * mirrors - config/index.js
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var ms = require('humanize-ms');
var mkdirp = require('mkdirp');
var copy = require('copy-to');
var path = require('path');
var fs = require('fs');
var os = require('os');

var version = require('../package.json').version;

var root = path.dirname(__dirname);

var config = {
  version: version,

  /**
   * Cluster mode
   */

  enableCluster: false,
  numCPUs: os.cpus().length,

  /*
   * server configure
   */

  port: 7001,
  bindingHost: '127.0.0.1', // only binding on 127.0.0.1 for local access
  // you can change it to support subpath as an app
  // like set `mount = "/mirrors"` => cnpmjs.org/mirrors
  mount: '/',

  // debug mode
  // if in debug mode, some middleware like limit wont load
  // logger module will print to stdout
  debug: true,
  // log dir name
  logdir: path.join(root, '.tmp', 'logs'),
  // upload template file dir name
  uploadDir: path.join(root, '.tmp', 'upload'),

  /**
   * database config
   */

  database: {
    db: 'mirrors_test',
    username: 'root',
    password: '',

    // the sql dialect of the database
    // - currently supported: 'mysql', 'sqlite', 'postgres', 'mariadb'
    dialect: 'sqlite',

    // custom host; default: 127.0.0.1
    host: '127.0.0.1',

    // custom port; default: 3306
    port: 3306,

    // use pooling in order to reduce db connection overload and to increase speed
    // currently only for mysql and postgresql (since v1.5.0)
    pool: {
      maxConnections: 10,
      minConnections: 0,
      maxIdleTime: ms('30s')
    },

    // the storage engine for 'sqlite'
    // default store into ~/mirrors.sqlite
    storage: path.join(process.env.HOME || root, 'mirrors.sqlite'),

    logging: !!process.env.SQL_DEBUG,
  },

  // package tarball store in local filesystem by default
  nfs: require('fs-cnpm')({
    dir: path.join(root, '.tmp', 'nfs')
  }),

  // pipe all file instead 302 redirect
  pipeAll: false,

  ua: 'github.com/cnpm/mirrors.robot@' + version,

  // put your github token here
  // to avoid github rate limit
  githubToken: '',

  // global switch
  enableSync: true,
  // global sync interval
  syncInterval: ms('5m'),

  // sync by clone from other mirrors
  cloneMode: false,
  cloneUrl: 'http://npm.taobao.org/mirrors/apis',

  // sync categories
  categories: {
    node: {
      name: 'Node.js',
      category: 'node',
      enable: true,
      // interval: ms('5m'),
      disturl: 'http://nodejs.org/dist',
      url: 'http://nodejs.org',
      description: 'is a platform built on Chrome\'s JavaScript runtime for easily building fast, scalable network applications.'
    },
    iojs: {
      name: 'io.js',
      category: 'iojs',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://iojs.org/dist',
      url: 'https://iojs.org',
      description: 'is an npm compatible platform originally based on node.js™.'
    },
    alinode: {
      name: 'alinode',
      category: 'alinode',
      enable: true,
      // interval: ms('5m'),
      disturl: 'http://alinode.aliyun.com/dist/new-alinode/',
      url: 'http://alinode.aliyun.com',
      description: 'alinode是阿里云出品的Node.js应用服务解决方案。它是基于社区Node改进的运行时环境和服务平台的总称。'
    },
    python: {
      name: 'Python',
      category: 'python',
      enable: false,
      // interval: ms('5m'),
      disturl: 'https://www.python.org/downloads',
      description: 'is a programming language that lets you work quickly and integrate systems more effectively.',
      url: 'https://www.python.org'
    },
    phantomjs: {
      name: 'PhantomJS',
      category: 'phantomjs',
      enable: true,
      // interval: ms('5m'),
      description: 'is a headless WebKit scriptable with a JavaScript API.',
      disturl: 'https://bitbucket.org/ariya/phantomjs/downloads',
      url: 'http://phantomjs.org'
    },
    // from github released
    npm: {
      name: 'NPM',
      category: 'npm',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/npm/npm/releases',
      githubRepo: 'npm/npm',
      url: 'https://npmjs.com',
      description: 'a JavaScript package manager.'
    },
    electron: {
      name: 'electron',
      category: 'electron',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/atom/electron/releases',
      githubRepo: 'atom/electron',
      url: 'https://github.com/atom/electron',
      description: 'lets you write cross-platform desktop applications using JavaScript, HTML and CSS.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
    },
    atom: {
      name: 'atom',
      category: 'atom',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/atom/atom/releases',
      githubRepo: 'atom/atom',
      url: 'https://github.com/atom/atom',
      description: 'Atom is a hackable text editor for the 21st century, built on Electron, and based on everything we love about our favorite editors.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
    },
    chromedriver: {
      alwayNewDirIndex: 0,
      name: 'ChromeDriver',
      category: 'chromedriver',
      enable: true,
      disturl: 'http://chromedriver.storage.googleapis.com',
      syncerClass: 'ListBucketResult',
      url: 'https://sites.google.com/a/chromium.org/chromedriver/',
      description: 'ChromeDriver is a standalone server which implements WebDriver\'s wire protocol for Chromium, which is then available for Chrome on Android and Chrome on Desktop (Mac, Linux, Windows and ChromeOS).'
    },
    operadriver: {
      name: 'OperaDriver',
      category: 'operadriver',
      enable: true,
      disturl: 'https://github.com/operasoftware/operachromiumdriver/releases',
      githubRepo: 'operasoftware/operachromiumdriver',
      url: 'https://github.com/operasoftware/operachromiumdriver',
      description: 'OperaDriver for Chromium-based Opera releases',
      syncerClass: 'GithubWithVersion',
    },
    selenium: {
      alwayNewDirIndex: 0,
      name: 'selenium',
      category: 'selenium',
      enable: true,
      disturl: 'http://selenium-release.storage.googleapis.com',
      syncerClass: 'ListBucketResult',
      url: 'http://www.seleniumhq.org/download/',
      description: 'Selenium automates browsers. That\'s it! What you do with that power is entirely up to you. Primarily, it is for automating web applications for testing purposes, but is certainly not limited to just that. Boring web-based administration tasks can (and should!) also be automated as well.'
    },
    'node-inspector': {
      alwayNewDirIndex: 0,
      name: 'node-inspector',
      category: 'node-inspector',
      enable: true,
      disturl: 'https://node-inspector.s3.amazonaws.com',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/node-inspector',
      description: 'Node.js debugger based on Blink Developer Tools'
    }
  },
};

// load config/config.js, everything in config.js will cover the same key in index.js
var customConfig = path.join(root, 'config/config.js');
if (fs.existsSync(customConfig)) {
  copy(require(customConfig)).override(config);
}

mkdirp.sync(config.logdir);
mkdirp.sync(config.uploadDir);

module.exports = config;

config.loadConfig = function (customConfig) {
  if (!customConfig) {
    return;
  }
  copy(customConfig).override(config);
};
