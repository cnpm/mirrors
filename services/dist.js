'use strict';

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

exports.listdir = function* (category, parent) {
  var where = {
    category: category
  };
  if (parent) {
    where.parent = parent;
  }
  var rs = yield [
    Dir.findAll({
      attributrs: KEYS.concat(DIR_ADDITIONS),
      where: where
    }),
    File.findAll({
      attributrs: KEYS.concat(FILE_ADDITIONS),
      where: where
    })
  ];
  return rs[0].map(function (dir) {
    var obj = dir.toJSON();
    obj.type = 'dir';
    return obj;
  }).concat(rs[1].map(function (file) {
    var obj = file.toJSON();
    obj.type = 'file';
    return obj;
  }));
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

exports.get = function* (type, category, parent, name) {
  var T = type === 'dir' ? Dir : File;
  var attributrs = type === 'dir' ? DIR_ADDITIONS : FILE_ADDITIONS;
  return yield T.find({
    attributrs: KEYS.concat(attributrs),
    where: {
      parent: parent,
      name: name,
      category: category
    }
  });
};
