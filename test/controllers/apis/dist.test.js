'use strict';

var Dist = require('../../../services/dist');
var request = require('supertest');
var app = require('../../../app');
var mm = require('mm');

describe('test/controllers/apis/dist.test.js', function () {
  afterEach(function () {
    mm.restore()
    app.close()
  });
  describe('GET /apis/:category', function () {
    it('should response 200 and empty list if category not exist', function (done) {
      request(app.listen())
      .get('/apis/notexist')
      .expect([])
      .expect(200, done);
    });

    it('should response 200 even if empty item list', function (done) {
      mm.data(Dist, 'listdir', []);
      request(app.listen())
      .get('/apis/node')
      .expect(200)
      .expect('access-control-allow-origin', '*')
      .expect([], done);
    });

    it('should response 200 with items', function (done) {
      mm.data(Dist, 'listdir', [{
        id: 1,
        name: 'latest/',
        parent: '/',
        category: 'node',
        date: '22-Dec-2014 21:51'
      }, {
        id: 2,
        name: 'node-0.0.1.tar.gz',
        parent: '/',
        category: 'node',
        size: 1567608,
      }]);
      request(app.listen())
      .get('/apis/node')
      .expect(200)
      .end(function (err, res) {
        res.body.should.have.length(2);
        res.body[0].type.should.equal('dir');
        res.body[0].url.should.containEql('/apis/node/latest/');
        res.body[1].type.should.equal('file');
        res.body[1].url.should.containEql('/node/node-0.0.1.tar.gz');
        done(err);
      });
    });
  });
});
