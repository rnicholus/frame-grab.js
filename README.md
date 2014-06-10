frame-grab.js
=============

## Grab, manipulate, and render &lt;video> frames

[![Build Status](https://travis-ci.org/rnicholus/frame-grab.js.svg?branch=master)](https://travis-ci.org/rnicholus/frame-grab.js)
[![Coverage Status](https://coveralls.io/repos/rnicholus/frame-grab.js/badge.png?branch=master)](https://coveralls.io/r/rnicholus/frame-grab.js?branch=master)
[![Dependency Status](https://david-dm.org/garstasio/frame-grab.js.svg?theme=shields.io)](https://david-dm.org/rnicholus/frame-grab.js)
[![devDependency Status](https://david-dm.org/garstasio/frame-grab.js/dev-status.svg?theme=shields.io)](https://david-dm.org/rnicholus/frame-grab.js#info=devDependencies)
[![Semver](http://img.shields.io/SemVer/2.0.0.png)](http://semver.org/spec/v2.0.0.html)
[![Bower Badge](http://img.shields.io/badge/get%20it-on%20bower-green.svg)](http://bower.io/)

### Getting started
Simply include both frame-grab.js, the [RSVP promise library][rsvp], and a source video
on your page.  See the [index.html file in the test directory][testindex]
for a simple example.  Please note that, while frame-grab is functional, it is not
yet complete.  See the [issue tracker][issues] for information and progress
on upcoming features.

### Browser Support
Frame-grab will not work in IE9 and older, or anything older than Safari 5.1.  Every other modern browser should, in theory, work just fine.  If you run into issues, please [file an issue][newissue].

### API
See the [API documentation page][api].

### Examples
See some code examples that describe various uses of frame-grab on the [examples documentation page][examples].

[api]: docs/api.md
[examples]: docs/examples.md
[issues]: https://github.com/rnicholus/frame-grab.js/issues
[newissue]: https://github.com/rnicholus/frame-grab.js/issues/new
[testindex]: https://github.com/rnicholus/frame-grab.js/blob/master/test/index.html
[rsvp]: https://github.com/tildeio/rsvp.js/tree/master
