# DEPRECATED, please use https://github.com/cnpm/cnpmcore instead
# DEPRECATED, please use https://github.com/cnpm/cnpmcore instead
# DEPRECATED, please use https://github.com/cnpm/cnpmcore instead

------

mirrors
---------------

[![build status][travis-image]][travis-url]
[![Test coverage][coveralls-image]][coveralls-url]

[travis-image]: https://img.shields.io/travis/cnpm/mirrors.svg?style=flat-square
[travis-url]: https://travis-ci.org/cnpm/mirrors
[coveralls-image]: https://img.shields.io/coveralls/cnpm/mirrors.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/cnpm/mirrors?branch=master

mirrors everything

## Usage

### electron-builder

```bash
# windows
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
  ELECTRON_MIRROR=http://npmmirror.com/mirrors/electron/ electron-builder build --win

# linux
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
  ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ electron-builder build --linux

# macOS
ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/ \
  ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/ electron-builder build --mac
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

## License

[MIT](LICENSE.txt)

## Contributors

[![](https://ergatejs.implements.io/badges/contributors/cnpm/mirrors.svg?width=1250&size=96&padding=6)](https://github.com/cnpm/mirrors/graphs/contributors)
