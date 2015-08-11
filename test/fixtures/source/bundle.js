var iF = require('include-folder');
var files = iF(__dirname + '/../files',/(.*)/);
console.dir(files);
