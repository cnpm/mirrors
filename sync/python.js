'use strict';

var util = require('util');
var NodeSyncer = require('./node');

module.exports = PythonSyncer;

function PythonSyncer(options) {
  if (!(this instanceof PythonSyncer)) {
    return new PythonSyncer(options);
  }
  NodeSyncer.call(this, options);
}

util.inherits(PythonSyncer, NodeSyncer);
