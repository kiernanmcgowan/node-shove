// bundle.js
// creates a browserify bundle for the site

var browserify = require('browserify');
var jade = require('jade');
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var through = require('through');

var bundle = null;

var defaultDrowserifyOpts = {cache: false, watch: true};

module.exports.init = function(browserifyOpts) {
  browserifyOpts = (browserifyOpts || {});
  browserifyOpts = _.defaults(browserifyOpts, defaultDrowserifyOpts);
  bundle = browserify();

  bundle.transform(function(file) {
    if (path.extname(file) === '.jade') {
      function write(buf) { data += buf }
      function end() {
        console.log('compiling jade');
        var jadeFn = jade.compile(data, {filename: file, compileDebug: false, client: true });
        this.queue('module.exports = ' + jadeFn.toString() + ';');
        this.queue(null);
      }
      var data = '';
      return through(write, end);
    } else {
      return through();
    }
  });
};

module.exports.createBundle = function(mainJs, includeDirs, callback) {
  bundle.require(require.resolve('underscore'), {expose: 'underscore'});
  bundle.require(require.resolve('backbone'), {expose: 'backbone'});
  var counter = 0;
  _.each(includeDirs, function(loc) {
    counter++;
    fs.readdir(loc, function(err, files) {
      _.each(files, function(f) {
        var ext = path.extname(f);
        if (ext === '.js') {
          bundle.add(path.join(loc, f));
        } else if (ext === '.jade') {
          // templates are compiled first
          bundle.require(path.join(loc, f), {expose: path.basename(f, ext)});
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
      console.log(err);
      res.send(src);
    });
  } else {
    next();
  }
};
