'use strict';

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
