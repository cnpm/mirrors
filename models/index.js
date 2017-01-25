'use strict';

var sequelize = require('../common/sequelize');
var path = require('path');

module.exports = {
  DistFile: load('dist_file'),
  DistDir: load('dist_dir'),
  sequelize: sequelize
};

module.exports.query = function* (sql, args) {
  return yield sequelize.query(sql, null, {raw: true}, args);
};

module.exports.queryOone = function* (sql, args) {
  var rows = yield sequelize.query(sql, null, {raw: true}, args);
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
