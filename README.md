# folderify
[![Build Status](https://secure.travis-ci.org/parroit/folderify.png?branch=master)](http://travis-ci.org/parroit/folderify)  [![Npm module](https://badge.fury.io/js/folderify.png)](https://npmjs.org/package/folderify) [![Code Climate](https://codeclimate.com/github/parroit/folderify.png)](https://codeclimate.com/github/parroit/folderify)

browserify call to [includeFolder](https://github.com/parroit/include-folder)


This module is a plugin for [browserify](http://browserify.org) to parse the AST
for `includeFolder()` calls so that you can inline folder contents into your
bundles.

Even though this module is intended for use with browserify, nothing about it is
particularly specific to browserify so it should be generally useful in other
projects.

## Getting Started
Install the module with: `npm install folderify --save`

then, for a main.js:

``` js
var includeFolder = require('include-folder'),
    folder = includeFolder("./aFolder");
```

and a [aFolder like this](https://github.com/parroit/include-folder/tree/master/test/files):


when you run the browserify command:

```
$ browserify -t folderify main.js > bundle.js
```

now in the bundle output file you get,

``` js
var includeFolder = undefined,
    folder =  {
               file3OtherFile: 'this is file3OtherContent content',
               file1: 'this is file1 content',
               file1_1: 'this is file1_1 content'
           };
```


## or with the api

``` js
var browserify = require('browserify');
var fs = require('fs');

var b = browserify('example/main.js');
b.transform('folderify');

b.bundle().pipe(fs.createWriteStream('bundle.js'));
```




##How it works

Folderify inline a whole directory content in browserify results.

1. It uses falafel to intercepts calls to [include-folder](https://github.com/parroit/include-folder)
2. use include-folder to generate source code of a function with a fs.readFileSync call for each file in directory
3. feed brfs stream with generated source code
4. replace include-folder call with brfs output


##Use cases

I use it to inline my HTML templates folder when I browserify
 sites, but I guess it could be useful in many situations...



## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.


## License
Copyright (c) 2013 parroit
Licensed under the MIT license.

