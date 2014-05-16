API
=============

To construct an instance, you must pass an `Object` with some configuration options.
At a minimum, you must include a reference to your source `<video>`, like this:

```javascript
var fg = new FrameGrab({
    video: document.getElementById("myVideo")
});
```

There are other optional configuration parameters as well.  Here is a list of all
possible options that you can pass to the constructor as properties of an object
(default values are in square brackets):
- `video`: (HTMLVideoElement) - [REQUIRED] The source video.
- `frame_rate`: (Float) - (`null`) The frame rate of the video.  Must be specified only if you intend to address the API using [SMPTE timecode][timecode] parameters or use methods dependent on frame calculation.
- `skip_solids.enabled`: (Boolean) - [false] True if you want frame-grab to skip past frames that are mostly solid.
- `skip_solids.frames`: (Integer) - [5] Number of frames to skip ahead when a solid frame is found.
- `skip_solids.secs`: (Float) - [0.25] Number of seconds to skip ahead when a solid frame is found.  Used if no frame_rate is specified during construction.
- `skip_solids.max_ratio`: (Float) - [0.95] If the frame contains more solid pixels, it will be skipped.


## Instance Methods

These methods are available only to a constructed instance of frame-grab.  

### `grab`
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


### `grab_now`
The behavior of `grab_now` mirrors the `grab` method, but the time value is assumed to
be the `currentTime` of your source video.  This allows you to render a frame
for your video, simply by seeking to that frame in the player and calling this method.

`grab_now` takes two parameters, in order: The target container for the rendered frame
(`<canvas>` or `<img>`), and an optional maximum scaled size for the rendered frame.

Note that the `grab_now` method returns a [promise][promise].  This is necessary as
the operation is asynchronous.

### `make_story`
Frame Grab will create a storyboard for you!  Just point it at a video and let it know
how many images you require.  The result will be proportionally spaced frame grabs of
your video, representing a visual outline of your video.

`make_story` takes three parameters:
- `type`: (String) - [REQUIRED] Type of image containers to create ("canvas" or "img").
- `images`: (Integer) - [REQUIRED] Total number of images to generate.
- `size`: (Integer) - The size of the rendered images.  If omitted, the size of the video will be used.

Note that the `make_story` method returns a [promise][promise].  This is necessary as
the operation is asynchronous.  If the operation is successful, an array will be returned
with one object per generated image.  Each object will contain a `time` and `container`
property.


### `secs_to_time_string`
You can pass in a number of seconds (as a float/integer) and receive a formatted time string
in this format: HH:mm:ss.mm.  This is useful if you need to easily display the time values
returned by frame-grab in the `make_story` API method results. 

`secs_to_time_string` takes two parameters:
- `secs`: (Float/Integer) - [REQUIRED] Number of seconds to convert.
- `precision`: (Integer) - [2] The number of decimal places to round the milliseconds portion of the time string.


## Static Methods

These methods are available as properties directly on the `FrameGrab` namespace/object.  

### `blob_to_video`
If you pass in a video `File` or `Blob`, frame-grab will attempt to render it as a 
`<video>`.

`blob_to_video` takes 1 parameter:
- `video_file`: (Blob/File) - [REQUIRED] The video file.

Note that the `blob_to_video` method returns a [promise][promise].  This is necessary as
the operation is asynchronous.  If the video was successfully rendered, the containing
`<video>` element will be passed into the resolve callback.  Otherwise, a failure reason
will be passed into the reject callback.

[promise]: http://promises-aplus.github.io/promises-spec/
[timecode]: https://documentation.apple.com/en/finalcutpro/usermanual/index.html#chapter=D%26section=5%26tasks=true
