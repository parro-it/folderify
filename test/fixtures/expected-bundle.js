(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
var iF = undefined;
var files = (function(){var self={},fs = require('fs');
self.DS_STORE = "ciao";
self.file3OtherFile = "this is file3OtherContent content";
self.file1 = "this is file1 content";
self.file1_1 = "this is file1_1 content";
return self})();
console.dir(files);
},{"fs":1}]},{},[2]);
