/* globals module, test, equal, ok, throws */
module("_timecode_to_secs");

test("invalid timecode throws error", function() {
    throws(function() {
        FrameGrab.prototype._timecode_to_secs("xyz");
    },
    /xyz/,
    "Ensure invalid timecode throws an error and includes the passed timecode in msg");
});

test("Valid timecodes are converted into seconds correctly", function() {
    equal(FrameGrab.prototype._timecode_to_secs("30", 30), 1);
    equal(FrameGrab.prototype._timecode_to_secs("15", 30), 0.5);

    equal(FrameGrab.prototype._timecode_to_secs("1:30", 30), 2);
    equal(FrameGrab.prototype._timecode_to_secs("1:15", 30), 1.5);

    equal(FrameGrab.prototype._timecode_to_secs("1:1:30", 30), 62);
    equal(FrameGrab.prototype._timecode_to_secs("1:1:15", 30), 61.5);

    equal(FrameGrab.prototype._timecode_to_secs("1:1:1:30", 30), 3662);
    equal(FrameGrab.prototype._timecode_to_secs("1:1:1:15", 30), 3661.5);
});


module("_normalize_time");

test("invalid parameters throw errors", function() {
    throws(function() {
        FrameGrab.prototype._normalize_time("xyz");
    });

    throws(function() {
        FrameGrab.prototype._normalize_time(function() {});
    });

    throws(function() {
        FrameGrab.prototype._normalize_time(null);
    });

    throws(function() {
        FrameGrab.prototype._normalize_time(undefined);
    });

    throws(function() {
        FrameGrab.prototype._normalize_time("00:00", null);
    });

    throws(function() {
        FrameGrab.prototype._normalize_time("00:00", -1);
    });
});

test("valid params result in a return value of converted seconds", function() {
    equal(FrameGrab.prototype._normalize_time(3), 3);

    equal(FrameGrab.prototype._normalize_time("1:1:1:15", 30), 3661.5);
});


module("constructor");

test("Error if constructed without <video>", function() {
    /* jshint nonew:false */
    throws(function() {
        new FrameGrab();
    });
});


module("grab");

test("invalid target container param results in Error", function() {
    var fg = new FrameGrab(document.createElement("video"));

    throws(function() {
        fg.grab(document.createElement("div"), 1);
    });

    throws(function() {
        fg.grab(null, 1);
    });
});


module("_uncacheable_url");

test("no-param URL", function() {
    ok(/^https:\/\/garstasio.com\/test\?fgtimestamp=\d+$/.test(FrameGrab.prototype._uncacheable_url("https://garstasio.com/test")));
});

test("existing-params URL", function() {
    ok(/^https:\/\/garstasio.com\/test\?param1=one&fgtimestamp=\d+$/.test(FrameGrab.prototype._uncacheable_url("https://garstasio.com/test?param1=one")));
});


module("_is_element");

test("gracefully handles null or non-element", function() {
    equal(FrameGrab.prototype._is_element(null, "div"), false);
    equal(FrameGrab.prototype._is_element([], "div"), false);
});

test("identifies real elements", function() {
    ok(FrameGrab.prototype._is_element(document.createElement("div"), "div"));
    ok(FrameGrab.prototype._is_element(document.createElement("canvas"), "canvas"));
    ok(!FrameGrab.prototype._is_element(document.createElement("div"), "span"));
});