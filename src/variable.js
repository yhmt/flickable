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
