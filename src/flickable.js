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
                transitionProperty       : getCSSVal("transform"),
                transitionDuration       : "0ms",
                transitionTimingFunction : this.opts.transition.timingFunction,
                transform                : getTranslate(0)
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

                isPrevent = !triggerEvent(this.el, "fltouchmove", true, true, {
                    delta     : distX,
                    direction : _this.directionX
                });

                // TODO: fix
                if (isPrevent) {
                    // this._touchAfter({
                    //     moved         : false,
                    //     originalPoint : _this.currentPoint,
                    //     newPoint      : _this.currentPoint,
                    //     cancelled     : true
                    // });
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

            this._touchAfter({
                moved         : newPoint !== _this.currentPoint,
                originalPoint : _this.currentPoint,
                newPoint      : newPoint,
                cancelled     : false
            });

            // console.log("@@@ newPoint: %s", newPoint);
            this.moveToPoint(newPoint);
        },
        _click: function (event) {
            event.stopPropagation();
            event.preventDefault();
        },
        _touchAfter: function (params) {
            var _this = this;

            this.scrolling = false;
            this.moveReady = false;

            setTimeout(function () {
                removeListener(_this.el, "click", _this, true);
            }, 200);

            // console.log("_touchAfter");

            triggerEvent(this.el, "fltouchend", true, false, params);
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
                parentElementWidth = this.el.parentNode.offsetWidth;

            function insertElement(start, end) {
                var firstElement = childElement[start],
                    lastElement  = childElement[childElement.length - end];

                _this.el.insertBefore(lastElement.cloneNode(true), childElement[0]);
                _this.el.appendChild(firstElement.cloneNode(true));
            }

            // console.log(this.el.parentNode.offsetWidth);
            // console.log(parentElementWidth);
            // console.log(childElementWidth);
            this.visibleSize = Math.round(parentElementWidth / childElementWidth) + 1;

            // console.log("this.el.parentNode: %s", this.el.parentNode);
            // console.log("parentElementWidth: %s", parentElementWidth);
            // console.log("childElementWidth: %s", childElementWidth);
            // console.log("this.visibleSize: %s", this.visibleSize);

            return (function (i, l) {
                for (; l; i++, l--) {
                    insertElement(i, _this.visibleSize - i);
                }

                if (!_this.opts.defaultPoint) {
                    _this.currentPoint = _this.visibleSize;
                }
            })(0, this.visibleSize);
        },
        _loop: function () {
            var _this             = this,
                visibleSize       = this.visibleSize,
                moveToBack        = this.currentPoint < this.visibleSize,
                moveToNext        = this.currentPoint > (this.maxPoint - this.visibleSize),
                clearInterval     = this.opts.clearInterval,
                childElementCount = getChildElementCount(this.el),
                transitionEndEventNames = getTransitionEndEventNames(),
                hasTransitionEndEvents  = transitionEndEventNames.length,
                timerId;

            function loopFunc() {
                if (_this.currentPoint < _this.visibleSize) {
                    // console.log("### back loop");
                    // _this.moveToPoint(childElementCount - (_this.visibleSize + 1), 0);
                    _this.moveToPoint(_this.currentPoint + _this.beforeChildElementCount, 0);
                }
                else if (_this.currentPoint > (_this.maxPoint - _this.visibleSize)) {
                    // console.log("### next loop");
                    // _this.moveToPoint(visibleSize, 0);
                    _this.moveToPoint(_this.currentPoint - _this.beforeChildElementCount, 0);
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
