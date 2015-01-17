/**!
 * mirrors - services/syncer.js
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var utility = require('utility');
var crypto = require('crypto');
var path = require('path');
var util = require('util');

exports.getTarballFilepath = function (filename) {
  // ensure download file path unique
  // TODO: not only .tgz, and also other extname
  var name = filename.replace(/\.tgz$/, '.' + crypto.randomBytes(16).toString('hex') + '.tgz');
  return path.join(config.uploadDir, name);
};

exports.getGithubBasicAuth = function (argument) {
  return config.githubToken
    ? 'Basic ' + utility.base64encode(util.format('%s:x-oauth-basic', config.githubToken))
    : '';
};
