/**!
 * mirrors - services/dist.js
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var models = require('../models');
var only = require('only');
var path = require('path');
var File = models.DistFile;
var Dir = models.DistDir;

var KEYS = ['parent', 'name', 'category'];
var FILE_ADDITIONS = ['date', 'size', 'url', 'sha1', 'md5'];
var DIR_ADDITIONS = ['date'];

exports.savefile = function* (info) {
  var mainstay = only(info, KEYS);
  var row = yield File.find({
    where: mainstay
  });

  if (!row) {
    row = File.build(mainstay);
  }

  var additions = only(info, FILE_ADDITIONS);
  for (var key in additions) {
    row[key] = additions[key];
  }

  return yield row.save();
};

exports.savedir = function* (info) {
  var mainstay = only(info, KEYS);
  var row = yield Dir.find({
    where: mainstay
  });

  if (!row) {
    row = Dir.build(mainstay);
  }

  row.date = info.date;
  return yield row.save();
};

exports.listdir = function* (category, name) {
  var rs = yield [
    Dir.findAll({
      attributrs: KEYS.concat(DIR_ADDITIONS),
      where: {
        category: category,
        parent: name,
      }
    }),
    File.findAll({
      attributrs: KEYS.concat(FILE_ADDITIONS),
      where: {
        category: category,
        parent: name,
      }
    })
  ];
  return rs[0].concat(rs[1]);
};

exports.getfile = function* (category, fullname) {
  var name = path.basename(fullname);
  var parent = path.dirname(fullname);
  if (parent === '.') {
    parent = '';
  }
  if (parent !== '/') {
    parent += '/';
  }

  return yield File.find({
    attributrs: KEYS.concat(FILE_ADDITIONS),
    where: {
      parent: parent,
      name: name,
      category: category
    }
  });
};
