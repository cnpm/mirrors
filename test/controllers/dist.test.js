/**!
 * mirrors - test/controllers/dist.test.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var Dist = require('../../services/dist');
var request = require('supertest');
var app = require('../../app');
var mm = require('mm');

describe('test/controllers/dist.test.js', function () {
  afterEach(mm.restore);
  describe('GET /:category', function () {
    it('should response 404 if category not exist', function (done) {
      request(app.listen())
      .get('/notexist')
      .expect(404, done);
    });

    it('should response 200 even if empty item list', function (done) {
      mm.data(Dist, 'listdir', []);
      request(app.listen())
      .get('/node')
      .expect(200)
      .expect(/<title>Node.js Mirror<\/title>/)
      .expect(/Mirror index of/)
      .expect(/\.\./)
      .expect(/http:\/\/nodejs\.org\/dist\//, done);
    });

    it('should response 200 with items', function (done) {
      mm.data(Dist, 'listdir', [{
        name: 'latest/',
        parent: '/',
        category: 'node',
        date: '22-Dec-2014 21:51'
      }, {
        name: 'node-0.0.1.tar.gz',
        parent: '/',
        category: 'node',
        size: 1567608,
        url: '/dist/node-0.0.2.tar.gz'
      }]);
      request(app.listen())
      .get('/node')
      .expect(200)
      .expect(/Mirror index of/)
      .expect(/\.\./)
      .expect(/<a href="\/node\/latest\/">latest\/<\/a>/)
      .expect(/<a href="\/node\/node-0.0.1.tar.gz">node-0.0.1.tar.gz<\/a>/)
      .expect(/http:\/\/nodejs\.org\/dist\//, done);
    });
  });
});
