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

var router = require('koa-middlewares').router;
var Home = require('./controllers/home');
var Dist = require('./controllers/dist');


module.exports = function (app) {
  app.use(router(app));

  app.get('/', Home);
  app.get(/^\/.*/, Dist);
};
