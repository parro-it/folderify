var iF = require('include-folder');
var json = require('./data.json');
var files = iF(__dirname + '/../files',/(.*)/);
console.dir(files);
