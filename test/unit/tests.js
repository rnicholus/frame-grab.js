/* globals module, test, equal, throws */
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
    }, Error);

    throws(function() {
        FrameGrab.prototype._normalize_time(function() {});
    }, Error);

    throws(function() {
        FrameGrab.prototype._normalize_time(null);
    }, Error);

    throws(function() {
        FrameGrab.prototype._normalize_time(undefined);
    }, Error);

    throws(function() {
        FrameGrab.prototype._normalize_time("00:00", null);
    }, Error);

    throws(function() {
        FrameGrab.prototype._normalize_time("00:00", -1);
    }, Error);
});

test("valid params result in a return value of converted seconds", function() {
    equal(FrameGrab.prototype._normalize_time(3), 3);

    equal(FrameGrab.prototype._normalize_time("1:1:1:15", 30), 3661.5);
});