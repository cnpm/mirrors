/**!
 * mirrors - app.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var middlewares = require('koa-middlewares');
var logger = require('./common/logger');
var config = require('./config');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var koa = require('koa');

var app = koa();
app.proxy = true;

app.use(middlewares.favicon());
app.use(middlewares.rt());

app.use(middlewares.compress({threshold: 150}));
app.use(middlewares.conditional());
app.use(middlewares.etag());


middlewares.ejs(app, {
  root: path.join(__dirname, 'views'),
  cache: !config.debug,
  debug: config.debug,
  locals: {
    config: config
  }
});

routes(app);

app.on('error', function (err) {
  console.log(err.stack);
  logger.error(err);
});

module.exports = http.createServer(app.callback());
