'use strict';

var Logger = require('mini-logger');
var config = require('../config');
var utility = require('utility');
var util = require('util');

var isTEST = process.env.NODE_ENV === 'test';
var categories = ['dist_sync_info', 'dist_sync_error'];

var logger = module.exports = Logger({
  categories: categories,
  dir: config.logdir,
  duration: '1h',
  format: '[{category}.]YYYY-MM-DD[.log]',
  stdout: config.debug && !isTEST
});

logger.syncInfo = function () {
  var args = [].slice.call(arguments);
  if (typeof args[0] === 'string') {
    args[0] = util.format('[%s][%s] ', utility.logDate(), process.pid) + args[0];
  }
  logger.dist_sync_info.apply(logger, args);
};

logger.syncError =function () {
  var args = [].slice.call(arguments);
  if (typeof args[0] === 'string') {
    args[0] = util.format('[%s][%s] ', utility.logDate(), process.pid) + args[0];
  }
  // remove err.data when data is buffer
  if (args[0] instanceof Error && Buffer.isBuffer(args[0].data)) {
    delete args[0].data;
  }
  logger.dist_sync_error.apply(logger, arguments);
};
