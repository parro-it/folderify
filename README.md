# folderify


> browserify calls to [includeFolder](https://github.com/parro-it/include-folder)

[![Build Status](https://img.shields.io/travis/parro-it/folderify.svg)](http://travis-ci.org/parro-it/folderify)
[![Npm module](https://img.shields.io/npm/dt/folderify.svg)](https://npmjs.org/package/folderify)
[![Code Climate](https://img.shields.io/codeclimate/github/parro-it/folderify.svg)](https://codeclimate.com/github/parro-it/folderify)
[![Coverage](https://img.shields.io/codeclimate/coverage/github/parro-it/folderify.svg)](https://codeclimate.com/github/parro-it/folderify)
[![Dependencies](https://img.shields.io/versioneye/d/parro-it/folderify.svg)](https://codeclimate.com/github/parro-it/folderify)

This module is a plugin for [browserify](http://browserify.org) to parse the AST for `includeFolder()` calls so that you can inline folders content into your bundles.

Even though this module is intended for use with browserify, nothing about it is particularly specific to browserify so it should be generally useful in other projects.

# Install

```bash
npm install folderify --save
```

# Usage

Give you have a `main.js` entry point file like this:

```js
var includeFolder = require('include-folder');
var folder = includeFolder('./aFolder');
```

and a [aFolder like this](https://github.com/parro-it/include-folder/tree/master/test/files):

when you run the browserify command:

```bash
$ browserify -t folderify main.js > bundle.js
```

you'll get this code in the output bundle:

``` js
var includeFolder = undefined,
var folder =  {
  file3OtherFile: 'this is file3OtherContent content',
  file1: 'this is file1 content',
  file1_1: 'this is file1_1 content'
};
```


# Programmatically usage

```js
var browserify = require('browserify');
var fs = require('fs');

var b = browserify('example/main.js');
b.transform('folderify');

b.bundle().pipe(fs.createWriteStream('bundle.js'));
```

# How

Folderify inline a whole directory content in browserify results.

1. It uses falafel to intercepts calls to [include-folder](https://github.com/parro-it/include-folder).
2. Uses include-folder to generate source code of a function with a `fs.readFileSync` call for each file in directory.
3. Feeds a `brfs` stream with generated source code.
4. Replaces include-folder call with `brfs` output


# Use cases

I use it to inline my HTML templates folder when I browserify sites, but I guess it could be useful in many situations...

# Custom file extensions

By default, supported file extensions are:
- `.es`
- `.es6`
- `.js`
- `.jsx`

The list is exposed as a property `validExtensions` on the folderify function and can be easily extended:

```js
var browserify = require('browserify');
var folderify = require('folderify');
folderify.validExtensions.push('.custom-js');

var b = browserify('example/main.js');
b.transform(folderify);
```


# Contributing

* Take care to maintain the existing coding style.
* Add unit tests for any new or changed functionality.

PR are very welcomed!

# License

Copyright (c) 2016 Andrea Parodi

Licensed under the MIT license.

