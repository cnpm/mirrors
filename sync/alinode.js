/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var util = require('util');
var NodeSyncer = require('./node');

module.exports = AlinodeSyncer;

function AlinodeSyncer(options) {
  if (!(this instanceof AlinodeSyncer)) {
    return new AlinodeSyncer(options);
  }
  NodeSyncer.call(this, options);
}

util.inherits(AlinodeSyncer, NodeSyncer);
