'use strict';

var utility = require('utility');
var crypto = require('crypto');
var path = require('path');
var util = require('util');
var config = require('../config');

exports.getTarballFilepath = function getTarballFilepath(filename) {
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

exports.nodePlatforms = [
  'linux',
  'darwin',
  'win32',
];

exports.template = function (text, params) {
  return text.replace(/\{(\w+)\}/g, function (total, name) {
    return params[name];
  });
};
