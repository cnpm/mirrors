'use strict';

var debug = require('debug')('mirrors:controllers:apis:dist');
var Dist = require('../../services/dist');
var config = require('../../config');
var only = require('only');
var path = require('path');

module.exports = function* () {
  // will error in windows
  var p = path.normalize(this.path);
  var paths = p.split('/');
  // paths = ['', 'apis', '{category}', '{path}', '{to}']
  paths.shift();
  paths.shift();

  var category = paths.shift();
  var name = paths.join('/').replace(/^\/?/, '/').replace(/\/?$/, '/');
  debug('request %s, normalize to %s, got category: %s, name: %s', this.path, p, category, name);

  // if (!config.categories[category]) {
  //   debug('requiest %s, category %s not exist', this.path, category);
  //   return this.status = 404;
  // }
  var items = yield Dist.listdir(category, name);
  var ctx = this;
  this.body = items.map(function (item) {
    item = only(item, ['id', 'name', 'date', 'category', 'size']);
    item.type = item.name[item.name.length - 1] === '/'
      ? 'dir'
      : 'file';
    item.url = item.type === 'dir'
      ? ctx.protocol + '://' + ctx.host + path.join(config.mount, ctx.path, item.name)
      : ctx.protocol + '://' + ctx.host + path.join(config.mount, category, name, item.name);
    return item;
  });
};
