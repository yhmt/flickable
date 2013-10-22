Flickable = (function () {
    function Flickable(element, options, callback) {
        this.el   = element;
        this.opts = options || {};

        this.opts.setWidth      = this.opts.setWidth      || true;
        this.opts.autoPlay      = this.opts.autoPlay      || false;
        this.opts.loop          = this.opts.loop          || (this.opts.autoPlay ? true : false);
        this.opts.interval      = this.opts.interval      || 6600;
        this.opts.clearInterval = this.opts.clearInterval || this.opts.interval / 2;
        this.opts.transition    = this.opts.transition    || {
            duration       : userAgent.isLegacy ? "200ms" : "330ms",
            timingFunction : "cubic-bezier(0.23, 1, 0.32, 1)"
        };

        this.maxPoint     =
        this.maxX         =
        this.currentPoint =
        this.currentX     =
        this.startPageX   = 
        this.startPageY   = 
        this.basePageX    = 
        this.directionX   = 
        this.visibleSize  = 0;

        this.timeId       = null;

        this.scrolling    =
        this.moveReady    =
        this.useJsAnimate = false;

        this.refresh();

        this._on(touchStartEvent, this, false);
        // this._on(touchMoveEvent,  this, false);
        // this._on(touchEndEvent,   this, false);
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
                                this.opts.maxPoint : getChildElementCount(this.el);
            this.distance = this.opts.distance ?
                                this.opts.distance : getElementWidth(this.el) / this.maxPoint;
            this.maxX     = -this.distance * this.maxPoint;

            // console.log(this.maxPoint);
            // console.log(this.distance);
            // console.log(this.maxX);

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
            point    = point    || this.currentPoint;
            duration = duration || this.opts.transition.duration;

            // console.log(point);
            // console.log(duration);

            var beforePoint   = this.currentPoint;
            this.currentPoint = point < 0 ?
                                    0 : 
                                point > this.maxPoint ?
                                    this.maxPoint :
                                    parseInt(point, 10)
                                ;
            // console.log(beforePoint);
            // console.log(this.currentPoint);
            if (support.cssAnimation) {
                setStyle(this.el, { transitionDuration: duration });
            }
            else {
                this.useJsAnimate = true;
            }

            this._setX(- this.currentPoint * this.distance, duration);

            if (beforePoint !== this.currentPoint) {
                console.log("beforePoint !== this.currentPoint");
                triggerEvent(this.el, "flpointmove", true, false);

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

            this._off(touchStartEvent, this);
        },
        _touchStart: function (event) {
            console.log("_touchStart");

            this._on(touchMoveEvent, this, false);
            // TODO: EventListener
            document.addEventListener(touchEndEvent, this, false);

            this.scrolling  = true;
            this.moveReady  = false;

            this.startPageX = getPage(event, "pageX");
            this.startPageY = getPage(event, "pageY");
            this.basePageX  = this.startPageX;
            this.directionX = 0;


            if (!support.touchEvent) {
                event.preventDefault();
            }

            return support.cssAnimation ?
                setStyle(this.el, { transitionDuration: "0ms" }) :
                this.useJsAnimate = false;
        },
        _touchMove: function (event) {
            // console.log("_touchMove");

            var pageX = getPage(event, "pageX"),
                pageY = getPage(event, "pageY"),
                deltaX, deltaY, distX, newX;

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

                this._setX(newX);
                this.directionX = distX === 0 ?
                                       this.directionX :
                                   distX > 0 ?
                                       -1 : 1;
            }
            else {
                deltaX = Math.abs(pageX - this.startPageX);
                deltaY = Math.abs(pageY - this.startPageY);

                if (deltaX > 5) {
                    event.preventDefault();
                    event.stopPropagation();

                    this.moveReady = true;
                    this._on("click", this, true);
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
            console.log("_touchEnd");
            var newPoint, _this = this;

            this._off(touchMoveEvent, this);
            // TODO: EventListener
            document.removeEventListener(touchEndEvent, this, false);

            if (!this.scrolling) {
                return;
            }

            newPoint = -this.currentX / this.distance;
            console.log(newPoint);
            newPoint = this.directionX > 0 ?
                           Math.ceil(newPoint)  :
                       this.directionX < 0 ?
                           Math.floor(newPoint) :
                           Math.round(newPoint)
                       ;

            console.log(newPoint);

            this.moveToPoint(newPoint);
            setTimeout(function () {
                _this._off("click", _this);
            }, 200);
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
            var _this = this, timerId,
                moveToBack        = this.currentPoint <= this.visibleSize,
                moveToNext        = this.currentPoint >= (this.maxPoint - this.visibleSize),
                clearInterval     = this.opts.clearInterval,
                childElementCount = getChildElementCount(this.el),
                transitionEndEventNames = getTransitionEndEventNames(),
                hasTransitionEndEvents  = transitionEndEventNames.length;

            function loopFunc() {
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
            // console.log("x: " + x);
            // console.log("currentX: " + this.currentX);

            if (support.cssAnimation) {
                // return !userAgent.isLegacy ?
                //     setStyle(this.el, { transform: getTranslate(x) }) :
                //     this.el.style.left = x + "px";
                if (!userAgent.isLegacy) {
                    setStyle(this.el, { transform: getTranslate(x) });
                }
                else {
                    this.el.style.left = x + "px";
                }
            }
            else {
                // TODO
                // this._jsAnimate(x, duration);
            }
        },
        _setWidth: function (width) {
            var childElementWidth = width || getElementWidth(getFirstElementChild(this.el)),
                childElementCount = getChildElementCount(this.el);

            this.el.style.width = childElementWidth * childElementCount + "px";
        },
        _cloneElement: function () {
            var _this = this,
                childElement       = getChildElement(this.el),
                childElementWidth  = getElementWidth(childElement[0]),
                parentElementWidth = getElementWidth(this.el.parentNode);

            function insertElement(start, end) {
                var firstElement = childElement[start],
                    lastElement  = childElement[childElement.length - end];

                _this.el.insertBefore(lastElement.cloneNode(true), childElement[0]);
                _this.el.appendChild(firstElement.cloneNode(true));
            }

            this.visibleSize = parseInt(parentElementWidth / childElementWidth, 10) + 1;

            return (function (i, l) {
                for (; l; i++, i--) {
                    insertElement(i, _this.visibleSize - i);
                }

                _this.currentPoint = _this.visibleSize;
            })(0, this.visibleSize);
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
        else {
            element = selector;
        }

        return new Flickable(element, options, callback);
    }

    return initialize;
})();
