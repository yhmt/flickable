// flickable 0.0.1 Copyright (c) 2013 Yuya Hashimoto
// See http://github.com/yhmt/flickable
(function (global, document, undefined) {

var Flickable,
    NS       = "Flickable",
    div      = document.createElement("div"),
    prefixes = ["webkit", "moz", "o", "ms"],
    regexp   = /^(.+[\#\.\s\[\*>:,]|[\[:])/,
    saveProp = {},
    support  = (function () {
        var hasTransform3d = hasProp([
                "perspectiveProperty",
                "WebkitPerspective",
                "MozPerspective",
                "msPerspective",
                "OPerspective"
            ]),
            hasTransform   = hasProp([
                "transformProperty",
                "WebkitTransform",
                "MozTransform",
                "msTransform",
                "OTransform"
            ]),
            hasTransition  = hasProp([
                "transitionProperty",
                "WebkitTransitionProperty",
                "MozTransitionProperty",
                "msTransitionProperty",
                "OTransitionProperty"
            ])
        ;

        return {
            touchEvent          : "ontouchstart"        in global,
            addEventListener    : "addEventListener"    in global,
            removeEventListener : "removeEventListener" in global,
            createEvent         : "createEvent"         in document,
            transform3d         : hasTransform3d,
            transform           : hasTransform,
            cssAnimation        : ((hasTransform3d || hasTransform) && hasTransition) ? true : false
        };
    })(),
    userAgent = (function () {
        var ua           = navigator.userAgent.toLowerCase(),
            ios          = ua.match(/(?:iphone\sos|ip[oa]d.*os)\s([\d_]+)/),
            android      = ua.match(/(android)\s+([\d.]+)/),
            isIOS        = !!ios,
            isAndroid    = !!android,
            checkBrowser = (function () {
                var match = /(webkit)[ \/]([\w.]+)/.exec(ua)              ||
                            /(firefox)[ \/]([\w.]+)/.exec(ua)             ||
                            /(msie) ([\w.]+)/.exec(ua)                    ||
                            /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || [];

                return {
                    name    : match[1],
                    version : parseFloat(match[2])
                };
            })(),
            platformName = (function () {
                if (support.touchEvent) {
                    return isIOS ? "ios" : "android";
                }
                else {
                    return "desktop";
                }
            })(),
            platformVersion = (function () {
                return platformName !== "desktop" ?
                    parseFloat((ios || android).pop().split(/\D/).join(".")) :
                    null;
            })();

        return {
            platform : platformName,
            browser  : checkBrowser.name,
            version  : {
                os      : platformVersion,
                browser : checkBrowser.version
            },
            isLegacy : (isAndroid && platformVersion < 3) ||
                       (checkBrowser.name === "msie" && checkBrowser.version < 10)
        };
    })(),
    touchStartEvent = support.touch ? "touchstart" : "mousedown",
    touchMoveEvent  = support.touch ? "touchmove"  : "mousemove",
    touchEndEvent   = support.touch ? "touchend"   : "mouseup"
;

// Object.keys shim
// http://uupaa.hatenablog.com/entry/2012/02/04/145400
if (!Object.keys) {
    Object.keys = function (source) {
        var ret = [], i = 0, key;

        for (key in source) {
            if (source.hasOwnProperty(key)) {
                ret[i++] = key;
            }
        }

        return ret;
    };
}

// Array.isArray shim
if (!Array.isArray) {
    Array.isArray = function (any) {
        return Object.prototype.toString.call(any) === "[object Array]";
    };
}

function uupaaLooper(hash) {
    var ret = [],
        ary = Object.keys(hash),
        i   = 0, l = ary.length;

    for (; l; i++, l--) {
        ret.push(ary[i]);
    }

    return ret;
}

function isNodeList(any) {
    var type = Object.prototype.toString.call(any);

    return type === "[object NodeList]" || type === "[object HTMLCollection]";
}

function forEach(list, callback) {
    var i = 0, l = list.length;

    for (; l; i++, l--) {
        callback.call(list[i], i);
    }
}

function hasProp(props) {
    if (props instanceof Array) {
        forEach(props, function (prop) {
            if (div.style[prop] !== undefined) {
                return true;
            }
        });
        return false;
    }
    else if (typeof props === "string") {
        return (div.style[props] !== undefined) ? true : false;
    }
}

function setStyle(element, styles) {
    var style    = element.style,
        styleAry = uupaaLooper(styles);

    function setAttr(style, prop, val) {
        var hasSaveProp = saveProp[prop];

        if (hasSaveProp) {
            style[hasSaveProp] = val;
        }
        else if (style[prop] !== undefined) {
            saveProp[prop] = prop;
            style[prop]    = val;
        }
        else {
            forEach(prefixes, function (prefix) {
                var prefixProp = ucFirst(prefix) + ucFirst(prop);

                if (style[prefixProp] !== undefined) {
                    saveProp[prop]    = prefixProp;
                    style[prefixProp] = val;

                    return true;
                }
            });

            return false;
        }
    }

    (function (i, l) {
        for (; l; i++, l--) {
            setAttr(style, styleAry[i], styles[styleAry[i]]);
        }
    })(0, styleAry.length);
}

function getTranslate(x) {
    return support.transform3d ?
        "translate3d(" + x + "px, 0, 0)" :
        "translate("   + x + "px, 0)";
}

function getPage(event, page) {
    return event.changedTouches ? event.changedTouches[0][page] : event[page];
}

function getCSSVal(prop) {
    if (div.style[prop] !== undefined) {
        return prop;
    }
    else {
        forEach(prefixes, function (prefix) {
            var prefixProp = ucFirst(prefix) + ucFirst(prop);

            if (div.style[prefixProp] !== undefined) {
                return "-" + prefix + prop;
            }
        });

        return null;
    }
}

function getElementWidth(element) {
    var getStyles    = element.currentStyle || global.getComputedStyle(element, null),
        hasBoxSizing = (function () {
            var properties = [
                "-webkit-box-sizing",
                "-moz-box-sizing",
                "-o-box-sizing",
                "-ms-box-sizing",
                "box-sizing"
            ];

            forEach(properties, function (prop) {
                if (element.style[prop] !== undefined) {
                    boxSizingVal = getStyles.prop;

                    return true;
                }
            });

            return false;
        })(),
        boxSizingVal, margin, padding, border, width;

    function styleParser(props) {
        var ret = 0;

        forEach(props, function (prop) {
            if (getStyles[prop]) {
                ret += parseFloat(prop.match(/\d+/)[0]);
            }
        });

        return ret;
    }

    if (hasBoxSizing || boxSizingVal !== "content-box") {
        margin = styleParser("margin-right", "margin-left");
        width  = element.scrollWidth + margin;
    }
    else {
        margin  = styleParser("margin-right",       "margin-left");
        padding = styleParser("padding-right",      "padding-left");
        border  = styleParser("border-right-width", "border-left-width");
        width   = element.scrollWidth + margin + padding + border;
    }

    return width;
}

function getTransitionEndEventNames() {
    var eventNames  = [
            "webkitTransitionEnd",
            "mozTransitionEnd",
            "oTransitionEnd",
            "transitionend"
        ],
        browserName = userAgent.browser !== "msie" ?
                          userAgent.browser :
                      userAgent.version.browser > 10 ?
                          "oldie" : "ie";

    switch (browserName) {
        case "webkit":
            return [transitionendNames[0], transitionendNames[3]];
            break;
        case "firefox":
            return [transitionendNames[1], transitionendNames[3]];
        case "opera":
            return [transitionendNames[2], transitionendNames[3]];
            break;
        case "ie":
            return [transitionendNames[3]];
            break;
        default:
            return [];
            break;
    }
}

function triggerEvent (element, type, bubbles, cancelable) {
    var event;

    if (support.createEvent) {
        event = document.createEvent("Event");

        event.initEvent(type, bubbles, cancelable);
        element.dispatchEvent(event);
    }
    else {
        event = document.createEventObject();

        element.fireEvent(type, event);
    }
}

function ucFirst(str) {
    return str[0].toUpperCase() + str.substring(1, str.length);
}

Flickable = (function () {
    function Flickable(element, options, callback) {
        this.el = element;

        this.opts  = options || {};

        this.opts.autoPlay = this.otps.autoPlay || false;
        this.opts.loop     = this.otps.loop     || (this.opts.autoPlay ? true : false);

        this.opts.interval      = this.opts.interval      || 6600;
        this.opts.clearInterval = this.opts.clearInterval || this.opts.interval / 2;
        this.opts.transition    = this.opts.transition    || {
            duration       : userAgent.isLegacy ? "200ms" : "330ms",
            timingFunction : "cubic-bezier(0.23, 1, 0.32, 1)"
        };
        
        this.distance     = this.opts.distance     || 0;
        this.currentPoint = this.opts.currentPoint || 0;

        this.maxPoint    =
        this.maxX        =
        this.currentX    =
        this.startPageX  = 
        this.startPageY  = 
        this.basePageX   = 
        this.directionX  = 
        this.visibleSize = 0;

        this.timeId      = null;

        this.scrolling   =
        this.moveReady   = false;

        return this;
    }

    Flickable.prototype = {
        handleEvent: function (event) {
            switch (event.type) {
                case touchStartEvent:
                    this._touchStart(event);
                    break;
                case touchMoveEvent:
                    this._touchMove(event);
                    break;
                case touchEndEvent:
                    this._touchEnd(event);
                    break;
                case "click":
                    this._click(event);
                    break;
            }
        },
        refresh: function () {
        },
        hasPrev: function () {
            return this.currentPoint > 0;
        },
        hasNext: function () {
            return this.currentPoint < this.maxPoint;
        },
        toPrev: function () {
            if (!this.hasPrev()) {
                return;
            }

            this.moveToPoint(this.currentPoint - 1);
        },
        toNext: function () {
            if (!this.hasNext()) {
                return;
            }

            this.moveToPoint(this.currentPoint + 1);
        },
        moveToPoint: function (point, duration) {
            point    = point    || this.currentPoint;
            duration = duration || this.option.transition.duration;

            var beforePoint   = this.currentPoint;
            this.currentPoint = point < 0 ?
                                    0 : 
                                point > this.maxPoint ?
                                    this.maxPoint :
                                    parseInt(point, 10)
                                ;

            this._setX(-(this.currentPoint * this.distance), duration);

            if (beforePoint !== this.currentPoint) {
                triggerEvent(this.el, "flpointmove", true, false);

                if (this.opts.loop) {
                    this._loop();
                }
            }
        },
        startAutoPlay: function () {
            var interval = this.opts.interval,
                _this;

            if (!this.opts.autoPlay) {
                return;
            }

            this.timerId = setInterval(function () {
                _this.toNext();
            }, interval);
        },
        clearAutoPlay: function () {
            if (!this.timeId) {
                return;
            }

            clearInterval(this.timerId);
        },
        destroy: function () {
            if (this.opts.autoPlay) {
                this.clearAutoPlay();
            }

            this._off(touchStartEvent, this);
        },
        _touchStart: function (event) {

        },
        _touchMove: function (event) {

        },
        _touchEnd: function (event) {

        },
        _click: function (event) {
            event.stopPropagation();
            event.preventDefault();
        },
        _on: function (type, fn, capture) {
            capture = capture || false;

            return support.addEventListener ?
                this.el.addEventListener(type, fn, capture) :
                this.el.attachEvent("on" + type, fn);
        },
        _off: function (type, fn) {
            return support.removeEventListener ?
                this.el.removeEventListener(type, fn) :
                this.el.detachEvent("on" + type, fn);
        },
        _loop: function () {
            var _this, timerId,
                clearInterval     = this.opts.clearInterval,
                childElementCount = this.childElementCount,
                transitionEndEventNames = getTransitionEndEventNames(),
                hasTransitionEndEvents  = transitionEndEventNames.length;

            function loopFunc() {
                var moveToBack = this.currentPoint <= this.visibleSize,
                    moveToNext = this.currentPoint >= (this.maxPoint - this.visibleSize);

                return moveToBack ?
                    _this.moveToPoint(_this.currentPoint + childElementCount, 0) :
                    _this.moveToPoint(_this.currentPoint - childElementCount, 0);
            }

            if (hasTransitionEndEvents && moveToBack || moveToNext) {
                forEach(transitionEndEventNames, function (eventName) {
                    _this._on(eventName, loopFunc, false);

                    setTimeout(function () {
                        _this._off(eventName, loopFunc);
                    }, clearInterval);
                });
            }
            // TODO: イミフ
            // else {
            //     timeId = loopFunc;
            // }
        },
        _setX: function (x, duration) {
            x        = parseInt(x, 10);
            duration = duration || this.opts.duration;

            this.currentX = x;

            if (support.cssAnimation) {
                return !userAgent.isLegacy ?
                    setStyle(this.el, {
                        transform: getTranslate(x)
                    }) :
                    this.el.style.left = x + "px";
            }
            else {
                // TODO
                this._jsAnimate(x, duration);
            }
        },
        _setWidth: function (element, width) {
            width = width || getElementWidth(element);

            element.style.width = width + "px";
        },
        _cloneNode: function () {
            if (!this.opts.loop) {
                return;
            }

        }
    };

    function initialize(selector, options, callback) {
        var regexp  = /^(.+[\#\.\s\[\*>:,]|[\[:])/,
            element, formatted;

        if (typeof selector === "string") {
            formatted = selector.substring(1, selector.length);
            element   = regexp.test(selector) ?
                            document.querySelector(selector) :
                        selector[0] === "#" ?
                            document.getElementById(formatted) :
                        selector[0] === "." ?
                            document.getElementsByClassName(formatted)[0] :
                            document.getElementsByTagName(selector)[0]
                        ;
        }
        else if (isNodeList(selector) ||
            (typeof selector === "object" && selector.length) ||
            (Array.isArray(selector) && selector.length && selector[0].nodeType)) {
            element = selector[0];
        }

        return new Flickable(element, options, callback);
    }

    return initialize;
})();

global[NS] = global[NS] || Flickable;
})(this, this.document);
