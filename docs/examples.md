Examples
=============

[![in progress notice](http://img.shields.io/badge/documentation-in%20progress-yellow.svg)]()

This page contains examples that demonstrate various uses of frame-grab.  If you would like to see other examples included here, [please open up a request][newissue].

## Before You Start

1. Download [client/frame-grab.js][frame-grab] and [client/lib/RSVP.js][rsvp].  One way to do this is by [downloading a zip of the master branch][download].
2. Ideally, you should setup a minimal server to host your CSS, HTML, and JavaScript files.  It's easy to [do this with node][node-server] or even [in one shell command with the help of python][python-server].
3. Setup your HTML page, such as index.html, like so:

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="rsvp.js"></script>
    <script src="frame-grab.js"></script>
  </head>
  <body>
    <!-- HTML from examples below goes here -->
  </body>
  <script>
    // JavaScript from examples below goes here
  </script>
</html>
```

## Example 1: Grabbing Frames for a User-Submitted Video File

NOTE: You are limited to only rendering user-submitted video files with codecs that are supported by the current browser.  For a list of codecs that each browser currently supports, see [this media format browser compatibiltiy table][codes-by-browser]

There are two ways to solicit a file from a user: drag & drop, and via a `<input type="file">` element.  This example will cover both.    

First, the markup.  Include this in your HTML document.  The `accept` attribute is intended to only allow the user to select videos from the file chooser dialog.  Please keep in mind that [not all browsers support the `accept` attribute][accept-support].

### Step 1: Accepting a video file via an `<input type="file">` element

```html
<input type="file" id="videoFileInput" accept="video/*">
<div id="videoContainer"></div>
```

Now, we must wait for the user to select a file, ask frame-grab to convert it to a `<video>`, then construct a new instance of frame-grab with this `<video>`.

```javascript
document.getElementById("videoFileInput").onchange = function() {
  var file = this.files[0];
  
  FrameGrab.blob_to_video(file).then(
    function videoRendered(videoEl) {
      var frameGrabInstance = new FrameGrab({video: videoEl});
      
      videoEl.setAttribute("controls", "");
      document.getElementById("videoContainer").appendChild(videoEl);
    },
    
    function videoFailedToRender(reason) {
      // TODO handle failure to convert the file to a video element
    }
  );
};
```

### Step 2-a: Allow the user to select images from the video

At this point, the video the user submitted will be visible on the page, with controls to play, forward, rewind, etc.  You can easily place a button that will instruct frame-grab to generate either a `<canvas>` or an `<img>` for the current time in the video.  

The following HTML should be placed after all other HTML from Step 1:
```html
<button id="grabCurrentFrame">Grab the current frame</button>
<div id="frameGrabs"></div>
```

You'll also need to handle the click event, and call the [`grab_now` method](api#grab-now) on your frame-grab instance:
```javascript
  document.getElementById("grabCurrentFrame").onclick = function() {
    var canvas = document.createElement("canvas");
    
    frameGrabInstance.grab_now(canvas).then(
      function grabbed(itemEntry) {
        document.getElementById("frameGrabs").appendChild(itemEntry.container);
      },
      
      function failedToGrab(reason) {
        // TODO Handle failure to turn the video frame into a `<canvas>`.
      }
    );
  }
```

### Step 2-b: Ask frame-grab to generate a "story" of images from the video

Maybe you just want to generate a variable number of equally spaced images that make up the video.  A summary, with pictures, if you will.  This is trivial with frame-grab's [make_story method](api#make-story).

The following HTML should be placed after all other HTML from Step 1:
```html
<button id="generateSummary">Create a summary, in images</button>
<div id="frameGrabs"></div>
```

You'll also need to handle the click event, ask the user how many images they want in the summary, and finally call the [`make_story` method](api#grab-now) on your frame-grab instance:
```javascript
  document.getElementById("generateSummary").onclick = function() {
    var numImages = parseInt(window.prompt("How many images?"));
    
    if (numImages) {
      frameGrabInstance.make_story("canvas", numImages).then(
        function generated(storyEntries) {
          storyEntries.forEach(function(storyEntry) {
            document.getElementById("frameGrabs").appendChild(storyEntry.container);
          });
        },
        
        function failureToGenerate(reason) {
          // TODO Handle failure to generate a story from the video.
        }
      );
    }
  }
```

For more options and API methods, please see the [API documentation page](api).

[accept-support]: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input#Browser_compatibility
[codecs-by-browser]: https://developer.mozilla.org/en-US/docs/HTML/Supported_media_formats#Browser_compatibility
[download]: https://github.com/rnicholus/frame-grab.js/archive/master.zip
[frame-grab]: https://github.com/rnicholus/frame-grab.js/blob/master/client/frame-grab.js
[newissue]: https://github.com/rnicholus/frame-grab.js/issues/new
[node-server]: http://www.mfranc.com/node-js/node-js-simple-web-server-with-express/
[python-server]: http://www.linuxjournal.com/content/tech-tip-really-simple-http-server-python
[rsvp]: https://github.com/rnicholus/frame-grab.js/blob/master/client/lib/rsvp.js
