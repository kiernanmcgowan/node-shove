// bundle.js
// creates a browserify bundle for the site

var browserify = require('browserify');
var jade = require('jade');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');

var bundle = null;

var defaultDrowserifyOpts = {cache: false, watch: true};

module.exports.init = function(browserifyOpts) {
  browserifyOpts = (browserifyOpts || {});
  browserifyOpts = _.defaults(browserifyOpts, defaultDrowserifyOpts);
  bundle = browserify();

  /*bundle.register('.jade', function(body, fileName) {
    var templateFunction = jade.compile(body, { filename: fileName, compileDebug: false, client: true });

    return 'module.exports = ' + templateFunction.toString() + ';';
  });*/
  /*bundle.transform(function(data) {
    console.log(data);
  });*/
};

module.exports.createBundle = function(mainJs, includeDirs, callback) {
  var jadeRuntime = fs.readFileSync(require.resolve('jade/runtime'), 'utf8');
  bundle.require(require.resolve('jade/runtime'), {expose: 'jade'});
  bundle.require(require.resolve('underscore'), {expose: 'underscore'});
  bundle.require(require.resolve('backbone'), {expose: 'backbone'});

  var counter = 0;
  _.each(includeDirs, function(loc) {
    counter++;
    fs.readdir(loc, function(err, files) {
      _.each(files, function(f) {
        var ext = path.extname(f);
        if (ext == '.js' || ext == '.jade') {
          bundle.add(path.join(loc, f));
        }
      });
      counter--;
      if (counter <= 0) {
        callback(bundle);
      }
    });
  });

  bundle.add(__dirname + '/reset.js');
  bundle.add(mainJs);
};

module.exports.middleware = function(req, res, next) {
  if (req.url === '/shove.js') {
    bundle.bundle({}, function(err, src) {
      res.send(src);
    });
  } else {
    next();
  }
};
