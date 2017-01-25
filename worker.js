'use strict';

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
