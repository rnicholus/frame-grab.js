(function() {

    var Promise = RSVP.Promise,

        // TODO document that frame_rate is now optional (unless timecode args are used)
        /**
         * Supported options object properties:
         *
         * - `video`: (HTMLVideoElement) - [REQUIRED] The source video
         * - `frame_rate`: (Float) - [null/undefined] The frame rate of the video.  Must be specified only if you intend to address the API using SMPTE timecode parameters or use methods dependent on frame calculation.
         * - `skip_solids.enabled`: (Boolean) - [false] True if you want to skip past frames that are mostly solid.
         * - `skip_solids.frames`: (Integer) - [5] Number of frames to skip ahead when a solid frame is found.  Used if a frame_rate is specified during constructions.
         * - `skip_solids.secs`: (Float) - [0.25] Number of seconds to skip ahead when a solid frame is found.  Used if no frame_rate is specified during construction.
         * - `skip_solids.max_ratio`: (Float) - [0.98] If the frame contains more solid pixels, it will be skipped.
         */
        FrameGrab = function(user_passed_opts) {
            var options = this._normalize_options(user_passed_opts);

            if (!this._is_element(options.video, "video")) {
                throw new Error("You must pass a valid <video>!");
            }
            if (options.frame_rate != null && options.frame_rate <= 0) {
                throw new Error("Invalid frame rate of " + options.frame_rate);
            }

            var video_clone = this._clone_video(options.video),
                clone_ready = new Promise(function(resolve) {
                    video_clone.addEventListener("canplaythrough", function() {
                        resolve(video_clone);
                    });
                });

            this.grab = function(target_container, time, opt_max_size) {
                if (!this._is_element(target_container, "img") &&
                    !this._is_element(target_container, "canvas") &&
                    !target_container && target_container.toLowerCase() !== "blob") {

                    throw new Error("Target container must be an <img>, <canvas>, or 'blob'!");
                }

                var grab_deferred = new RSVP.defer(),
                    time_in_secs = this._normalize_time(time, options.frame_rate);

                clone_ready.then(function(cloned_video) {
                    var temp_canvas = document.createElement("canvas");

                    this._draw_specific_frame({
                        canvas: temp_canvas,
                        frame_rate: options.frame_rate,
                        max_size: opt_max_size,
                        skip_solids: options.skip_solids,
                        time_in_secs: time_in_secs,
                        video: cloned_video
                    }).then(
                        function draw_success(result) {
                            // If a canvas is user-supplied, draw onto a temp canvas
                            // and then draw the final image onto the passed canvas
                            // to avoid flickering in case we need to adjust the time
                            // to a non-solid frame.
                            if (this._is_element(target_container, "canvas")) {
                                var target_context = target_container.getContext("2d");

                                target_container.width = temp_canvas.width;
                                target_container.height = temp_canvas.height;

                                target_context.drawImage(temp_canvas, 0, 0);

                                grab_deferred.resolve({time: result.time, container: target_container});
                            }

                            else if (this._is_element("img")) {
                                target_container.onload = function() {
                                    grab_deferred.resolve({time: result.time, container: target_container});
                                };
                                target_container.onerror = function() {
                                    grab_deferred.reject("Frame failed to load in <img>.");
                                };
                                target_container.src = temp_canvas.toDataURL();
                            }

                            // target container is a Blob
                            else {
                                grab_deferred.resolve({time: result.time, container: this._dataUriToBlob(temp_canvas.toDataURL())});
                            }
                        }.bind(this),

                        // draw failure
                        grab_deferred.reject
                    );
                }.bind(this));

                return grab_deferred.promise;
            };

            this.grab_now = function(target_container, opt_max_size) {
                var deferred = new RSVP.defer();

                clone_ready.then(function() {
                    this.grab(target_container, options.video.currentTime, opt_max_size).then(
                        deferred.resolve,
                        deferred.reject
                    );
                }.bind(this));

                return deferred.promise;
            };

            this.make_story = function(type, images, opt_size) {
                var deferred = new RSVP.defer(),
                    normalized_type = type && type.toLowerCase(),
                    size = typeof opt_size === "number" && opt_size > 0 && opt_size;

                if (!normalized_type ||
                    normalized_type !== "canvas" &&
                    normalized_type !== "img" &&
                    normalized_type !== "blob") {

                    throw new Error(type + " is not a valid type!");
                }
                else if (!images ||
                    typeof images !== "number" ||
                    images < 0) {

                    throw new Error(images + " is not a valid number of images!");
                }

                clone_ready.then(function(cloned_video) {
                    var frame_period = cloned_video.duration / (images + 1),
                        rendered_frames = [],

                        draw_next_frame = function(time_to_render) {
                            var container = normalized_type === "blob" ? "blob" : document.createElement(normalized_type);

                            this.grab(container, time_to_render, size).then(
                                function grabbed(rendered_container) {
                                    rendered_frames.push(rendered_container);

                                    if (rendered_frames.length < images) {
                                        draw_next_frame(time_to_render + frame_period);
                                    }
                                    else {
                                        deferred.resolve(rendered_frames);
                                    }
                                }.bind(this),

                                deferred.reject
                            );
                        }.bind(this);

                    draw_next_frame(frame_period);
                }.bind(this));

                return deferred.promise;
            };
        };

    FrameGrab.prototype = {
        _calculate_scaled_dimensions: function(video, max_size) {
            if (max_size >= video.videoWidth && max_size >= video.videoHeight) {
                return {
                    height: video.videoHeight,
                    width: video.videoWidth
                };
            }

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
                        currentElement = source_els[idx];
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
            var deferred = spec.deferred || RSVP.defer(),
                frames_to_skip, secs_to_skip;

            if (spec.frame_rate) {
                frames_to_skip = spec.skip_solids.frames.toString();
                secs_to_skip = this._normalize_time(frames_to_skip, spec.frame_rate);
            }
            else {
                secs_to_skip = spec.skip_solids.secs;
            }

            this._seek(spec.video, spec.time_in_secs).then(
                function seek_success() {
                    this._draw(spec.video, spec.canvas, spec.max_size);

                    if (spec.skip_solids.enabled &&
                        this._is_solid_color(spec.video, spec.skip_solids.max_ratio)) {

                        (function() {
                            spec.time_in_secs += secs_to_skip;
                            spec.deferred = deferred;

                            if (spec.frame_rate) {
                                console.log("Found a solid frame, advancing " + frames_to_skip + " frames to find a non-solid one");
                            }
                            else {
                                console.log("Found a solid frame, advancing " + secs_to_skip + " seconds to find a non-solid one");
                            }

                            this._draw_specific_frame(spec);
                        }.bind(this)());
                    }
                    else {
                        deferred.resolve({time: spec.time_in_secs, container: spec.canvas});
                    }
                }.bind(this),

                function seek_failure() {
                    console.error("Failed to seek in _draw_specific_frame!");
                    deferred.reject("Seek failure!");
                }
            );

            return deferred.promise;
        },

        _is_element: function(el, type) {
            return el != null &&
                el.tagName != null &&
                el.tagName.toLowerCase() === type;
        },

        // That is, detect ALL solid colors and colors that are near-solid.
        // TODO This code became very messy during FedEx Day.  Soem time will need to be spent cleaning this up.
        _is_solid_color: function(video, max_solid_ratio) {
                // re-draw the frame onto the canvas at a minimal size
                // to speed up image data parsing
            var canvas = this._draw(video, document.createElement("canvas"), 10),
                context = canvas.getContext("2d"),
                image_data = context.getImageData(0, 0, canvas.width, canvas.height),
                pixel_data = image_data.data,
                solid_occurrences = 0,
                color_count = {length: 0},
                red, green, blue, alpha;

            for (var pixel_index = 0; pixel_index < pixel_data.length;) {
                red = pixel_data[pixel_index++];
                green = pixel_data[pixel_index++];
                blue = pixel_data[pixel_index++];
                alpha = pixel_data[pixel_index++];

                if (red === green && green === blue) {
                    if (color_count[red]) {
                        color_count[red] += 1;
                    }
                    else {
                        color_count[red] = 1;
                        color_count.length++;
                    }
                }
            }

            function get_like_solid_occurrences(occurrences_by_color, color_index) {
                var range = 5,
                    current_idx = color_index,
                    occurrences = occurrences_by_color[color_index];

                for (var i = 1; i <= 5 && current_idx < occurrences_by_color.length; i++) {
                    current_idx++;
                    if (occurrences_by_color[current_idx]) {
                        occurrences += occurrences_by_color[current_idx];
                    }
                }

                current_idx = color_index;
                for (var i = 1; i > 0 && current_idx >= 0; i++) {
                    current_idx--;
                    if (occurrences_by_color[current_idx]) {
                        occurrences += occurrences_by_color[current_idx];
                    }
                }

                return occurrences;
            }

            var occurrences = 0;
            for (var color_val in color_count) {
                if (color_val !== "length") {
                    occurrences = get_like_solid_occurrences(color_count, parseInt(color_val));
                    solid_occurrences = Math.max(solid_occurrences, occurrences);
                }
            }

            // If most of the frames are solid, return true
            return (solid_occurrences / (pixel_data.length / 4) > max_solid_ratio);
        },

        _normalize_options: function(user_passed_options) {
            var options = {
                video: user_passed_options.video,
                frame_rate: user_passed_options.frame_rate,
                skip_solids: {
                    enabled: false,
                    frames: 5,
                    secs: 0.25,
                    max_ratio: 0.92
                }
            };

            if (user_passed_options.skip_solids) {
                options.skip_solids.enabled = user_passed_options.skip_solids.enabled;

                options.skip_solids.frames = user_passed_options.skip_solids.frames ||
                    options.skip_solids.frames;

                options.skip_solids.secs = user_passed_options.skip_solids.secs ||
                    options.skip_solids.secs;

                options.skip_solids.max_ratio = user_passed_options.skip_solids.max_ratio ||
                    options.skip_solids.max_ratio;
            }

            return options;
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
                    resolve(video);
                };

                if (video.duration < secs) {
                    reject("Target time exceeds the video length");
                }
                else {
                    video.addEventListener("seeked", seek_complete);
                    video.currentTime = secs;
                }
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

            // Don't attempt to add cache-buster to data URI, as this apparently results in a 404.
            if (url.indexOf("blob:") !== 0) {
                return url + param_prefix +
                    "fgtimestamp=" + new Date().getMilliseconds();
            }

            return url;
        },

        // TODO cleanup this mess from FedEx Day
        _dataUriToBlob: function(dataUri) {
            "use strict";

            var byteString, mimeString, arrayBuffer, intArray;

            // convert base64 to raw binary data held in a string
            if (dataUri.split(",")[0].indexOf("base64") >= 0) {
                byteString = atob(dataUri.split(",")[1]);
            }
            else {
                byteString = decodeURI(dataUri.split(",")[1]);
            }

            // extract the MIME
            mimeString = dataUri.split(",")[0]
                .split(":")[1]
                .split(";")[0];

            // write the bytes of the binary string to an ArrayBuffer
            arrayBuffer = new ArrayBuffer(byteString.length);
            intArray = new Uint8Array(arrayBuffer);
            for (var i = 0; i < byteString.length; i++) {
                intArray[i] = byteString.charCodeAt(i);
            }

            return this._createBlob(arrayBuffer, mimeString);
        },

        _createBlob: function(data, mime) {
            "use strict";

            var BlobBuilder = window.BlobBuilder ||
                    window.WebKitBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.MSBlobBuilder,
                blobBuilder = BlobBuilder && new BlobBuilder();

            if (blobBuilder) {
                blobBuilder.append(data);
                return blobBuilder.getBlob(mime);
            }
            else {
                return new Blob([data], {type: mime});
            }
        }
    };

    FrameGrab.make_video = function(blob, video) {
        var URL = window.URL || window.webkitURL,
            video_url = URL.createObjectURL(blob),
            temp_video = document.createElement("video"),
            deferred = new RSVP.defer();

        temp_video.addEventListener("canplay", function() {
            video.setAttribute("src", video_url);
            deferred.resolve(video);
        });

        temp_video.onerror = function() {
            deferred.reject();
        };

        temp_video.setAttribute("src", video_url);

        return deferred.promise;
    };

    // TODO eliminate redundancies
    FrameGrab.secs_to_timecode = function(secs, framerate) {
        var pad_tc = function(segment) {
                return ("00" + segment).substr(-2, 2);
            },
            timecode, tc_mins, tc_secs, tc_frames,
            tc_hours = Math.floor(secs / 60 / 60);

        timecode = pad_tc(tc_hours) + ":";
        secs -= tc_hours * 60 * 60;

        tc_mins = Math.floor(secs / 60);
        timecode += pad_tc(tc_mins) + ":";
        secs -= tc_mins * 60;

        tc_secs = Math.floor(secs);
        timecode += pad_tc(tc_secs) + ":";
        secs -= tc_secs;

        tc_frames = Math.floor(secs * framerate);
        timecode += pad_tc(tc_frames);

        return timecode;
    };

    // TODO eliminate redundancies
    FrameGrab.secs_to_formatted_time_string = function(secs, precision) {
        var pad_tc = function(segment) {
                return ("00" + segment).substr(-2, 2);
            },
            formatted_time_string, tc_mins, tc_secs, tc_secs_remainder,
            tc_hours = Math.floor(secs / 60 / 60);

        formatted_time_string = pad_tc(tc_hours) + ":";
        secs -= tc_hours * 60 * 60;

        tc_mins = Math.floor(secs / 60);
        formatted_time_string += pad_tc(tc_mins) + ":";
        secs -= tc_mins * 60;

        tc_secs = Math.floor(secs);
        formatted_time_string += pad_tc(tc_secs);
        secs -= tc_secs;

        if (secs > 0) {
            tc_secs_remainder = secs.toFixed(precision);
            formatted_time_string += String(tc_secs_remainder).replace("0.", ".");
        }

        return formatted_time_string;
    };

    FrameGrab.timecode_to_secs = FrameGrab.prototype.timecode_to_secs;

    this.FrameGrab = FrameGrab;
}());
