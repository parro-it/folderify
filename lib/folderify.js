'use strict';

var brfs = require('brfs');
var concat = require('concat-stream');
var includeFolder = require('include-folder');
var falafel = require('falafel');
var through = require('through');
var path = require('path');

function folderify (file) {
  var data;
  var pending;
  var ifNames;
  var tr;
  var itsDirName;
  var itsFileName;

  function isIF (node) {
    var c = node.callee;

    return c &&
      node.type === 'CallExpression' &&
      node.arguments.length &&
      node.arguments[0].value === 'include-folder' &&

    c.type === 'Identifier' &&
      c.name === 'require';
  }

  function isParsableFileName (filename) {
    return folderify.validExtensions.indexOf(path.extname(filename)) >= 0;
  }

  function write (buf) {
    data += buf;
  }

  function finish (output) {
    tr.queue(String(output));
    tr.queue(null);
  }

  function isVarDecl (node) {
    return isIF(node) &&
      node.parent.type === 'VariableDeclarator' &&
      node.parent.id.type === 'Identifier';
  }

  function isVarAssign (node) {
    return isIF(node) &&
      node.parent.type === 'AssignmentExpression' &&
      node.parent.left.type === 'Identifier'

    ;
  }

  function unrequireIF (node) {
    function unrequire (n) {
      n.update('undefined');
    }
    if (isVarDecl(node)) {
      ifNames[node.parent.id.name] = true;

      unrequire(node.parent.init);
    } else if (isVarAssign(node)) {
      ifNames[node.parent.left.name] = true;

      unrequire(node.parent.right);
    }
  }

  function buildOriginalSource (folder, filter, options) {
    if (!filter) {
      filter = /^[^.].*$/;
    }

    if (typeof options !== 'object') {
      options = {};
    }

    var fnBody = includeFolder.buildSource(folder, filter, options);

    return '(function(){' +
      fnBody +
      '})()';
  }

  function parse () {
    if (!isParsableFileName(itsFileName)) {
      finish(data);
      return;
    }

    var output = falafel(data, function (node) {
      unrequireIF(node);

      if (node.type === 'CallExpression' && node.callee && ifNames[node.callee.name] === true) {
        var folderSourceCode = node.arguments[0].source();

        folderSourceCode = folderSourceCode
          .replace(/__dirname/g, '"' + itsDirName + '"')
          .replace(/__filename/g, '"' + itsFileName + '"')
          .replace(/\\/g, '/');

        var folder = eval(folderSourceCode); // eslint-disable-line no-eval

        var filesFilter;

        if (node.arguments.length > 1) {
          filesFilter = eval(node.arguments[1].source()); // eslint-disable-line no-eval
        }

        var options;

        if (node.arguments.length > 2) {
          options = eval('(' + node.arguments[2].source() + ')'); // eslint-disable-line no-eval
        }

        var originalSource;

        originalSource = buildOriginalSource(folder, filesFilter, options);

        var brfsStream = brfs(folder + 'bogus.txt');

        var brfsResult = concat({encoding: 'string'}, function (result) {
          node.update(result);
          pending--;
          if (pending === 0) {
            finish(output);
          }
        });

        brfsStream.on('error', function (err) {
          this.emit('error', err);
        });

        brfsStream.pipe(brfsResult);

        brfsStream.write(originalSource);
        brfsStream.end();

        pending++;
      }
    });

    if (pending === 0) {
      finish(output);
    }
  }

  function end () {
    try {
      parse();
    } catch (err) {
      this.emit('error', err);
    }
  }

  itsDirName = path.dirname(file);
  itsFileName = file;

  data = '';
  pending = 0;
  ifNames = {};
  tr = through(write, end);

  return tr;
}

folderify.validExtensions = [
  '.es',
  '.es6',
  '.js',
  '.jsx'
];

module.exports = folderify;
