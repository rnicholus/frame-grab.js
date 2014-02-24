/* globals module, test, ok, equal, notEqual, FrameGrab, throws */
module("timecode_to_secs");

test("invalid timecode throws error", function() {
    throws(function() {
        FrameGrab.prototype._timecode_to_secs("xyz");
    });
});