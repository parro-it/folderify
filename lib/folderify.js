'use strict';

const brfs = require('brfs');
const concat = require('concat-stream');
const includeFolder = require('include-folder');
const falafel = require('falafel');
const through = require('through');
const path = require('path');

function folderify(file) {
  let tr = null;
  let data = '';
  let pending = 0;
  const ifNames = {};
  const itsDirName = path.dirname(file);
  const itsFileName = file;

  function isIF(node) {
    const c = node.callee;

    return c &&
      node.type === 'CallExpression' &&
      node.arguments.length &&
      node.arguments[0].value === 'include-folder' &&
      c.type === 'Identifier' &&
      c.name === 'require';
  }

  function isParsableFileName(filename) {
    return folderify.validExtensions.indexOf(path.extname(filename)) >= 0;
  }

  function write(buf) {
    data += buf;
  }

  function finish(output) {
    tr.queue(String(output));
    tr.queue(null);
  }

  function isVarDecl(node) {
    return isIF(node) &&
      node.parent.type === 'VariableDeclarator' &&
      node.parent.id.type === 'Identifier';
  }

  function isVarAssign(node) {
    return isIF(node) &&
      node.parent.type === 'AssignmentExpression' &&
      node.parent.left.type === 'Identifier'

    ;
  }

  function unrequireIF(node) {
    function unrequire(n) {
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

  function buildOriginalSource(folder, sourceFilter, options) {
    let _sourceFilter = sourceFilter;
    let _options = options;

    if (!sourceFilter) {
      _sourceFilter = /^[^.].*$/;
    }

    if (typeof options !== 'object') {
      _options = {};
    }

    const fnBody = includeFolder.buildSource(folder, _sourceFilter, _options);

    return '(function(){' +
      fnBody +
      '})()';
  }

  function parse() {
    if (!isParsableFileName(itsFileName)) {
      finish(data);
      return;
    }

    const output = falafel(data, {ecmaVersion: 6}, function(node) {
      unrequireIF(node);

      if (node.type === 'CallExpression' && node.callee && ifNames[node.callee.name] === true) {
        let folderSourceCode = node.arguments[0].source();

        folderSourceCode = folderSourceCode
          .replace(/__dirname/g, '"' + itsDirName + '"')
          .replace(/__filename/g, '"' + itsFileName + '"')
          .replace(/\\/g, '/');

        const folder = eval(folderSourceCode); // eslint-disable-line no-eval

        let filesFilter;

        if (node.arguments.length > 1) {
          filesFilter = eval(node.arguments[1].source()); // eslint-disable-line no-eval
        }

        let options;

        if (node.arguments.length > 2) {
          options = eval('(' + node.arguments[2].source() + ')'); // eslint-disable-line no-eval
        }

        const originalSource = buildOriginalSource(folder, filesFilter, options);

        const brfsStream = brfs(folder + 'bogus.txt');

        const brfsResult = concat({encoding: 'string'}, function(result) {
          node.update(result);
          pending--;
          if (pending === 0) {
            finish(output);
          }
        });

        brfsStream.on('error', function(err) {
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

  function end() {
    try {
      parse();
    } catch (err) {
      this.emit('error', err);
    }
  }


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
