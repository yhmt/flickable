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
