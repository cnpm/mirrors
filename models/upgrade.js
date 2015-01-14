var co = require('co');
var models = require('./index');

co(function* () {
  var lastId = 0;
  while (true) {
    var rows = yield models.query('select id, parent, name, category from dist_file where id>' + lastId + ' limit 100;');
    console.log('id>%d got %d rows', lastId, rows.length);
    if (rows.length === 0) {
      break;
    }

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      lastId = row.id;
      row.parent = '/phantomjs/';
      // /python/wpy/
      var m = /^\/(\w+)+\//.exec(row.parent);
      var category;
      if (m) {
        category = m[1];
      }
      if (!category) {
        continue;
      }
      if (row.category === category) {
        continue;
      }
      if (category === 'phantomjs' || category === 'python') {
        var parent = row.parent.replace('/' + category, '');
        console.log(category, parent, row);
        yield models.query('update dist_file set category="' + category + '" where id=' + row.id);
      }
    }
  }
  process.exit(0);
})(function (err) {
  console.log(err);
  throw err;
});
