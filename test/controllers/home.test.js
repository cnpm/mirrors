/**!
 * mirrors - test/controllers/home.test.js
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var request = require('supertest');
var app = require('../../app');

describe('test/controllers/home.test.js', function () {
  describe('GET /', function () {
    it('should response 200', function (done) {
      request(app.listen())
      .get('/')
      .expect(200)
      .expect(/Node\.js/)
      .expect(/io\.js/, done);
    });
  });
});
