/**!
 * cnpmjs.org - common/logger.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

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
  logger.dist_sync_error.apply(logger, arguments);
};
