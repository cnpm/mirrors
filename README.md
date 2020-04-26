mirrors
---------------

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]
[![David deps][david-image]][david-url]
[![node version][node-image]][node-url]
[![Gittip][gittip-image]][gittip-url]

[npm-image]: https://img.shields.io/npm/v/mirrors.svg?style=flat-square
[npm-url]: https://npmjs.org/package/mirrors
[travis-image]: https://img.shields.io/travis/cnpm/mirrors.svg?style=flat-square
[travis-url]: https://travis-ci.org/cnpm/mirrors
[coveralls-image]: https://img.shields.io/coveralls/cnpm/mirrors.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/cnpm/mirrors?branch=master
[david-image]: https://img.shields.io/david/cnpm/mirrors.svg?style=flat-square
[david-url]: https://david-dm.org/cnpm/mirrors
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11.14-blue.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[gittip-image]: https://img.shields.io/gittip/dead-horse.svg?style=flat-square
[gittip-url]: https://www.gittip.com/dead-horse/

mirrors everything

## Usage

### electron-builder

```bash
# windows
ELECTRON_BUILDER_BINARIES_MIRROR=https://npm.taobao.org/mirrors/electron-builder-binaries/ \
  ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ electron-builder build --win

# linux
ELECTRON_BUILDER_BINARIES_MIRROR=https://npm.taobao.org/mirrors/electron-builder-binaries/ \
  ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ electron-builder build --linux

# macOS
ELECTRON_BUILDER_BINARIES_MIRROR=https://npm.taobao.org/mirrors/electron-builder-binaries/ \
  ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ electron-builder build --mac
```

## Contributing

1. `make test`
2. Add your code and test code. Run test again. You can refer to `test/sync/nw.test.js` for syncer test

For more information about how to run the project, see Makefile.

## Development run

1. `make init-database`
2. `node dispatch.js`
3. You can alternatively choose which one you wanna sync in `config.categories` in `config/index.js`
4. If you wanna visit 7001 port, change `bindingHost` to `0.0.0.0` in `config/index.js`

## Usage

### License

MIT
