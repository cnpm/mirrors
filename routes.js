'use strict';

const mount = require('koa-mount');
const router = require('koa-middlewares').router;
const Home = require('./controllers/home');
const Dist = require('./controllers/dist');
const APIDist = require('./controllers/apis/dist');
const advisories = require('./controllers/apis/nodesecurity/advisories');
const config = require('./config');

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
  app.get('/apis/nodesecurity/advisories', advisories);
  app.get(/^\/apis\/.*/, APIDist);
  app.get(/^\/.*/, Dist);
};
