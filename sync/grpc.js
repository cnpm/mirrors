'use strict';

var debug = require('debug')('mirrors:sync:grpc');
var util = require('util');
var urllib = require('urllib');
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
  formatDownloadUrl(pkg, nodeAbiVersion, nodePlatform, name) {
    return `${this._storeUrl}grpc-precompiled-binaries/node/grpc/v${pkg.version}/node-${nodeAbiVersion}-${nodePlatform}-x64.tar.gz`;
  }
}

module.exports = GRPCSyncer;
