/**!
 * mirrors - controllers/home.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var path = require('path');
var config = require('../config');

module.exports = function* () {
  var pathname = path.join(config.mount, this.path).replace(/\/+$/, '');
  yield this.render('home', {
    categories: config.categories,
    baseUrl: this.protocol + '://' + this.host + pathname,
  });
};
