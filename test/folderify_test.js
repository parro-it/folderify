'use strict';

const concat = require('concat-stream');
const test = require('tape');
const fs = require('fs');
const path = require('path');
const folderify = require('../lib/folderify');
const browserify = require('browserify');

function rf(file) {
  return fs.readFileSync(path.join(__dirname, file), 'utf8');
}

function checkTransform(sourcefile, expectedfile, t) {
  const source = rf(sourcefile);
  const expected = rf(expectedfile);
  const result = concat(function(data) {
    t.isEqual(data, expected);
    t.end();
  });
  const stream = folderify(sourcefile);
  stream.pipe(result);
  stream.write(source);
  stream.end();
}

test('folderify exports a function', function(t) {
  t.isEqual(typeof folderify, 'function');
  t.end();
});

test('return a through stream', function(t) {
  t.isEqual(folderify().constructor.name, 'Stream');
  t.end();
});

test('un-requires include-folder', function(t) {
  checkTransform(
    'fixtures/source/unrequire-include-folder.js',
    'fixtures/expected/unrequire-include-folder.js',
    t
  );
});

test('replaces includeFolder call with `files` array', function(t) {
  checkTransform(
    'fixtures/source/include-folder-default.js',
    'fixtures/expected/include-folder-default.js',
    t
  );
});

test('respects includeFolder pattern-match arguments', function(t) {
  checkTransform(
    'fixtures/source/include-folder-regex.js',
    'fixtures/expected/include-folder-regex.js',
    t
  );
});

test('preserves filenames when option is set', function(t) {
  checkTransform(
    'fixtures/source/include-folder-filenames.js',
    'fixtures/expected/include-folder-filenames.js',
    t
  );
});

test('as a browserify transform', function(s) {
  const expectedBundle = rf('fixtures/expected/bundle.js');
  const expectedBundleWithJson = rf('fixtures/expected/bundle-with-json.js');

  s.test('doesn\'t require brfs', function(t) {
    const b = browserify(path.join(__dirname, 'fixtures/source/bundle.js'));
    b.transform(folderify);

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function(data) {
        t.isEqual(data.toString('utf8'), expectedBundle);
        t.end();
      }));
  });

  s.test('supports brfs running after folderify', function(t) {
    const b = browserify(path.join(__dirname, 'fixtures/source/bundle.js'));
    b.transform(folderify);
    b.transform('brfs');

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function(data) {
        t.isEqual(data.toString('utf8'), expectedBundle);
        t.end();
      }));
  });

  s.test('support brfs running before folderify', function(t) {
    const b = browserify(__dirname + '/fixtures/source/bundle.js');
    b.transform('brfs');
    b.transform(folderify);

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function(data) {
        t.isEqual(data.toString('utf8'), expectedBundle);
        t.end();
      }));
  });

  s.test('support bundles with non JavaScript files', function(t) {
    const b = browserify(__dirname + '/fixtures/source/bundle-with-json.js');
    b.transform('brfs');
    b.transform(folderify);

    b
      .bundle()
      .on('error', t.end.bind(t))
      .pipe(concat(function(data) {
        t.isEqual(data.toString('utf8'), expectedBundleWithJson);
        t.end();
      }));
  });
});

test('Custom extensions', function(s) {
  s.test('expose validExtensions', function(t) {
    t.isEqual(typeof folderify.validExtensions, 'array');
    t.end();
  });

  s.test('can modify validExtensions for allowing custom extensions', function(t) {
    const origin = folderify.validExtensions;
    folderify.validExtensions = ['.custom-js'];
    checkTransform(
      'fixtures/source/include-folder-default.custom-js',
      'fixtures/expected/include-folder-default.custom-js',
      {
        end: function(err) {
          folderify.validExtensions = origin;
          t.end(err);
        }
      }
    );
  });
});
