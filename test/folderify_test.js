'use strict';

var expect = require("expect.js"),
    concat = require("concat-stream"),
    folderify = require("../lib/folderify");


describe("folderify", function() {
    it("is defined", function() {
        expect(folderify).to.be.an('function');
    });

    it("return a through stream", function() {
        expect(folderify("./test/files").constructor.name).to.be.equal('Stream');
    });

    function checkTransform(source, expected, done) {
        var stream = folderify("./test/files");
        var result = concat(function(data) {
            //console.log(data);
            //console.log(expected);
            expect(data).to.be.equal(expected);
            done();
        });
        stream.pipe(result);

        stream.write(source);
        stream.end();
    }

    this.timeout(3000);

    it("un-require include-folder", function(done) {
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

    it("skip hidden files", function(done) {
        var source =
            'var iF = require("include-folder");\n' +
            'var files = iF("./test/files")\n';


        var expected = 'var iF = undefined;\n' +
            "var files = (function(){var self={},fs = require('fs');\n" +
            'self.file3OtherFile = "this is file3OtherContent content";\n' +
            'self.file1 = "this is file1 content";\n' +
            'self.file1_1 = "this is file1_1 content";\n' +
            'return self})()\n';

        checkTransform(source, expected, done);
    });

    it("include hidden files", function(done) {
        var source =
            'var iF = require("include-folder");\n' +
            'var files = iF("./test/files",/(.*)/)\n';


        var expected = 'var iF = undefined;\n' +
            "var files = (function(){var self={},fs = require('fs');\n" +
            'self.DS_STORE = "ciao";\n' +
            'self.file3OtherFile = "this is file3OtherContent content";\n' +
            'self.file1 = "this is file1 content";\n' +
            'self.file1_1 = "this is file1_1 content";\n' +
            'return self})()\n';

        checkTransform(source, expected, done);
    });


});