'use strict';

const request = require('supertest');
const app = require('../../../../app');
const cacheRef = require('../../../../controllers/apis/nodesecurity/advisories')._cacheRef;
const mm = require('mm');

describe('test/controllers/apis/nodesecurity/advisories.test.js', () => {
  afterEach(mm.restore);
  describe('GET /apis/:category', () => {
    it('should response 200 at the first time', done => {
      request(app.listen())
      .get('/apis/nodesecurity/advisories')
      .expect('X-From-Cache', '0')
      .expect(res => {
        res.body.results.length.should.equal(res.body.total);
        res.body.count.should.equal(res.body.total);
        res.body.offset.should.equal(0);
      })
      .expect(200, done);
    });

    it('should response 200 from cache', done => {
      request(app.listen())
      .get('/apis/nodesecurity/advisories')
      .expect('X-From-Cache', '1')
      .expect(res => {
        res.body.results.length.should.equal(res.body.total);
        res.body.count.should.equal(res.body.total);
        res.body.offset.should.equal(0);
      })
      .expect(200, done);
    });

    it('should try to update cache when modified expired', done => {
      cacheRef.modified = 0;
      request(app.listen())
      .get('/apis/nodesecurity/advisories')
      .expect('X-From-Cache', '1')
      .expect(res => {
        res.body.results.length.should.equal(res.body.total);
        res.body.count.should.equal(res.body.total);
        res.body.offset.should.equal(0);
      })
      .expect(200, done);
    });
  });
});
