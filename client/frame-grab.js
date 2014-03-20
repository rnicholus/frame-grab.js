(function() {

    var Promise = RSVP.Promise,

        FrameGrab = function(video, frame_rate) {
            if (!this._is_element(video, "video")) {
                throw new Error("You must pass a valid <video>!");
            }
            if (!frame_rate || frame_rate < 0) {
                throw new Error("Invalid frame rate of " + frame_rate);
            }

            var video_clone = this._clone_video(video),
                clone_ready = new Promise(function(resolve, reject) {
                    video_clone.addEventListener("canplaythrough", function() {
                        resolve();
                    });
                });

            this.grab = function(target_container, time, opt_max_size) {
                if (!this._is_element(target_container, "img") &&
                    !this._is_element(target_container, "canvas")) {

                    throw new Error("Target container must be an <img> or <canvas>!");
                }

                var grab_deferred = new RSVP.defer(),
                    time_in_secs = this._normalize_time(time, frame_rate);

                clone_ready.then(function() {
                    var canvas = this._is_element(target_container, "canvas") ?
                        target_container :
                        document.createElement("canvas");

                    // TODO If a canvas is user-supplied, draw onto a temp canvas
                    // and then draw the final image onto the passed canvas
                    // to avoid flickering in case we need to adjust the time to
                    // a non-solid frame.
                    this._draw_specific_frame({
                        canvas: canvas,
                        frame_rate: frame_rate,
                        max_size: opt_max_size,
                        time_in_secs: time_in_secs,
                        video: video_clone
                    }).then(
                        function() {
                            if (this._is_element(target_container, "canvas")) {
                                grab_deferred.resolve(target_container);
                            }
                            else {
                                target_container.onload = function() {
                                    grab_deferred.resolve(target_container);
                                };
                                target_container.onerror = function() {
                                    grab_deferred.reject("Frame failed to load in <img>.");
                                };
                                target_container.src = canvas.toDataURL();
                            }
                        }.bind(this),
                        function() {
                            //TODO handle failure
                            console.log("TODO");
                        }
                    );
                }.bind(this));

                return grab_deferred.promise;
            };
        };

    FrameGrab.prototype = {
        _calculate_scaled_dimensions: function(video, max_size) {
            var aspect_ratio = video.videoHeight / video.videoWidth,
                scaled_size = aspect_ratio * max_size;

            return {
                height: scaled_size,
                width: max_size
            };
        },

        // Most of this is a workaround for a bug in Chrome
        // that causes the loading of the cloned video to stall
        _clone_video: function(video) {
            var clone = video.cloneNode(true),
                videoSrc = clone.getAttribute("src");

            if (videoSrc) {
                clone.setAttribute("src", this._uncacheable_url(videoSrc));
            }
            else {
                (function() {
                    var source_els = clone.getElementsByTagName("source"),
                        currentElement, srcAttr, idx;

                    for (idx = 0; idx < source_els.length; idx++) {
                        currentElement = source_els[idx],
                        srcAttr = currentElement.getAttribute("src");

                        if (srcAttr) {
                            currentElement.setAttribute("src",
                                this._uncacheable_url(srcAttr));
                        }
                    }
                }.bind(this)());
            }

            // Not all impls of HTMLMediaElement include load() (i.e. phantomjs)
            clone.load && clone.load();
            return clone;
        },

        _draw: function(video, canvas, opt_max_size) {
            var context = canvas.getContext("2d"),
                target_dim = {
                    height: video.videoHeight,
                    width: video.videoWidth
                };

            if (opt_max_size) {
                target_dim = this._calculate_scaled_dimensions(video, opt_max_size);
            }
            canvas.width = target_dim.width;
            canvas.height = target_dim.height;

            context.drawImage(video, 0, 0, target_dim.width, target_dim.height);

            return canvas;
        },

        _draw_specific_frame: function(spec) {
            var video = spec.video,
                canvas = spec.canvas,
                time_in_secs = spec.time_in_secs,
                max_size = spec.max_size,
                frame_rate = spec.frame_rate,
                deferred = spec.deferred || RSVP.defer();

            this._seek(video, time_in_secs).then(function() {
                this._draw(video, canvas, max_size);

                // TODO Make solid-color detection optional
                if (this._is_solid_color(canvas)) {
                    (function() {
                        // TODO Make # of frames to jump configurable
                        var jump_frames_in_secs = this._normalize_time("5", frame_rate);
                        spec.time_in_secs += jump_frames_in_secs;
                        spec.deferred = deferred;
                        // TODO Fail if we have run out of frames in the video
                        console.log("Found a solid frame, advancing 5 frames to find a non-solid one");
                        this._draw_specific_frame(spec);
                    }.bind(this)());
                }
                else {
                    deferred.resolve(canvas);
                }
            }.bind(this));

            return deferred.promise;
        },

        _is_element: function(el, type) {
            return el != null &&
                el.tagName != null &&
                el.tagName.toLowerCase() === type;
        },

        // TODO Do a better job of detecting solid colors.
        // That is, detect ALL solid colors and colors that are near-solid.
        _is_solid_color: function(canvas) {
            var context = canvas.getContext("2d"),
                image_data = context.getImageData(0, 0, canvas.width, canvas.height),
                pixel_data = image_data.data,
                black_occurrences = 0,
                pixel_index, red, green, blue, alpha;

            for (var i = 0; i < pixel_data.length; i++) {
                pixel_index = 4 * i;

                red = pixel_data[pixel_index++];
                green = pixel_data[pixel_index++];
                blue = pixel_data[pixel_index++];
                alpha = pixel_data[pixel_index];

                // We only currently look for solid or near-solid black
                // TODO consider making these values configurable
                if (alpha === 255 &&
                    Math.abs(red - green) < 30 &&
                    Math.abs(green - blue) < 30) {

                    black_occurrences++;
                }
            }

            // If at least 95% of the frame is solid black, return true
            // TODO consider making the quotient configurable
            if (black_occurrences / (pixel_data.length / 4) > 0.95) {
                return true;
            }
            return false;
        },

        _normalize_time: function(time, frame_rate) {
            if (typeof time === "number") {
                return parseFloat(time);
            }
            else if (typeof time === "string" &&
                typeof frame_rate === "number" &&
                frame_rate > 0) {

                return this._timecode_to_secs(time, frame_rate);
            }
            else {
                throw new Error("Invalid time or frame rate");
            }
        },

        _seek: function(video, secs) {
            return new Promise(function(resolve, reject) {
                var seek_complete = function() {
                    video.removeEventListener("seeked", seek_complete);
                    resolve();
                };

                video.addEventListener("seeked", seek_complete);
                video.currentTime = secs;
            });
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
        },

        _uncacheable_url: function(url) {
            var param_prefix = url.indexOf("?") > 0 ? "&" : "?";

            return url + param_prefix +
                "fgtimestamp=" + new Date().getMilliseconds();
        }
    };

    this.FrameGrab = FrameGrab;
}());