'use strict';

var includeFolder = require('include-folder');

var folder = includeFolder(__dirname + '/files');

console.log(folder.file1, folder.file2);
