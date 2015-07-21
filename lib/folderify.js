/*
 * folderify
 * https://github.com/parroit/folderify
 *
 * Copyright (c) 2013 parroit
 * Licensed under the MIT license.
 */

var brfs = require('brfs'),
    concat = require('concat-stream'),
    includeFolder = require('include-folder'),
    falafel = require('falafel'),
    through = require('through'),
    path = require('path');


function folderify(file) {

    var data,
        pending,
        ifNames,
        tr,
        itsDirName,
        itsFileName;



    function isIF(node) {
        var c = node.callee;

        return c &&
            node.type === 'CallExpression' &&
            node.arguments.length &&
            node.arguments[0].value === 'include-folder' &&

        c.type === 'Identifier' &&
            c.name === 'require';
    }


    function write(buf) {
        data += buf;
    }

    function end() {



        try {
            parse();
        } catch (err) {

            this.emit('error', err);
        }


    }

    function finish(output) {
        tr.queue(String(output));
        tr.queue(null);
    }


    function isVarDecl(node) {
        return isIF(node) &&
            node.parent.type === 'VariableDeclarator' &&
            node.parent.id.type === 'Identifier'

        ;
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

    function buildOriginalSource(folder, filter, options) {

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

    function parse() {

        var output = falafel(data, function(node) {
            unrequireIF(node);

            if (node.type === 'CallExpression' && node.callee && ifNames[node.callee.name] === true) {
                var folderSourceCode = node.arguments[0].source();

                folderSourceCode = folderSourceCode
                    .replace(/__dirname/g, '"' + itsDirName + '"')
                    .replace(/__filename/g, '"' + itsFileName + '"')
                    .replace(/\\/g, '/');
                /*jshint -W061 */
                var folder = eval(folderSourceCode);
                /*jshint +W061 */

                var filesFilter;

                if (node.arguments.length > 1) {
                    /*jshint -W061 */
                    filesFilter = eval(node.arguments[1].source());
                    /*jshint +W061 */
                }


                var options;

                if (node.arguments.length > 2) {
                    /*jshint -W061 */
                    options = eval('('+node.arguments[2].source()+')');
                    /*jshint +W061 */
                }


                var originalSource;

                originalSource = buildOriginalSource(folder, filesFilter, options);

                var brfsStream = brfs(folder + 'bogus.txt');

                var brfsResult = concat({encoding:'string'},function(data) {
                    node.update(data);
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



    itsDirName = path.dirname(file);
    itsFileName = file;


    data = '';
    pending = 0;
    ifNames = {};
    tr = through(write, end);



    return tr;

}


module.exports = folderify;
