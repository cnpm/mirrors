/**!
 * mirrors - worker.js
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var logger = require('./common/logger');
var graceful = require('graceful');
var config = require('./config');
var app = require('./app');

app.listen(config.port, config.bindingHost);

console.log('[%s] [worker:%d] Server started, dist server listen at %s:%d, cluster: %s',
  new Date(), process.pid,
  config.bindingHost, config.port,
  config.enableCluster);

graceful({
  server: [app],
  error: function (err, throwErrorCount) {
    if (err.message) {
      err.message += ' (uncaughtException throw ' + throwErrorCount + ' times on pid:' + process.pid + ')';
    }
    console.error(err.stack);
    logger.error(err);
  }
});
