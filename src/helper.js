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
        boxSizingVal, margin, padding, border, width;
        // margin, width;

    function styleParser(props) {
        var ret = 0;

        forEach(props, function (prop) {
            var value = getStyles[prop];

            if (value) {
                // console.log(value);
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

function triggerEvent(element, type, bubbles, cancelable, data) {
    var event;

    function parseData() {
        if (data) {
            for (var d in data) {
                if (data.hasOwnProperty(d)) {
                    event[d] = data[d];
                }
            }
        }
    }

    if (support.createEvent) {
        event = document.createEvent("Event");
        event.initEvent(type, bubbles, cancelable);

        parseData();
        element.dispatchEvent(event);
    }
    else {
        event = document.createEventObject();

        parseData();
        element.fireEvent(type, event);
    }
}

function ucFirst(str) {
    return str[0].toUpperCase() + str.substring(1, str.length);
}
