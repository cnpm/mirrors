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
    db: 'mirros_test',
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
    python: {
      name: 'python',
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
    'atom-shell': {
      name: 'atom-shell',
      category: 'atom-shell',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/atom/atom-shell/releases',
      githubRepo: 'atom/atom-shell',
      url: 'https://github.com/atom/atom-shell',
      description: 'lets you write cross-platform desktop applications using JavaScript, HTML and CSS.'
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
