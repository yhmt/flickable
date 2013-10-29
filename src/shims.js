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
