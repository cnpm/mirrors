'use strict';

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

  githubProxy: '',
  githubApiProxy: '',

  // put your github token here
  // to avoid github rate limit
  githubToken: '',

  // global switch
  enableSync: true,
  // global sync interval
  syncInterval: ms('5m'),

  // sync by clone from other mirrors
  cloneMode: false,
  cloneUrl: 'https://npm.taobao.org/mirrors/apis',

  // proxy nodesecurity advisories
  nodesecurity: {
    advisories: 'https://api.nodesecurity.io/advisories',
  },

  // formatDownloadUrl: function (url) {},

  // sync categories
  categories: {
    // from github released
    npm: {
      name: 'NPM',
      category: 'npm',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/npm/cli/releases',
      repo: 'npm/cli',
      url: 'https://npmjs.com',
      description: 'a JavaScript package manager.',
      syncerClass: 'github',
      needSourceCode: true,
    },

    node: {
      name: 'Node.js',
      category: 'node',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://nodejs.org/dist',
      url: 'https://nodejs.org',
      description: 'is a platform built on Chrome\'s JavaScript runtime for easily building fast, scalable network applications.',
      syncDocument: true,
    },
    'node-rc': {
      name: 'Node.js RC',
      category: 'node-rc',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://nodejs.org/download/rc',
      url: 'https://nodejs.org',
      description: 'Node.js Release Candidate',
      syncerClass: 'node',
      syncDocument: true,
    },
    'node-nightly': {
      name: 'Node.js Nightly',
      category: 'node-nightly',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://nodejs.org/download/nightly',
      url: 'https://nodejs.org',
      description: 'Node.js Nightly Build',
      syncerClass: 'node',
      syncDocument: false,
    },
    iojs: {
      name: 'io.js',
      category: 'iojs',
      enable: false,
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
      url: 'https://alinode.aliyun.com',
      description: 'alinode是阿里云出品的Node.js应用服务解决方案。它是基于社区Node改进的运行时环境和服务平台的总称。'
    },
    nsolid: {
      name: 'nsolid',
      category: 'nsolid',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://nsolid-download.nodesource.com/download/nsolid-node/release/',
      url: 'https://nodesource.com/products/nsolid',
      description: 'N|Solid™ is the premier enterprise-grade Node.js® platform.',
    },
    python: {
      name: 'Python',
      category: 'python',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://www.python.org/ftp/python/',
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
    electron: {
      name: 'electron',
      category: 'electron',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/electron/electron/releases',
      repo: 'electron/electron',
      url: 'https://github.com/electron/electron',
      description: ':electron: Build cross-platform desktop apps with JavaScript, HTML, and CSS https://electronjs.org',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: true,
      // for mirrors
      alwayNewDirIndex: 0,
      // retry on 403 response
      retryOn403: true,
    },
    'electron-builder-binaries': {
      name: 'electron-builder-binaries',
      category: 'electron-builder-binaries',
      enable: true,
      disturl: 'https://github.com/electron-userland/electron-builder-binaries/releases',
      repo: 'electron-userland/electron-builder-binaries',
      url: 'https://github.com/electron-userland/electron-builder-binaries',
      description: 'A complete solution to package and build a ready for distribution Electron app with “auto update” support out of the box.',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
      // retry on 403 response
      retryOn403: true,
    },
    'atom-shell': {
      name: 'atom-shell',
      category: 'atom-shell',
      enable: true,
      disturl: 'https://gh-contractor-zcbenz.s3.amazonaws.com',
      syncerClass: 'atom-shell',
      url: 'https://github.com/electron/electron-rebuild',
      description: 'atom-shell dist for electron-rebuild',
    },
    'node-chakracore': {
      name: 'node-chakracore',
      category: 'node-chakracore',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/nodejs/node-chakracore/releases',
      repo: 'nodejs/node-chakracore',
      url: 'https://github.com/nodejs/node-chakracore',
      description: 'Node.js on ChakraCore ✨🐢🚀✨',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: true,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'nodejieba': {
      name: 'nodejieba',
      category: 'nodejieba',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/yanyiwu/nodejieba/releases',
      repo: 'yanyiwu/nodejieba',
      url: 'https://github.com/yanyiwu/nodejieba',
      description: 'chinese word segmentation for node',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'git-for-windows': {
      name: 'git-for-windows',
      category: 'git-for-windows',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/git-for-windows/git/releases',
      repo: 'git-for-windows/git',
      url: 'https://github.com/git-for-windows/git',
      description: 'A fork of Git containing Windows-specific patches. http://git-scm.com/',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    nwjs: {
      name: 'nwjs',
      category: 'nwjs',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://nwjs2.s3.amazonaws.com',
      description: 'lets you call all Node.js modules directly from DOM and enables a new way of writing applications with all Web technologies.',
      syncerClass: 'nw',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    atom: {
      name: 'atom',
      category: 'atom',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/atom/atom/releases',
      repo: 'atom/atom',
      url: 'https://github.com/atom/atom',
      description: 'Atom is a hackable text editor for the 21st century, built on Electron, and based on everything we love about our favorite editors.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: true,
      // for mirrors
      alwayNewDirIndex: 0,
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
      repo: 'operasoftware/operachromiumdriver',
      url: 'https://github.com/operasoftware/operachromiumdriver',
      description: 'OperaDriver for Chromium-based Opera releases',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: true,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    geckodriver: {
      name: 'geckodriver',
      category: 'geckodriver',
      enable: true,
      disturl: 'https://github.com/mozilla/geckodriver/releases',
      repo: 'mozilla/geckodriver',
      url: 'https://github.com/mozilla/geckodriver',
      description: 'WebDriver <-> Marionette proxy',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
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
      alwayNewDirIndex: [0, 1],
      name: 'node-inspector',
      category: 'node-inspector',
      enable: true,
      disturl: 'https://node-inspector.s3.amazonaws.com',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/node-inspector',
      description: 'Node.js debugger based on Blink Developer Tools',
    },
    fsevents: {
      name: 'fsevents',
      category: 'fsevents',
      enable: true,
      disturl: 'https://fsevents-binaries.s3-us-west-2.amazonaws.com',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/strongloop/fsevents',
      description: 'Native Access to Mac OS-X FSEvents',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'node-sass': {
      name: 'node-sass',
      category: 'node-sass',
      enable: true,
      disturl: 'https://github.com/sass/node-sass/releases',
      repo: 'sass/node-sass',
      url: 'https://github.com/sass/node-sass',
      description: 'Node.js bindings to libsass',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    leveldown: {
      name: 'leveldown',
      category: 'leveldown',
      enable: true,
      disturl: 'https://github.com/Level/leveldown/releases',
      repo: 'Level/leveldown',
      url: 'https://github.com/Level/leveldown',
      description: 'Pure C++ Node.js LevelDB binding serving as the back-end to LevelUP',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'leveldown-hyper': {
      name: 'leveldown-hyper',
      category: 'leveldown-hyper',
      enable: true,
      disturl: 'https://github.com/Level/leveldown-hyper/releases',
      repo: 'Level/leveldown-hyper',
      url: 'https://github.com/Level/leveldown-hyper',
      description: 'Fork of leveldown using HyperDex fork of LevelDB as backend',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    mknod: {
      name: 'mknod',
      category: 'mknod',
      enable: true,
      disturl: 'https://github.com/mafintosh/mknod/releases',
      repo: 'mafintosh/mknod',
      url: 'https://github.com/mafintosh/mknod',
      description: 'Node bindings for mknod',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    rabin: {
      name: 'rabin',
      category: 'rabin',
      enable: true,
      disturl: 'https://github.com/maxogden/rabin/releases',
      repo: 'maxogden/rabin',
      url: 'https://github.com/maxogden/rabin',
      description: 'node native addon for rabin fingerprinting data streams',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'sodium-prebuilt': {
      name: 'sodium-prebuilt',
      category: 'sodium-prebuilt',
      enable: true,
      disturl: 'https://github.com/mafintosh/node-sodium-prebuilt/releases',
      repo: 'mafintosh/node-sodium-prebuilt',
      url: 'https://github.com/mafintosh/node-sodium-prebuilt',
      description: 'Port of the lib sodium encryption library to Node.js',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'utp-native': {
      name: 'utp-native',
      category: 'utp-native',
      enable: true,
      disturl: 'https://github.com/mafintosh/utp-native/releases',
      repo: 'mafintosh/utp-native',
      url: 'https://github.com/mafintosh/utp-native',
      description: 'Native bindings for libutp',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'node-tk5': {
      name: 'node-tk5',
      category: 'node-tk5',
      enable: true,
      disturl: 'https://github.com/nodetk5/node-tk5/releases',
      repo: 'nodetk5/node-tk5',
      url: 'https://github.com/nodetk5/node-tk5',
      description: 'gs2 tk5 api for node.js',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    couchbase: {
      name: 'couchbase',
      category: 'couchbase',
      enable: true,
      disturl: 'https://github.com/couchbase/couchnode/releases',
      repo: 'couchbase/couchnode',
      url: 'https://github.com/couchbase/couchnode',
      description: 'libcouchbase node.js access',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'fuse-bindings': {
      name: 'fuse-bindings',
      category: 'fuse-bindings',
      enable: true,
      disturl: 'https://github.com/mafintosh/fuse-bindings/releases',
      repo: 'mafintosh/fuse-bindings',
      url: 'https://github.com/mafintosh/fuse-bindings',
      description: 'Fully maintained FUSE bindings for Node that aims to cover the entire FUSE api',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'zmq-prebuilt': {
      name: 'zmq-prebuilt',
      category: 'zmq-prebuilt',
      enable: true,
      disturl: 'https://github.com/nteract/zmq-prebuilt/releases',
      repo: 'nteract/zmq-prebuilt',
      url: 'https://github.com/nteract/zmq-prebuilt',
      description: 'Prebuilt Node.js bindings to the zeromq library',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    gl: {
      name: 'gl',
      category: 'gl',
      enable: true,
      disturl: 'https://github.com/stackgl/headless-gl/releases',
      repo: 'stackgl/headless-gl',
      url: 'https://github.com/stackgl/headless-gl',
      description: 'Creates WebGL contexts without making windows',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    hackrf: {
      name: 'hackrf',
      category: 'hackrf',
      enable: true,
      disturl: 'https://github.com/mappum/node-hackrf/releases',
      repo: 'mappum/node-hackrf',
      url: 'https://github.com/mappum/node-hackrf',
      description: 'Control a HackRF device (e.g. Jawbreaker, HackRF One, or Rad1o)',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    sqlite3: {
      name: 'sqlite3',
      category: 'sqlite3',
      enable: true,
      disturl: 'https://github.com/mapbox/node-sqlite3',
      url: 'https://github.com/mapbox/node-sqlite3',
      description: 'Asynchronous, non-blocking SQLite3 bindings for Node.js',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    sqlcipher: {
      name: 'sqlcipher',
      category: 'sqlcipher',
      enable: true,
      disturl: 'https://journeyapps-node-binary.s3.amazonaws.com/@journeyapps/sqlcipher/',
      url: 'https://github.com/journeyapps/node-sqlcipher',
      description: 'SQLCipher bindings for Node https://journeyapps.com',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'chromium-browser-snapshots': {
      name: 'chromium-browser-snapshots',
      category: 'chromium-browser-snapshots',
      enable: true,
      disturl: 'https://github.com/GoogleChrome/puppeteer',
      url: 'https://github.com/GoogleChrome/puppeteer',
      description: 'Headless Chrome Node API. https://github.com/GoogleChrome/puppeteer',
      // for mirrors
      alwayNewDirIndex: 0,
      syncerClass: 'PuppeteerChromeSyncer',
    },
    grpc: {
      name: 'grpc',
      category: 'grpc',
      needTargetLibc: true,
      enable: true,
      disturl: 'https://github.com/grpc/grpc',
      url: 'https://github.com/grpc/grpc',
      description: 'The C based gRPC (C++, Node.js, Python, Ruby, Objective-C, PHP, C#)',
      alwayNewDirIndex: 0,
    },
    nodegit: {
      name: 'nodegit',
      category: 'nodegit',
      enable: true,
      disturl: 'https://github.com/nodegit/nodegit',
      url: 'https://github.com/nodegit/nodegit',
      description: 'Native Node bindings to Git. http://www.nodegit.org/',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'canvas-prebuilt': {
      name: 'canvas-prebuilt',
      category: 'canvas-prebuilt',
      enable: true,
      disturl: 'https://github.com/chearon/node-canvas-prebuilt',
      url: 'https://github.com/chearon/node-canvas-prebuilt',
      description: 'Prebuilt versions of node-canvas as a drop-in replacement',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    cypress: {
      name: 'cypress',
      category: 'cypress',
      enable: true,
      disturl: 'https://cdn.cypress.io/desktop',
      url: 'https://github.com/cypress-io/cypress',
      description: 'Fast, easy and reliable testing for anything that runs in a browser. https://www.cypress.io',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    flow: {
      name: 'flow',
      category: 'flow',
      enable: true,
      disturl: 'https://github.com/facebook/flow/releases',
      repo: 'facebook/flow',
      url: 'https://github.com/facebook/flow',
      description: 'Adds static typing to JavaScript to improve developer productivity and code quality. http://flowtype.org/',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    robotjs: {
      name: 'robotjs',
      category: 'robotjs',
      enable: true,
      disturl: 'https://github.com/octalmage/robotjs/releases',
      repo: 'octalmage/robotjs',
      url: 'https://github.com/octalmage/robotjs',
      description: 'Node.js Desktop Automation.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    poi: {
      name: 'poi',
      category: 'poi',
      enable: true,
      disturl: 'https://github.com/poooi/poi/releases',
      repo: 'poooi/poi',
      url: 'https://github.com/poooi/poi',
      description: 'Scalable KanColle browser and tool.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'libjpeg-turbo': {
      name: 'libjpeg-turbo',
      category: 'libjpeg-turbo',
      enable: true,
      disturl: 'https://sourceforge.net/projects/libjpeg-turbo/rss?path=%2F',
      url: 'https://github.com/libjpeg-turbo/libjpeg-turbo',
      description: 'libjpeg-turbo is a JPEG image codec.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'SourceForge',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    moby: {
      name: 'moby',
      category: 'moby',
      enable: true,
      disturl: 'https://github.com/moby/moby/releases',
      url: 'https://github.com/moby/moby',
      description: 'a collaborative project for the container ecosystem to assemble container-based systems https://mobyproject.org/',
      max: 10, // sync the latest 10 releases
      syncerClass: 'moby',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    yarn: {
      name: 'yarn',
      category: 'yarn',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/yarnpkg/yarn/releases',
      repo: 'yarnpkg/yarn',
      url: 'https://github.com/yarnpkg/yarn',
      description: '📦🐈 Fast, reliable, and secure dependency management.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'utf-8-validate': {
      name: 'utf-8-validate',
      category: 'utf-8-validate',
      enable: true,
      disturl: 'https://github.com/websockets/utf-8-validate/releases',
      repo: 'websockets/utf-8-validate',
      url: 'https://github.com/websockets/utf-8-validate',
      description: 'Check if a buffer contains valid UTF-8',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'jpegtran-bin': {
      name: 'jpegtran-bin',
      category: 'jpegtran-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/jpegtran-bin/tree',
      url: 'https://github.com/imagemin/jpegtran-bin',
      description: 'jpegtran bin-wrapper that makes it seamlessly available as a local dependency http://libjpeg-turbo.virtualgl.org',
      max: 10, // sync the latest 10 releases
      syncerClass: 'jpegtran-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'pngquant-bin': {
      name: 'pngquant-bin',
      category: 'pngquant-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/pngquant-bin/tree',
      url: 'https://github.com/imagemin/pngquant-bin',
      description: 'pngquant bin-wrapper that makes it seamlessly available as a local dependency http://pngquant.org',
      max: 10, // sync the latest 10 releases
      syncerClass: 'pngquant-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'zopflipng-bin': {
      name: 'zopflipng-bin',
      category: 'zopflipng-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/zopflipng-bin/tree',
      url: 'https://github.com/imagemin/zopflipng-bin',
      description: 'zopflipng bin-wrapper that makes it seamlessly available as a local dependency https://github.com/google/zopfli',
      max: 10, // sync the latest 10 releases
      syncerClass: 'zopflipng-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'gifsicle-bin': {
      name: 'gifsicle-bin',
      category: 'gifsicle-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/gifsicle-bin/tree',
      url: 'https://github.com/imagemin/gifsicle-bin',
      description: 'gifsicle bin-wrapper that makes it seamlessly available as a local dependency http://www.lcdf.org/gifsicle/',
      max: 10, // sync the latest 10 releases
      syncerClass: 'gifsicle-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'mozjpeg-bin': {
      name: 'mozjpeg-bin',
      category: 'mozjpeg-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/mozjpeg-bin/tree',
      url: 'https://github.com/imagemin/mozjpeg-bin',
      description: 'mozjpeg bin-wrapper that makes it seamlessly available as a local dependency https://github.com/mozilla/mozjpeg',
      max: 10, // sync the latest 10 releases
      syncerClass: 'mozjpeg-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'cwebp-bin': {
      name: 'cwebp-bin',
      category: 'cwebp-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/cwebp-bin/tree',
      url: 'https://github.com/imagemin/cwebp-bin',
      description: 'cwebp bin-wrapper that makes it seamlessly available as a local dependency https://developers.google.com/speed/webp',
      max: 10, // sync the latest 10 releases
      syncerClass: 'cwebp-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'optipng-bin': {
      name: 'optipng-bin',
      category: 'optipng-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/optipng-bin/tree',
      url: 'https://github.com/imagemin/optipng-bin',
      description: 'optipng bin-wrapper that makes it seamlessly available as a local dependency http://optipng.sourceforge.net',
      max: 10, // sync the latest 10 releases
      syncerClass: 'optipng-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'jpegoptim-bin': {
      name: 'jpegoptim-bin',
      category: 'jpegoptim-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/jpegoptim-bin/tree',
      url: 'https://github.com/imagemin/jpegoptim-bin',
      description: 'jpegoptim bin-wrapper that makes it seamlessly available as a local dependency https://github.com/tjko/jpegoptim',
      max: 10, // sync the latest 10 releases
      syncerClass: 'jpegoptim-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'pngcrush-bin': {
      name: 'pngcrush-bin',
      category: 'pngcrush-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/pngcrush-bin/tree',
      url: 'https://github.com/imagemin/pngcrush-bin',
      description: 'pngcrush bin-wrapper that makes it seamlessly available as a local dependency http://pmt.sourceforge.net/pngcrush/',
      max: 10, // sync the latest 10 releases
      syncerClass: 'pngcrush-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'guetzli-bin': {
      name: 'guetzli-bin',
      category: 'guetzli-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/guetzli-bin/tree',
      url: 'https://github.com/imagemin/guetzli-bin',
      description: 'guetzli wrapper that makes it seamlessly available as a local dependency https://github.com/google/guetzli',
      max: 10, // sync the latest 10 releases
      syncerClass: 'guetzli-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'gif2webp-bin': {
      name: 'gif2webp-bin',
      category: 'gif2webp-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/gif2webp-bin/tree',
      url: 'https://github.com/imagemin/gif2webp-bin',
      description: 'gif2webp bin-wrapper that makes it seamlessly available as a local dependency',
      max: 10, // sync the latest 10 releases
      syncerClass: 'gif2webp-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'pngout-bin': {
      name: 'pngout-bin',
      category: 'pngout-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/pngout-bin/tree',
      url: 'https://github.com/imagemin/pngout-bin',
      description: 'pngout bin-wrapper that makes it seamlessly available as a local dependency http://advsys.net/ken/util/pngout.htm',
      max: 10, // sync the latest 10 releases
      syncerClass: 'pngout-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'advpng-bin': {
      name: 'advpng-bin',
      category: 'advpng-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/advpng-bin/tree',
      url: 'https://github.com/imagemin/advpng-bin',
      description: 'AdvPNG bin-wrapper that makes it seamlessly available as a local dependency https://github.com/amadvance/advancecomp',
      max: 10, // sync the latest 10 releases
      syncerClass: 'advpng-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'jpeg-recompress-bin': {
      name: 'jpeg-recompress-bin',
      category: 'jpeg-recompress-bin',
      enable: true,
      disturl: 'https://github.com/imagemin/jpeg-recompress-bin/tree',
      url: 'https://github.com/imagemin/jpeg-recompress-bin',
      description: 'jpeg-recompress bin-wrapper that makes it seamlessly available as a local dependency https://github.com/danielgtaylor/jpeg-archive',
      max: 10, // sync the latest 10 releases
      syncerClass: 'jpeg-recompress-bin',
      // for mirrors
      alwayNewDirIndex: 0,
    },

    zeromq: {
      name: 'zeromq',
      category: 'zeromq',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/zeromq/zeromq.js/releases',
      repo: 'zeromq/zeromq.js',
      url: 'https://github.com/zeromq/zeromq.js',
      description: '⚡️ Node.js bindings to the ØMQ library http://zeromq.github.io/zeromq.js/',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    minikube: {
      name: 'minikube',
      category: 'minikube',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/kubernetes/minikube/releases',
      repo: 'kubernetes/minikube',
      url: 'https://github.com/kubernetes/minikube',
      description: 'Run Kubernetes locally',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'sentry-cli': {
      name: 'sentry-cli',
      category: 'sentry-cli',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/getsentry/sentry-cli/releases',
      repo: 'getsentry/sentry-cli',
      url: 'https://github.com/getsentry/sentry-cli',
      description: 'A command line utility to work with Sentry',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: true,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'sharp-libvips': {
      name: 'sharp-libvips',
      category: 'sharp-libvips',
      enable: true,
      disturl: 'https://github.com/lovell/sharp-libvips/releases',
      repo: 'lovell/sharp-libvips',
      url: 'https://github.com/lovell/sharp-libvips',
      description: 'Packaging scripts to prebuild libvips and its dependencies - you\'re probably looking for https://github.com/lovell/sharp',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    sharp: {
      name: 'sharp',
      category: 'sharp',
      enable: true,
      disturl: 'https://github.com/lovell/sharp/releases',
      repo: 'lovell/sharp',
      url: 'https://github.com/lovell/sharp',
      description: 'High performance Node.js image processing, the fastest module to resize JPEG, PNG, WebP and TIFF images. Uses the libvips library. http://sharp.pixelplumbing.com/',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'looksgood-s2': {
      name: 'looksgood-s2',
      category: 'looksgood-s2',
      enable: true,
      disturl: 'https://github.com/looksgood/s2/releases',
      repo: 'looksgood/s2',
      url: 'https://github.com/looksgood/s2',
      description: 'Node.js JavaScript & TypeScript bindings for Google S2.',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: true,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'tfjs-models': {
      alwayNewDirIndex: 0,
      name: 'tfjs-models',
      category: 'tfjs-models',
      enable: true,
      disturl: 'https://storage.googleapis.com/tfjs-models/',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/tensorflow/tfjs-models',
      description: 'Pretrained models for TensorFlow.js https://js.tensorflow.org'
    },

    tensorflow: {
      alwayNewDirIndex: 0,
      name: 'tensorflow',
      category: 'tensorflow',
      enable: true,
      disturl: 'https://storage.googleapis.com/tensorflow/',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/tensorflow/tfjs/blob/master/tfjs-node/scripts/install.js#L45',
      description: 'tensorflow binaries'
    },

    'tf-builds': {
      alwayNewDirIndex: 0,
      name: 'tf-builds',
      category: 'tf-builds',
      enable: true,
      disturl: 'https://storage.googleapis.com/tf-builds/',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/tensorflow/tfjs/blob/master/tfjs-node/scripts/install.js#L95',
      description: 'tensorflow binaries: tf-builds'
    },

    'node-canvas-prebuilt': {
      name: 'node-canvas-prebuilt',
      category: 'node-canvas-prebuilt',
      enable: true,
      disturl: 'https://github.com/node-gfx/node-canvas-prebuilt/releases',
      repo: 'node-gfx/node-canvas-prebuilt',
      url: 'https://github.com/node-gfx/node-canvas-prebuilt',
      description: 'Repo used to build binaries for node-canvas on CI',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'canvas': {
      name: 'canvas',
      category: 'node-canvas-prebuilt',
      enable: true,
      disturl: 'https://github.com/Automattic/node-canvas/releases',
      repo: 'Automattic/node-canvas',
      url: 'https://github.com/Automattic/node-canvas',
      description: 'Repo used to build binaries for node-canvas on CI',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'node-swc': {
      name: 'node-swc',
      category: 'node-swc',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/swc-project/node-swc/releases',
      repo: 'swc-project/node-swc',
      url: 'https://github.com/swc-project/node-swc',
      description: 'nodejs binding for the swc project.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },

    'xprofiler': {
      name: 'xprofiler',
      category: 'xprofiler',
      enable: true,
      // interval: ms('5m'),
      disturl: 'https://github.com/X-Profiler/xprofiler/releases',
      repo: 'X-Profiler/xprofiler',
      url: 'https://github.com/X-Profiler/xprofiler',
      description: '🌀An addon for node.js, which supporting output performance log and real-time profiling through sampling.',
      max: 10, // sync the latest 10 releases
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
      needSourceCode: false,
    },

    prisma: {
      name: 'prisma',
      category: 'prisma',
      enable: true,
      disturl: 'https://binaries.prisma.sh',
      syncerClass: 'ListBucketResult',
      url: 'https://github.com/prisma/prisma',
      description: 'Next-generation ORM for Node.js & TypeScript | PostgreSQL, MySQL, MariaDB, SQL Server & SQLite',
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'argon2': {
      name: 'argon2',
      category: 'argon2',
      enable: true,
      disturl: 'https://github.com/ranisalt/node-argon2/releases',
      repo: 'ranisalt/node-argon2',
      url: 'https://github.com/ranisalt/node-argon2',
      description: 'Node.js bindings for Argon2 hashing algorithm',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
    'ali-zeromq': {
      name: 'ali-zeromq',
      category: 'ali-zeromq',
      enable: true,
      disturl: 'https://github.com/looksgood/zeromq.js/releases',
      repo: 'looksgood/zeromq.js',
      url: 'https://github.com/looksgood/zeromq.js',
      description: 'Node.js bindings for zeromp',
      syncerClass: 'GithubWithVersion',
      needFormatTagName: false,
      // for mirrors
      alwayNewDirIndex: 0,
    },
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
