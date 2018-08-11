'use strict';

var debug = require('debug')('mirrors:sync:grpc');
var util = require('util');
var urllib = require('urllib');
var semver = require('semver');
var Sqlite3Syncer = require('./sqlite3');

class GRPCSyncer extends Sqlite3Syncer {
  constructor(options) {
    super(options);

    // https://storage.googleapis.com/grpc-precompiled-binaries/node/grpc/v1.0.1/node-v48-darwin-x64.tar.gz
    this._npmPackageUrl = 'https://registry.npmjs.com/grpc';
    this._storeUrl = 'https://storage.googleapis.com/';
  }

  // "binary": {
  //   "module_name": "grpc_node",
  //   "module_path": "src/node/extension_binary",
  //   "host": "https://storage.googleapis.com/",
  //   "remote_path": "grpc-precompiled-binaries/node/{name}/v{version}",
  //   "package_name": "{node_abi}-{platform}-{arch}.tar.gz"
  // },
  // >= 1.7.2
  // "binary": {
  //   "module_name": "grpc_node",
  //   "module_path": "src/node/extension_binary/{node_abi}-{platform}-{arch}",
  //   "host": "https://storage.googleapis.com/",
  //   "remote_path": "grpc-precompiled-binaries/node/{name}/v{version}",
  //   "package_name": "{node_abi}-{platform}-{arch}.tar.gz"
  // },
  // https://storage.googleapis.com/grpc-precompiled-binaries/node/grpc/v1.7.2/node-v57-darwin-x64-unknown.tar.gz
  // https://storage.googleapis.com/grpc-precompiled-binaries/node/grpc/v1.7.2/node-v57-linux-x64-glibc.tar.gz
  // https://storage.googleapis.com/grpc-precompiled-binaries/node/grpc/v1.7.2/node-v57-win32-x64-unknown.tar.gz

  // >= 1.14.0
  // https://github.com/grpc/grpc-node/blob/499ddebd1e0126d24e8d58fb096ccf8893e7c2d8/packages/grpc-native-core/package.json#L53
  // "binary": {
  //   "module_name": "grpc_node",
  //   "module_path": "src/node/extension_binary/{node_abi}-{platform}-{arch}-{libc}",
  //   "host": "https://node-precompiled-binaries.grpc.io/",
  //   "remote_path": "{name}/v{version}",
  //   "package_name": "{node_abi}-{platform}-{arch}-{libc}.tar.gz"
  // },
  // https://node-precompiled-binaries.grpc.io/grpc/v1.14.0/node-v57-darwin-x64-unknown.tar.gz
  // https://node-precompiled-binaries.grpc.io/grpc/v1.14.0/node-v57-linux-x64-glibc.tar.gz
  // https://node-precompiled-binaries.grpc.io/grpc/v1.14.0/node-v64-linux-x64-glibc.tar.gz

  formatDownloadItem(fileParent, pkg, nodeAbiVersion, nodePlatform) {
    var glibc = nodePlatform === 'linux' ? 'glibc' : 'unknown';
    var name = `node-${nodeAbiVersion}-${nodePlatform}-x64-${glibc}.tar.gz`;
    if (semver.satisfies(pkg.version, '<1.7.2')) {
      name = `node-${nodeAbiVersion}-${nodePlatform}-x64.tar.gz`;
    }
    var downloadURL = `${this._storeUrl}grpc-precompiled-binaries/node/grpc/v${pkg.version}/${name}`;
    if (semver.satisfies(pkg.version, '>=1.14.0')) {
      downloadURL = `https://node-precompiled-binaries.grpc.io/grpc/v${pkg.version}/${name}`;
    }
    return {
      name: name,
      // size: null,
      downloadURL: downloadURL,
    };
  }
}

module.exports = GRPCSyncer;
