'use strict';

var expect = require('expect.js');
var concat = require('concat-stream');
var fs = require('fs');
var path = require('path');
var folderify = require('../lib/folderify');
var browserify = require('browserify');

function rf (file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

function checkTransform (sourcefile, expectedfile, done) {
  var source = rf(sourcefile);
  var expected = rf(expectedfile);
  var result = concat(function (data) {
    expect(data).to.be.equal(expected);
    done();
  });
  var stream = folderify(sourcefile);
  stream.pipe(result);
  stream.write(source);
  stream.end();
}

describe('folderify', function () {

  it('is defined', function () {
    expect(folderify).to.be.an('function');
  });

  it('return a through stream', function () {
    expect(folderify().constructor.name).to.be.equal('Stream');
  });

  this.timeout(3000);

  it('un-requires include-folder', function (done) {
    checkTransform(
      'fixtures/source/unrequire-include-folder.js',
      'fixtures/expected/unrequire-include-folder.js',
      done
    );
  });

  it('replaces includeFolder call with `files` array', function (done) {
    checkTransform(
      'fixtures/source/include-folder-default.js',
      'fixtures/expected/include-folder-default.js',
      done
    );
  });

  it('respects includeFolder pattern-match arguments', function (done) {
    checkTransform(
      'fixtures/source/include-folder-regex.js',
      'fixtures/expected/include-folder-regex.js',
      done
    );
  });

  it('preserves filenames when option is set', function (done) {
    checkTransform(
      'fixtures/source/include-folder-filenames.js',
      'fixtures/expected/include-folder-filenames.js',
      done
    );
  });

  describe('as a browserify transform', function () {
    var expectedBundle = rf('fixtures/expected/bundle.js');
    var expectedBundleWithJson = rf('fixtures/expected/bundle-with-json.js');

    it('doesn\'t require brfs', function (done) {

      var b = browserify(path.join(__dirname, 'fixtures/source/bundle.js'));
      b.transform(folderify);

      b
        .bundle()
        .on('error', done)
        .pipe(concat(function (data) {
          expect(data.toString('utf8')).to.be.equal(expectedBundle);
          done();
        }));
    });

    it('supports brfs running after folderify', function (done) {

      var b = browserify(path.join(__dirname, 'fixtures/source/bundle.js'));
      b.transform(folderify);
      b.transform('brfs');

      b
        .bundle()
        .on('error', done)
        .pipe(concat(function (data) {
          expect(data.toString('utf8')).to.be.equal(expectedBundle);
          done();
        }));
    });

    it('support brfs running before folderify', function (done) {

      var b = browserify(__dirname + '/fixtures/source/bundle.js');
      b.transform('brfs');
      b.transform(folderify);

      b
        .bundle()
        .on('error', done)
        .pipe(concat(function (data) {
          expect(data.toString('utf8')).to.be.equal(expectedBundle);
          done();
        }));
    });

    it('support bundles with non JavaScript files', function (done) {

      var b = browserify(__dirname + '/fixtures/source/bundle-with-json.js');
      b.transform('brfs');
      b.transform(folderify);

      b
        .bundle()
        .on('error', done)
        .pipe(concat(function (data) {
          expect(data.toString('utf8')).to.be.equal(expectedBundleWithJson);
          done();
        }));
    });

  });
});
