/**!
 * mirrors - test/services/dist.test.js
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 *   dead_horse <dead_horse@qq.com> (https://github.com/dead-horse)
 */

'use strict';

/**
 * Module dependencies.
 */

var Dist = require('../../services/dist');
var should = require('should');

describe('services/dist.test.js', function () {
  describe('savefile() and getfile', function () {
    it('should save and get /npm-versions.txt', function* () {
      var name = 'npm-versions.txt';
      var category = 'node';
      var info = {
        category: category,
        name: name,
        parent: '/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: name,
        sha1: '104731881047318810473188',
        md5: '1klsd803284934',
      };
      yield* Dist.savefile(info);
      var got = yield* Dist.getfile(category, '/npm-versions.txt');
      should.exist(got);
      for (var k in info) {
        got[k].should.equal(info[k]);
      }

      var infos = yield* Dist.listdir(category, '/');
      infos.forEach(function (info) {
        info.parent.should.equal('/');
        info.category.should.equal(category);
        info.type.should.be.a.String;
      });
    });

    it('should save and get /v1.0.0/npm-versions2.txt', function* () {
      var category = 'node';
      var info = {
        name: 'npm-versions2.txt',
        category: category,
        parent: '/v1.0.0/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: 'v1.0.0/npm-versions2.txt',
        sha1: '104731881047318810473188',
        md5: '1klsd803284934',
      };
      yield* Dist.savefile(info);
      var got = yield* Dist.getfile(category, '/v1.0.0/npm-versions2.txt');
      should.exist(got);
      for (var k in info) {
        got[k].should.equal(info[k]);
      }

      var infos = yield* Dist.listdir(category, '/v1.0.0');
      infos.forEach(function (info) {
        info.parent.should.equal('/v1.0.0/');
        info.category.should.equal(category);
      });
    });
  });

  describe('listdir()', function () {
    it('should listdir(category) return all items', function* () {
      var info = {
        name: 'name1.txt',
        category: 'test-listdir',
        parent: 'dir1/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: 'v1.0.0/name1.txt',
        sha1: '104731881047318810473188',
        md5: '1klsd803284934',
      };
      yield* Dist.savefile(info);

      info = {
        name: 'name1.txt',
        category: 'test-listdir',
        parent: 'dir2/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: 'v1.0.0/name1.txt',
        sha1: '104731881047318810473188',
        md5: '1klsd803284934',
      };
      yield* Dist.savefile(info);

      info = {
        name: 'name1.txt',
        category: 'test-listdir',
        parent: '/',
        date: '15-Sep-2011 23:48',
        size: 1676,
        url: 'v1.0.0/name1.txt',
        sha1: '104731881047318810473188',
        md5: '1klsd803284934',
      };
      yield* Dist.savefile(info);

      var dir = {
        name: 'dir1/',
        category: 'test-listdir',
        parent: '/',
        date: '15-Sep-2011 23:48',
      };
      yield* Dist.savedir(dir);

      dir = {
        name: 'dir2/',
        category: 'test-listdir',
        parent: '/',
        date: '15-Sep-2011 23:48',
      };
      yield* Dist.savedir(dir);

      dir = {
        name: 'dir3/',
        category: 'test-listdir',
        parent: 'dir1/',
        date: '15-Sep-2011 23:48',
      };
      yield* Dist.savedir(dir);

      var infos = yield* Dist.listdir('test-listdir');
      infos.should.length(6);
    });
  });
});
