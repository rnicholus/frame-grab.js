frame-grab.js
=============

##Grab, manipulate, and render &lt;video> frames

[![Build Status](https://travis-ci.org/rnicholus/frame-grab.js.svg?branch=master)](https://travis-ci.org/rnicholus/frame-grab.js)
[![Semver](http://img.shields.io/SemVer/2.0.0.png)](http://semver.org/spec/v2.0.0.html)

<img src="http://benschwarz.github.io/bower-badges/badge@2x.png" width="130" height="30">


###Getting started
Simply include both frame-grab.js, the [RSVP promise library][rsvp], and a source video
on your page.  See the [index.html file in the test directory][testindex]
for a simple example.  Please note that, while frame-grab is functional, it is not
yet complete.  See the [issue tracker][issues] for information and progress
on upcoming features.

###API
To construct an instance, you must pass an `Object` with some configuration options.
At a minimum, you must incude a reference to your source `<video>` and the video's
frame-rate, like this:

```javascript
var fg = new FrameGrab({
    video: document.getElementById("myVideo"),
    frame_rate: 30 //video is 30 FPS
});
```

There are other optional configuration parameters as well.  Here is a list of all
possible options that you can pass to the constructor as properties of an object
(default values are in square brackets):
- `video`: (HTMLVideoElement) - [REQUIRED] The source video.
- `frame_rate`: (Float) - [REQUIRED] The frame rate of the video.
- `skip_solids.enabled`: (Boolean) - [false] True if you want frame-grab to skip past frames that are mostly solid.
- `skip_solids.frames`: (Integer) - [5] Number of frames to skip ahead when a solid frame is found.
- `skip_solids.max_ratio`: (Float) - [0.95] If the frame contains more solid pixels, it will be skipped.


frame-grab also provides two methods:

#### FrameGrab.grab
This method asks frame-grab to render a specific frame of your source video onto
a `<canvas>` or `<img>`.  You can specify the exact time of the video to render in seconds
or an [SMPTE timecode string][timecode].  You can also optionally specify the
target scaled size of the rendered frame.

For example, to render a 100 max width/height proportionally scaled frame of your
source video onto an `<img>` at the 1 second, 15 frame mark, your could would
look like this:

```javascript
var myImg = document.getElementById("myImg");
fg.grab(myImg, "1:15", 100).then(
    function success(img) {
        console.log("Frame rendered successfully!");
    },
    function failure(reason) {
        console.error("Problem rendering frame! + " reason);
    }
);
```

Note that the `grab` method returns a [promise][promise].  This is necessary as
the operation is asynchronous.



#### FrameGrab.grab_now
The behavior of `grab_now` mirrors the `grab` method, but the time value is assumed to
be the `currentTime` of your source video.  This allows you to render a frame
for your video, simply by seeking to that frame in the player and calling this method.

`grab_now` takes two parameters, in order: The target container for the rendered frame
(`<canvas>` or `<img>`), and an optional maximum scaled size for the rendered frame.


[issues]: https://github.com/rnicholus/frame-grab.js/issues
[promise]: http://promises-aplus.github.io/promises-spec/
[rsvp]: https://github.com/tildeio/rsvp.js/tree/master
[testindex]: https://github.com/rnicholus/frame-grab.js/blob/master/test/index.html
[timecode]: https://documentation.apple.com/en/finalcutpro/usermanual/index.html#chapter=D%26section=5%26tasks=true
