'use strict';

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
