var nfs = require('../common/nfs');
var co = require('co');

var fn = co.wrap(function* () {
  var args = {
    key: '/test_upload.js',
  };

  var result = yield nfs.upload(__filename, args);
  console.log(result);
});

fn()
.then(function () {
  process.exit(0);
})
.catch(function (err) {
  console.error(err);
  process.exit(1);
});
