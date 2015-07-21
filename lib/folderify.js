/*
 * folderify
 * https://github.com/parroit/folderify
 *
 * Copyright (c) 2013 parroit
 * Licensed under the MIT license.
 */

var brfs = require("brfs"),
    concat = require("concat-stream"),
    includeFolder = require("include-folder"),
    falafel = require('falafel'),
    through = require('through'),
    path = require("path");


function folderify(file) {

    var data,
        pending,
        ifNames,
        tr,
        itsDirName,
        itsFileName;



    function isIF(node) {
        var c = node.callee;
        //console.dir(node)
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
            //console.log("%s\n%s",err.message,err.stack);
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
            n.update("undefined");
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

        return "(function(){" +
            fnBody +
            "})()";
    }

    function parse() {

        var output = falafel(data, function(node) {
            unrequireIF(node);

            if (node.type === 'CallExpression' && node.callee && ifNames[node.callee.name] == true) {
                var folderSourceCode = node.arguments[0].source();

                folderSourceCode = folderSourceCode
                    .replace(/__dirname/g, '"' + itsDirName + '"')
                    .replace(/__filename/g, '"' + itsFileName + '"')
                    .replace(/\\/g, '/');
                var folder = eval(folderSourceCode);


                var filesFilter;

                if (node.arguments.length > 1) {
                    filesFilter = eval(node.arguments[1].source());
                    //console.dir(filesFilter)
                }


                var options;

                if (node.arguments.length > 2) {
                    options = eval('('+node.arguments[2].source()+')');
                }


                var originalSource;
                //console.log(folder)
                originalSource = buildOriginalSource(folder, filesFilter, options);
                //console.dir(originalSource)
                var brfsStream = brfs(folder + "bogus.txt");

                var brfsResult = concat(function(data) {
                    //console.log("\n\npending:%s\n\n",pending);
                    node.update(data);
                    pending--;
                    if (pending === 0) {
                        finish(output);
                    }
                });

                brfsStream.on("error", function(err) {
                    //console.log(err);
                    //console.log("%s\n%s",err.message,err.stack);
                    this.emit('error', err);
                });

                brfsStream.pipe(brfsResult);
                //console.log(originalSource);
                brfsStream.write(originalSource);
                brfsStream.end();

                pending++;
            }
        });

        if (pending === 0) {
            //console.log("%s END",itsFileName)
            finish(output);
        }

    }



    itsDirName = path.dirname(file);
    itsFileName = file;
    //console.log("%s START",itsFileName)

    data = '';
    pending = 0;
    ifNames = {};
    tr = through(write, end);



    return tr;

}


module.exports = folderify;
