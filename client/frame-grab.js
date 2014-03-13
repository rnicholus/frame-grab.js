(function() {

    var Promise = RSVP.Promise,

        FrameGrab = function(video, opt_frame_rate) {
            if (!this._is_element(video, "video")) {
                throw new Error("You must pass a valid <video>!");
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
                    time_in_secs = this._normalize_time(time, opt_frame_rate);

                clone_ready.then(function() {
                    this._seek(video_clone, time_in_secs).then(function() {
                        var canvas = this._is_element(target_container, "canvas") ?
                            target_container :
                            document.createElement("canvas");

                        this._draw(video_clone, canvas, opt_max_size);

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
                    }.bind(this));
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

        _is_element: function(el, type) {
            return el != null &&
                el.tagName != null &&
                el.tagName.toLowerCase() === type;
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