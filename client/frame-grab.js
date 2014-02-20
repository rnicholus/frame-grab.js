(function() {

    var FrameGrab = function(video) {

        this.grab = function(time, opt_frame_rate) {
            var time_in_secs = this._normalize_time(time, opt_frame_rate);

            console.log(time_in_secs);
        };
    };

    FrameGrab.prototype = {
        _normalize_time: function(time, frame_rate) {
            if (typeof time === "number") {
                return parseFloat(time);
            }
            else if (typeof time === "string" && typeof frame_rate === "number") {
                return this._timecode_to_secs(time, frame_rate);
            }
            else {
                throw new Error("Invalid time or frame rate");
            }
        },

        _timecode_to_secs: function(timecode, frame_rate) {
            var timecode_segments = timecode.split(":").reverse(),
                seconds_per_frame = 1 / frame_rate,
                seconds = 0;

            for (var i = 3; i >= 0; i--) {
                switch (i) {
                    case 0:
                        seconds += parseInt(timecode_segments[i]) *
                            seconds_per_frame;
                        break;
                    case 1:
                        if (timecode_segments.length === 2) {
                            seconds += parseInt(timecode_segments[i]);
                        }
                        break;
                    case 2:
                        if (timecode_segments.length === 3) {
                            seconds += parseInt(timecode_segments[i]) * 60;
                        }
                        break;
                    case 3:
                        if (timecode_segments.length === 4) {
                            seconds += parseInt(timecode_segments[i]) * 60 * 60;
                        }
                        break;
                }
            }

            return seconds;
        }
    };

    this.FrameGrab = FrameGrab;
}());