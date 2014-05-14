describe("_timecode_to_secs", function() {
    it("should throw an error if an invalid timecode is passed", function() {
        expect(function() {
            FrameGrab.prototype._timecode_to_secs("xyz");
        }).toThrow();
    });

    it("converts valid timecodes into seconds correctly", function() {
        expect(FrameGrab.prototype._timecode_to_secs("30", 30)).toEqual(1);
        expect(FrameGrab.prototype._timecode_to_secs("15", 30)).toEqual(0.5);

        expect(FrameGrab.prototype._timecode_to_secs("1:30", 30)).toEqual(2);
        expect(FrameGrab.prototype._timecode_to_secs("1:15", 30)).toEqual(1.5);

        expect(FrameGrab.prototype._timecode_to_secs("1:1:30", 30)).toEqual(62);
        expect(FrameGrab.prototype._timecode_to_secs("1:1:15", 30)).toEqual(61.5);

        expect(FrameGrab.prototype._timecode_to_secs("1:1:1:30", 30)).toEqual(3662);
        expect(FrameGrab.prototype._timecode_to_secs("1:1:1:15", 30)).toEqual(3661.5);
    });
});

describe("secs_to_time_string", function() {
    it("generates a valid time string for 0 seconds", function() {
        expect(FrameGrab.prototype.secs_to_time_string(0, 2)).toEqual("00:00:00");
    });

    it("generates a valid time string for 1.234 seconds, precision 2", function() {
        expect(FrameGrab.prototype.secs_to_time_string(1.234, 2)).toEqual("00:00:01.23");
    });

    it("generates a valid time string for 3932.01 seconds", function() {
        expect(FrameGrab.prototype.secs_to_time_string(3932.01, 2)).toEqual("01:05:32.01");
    });
});

describe("_normalize_time", function() {
    it("throws an Error on invalid parameters", function() {
        expect(function() {
            FrameGrab.prototype._normalize_time("xyz");
        }).toThrow();

        expect(function() {
            FrameGrab.prototype._normalize_time(function() {});
        }).toThrow();

        expect(function() {
            FrameGrab.prototype._normalize_time(null);
        }).toThrow();

        expect(function() {
            FrameGrab.prototype._normalize_time(undefined);
        }).toThrow();

        expect(function() {
            FrameGrab.prototype._normalize_time("00:00", null);
        }).toThrow();

        expect(function() {
            FrameGrab.prototype._normalize_time("00:00", -1);
        }).toThrow();
    });

    it("converts to seconds", function() {
        expect(FrameGrab.prototype._normalize_time(3)).toEqual(3);
        expect(FrameGrab.prototype._normalize_time("1:1:1:15", 30)).toEqual(3661.5);
    });
});

describe("constructor", function() {
    it("throws an Error if constructed without a <video>", function() {
        /* jshint nonew:false */
        expect(function() {
            new FrameGrab();
        }).toThrow();
    });

    it("throws an Error if constructed without a valid frame rate", function() {
        var video = document.createElement("video");

        /* jshint nonew:false */
        expect(function() {
            new FrameGrab({video: video, frame_rate: 0});
        }).toThrow();

        expect(function() {
            new FrameGrab({video: video, frame_rate: -1});
        }).toThrow();
    });
});

describe("grab", function() {
    it("throws an Error on an invalid target container param", function() {
        var fg = new FrameGrab({video: document.createElement("video"), frame_rate: 1});

        expect(function() {
            fg.grab(document.createElement("div"), 1);
        }).toThrow();

        expect(function() {
            fg.grab(null, 1);
        }).toThrow();
    });
});

describe("_uncacheable_url", function() {
    it("augments a no-param URL", function() {
        expect(FrameGrab.prototype._uncacheable_url("https://garstasio.com/test")).toMatch(/^https:\/\/garstasio.com\/test\?fgtimestamp=\d+$/);
    });

    it("augments an existing-params URL", function() {
        expect(FrameGrab.prototype._uncacheable_url("https://garstasio.com/test?param1=one")).toMatch(/^https:\/\/garstasio.com\/test\?param1=one&fgtimestamp=\d+$/);
    });
});

describe("_is_element", function() {
    it("gracefully handles null or non-element", function() {
        expect(FrameGrab.prototype._is_element(null, "div")).toBe(false);
        expect(FrameGrab.prototype._is_element([], "div")).toBe(false);
    });

    it("identifies real elements", function() {
        expect(FrameGrab.prototype._is_element(document.createElement("div"), "div")).toBe(true);
        expect(FrameGrab.prototype._is_element(document.createElement("canvas"), "canvas")).toBe(true);
        expect(!FrameGrab.prototype._is_element(document.createElement("div"), "span")).toBe(true);
    });
});

describe("live video tests", function() {
    function setupVideo(name) {
        var timestamp = Date.now(),
            video_inner_html = "<source src=\"http://localhost:3000/" + name + ".mp4?testtimestamp=" + timestamp + "\" type=\"video/mp4\"><source src=\"http://localhost:3000/" + name + ".ogv\" type=\"video/ogg\">";

        this.video_el = document.createElement("video");
        this.video_el.crossOrigin = "anonymous";
        this.video_el.innerHTML = video_inner_html;

        document.getElementsByTagName("body")[0].appendChild(this.video_el);
    }

    function cleanupVideo() {
        this.video_el.src = "";

        this.video_el.parentNode.removeChild(this.video_el);

    }


    describe("isolated prototype methods", function() {
        var expected_video_height = 360,
            expected_video_width = 640;

        beforeEach(function(done) {
            var done_callback = function() {
                    this.video_el.removeEventListener("canplay", done_callback);
                    done();
                }.bind(this);

            setupVideo.call(this, "big_buck_bunny");
            this.video_el.addEventListener("canplay", done_callback);
        });
        afterEach(cleanupVideo);

        it("seeks to a valid time", function(done) {
            FrameGrab.prototype._seek(this.video_el, 1).then(function(videoEl) {
                expect(videoEl.currentTime).toEqual(1);
                done();
            });
        });

        it("properly calculates scaled dimensions for a video", function() {
            var dimensions1 = FrameGrab.prototype._calculate_scaled_dimensions(this.video_el, 100),
                dimensions2 = FrameGrab.prototype._calculate_scaled_dimensions(this.video_el, 641);

            expect(dimensions1).toEqual({
                height: (expected_video_height / expected_video_width) * 100,
                width: 100
            });

            expect(dimensions2).toEqual({
                height: expected_video_height,
                width: expected_video_width
            });
        });

        it("clones a video", function() {
            var clone = FrameGrab.prototype._clone_video(this.video_el);

            expect(clone.children[0].src).not.toEqual(this.video_el.children[0].src);
            expect(clone.children[1].src).not.toEqual(this.video_el.children[1].src);
            expect(clone.tagName.toLowerCase()).toEqual("video");
        });

        it("draws a frame onto a canvas", function() {
            var canvas = document.createElement("canvas"),
                last_data_url = canvas.toDataURL();

            FrameGrab.prototype._draw(this.video_el, canvas);
            expect(last_data_url).not.toEqual(canvas.toDataURL());
            last_data_url = canvas.toDataURL();

            FrameGrab.prototype._draw(this.video_el, canvas, 100);
            expect(last_data_url).not.toEqual(canvas.toDataURL());
            expect(canvas.width).toEqual(100);
            expect(canvas.height).toEqual(Math.round((expected_video_height / expected_video_width) * 100));
        });
    });

    describe("constructed instance", function() {
        beforeEach(function() {
            setupVideo.call(this, "big_buck_bunny");
        });
        afterEach(cleanupVideo);

        it("does not attempt to skip past solid frames if not enabled via options", function(done) {
            var fg = new FrameGrab({
                video: this.video_el,
                frame_rate: 30
            });

            spyOn(fg, "_is_solid_color");
            fg.grab(document.createElement("canvas"), 1).then(function() {
                expect(fg._is_solid_color).not.toHaveBeenCalled();
                done();
            });
        });

        it("attempts to skip past 5 solid frames at a time if enabled via options", function(done) {
            var fg = new FrameGrab({
                video: this.video_el,
                frame_rate: 30,
                skip_solids: {
                    enabled: true
                }
            });

            spyOn(fg, "_normalize_time").and.callThrough();

            fg.grab(document.createElement("canvas"), "0:30").then(function() {
                expect(fg._normalize_time.calls.count()).toBeGreaterThan(1);
                expect(fg._normalize_time.calls.argsFor(1)).toEqual(["5", 30]);
                done();
            });
        });

        it("attempts to skip past user-supplied solid frames at a time if enabled via options", function(done) {
            var fg = new FrameGrab({
                video: this.video_el,
                frame_rate: 30,
                skip_solids: {
                    enabled: true,
                    frames: 3
                }
            });

            spyOn(fg, "_normalize_time").and.callThrough();

            fg.grab(document.createElement("canvas"), "0:30").then(function() {
                expect(fg._normalize_time.calls.count()).toBeGreaterThan(1);
                expect(fg._normalize_time.calls.argsFor(1)).toEqual(["3", 30]);
                done();
            });
        });
    });

    describe("non-solid frame skip failures", function() {
        beforeEach(function() {
            setupVideo.call(this, "black_screen_test");
        });
        afterEach(cleanupVideo);

        it("fails if the video ends before a non-solid frame is encountered", function (done) {
            var fg = new FrameGrab({
                video: this.video_el,
                frame_rate: 24,
                skip_solids: {
                    enabled: true
                }
            });

            spyOn(fg, "_is_solid_color").and.callThrough();
            fg.grab(document.createElement("canvas"), 0).then(
                function success() {/* should not be hit */},
                function failure() {
                    expect(fg._is_solid_color).toHaveBeenCalled();
                    done();
                });
        });
    });

    describe("solid frame test options enforcement", function() {
        beforeEach(function() {
            setupVideo.call(this, "big_buck_bunny");
        });
        afterEach(cleanupVideo);

        it("uses a default value for max_ratio if no value is supplied by user", function(done) {
            var fg = new FrameGrab({
                video: this.video_el,
                frame_rate: 30,
                skip_solids: {
                    enabled: true
                }
            });

            spyOn(fg, "_is_solid_color");

            fg.grab(document.createElement("canvas"), "0:30").then(function() {
                expect(fg._is_solid_color.calls.argsFor(0)[1]).toBeTruthy();
                done();
            });
        });

        it("uses a user passed value for max_ratio", function(done) {
            var fg = new FrameGrab({
                video: this.video_el,
                frame_rate: 30,
                skip_solids: {
                    enabled: true,
                    max_ratio: 0.812
                }
            });

            spyOn(fg, "_is_solid_color");

            fg.grab(document.createElement("canvas"), "0:30").then(function() {
                expect(fg._is_solid_color.calls.argsFor(0)[1]).toEqual(0.812);
                done();
            });
        });
    });

    describe("grab_now tests", function() {
        beforeEach(function() {
            setupVideo.call(this, "black_screen_test");
        });
        afterEach(cleanupVideo);

        it("attempts to grab the current frame in a video", function(done) {
            var canvas = document.createElement("canvas"),
                deferred = new RSVP.defer(),
                fg = new FrameGrab({
                    video: this.video_el,
                    frame_rate: 30
                });

            deferred.resolve();
            spyOn(fg, "grab").and.returnValue(deferred.promise);

            var done_callback = function() {
                this.video_el.currentTime = 0.1;
                this.video_el.removeEventListener("canplay", done_callback);
                fg.grab_now(canvas, 100).then(function() {
                    expect(fg.grab).toHaveBeenCalledWith(canvas, 0.1, 100);
                    done();
                }.bind(this));
            }.bind(this);

            this.video_el.addEventListener("canplay", done_callback);
        });
    });

    describe("make_story", function() {
        describe("parameter error handling", function() {
            beforeEach(function() {
                this.fg = new FrameGrab({
                    video: document.createElement("video"),
                    frame_rate: 1
                });
            });

            it("rejects invalid type param", function() {
                expect(function() {
                    this.fg.make_story(null, 1);
                }.bind(this)).toThrow();

                expect(function() {
                    this.fg.make_story("foobar", 1);
                }.bind(this)).toThrow();

                expect(function() {
                    this.fg.make_story(1, 1);
                }.bind(this)).toThrow();

                expect(function() {
                    this.fg.make_story("CANVAS", 1);
                }.bind(this)).not.toThrow();

                expect(function() {
                    this.fg.make_story("canvas", 1);
                }.bind(this)).not.toThrow();

                expect(function() {
                    this.fg.make_story("iMg", 1);
                }.bind(this)).not.toThrow();

                expect(function() {
                    this.fg.make_story("img", 1);
                }.bind(this)).not.toThrow();
            });

            it("rejects invalid images param", function() {
                expect(function() {
                    this.fg.make_story("canvas");
                }.bind(this)).toThrow();

                expect(function() {
                    this.fg.make_story("canvas", -1);
                }.bind(this)).toThrow();

                expect(function() {
                    this.fg.make_story("canvas", 0);
                }.bind(this)).toThrow();
            });
        });

        describe("live video tests", function() {
            var expected_video_height = 360,
                expected_video_width = 640;

            beforeEach(function() {
                setupVideo.call(this, "big_buck_bunny");
            });
            afterEach(cleanupVideo);

            it("generates expected number of canvas elements", function(done) {
                var fg = new FrameGrab({
                    video: this.video_el,
                    frame_rate: 30
                });

                fg.make_story("canvas", 5).then(
                    function success(story_items) {
                        var last_time = 0;

                        expect(story_items.length).toBe(5);
                        story_items.forEach(function(story_item) {
                            var time = story_item.time,
                                container = story_item.container;

                            expect(time).toBeGreaterThan(last_time);
                            last_time = time;

                            expect(container.tagName.toLowerCase()).toEqual("canvas");
                            expect(container.width).toEqual(expected_video_width);
                            expect(container.height).toEqual(expected_video_height);
                        });
                        done();
                    },

                    function failure() {
                        console.error("make_story failed!");
                    }
                );
            });

            it("generates expected number of img elements", function(done) {
                var fg = new FrameGrab({
                    video: this.video_el,
                    frame_rate: 30
                });

                fg.make_story("img", 5).then(
                    function success(story_items) {
                        var last_time = 0,
                            last_data_uri;

                        expect(story_items.length).toBe(5);
                        story_items.forEach(function(story_item) {
                            var time = story_item.time,
                                container = story_item.container;

                            expect(time).toBeGreaterThan(last_time);
                            last_time = time;

                            expect(container.tagName.toLowerCase()).toEqual("img");
                            expect(container.width).toEqual(expected_video_width);
                            expect(container.height).toEqual(expected_video_height);

                            expect(container.src).not.toEqual(last_data_uri);
                            last_data_uri = container.src;
                        });
                        done();
                    },

                    function failure() {
                        console.error("make_story failed!");
                    }
                );
            });

            it("generates expected number of blobs (w/out frame rate)", function(done) {
                var fg = new FrameGrab({
                    video: this.video_el
                });

                fg.make_story("blob", 5).then(
                    function success(story_items) {
                        var last_time = 0;

                        expect(story_items.length).toBe(5);
                        story_items.forEach(function(story_item) {
                            var time = story_item.time,
                                container = story_item.container;

                            expect(time).toBeGreaterThan(last_time);
                            last_time = time;

                            expect(container instanceof Blob).toBe(true);
                            expect(container.type).toEqual("image/png");
                            expect(container.size).toBeGreaterThan(0);
                        });
                        done();
                    },

                    function failure() {
                        console.error("make_story failed!");
                    }
                );
            });
        });
    });
});
