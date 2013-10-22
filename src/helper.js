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
