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
