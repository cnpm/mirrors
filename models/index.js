/**!
 * mirrors - models/index.js
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com>
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var sequelize = require('../common/sequelize');
var path = require('path');

module.exports = {
  DistFile: load('dist_file'),
  DistDir: load('dist_dir'),
  sequelize: sequelize
};

module.exports.query  =function* (sql, args) {
  return yield sequelize.query(sql, args);
};

module.exports.queryOone = function* (sql, args) {
  var rows = yield* sequelize.query(sql, args);
  return rows && rows[0];
};

/**
 * load file to sequelize
 *
 * @param {String} name
 * @api private
 */

function load(name) {
  return sequelize.import(path.join(__dirname, name));
}
