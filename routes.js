/**!
 * mirrors - routes.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var mount = require('koa-mount');
var router = require('koa-middlewares').router;
var Home = require('./controllers/home');
var Dist = require('./controllers/dist');
var config = require('./config');

module.exports = function (app) {
  if (config.mount && config.mount !== '/') {
    if (config.mount[config.mount.length - 1] !== '/') {
      config.mount += '/';
    }
    app.use(mount(config.mount.replace(/\/+$/, ''), router(app)));
  } else {
    app.use(router(app));
  }

  app.get('/', Home);
  app.get(/^\/.*/, Dist);
};
