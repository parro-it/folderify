/*
 * folderify
 * https://github.com/parroit/folderify
 *
 * Copyright (c) 2013 parroit
 * Licensed under the MIT license.
 */



var brfs = require("brfs"),
    concat = require("concat-stream"),

    falafel = require('falafel'),
    through = require('through'),
    includeFolder = require("include-folder");



function isIF (node) {
    var c = node.callee;
    return c
        && node.type === 'CallExpression'
        && c.type === 'Identifier'
        && c.name === 'require'
        ;
}


function folderify(file) {
    var data = '',
        pending = 0,
        ifNames = {};

    var tr = through(write, end);
    return tr;

    function write (buf) {
        data += buf
    }

    function end () {



        try {
             parse()
        }
        catch (err) {
            console.log("%s\n%s",err.message,err.stack);
            this.emit('error', new Error(
                err.toString().replace('Error: ', '') + ' (' + file + ')')
            );
        }


    }

    function finish (output) {
        tr.queue(String(output));
        tr.queue(null);
    }


    function unrequireIF(node) {
        if (isIF(node) && node.arguments[0].value === 'include-folder'
            && node.parent.type === 'VariableDeclarator'
            && node.parent.id.type === 'Identifier') {
            ifNames[node.parent.id.name] = true;
            //console.dir(node.parent)
            node.parent.init.update("undefined");
        }
        if (isIF(node) && node.arguments[0].value === 'include-folder'
            && node.parent.type === 'AssignmentExpression'
            && node.parent.left.type === 'Identifier') {
            ifNames[node.parent.left.name] = true;

            node.parent.right.update("undefined");
        }
    }

    function buildOriginalSource(folder) {
        var fnBody = includeFolder._testHook.buildSource(folder);
        return "(function(){" +
            fnBody +
            "})()";
    }

    function parse() {

        var output = falafel(data, function (node) {
            unrequireIF(node);

            if (node.type === 'CallExpression' && node.callee && ifNames[node.callee.name]) {
                var folder = node.arguments[0].value;
                if (folder.charAt(folder.length - 1) !== "/") {
                    folder += "/";
                }
                var originalSource;

                originalSource = buildOriginalSource(folder);

                var brfsStream = brfs(folder+"bogus.txt");

                var brfsResult = concat(function (data) {
                    console.log("\n\npending:%s\n\n",pending);
                    node.update(data);
                    pending--;
                    if (pending === 0) {
                        finish(output);
                    }
                });

                brfsStream.on("error",function(err){
                    console.log(err);
                    console.log("%s\n%s",err.message,err.stack);
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
            finish(output);
        }

    }



    var source = includeFolder._testHook.buildSource(file);
    return brfs(file);
}


module.exports = folderify;