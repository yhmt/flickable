// Flickable 0.0.1 Copyright (c) 2013 Yuya Hashimoto
// See http://github.com/yhmt/flickable
;(function (global, document, undefined) {

// document.getElementsByClassName
if (!document.getElementsByClassName) {
    document.getElementsByClassName = function (selector) {
        return document.querySelectorAll("." + selector);
    };
}

// Object.keys
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

// Array.isArray
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
if (!Array.isArray) {
    Array.isArray = function (any) {
        return Object.prototype.toString.call(any) === "[object Array]";
    };
}

var Flickable,
    NS        = "Flickable",
    div       = document.createElement("div"),
    prefixes  = ["webkit", "moz", "o", "ms"],
    stashData = {},
    support   = (function () {
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
            orientationchange   : "onorientationchange" in global,
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
                if (support.touchEvent && (isIOS || isAndroid)) {
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
            isLegacy : isAndroid && platformVersion < 4 ||
                       checkBrowser.name === "msie" && checkBrowser.version < 10
        };
    })(),
    touchStartEvent        = support.touchEvent        ? "touchstart"        : "mousedown",
    touchMoveEvent         = support.touchEvent        ? "touchmove"         : "mousemove",
    touchEndEvent          = support.touchEvent        ? "touchend"          : "mouseup",
    orientationChangeEvent = support.orientationchange ? "orientationchange" : "resize"
;

function isNodeList(any) {
    var type = Object.prototype.toString.call(any);

    return type === "[object NodeList]" || type === "[object HTMLCollection]";
}

function forEach(ary, callback) {
    var i = 0, l = ary.length;

    for (; l; i++, l--) {
        callback.call(ary[i], ary[i]);
    }
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

function DOMSelector(selector) {
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
    else {
        element = selector;
    }

    return element;
}

function hasProp(props) {
    var ret;

    if (props instanceof Array) {
        ret = false;

        forEach(props, function (prop) {
            if (div.style[prop] !== undefined) {
                ret = true;
            }
        });

        return ret;
    }
    else if (typeof props === "string") {
        return (div.style[props] !== undefined) ? true : false;
    }
}

function setStyle(element, styles) {
    var style    = element.style,
        styleAry = uupaaLooper(styles);

    function setAttr(style, prop, val) {
        var hasSaveProp = stashData[prop];

        if (hasSaveProp) {
            style[hasSaveProp] = val;
        }
        else if (style[prop] !== undefined) {
            stashData[prop] = prop;
            style[prop]     = val;
        }
        else {
            forEach(prefixes, function (prefix) {
                var prefixProp = ucFirst(prefix) + ucFirst(prop);

                if (style[prefixProp] !== undefined) {
                    stashData[prop]   = prefixProp;
                    style[prefixProp] = val;
                }
            });
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
    var ret = null;

    if (div.style[prop] !== undefined) {
        return prop;
    }
    else {
        forEach(prefixes, function (prefix) {
            var prefixProp = ucFirst(prefix) + ucFirst(prop);

            if (div.style[prefixProp] !== undefined) {
                ret = "-" + prefix + prop;
            }
        });

        return ret;
    }
}

function getChildElement(element, callback) {
    var ret   = [],
        nodes = element.childNodes;

    if (!stashData.childElement) {
        forEach(nodes, function (node) {
            if (node.nodeType === 1) {
                ret.push(node);
            }
        });

        stashData.childElement = ret;
    }

    return callback ? callback() : stashData.childElement;
}

function getFirstElementChild(element) {
    return element.firstElementChild ?
        element.firstElementChild :
        getChildElement(element, function () {
            return stashData.childElement[0];
        });
}

function getLastElementChild(element) {
    return element.lastElementChild ?
        element.lastElementChild :
        getChildElement(element, function () {
            return stashData.childElement[stashData.childElement.length - 1];
        });
}

function getChildElementCount(element) {
    return element.childElementCount ?
        element.childElementCount :
        getChildElement(element, function () {
            return stashData.childElement.length;
        });
}

function getElementWidth(element, incMargin, getType) {
    incMargin = incMargin || false;
    getType   = getType   || "offsetWidth";

    var getStyles    = element.currentStyle || global.getComputedStyle(element, null),
        // hasBoxSizing = (function () {
        //     var ret        = false,
        //         properties = [
        //             "-webkit-box-sizing",
        //             "-moz-box-sizing",
        //             "-o-box-sizing",
        //             "-ms-box-sizing",
        //             "box-sizing"
        //         ];

        //     forEach(properties, function (prop) {
        //         if (element.style[prop] !== undefined) {
        //             boxSizingVal = getStyles.prop;
        //             ret          = true;
        //         }
        //     });

        //     return ret;
        // })(),
        // boxSizingVal, margin, padding, border, width;
        margin, width;

    function styleParser(props) {
        var ret = 0;

        forEach(props, function (prop) {
            var value = getStyles[camelCase(prop)];

            if (value) {
                ret += /\d/.test(value) ? parseFloat(value.match(/\d+/)[0]) : 0;
            }
        });

        return ret;
    }

    // if (hasBoxSizing || boxSizingVal !== "content-box") {
    margin = styleParser(["margin-right", "margin-left"]);
    width  = element[getType] + margin;
    // }
    // else {
    // margin  = styleParser(["margin-right",       "margin-left"]);
    // padding = styleParser(["padding-right",      "padding-left"]);
    // border  = styleParser(["border-right-width", "border-left-width"]);
    // width   = element[getType] + margin + padding + border;
    // }

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
        return [eventNames[0], eventNames[3]];
    case "firefox":
        return [eventNames[1], eventNames[3]];
    case "opera":
        return [eventNames[2], eventNames[3]];
    case "ie":
        return [eventNames[3]];
    default:
        return [];
    }
}

function addListener(element, type, fn, capture) {
    capture = capture || false;

    return support.addEventListener ?
        element.addEventListener(type, fn, capture) :
        element.attachEvent("on" + type, fn);
}

function removeListener(element, type, fn, capture) {
    capture = capture || false;
    
    return support.removeEventListener ?
        element.removeEventListener(type, fn, capture) :
        element.detachEvent("on" + type, fn);
}

function triggerEvent(element, type, bubbles, cancelable) {
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

function camelCase(str) {
    return str.replace(/-[a-z]/ig, function (x) {
        return x[1].toUpperCase();
    });
}

Flickable = (function () {
    function Flickable(element, options, callback) {
        var _this = this, initStyle;

        this.el   = DOMSelector(element);
        this.opts = options || {};

        this.opts.setWidth      = this.opts.setWidth      || false;
        this.opts.autoPlay      = this.opts.autoPlay      || false;
        this.opts.loop          = this.opts.loop          || (this.opts.autoPlay ? true : false);
        this.opts.interval      = this.opts.interval      || 6600;
        this.opts.clearInterval = this.opts.clearInterval || this.opts.interval / 2;
        this.opts.disableTouch  = this.opts.disableTouch  || false;
        this.opts.transition    = this.opts.transition    || {
            duration       : userAgent.isLegacy ? "200ms" : "330ms",
            timingFunction : "cubic-bezier(0.23, 1, 0.32, 1)"
        };

        this.maxX         =
        this.currentX     =
        this.startPageX   = 
        this.startPageY   = 
        this.basePageX    = 
        this.directionX   = 
        this.visibleSize  = 0;

        this.timeId       = null;

        this.currentPoint            = this.opts.defaultPoint || 0;
        // console.log("@@@@@@@@@@@@@@@@@");
        // console.log("this.currentPoint: %s", this.currentPoint);
        this.beforeChildElementCount = getChildElementCount(this.el);

        this.scrolling    =
        this.moveReady    =
        this.useJsAnimate = false;

        if (support.cssAnimation && !userAgent.isLegacy) {
            initStyle = {
                transitionProperty       : getCSSVal("transform"),
                transitionDuration       : "0ms",
                transitionTimingFunction : this.opts.transition.timingFunction,
                transform                : getTranslate(0)
            };
        }
        else if (support.cssAnimation && userAgent.isLegacy) {
            initStyle = {
                position                 : "relative",
                left                     : "0px",
                transitionProperty       : "left",
                transitionDuration       : "0ms",
                transitionTimingFunction : this.opts.transition.timingFunction
            };
        }
        else {
            initStyle = {
                position : "relative",
                left     : "0px"
            };
        }

        setStyle(this.el, initStyle);

        addListener(this.el, touchStartEvent, this);
        addListener(window, orientationChangeEvent, function () {
            // TODO: orientationchange なら debounce
            //       resize なら throttle で間引く
            _this.refresh();
        });

        if (this.opts.loop) {
            this._cloneElement();
        }
        if (callback) {
            callback();
        }

        this.refresh();
    }

    Flickable.prototype = {
        handleEvent: function (event) {
            switch (event.type) {
            case touchStartEvent:
                return this._touchStart(event);
            case touchMoveEvent:
                return this._touchMove(event);
            case touchEndEvent:
                return this._touchEnd(event);
            case "click":
                return this._click(event);
            }
        },
        refresh: function () {
            if (this.opts.setWidth) {
                this._setWidth();
            }

            this.maxPoint = this.opts.maxPoint ?
                                this.opts.maxPoint :
                                getChildElementCount(this.el) - 1;
                                   // getChildElementCount(this.el);
                                   // getChildElementCount(this.el) - Math.round(this.visibleSize / 2);
                                   // childElement.length;
            this.distance = this.opts.distance ?
                                this.opts.distance :
                            this.maxPoint < 0  ?
                                0 : getElementWidth(getFirstElementChild(this.el), true)
                            ;
            // console.log("this.distance: %s", this.distance);
            // console.log("this.maxPoint: %s", this.maxPoint);
            this.maxX     = -this.distance * this.maxPoint;

            // this.visibleSize = Math.round(parentElementWidth / childElementWidth);

            // console.log("this.distance: %s", this.distance);
            // console.log("this.currentPoint: %s", this.currentPoint);
            // console.log("this.currentX: %s", this.currentX);
            // console.log("this.maxX: %s", this.maxX);
            // console.log("this.maxPoint: %s", this.maxPoint);
            // console.log("this.startPageX: %s", this.startPageX);
            // console.log("this.startPageY: %s", this.startPageY);
            // console.log("this.basePageX: %s", this.basePageX);
            // console.log("this.directionX: %s", this.directionX);
            // console.log("this.visibleSize: %s", this.visibleSize);

            this.moveToPoint();
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
            point    = point    === undefined ? this.currentPoint : point; 
            duration = duration === undefined ? this.opts.transition.duration : duration;

            var beforePoint   = this.currentPoint;
            this.currentPoint = point < 0 ?
                                    0 : 
                                point > this.maxPoint ?
                                    this.maxPoint :
                                    parseInt(point, 10)
                                ;

            if (support.cssAnimation) {
                setStyle(this.el, { transitionDuration: duration });
            }
            else {
                this.useJsAnimate = true;
            }

            // console.log("this.currentPoint: %s", this.currentPoint);
            // console.log("this.maxPoint: %s", this.maxPoint);

            // console.log("@@@@@@@@@@@@@@@@@@@@");
            // console.log(- this.currentPoint * this.distance);
            // console.log("@@@@@@@@@@@@@@@@@@@@");
            this._setX(- this.currentPoint * this.distance, duration);

            if (beforePoint !== this.currentPoint) {
                triggerEvent(document, "flpointmove", true, false);

                if (this.opts.loop) {
                    this._loop();
                }
            }
        },
        startAutoPlay: function () {
            var _this = this, interval = this.opts.interval;

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

            removeListener(this.el, touchStartEvent, this);
        },
        _touchStart: function (event) {
            if (this.opts.disableTouch) {
                return;
            }

            addListener(this.el, touchMoveEvent, this);
            addListener(document, touchEndEvent, this);

            if (!support.touchEvent) {
                event.preventDefault();
            }

            if (support.cssAnimation) {
                setStyle(this.el, { transitionDuration: "0ms" });
            }
            else {
                this.useJsAnimate = false;
            }

            this.scrolling  = true;
            this.moveReady  = false;
            this.startPageX = getPage(event, "pageX");
            this.startPageY = getPage(event, "pageY");
            this.basePageX  = this.startPageX;
            this.directionX = 0;

            triggerEvent(this.el, "fltouchstart", true, false);
        },
        _touchMove: function (event) {
            if (!this.scrolling) {
                return;
            }

            var _this = this,
                pageX = getPage(event, "pageX"),
                pageY = getPage(event, "pageY"),
                deltaX, deltaY, distX, newX, isPrevent;

            if (this.opts.autoPlay) {
                this.clearAutoPlay();
            }

            if (this.moveReady) {
                event.preventDefault();
                event.stopPropagation();

                distX = pageX - this.basePageX;
                newX  = this.currentX + distX;

                if (newX >= 0 || newX < this.maxX) {
                    newX = Math.round(this.currentX + distX / 3);
                }

                this.directionX = distX === 0 ?
                                      this.directionX :
                                  distX > 0 ?
                                      -1 : 1
                                  ;

                // isPrevent = !triggerEvent(this.el, "fltouchmove", true, true, {
                //     delta     : distX,
                //     direction : _this.directionX
                // });
                isPrevent = !triggerEvent(this.el, "fltouchmove", true, true);

                // TODO: fix
                if (isPrevent) {
                    // this._touchAfter({
                    //     moved         : false,
                    //     originalPoint : _this.currentPoint,
                    //     newPoint      : _this.currentPoint,
                    //     cancelled     : true
                    // });
                    // this._touchAfter();
                    this._setX(newX);
                }
                else {
                    this._setX(newX);
                }
            }
            else {
                deltaX = Math.abs(pageX - this.startPageX);
                deltaY = Math.abs(pageY - this.startPageY);

                if (deltaX > 5) {
                    event.preventDefault();
                    event.stopPropagation();

                    this.moveReady = true;
                    addListener(this.el, "click", this, true);
                }
                else if (deltaY > 5) {
                    this.scrolling = false;
                }
            }

            this.basePageX = pageX;

            if (this.opts.autoPlay) {
                this.startAutoPlay();
            }
        },
        _touchEnd: function (event) {
            var _this = this, newPoint;

            removeListener(this.el, touchMoveEvent, this);
            removeListener(document, touchEndEvent, this);

            if (!this.scrolling) {
                return;
            }

            newPoint = -this.currentX / this.distance;
            newPoint = this.directionX > 0 ?
                           Math.ceil(newPoint)  :
                       this.directionX < 0 ?
                           Math.floor(newPoint) :
                           Math.round(newPoint)
                       ;

            if (newPoint < 0) {
                newPoint = 0;
            }
            else if (newPoint > this.maxPoint) {
                newPoint = this.maxPoint;
            }

            // console.log("this.distance     : %s", this.distance);
            // console.log("this.currentX     : %s", this.currentX);
            // console.log("this.directionX   : %s", this.directionX);
            // console.log("this.currentPoint : %s", this.currentPoint);
            // console.log("this.maxPoint     : %s", this.maxPoint);
            // console.log("newPoint          : %s", newPoint);

            // this._touchAfter({
            //     moved         : newPoint !== _this.currentPoint,
            //     originalPoint : _this.currentPoint,
            //     newPoint      : newPoint,
            //     cancelled     : false
            // });
            this._touchAfter();

            // console.log("@@@ newPoint: %s", newPoint);
            this.moveToPoint(newPoint);
        },
        _click: function (event) {
            event.stopPropagation();
            event.preventDefault();
        },
        // _touchAfter: function (params) {
        _touchAfter: function () {
            var _this = this;

            this.scrolling = false;
            this.moveReady = false;

            setTimeout(function () {
                removeListener(_this.el, "click", _this, true);
            }, 200);

            // console.log("_touchAfter");

            // triggerEvent(this.el, "fltouchend", true, false, params);
            triggerEvent(this.el, "fltouchend", true, false);
        },
        _setX: function (x, duration) {
            x        = parseInt(x, 10);
            duration = duration || this.opts.duration;
            
            this.currentX = x;

            if (support.cssAnimation && !userAgent.isLegacy) {
                // console.log("x: %s", x);
                // console.log("######################");
                // console.log("this.el.style[stashData.transform]: %s", this.el.style[stashData.transform]);
                // console.log("getTranslate(x): %s", getTranslate(x));
                // console.log("######################");

                // this.el.style[stashData.transform] = getTranslate(x * 2);
                this.el.style[stashData.transform] = getTranslate(x);
            }
            else if (this.useJsAnimate) {
                this._animate(x, duration);
            }
            else {
                this.el.style.left = x + "px";
            }
        },
        _setWidth: function (width) {
            var childElementWidth = width || getElementWidth(getFirstElementChild(this.el), true),
                childElementCount = getChildElementCount(this.el);

            // console.log("childElementWidth: %s", childElementWidth);
            // console.log("childElementCount: %s", childElementCount);

            this.el.style.width = childElementWidth * childElementCount + "px";
        },
        _cloneElement: function () {
            var _this              = this,
                childElement       = getChildElement(this.el),
                childElementWidth  = getElementWidth(childElement[0], true),
                // parentElementWidth = getElementWidth(this.el.parentNode, false, "offsetWidth");
                parentElementWidth = this.el.parentNode.offsetWidth,
                stashCurrentPoint, i, l;

            function insertElement(start, end) {
                var firstElement = childElement[start],
                    lastElement  = childElement[childElement.length - end];

                if (lastElement && firstElement) {
                    _this.el.insertBefore(lastElement.cloneNode(true), childElement[0]);
                    _this.el.appendChild(firstElement.cloneNode(true));
                }
                // if (firstElement) {
                //     _this.el.appendChild(firstElement.cloneNode(true));
                //     // insertedCount++;
                // }
            }

            // console.log(this.el.parentNode.offsetWidth);
            // console.log(parentElementWidth);
            // console.log(childElementWidth);
            this.visibleSize  = Math.round(parentElementWidth / childElementWidth) + 1;
            this.visibleSize  = this.visibleSize < this.beforeChildElementCount ? this.visibleSize : this.beforeChildElementCount;
            // stashCurrentPoint = this.visibleSize < this.beforeChildElementCount ? this.visibleSize : this.beforeChildElementCount;
            // this.visibleSize =  Math.min(this.visibleSize, this.beforeChildElementCount);
            // this.visibleSize = Math.min(this.visibleSize > this.beforeChildElementCount);

            // console.log("this.el.parentNode: %s", this.el.parentNode);
            // console.log("parentElementWidth: %s", parentElementWidth);
            // console.log("childElementWidth: %s", childElementWidth);
            // console.log("this.visibleSize: %s", this.visibleSize);

            i = 0;
            // l = this.visibleSize;
            // l = this.visibleSize < this.beforeChildElementCount ? this.visibleSize : this.beforeChildElementCount;
            l = this.visibleSize;
            // l = Math.min(this.visibleSize, this.beforeChildElementCount);

            for (; l; i++, l--) {
                insertElement(i, l);
            }

            if (!this.opts.defaultPoint) {
                // this.currentPoint = insertedCount > this.visibleSize ? insertedCount - this.visibleSize : this.visibleSize;
                // this.currentPoint = Math.min(this.visibleSize, this.insertBeforeCount);
                // this.currentPoint = this.visibleSize;
                this.currentPoint = this.visibleSize;
                // this.currentPoint = this.visibleSize - this.beforeChildElementCount;
            }
        },
        _loop: function () {
            var _this                   = this,
                transitionEndEventNames = getTransitionEndEventNames(),
                hasTransitionEndEvents  = transitionEndEventNames.length,
                clearInterval           = this.opts.clearInterval,
                timerId;

            // console.log("this.visibleSize: %s", this.visibleSize);
            // console.log("this.beforeChildElementCount: %s", this.beforeChildElementCount);
            // console.log("this.insertBeforeCount: %s", this.insertBeforeCount);
            // console.log("this.currentPoint: %s", this.currentPoint);
            // console.log("borderSize: %s", borderSize);

            function loopFunc() {
                // console.log("this.currentPoint: %s", _this.currentPoint);

                // if (_this.currentPoint < _this.visibleSize) {
                if (_this.currentPoint < _this.visibleSize) {
                    // console.log("### back loop");

                    // console.log("this.visibleSize:             %s", _this.visibleSize);
                    // console.log("this.beforeChildElementCount: %s", _this.beforeChildElementCount);
                    // console.log("this.currentPoint:            %s", _this.currentPoint);

                    // console.log("borderSize: %s", borderSize);
                    // console.log(_this.currentPoint + _this.beforeChildElementCount);

                    // _this.moveToPoint(childElementCount - (_this.visibleSize + 1), 0);
                    // _this.moveToPoint(_this.currentPoint + _this.beforeChildElementCount, 0);

                    // _this.moveToPoint(_this.currentPoint + _this.beforeChildElementCount, 0);

                    // _this.moveToPoint(_this.currentPoint + _this.beforeChildElementCount, 0);

                    // TMP
                    _this.moveToPoint(_this.currentPoint + _this.visibleSize, 0);
                }
                // else if (_this.currentPoint > (_this.maxPoint - _this.visibleSize)) {
                else if (_this.currentPoint > (_this.maxPoint - _this.visibleSize)) {
                    // console.log("### next loop");
                    // console.log(_this.currentPoint - _this.beforeChildElementCount);

                    // _this.moveToPoint(visibleSize, 0);
                    // _this.moveToPoint(_this.currentPoint - _this.beforeChildElementCount, 0);

                    // _this.moveToPoint(_this.currentPoint - _this.beforeChildElementCount, 0);

                    // TMP
                    _this.moveToPoint(_this.currentPoint - _this.visibleSize, 0);
                    // _this.moveToPoint(_this.currentPoint - borderSize, 0);
                }
            }

            if (hasTransitionEndEvents) {
                forEach(transitionEndEventNames, function (transitionEndEvent) {
                    addListener(_this.el, transitionEndEvent, loopFunc);
                    setTimeout(function () {
                        removeListener(_this.el, transitionEndEvent, loopFunc);
                    }, clearInterval);
                });
            }
            // TODO: イミフ
            else {
                timerId = loopFunc;
                clearTimeout(function () {
                    loopFunc();
                }, clearInterval);
            }
        },
        _animate: function (x, transitionDuration) {
            var _this    = this,
                begin    = +new Date(),
                from     = parseInt(_this.el.style.left, 10),
                to       = x,
                duration = parseInt(transitionDuration, 10),
                easing   = function (time, duration) {
                    return -(time /= duration) * (time - 2);
                },
                timer    = setInterval(function () {
                    var time = new Date() - begin,
                        pos, now;

                    if (time > duration) {
                        clearInterval(timer);
                        now = to;
                    }
                    else {
                        pos = easing(time, duration);
                        now = pos * (to - from) + from;
                    }

                    _this.el.style.left = now + "px";
                }, 10)
            ;

        }
    };

    return Flickable;
})();

global[NS] = global[NS] || Flickable;
})(this, this.document);
