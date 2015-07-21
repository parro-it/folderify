'use strict';

var expect = require('expect.js'),
    concat = require('concat-stream'),
    fs = require('fs'),
    folderify = require('../lib/folderify');

var browserify = require('browserify');

var expectedBundle = fs.readFileSync(__dirname +'/fixtures/expected-bundle.js','utf8');



describe('folderify', function() {
    it('is defined', function() {
        expect(folderify).to.be.an('function');
    });

    it('return a through stream', function() {
        expect(folderify('./test/files').constructor.name).to.be.equal('Stream');
    });


    function checkTransform(source, expected, done) {
        var stream = folderify('./test/files');
        var result = concat(function(data) {
            console.log('----------------------------');
            console.log(data);
            console.log('----------------------------');
            console.log(expected);
            console.log('----------------------------');
            expect(data).to.be.equal(expected);
            done();
        });
        stream.pipe(result);

        stream.write(source);
        stream.end();
    }

    this.timeout(3000);

    it('un-require include-folder', function(done) {
        var source = 'var iF = require("include-folder");\n' +
            'console.log("anything");\n' +
            'var another = require("include-folder");\n' +
            'console.log("anything");\n' +
            'var ciao=iF;\n' +
            'var b;\n' +
            'console.log(b = another);\n' +
            'console.log(b = require("include-folder"));\n';
        var expected = 'var iF = undefined;\n' +
            'console.log("anything");\n' +
            'var another = undefined;\n' +
            'console.log("anything");\n' +
            'var ciao=iF;\n' +
            'var b;\n' +
            'console.log(b = another);\n' +
            'console.log(b = undefined);\n';
        checkTransform(source, expected, done);
    });

    it.only('skip hidden files', function(done) {
        var source =
            'var iF = require("include-folder");\n' +
            'var files = iF("./test/files")\n';


        var expected = 'var iF = undefined;\n' +
            'var files = (function(){var self={},fs = require("fs");\n' +
            'self["file3OtherFile"] = "this is file3OtherContent content";\n' +
            'self["file1"] = "this is file1 content";\n' +
            'self["file1_1"] = "this is file1_1 content";\n' +
            'return self})()\n';

        checkTransform(source, expected, done);
    });

    it('include hidden files', function(done) {
        var source =
            'var iF = require("include-folder");\n' +
            'var files = iF("./test/files",/(.*)/)\n';


        var expected = 'var iF = undefined;\n' +
            'var files = (function(){var self={},fs = require("fs");\n' +
            'self["DS_STORE"] = "ciao";\n' +
            'self["file3OtherFile"] = "this is file3OtherContent content";\n' +
            'self["file1"] = "this is file1 content";\n' +
            'self["file1_1"] = "this is file1_1 content";\n' +

            'return self})()\n';

        checkTransform(source, expected, done);
    });

    it('preserve filenames', function(done) {
        var source =
            'var iF = require("include-folder");\n' +
            'var files = iF("./test/files",null,{preserveFilenames:true})\n';


        var expected = 'var iF = undefined;\n' +
            'var files = (function(){var self={},fs = require("fs");\n' +
            'self["file-3-other&file.txt"] = "this is file3OtherContent content";\n' +
            'self["file1.check"] = "this is file1 content";\n' +
            'self["file1.txt"] = "this is file1_1 content";\n' +

            'return self})()\n';

        checkTransform(source, expected, done);
    });

    it('doesn\'t require brfs', function(done){

        var b = browserify(__dirname +'/fixtures/source.js');
        b.transform(folderify);

        b
          .bundle()
          .on('error', done)
          .pipe(concat(function(data){
              expect(data.toString('utf8')).to.be.equal(expectedBundle);
              done();
          }));
    });

    it('is compatible with brfs', function(done){

        var b = browserify(__dirname +'/fixtures/source.js');
        b.transform(folderify);
        b.transform('brfs');

        b
          .bundle()
          .on('error', done)
          .pipe(concat(function(data){
              expect(data.toString('utf8')).to.be.equal(expectedBundle);
              done();
          }));
    });

    it('support transforms in both order', function(done){

        var b = browserify(__dirname +'/fixtures/source.js');
        b.transform('brfs');
        b.transform(folderify);


        b
          .bundle()
          .on('error', done)
          .pipe(concat(function(data){
              //console.log(data.toString('utf8'));
              //console.log(expectedBundle);
              expect(data.toString('utf8')).to.be.equal(expectedBundle);
              done();
          }));
    });
});
