'use strict';

var config = require('../config');

config.database.logging = console.log;

// $ node --harmony models/init_script.js <force> <dialect>
var force = process.argv[2] === 'true';
var dialect = process.argv[3];
if (dialect) {
  config.database.dialect = dialect;
}

var models = require('./');
models.sequelize.sync({ force: force })
.then(function () {
  console.log('[models/init_script.js] `%s` sequelize sync and init success',
    config.database.dialect);
  process.exit(0);
})
.catch(function (err) {
  console.error('[models/init_script.js] sequelize sync fail');
  console.error(err);
  throw err;
});
