/**!
 * mirrors - controllers/dist.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var Dist = require('../services/dist');

module.exports = function* () {
  var category = this.params[0];
  var fullpath = this.params[1];

  // dir
  if (fullpath.match(/\/$/)) {
    var items = yield Dist.listdir(category, fullpath);
    this.body = items;
    return;
  }

  var file = yield Dist.getfile(category, fullpath);
  if (!file) {
    this.redirect(this.url + '/');
    return;
  }

  this.body = file;
};
