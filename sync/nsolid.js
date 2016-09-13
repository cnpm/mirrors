'use strict';

const util = require('util');
const NodeSyncer = require('./node');

module.exports = NSolidSyncer;

function NSolidSyncer(options) {
  if (!(this instanceof NSolidSyncer)) {
    return new NSolidSyncer(options);
  }
  NodeSyncer.call(this, options);
}

util.inherits(NSolidSyncer, NodeSyncer);
