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
            if(!/^(\d{1,2}:)?(\d{1,2}:)?(\d{1,2}:)?\d{1,2}$/.test(timecode)) {
                throw new Error(timecode + " is not a valid timecode!");
            }

            var segments = timecode.split(":").reverse(),
                secs_per_frame = 1 / frame_rate,
                secs = 0,
                segment_int;

            for (var i = 3; i >= 0; i--) {
                segment_int = parseInt(segments[i]);

                switch (i) {
                    case 0:
                        secs += segment_int * secs_per_frame;
                        break;
                    case 1:
                        if (segments.length >= 2) {
                            secs += segment_int;
                        }
                        break;
                    case 2:
                        if (segments.length >= 3) {
                            secs += segment_int * 60;
                        }
                        break;
                    case 3:
                        if (segments.length === 4) {
                            secs += segment_int * 60 * 60;
                        }
                        break;
                }
            }

            return secs;
        }
    };

    this.FrameGrab = FrameGrab;
}());