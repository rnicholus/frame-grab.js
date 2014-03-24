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
            new FrameGrab(video);
        }).toThrow();

        expect(function() {
            new FrameGrab(video, 0);
        }).toThrow();

        expect(function() {
            new FrameGrab(video, -1);
        }).toThrow();
    });
});

describe("grab", function() {
    it("throws an Error on an invalid target container param", function() {
        var fg = new FrameGrab(document.createElement("video"), 1);

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

describe("_seek", function() {
    beforeEach(function(done) {
        var videoInnerHtml = "<source src=\"http://localhost:3000/big_buck_bunny.mp4?randomstr=12124\" type=\"video/mp4\"><source src=\"http://localhost:3000/big_buck_bunny.ogv\" type=\"video/ogg\">",
            video = document.createElement("video");

        video.id = "test-video";
        video.crossOrigin = "anonymous";
        video.innerHTML = videoInnerHtml;

        document.getElementsByTagName("body")[0].appendChild(video);

        video.addEventListener("canplay", function() {
            done();
        });
    });

    afterEach(function() {
        var videoEl = document.getElementById("test-video"),
            bodyEl = document.getElementsByTagName("body")[0];

        bodyEl.removeChild(videoEl);
    });

    it("seeks to a valid time", function(done) {
        var video = document.getElementById("test-video");

        FrameGrab.prototype._seek(video, 1).then(function() {
            expect(video.currentTime).toEqual(1);
            done();
        });
    });
});