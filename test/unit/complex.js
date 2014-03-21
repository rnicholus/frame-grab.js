/* globals module, test, equal, ok, throws, expect, start, asyncTest */

/**
 * These tests cannot currently be automated since:
 *
 * 1. PhantomJS does not have support for media
 * 2. Karma's Qunit adapter sucks (it doesn't report test counts & it doesn't handle async tests correctly)
 *
 * Once I find a solution or a workaround to the above problems, these can be automated
 * and run via a grunt task (and of course on Travis).
 */

module("_seek");

asyncTest("seek to valid time", function() {
    expect(1);

    var video = document.getElementById("test-video");

    FrameGrab.prototype._seek(video, 1).then(function() {
        equal(video.currentTime, 1);
        start();
    }, function(errorMsg) {
        console.log(errorMsg);
    });
});