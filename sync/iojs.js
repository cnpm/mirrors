/**!
 * mirrors - sync/iojs.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var util = require('util');
var NodeSyncer = require('./node');

module.exports = IojsSyncer;

function IojsSyncer(options) {
  if (!(this instanceof IojsSyncer)) {
    return new IojsSyncer(options);
  }
  NodeSyncer.call(this, options);
}

util.inherits(IojsSyncer, NodeSyncer);

var proto = IojsSyncer.prototype;

// */doc/api/
proto.DOC_API_RE = /\/doc\/api\/$/;
