/*!
 *                          . .
 *                          | |            o
 *      ;-. ;-. ,-. ;-. ,-. | | ,-. ;-.    , ,-.
 *      | | |   | | | | |-' | | |-' |      | `-.
 *      |-' '   `-' |-' `-' ' ' `-' '   o  | `-'
 *      '           '                     -'
 *
 *      http://pixelscommander.com/polygon/propeller/example/
 *      jQuery plugin to rotate HTML elements by mouse. With inertia or without it.
 *
 *      Copyright (c) 2014 Denis Radin
 *      Licensed under the MIT license.
 *
 *      Title generated using "speed" http://patorjk.com/software/taag/#p=display&f=Shimrod&t=propeller.js
 *      Inspired by Brian Gonzalez
 */

;
(function (w) {

    var jqPluginName = 'propeller';

    var defaults = {
        angle: 0,
        speed: 0,
        inertia: 0,
        minimalInertia: 0.001,
        minimalAngleChange: 0.1,
        step: 0,
        stepTransitionTime: 0,
        stepTransitionEasing: 'linear'
    };

    var Propeller = function (element, options) {

        if (typeof element === 'string') {
            element = document.querySelectorAll(element);
        }

        if (typeof  element === 'array') {
            return Propeller.createMany(element, options);
        }

        this.element = element;
        this.active = false;
        this.transiting = false;
        this.update = this.update.bind(this);

        this.initOptions(options);
        this.initHardwareAcceleration();
        this.initTransition();
        this.addListeners();
        this.update();
    };

    Propeller.createMany = function (nodes, options) {
        var result = [];
        for (var i = 0; i < nodes.length; i++) {
            result.push(new Propeller(nodes[i], options));
        }
        return result;
    };

    var p = Propeller.prototype;

    p.addListeners = function () {
        if ('ontouchstart' in document.documentElement) {
            this.element.addEventListener('touchstart', this.onRotationStart.bind(this));
            this.element.addEventListener('touchmove', this.onRotated.bind(this));
            this.element.addEventListener('touchend', this.onRotationStop.bind(this));
            this.element.addEventListener('touchcancel', this.onRotationStop.bind(this));
            this.element.addEventListener('dragstart', this.returnFalse);
        } else {
            this.element.addEventListener('mousedown', this.onRotationStart.bind(this));
            this.element.addEventListener('mousemove', this.onRotated.bind(this));
            this.element.addEventListener('mouseup', this.onRotationStop.bind(this));
            this.element.addEventListener('mouseleave', this.onRotationStop.bind(this));
            this.element.addEventListener('dragstart', this.returnFalse);
        }

        this.element.ondragstart = this.returnFalse;
    }

    p.onRotationStart = function (event) {
        //Initializes coordinates if object was moved
        this.initCoordinates();
        this.initDrag();
        this.active = true;
    }

    p.onRotationStop = function () {
        this.active = false;
    }

    p.onRotated = function (event) {
        if (this.active === true) {
            event.stopPropagation();
            event.preventDefault();

            if (event.touches !== undefined && event.touches[0] !== undefined) {
                this.lastMouseEvent = {
                    pageX: event.touches[0].pageX,
                    pageY: event.touches[0].pageY
                }
            } else {
                this.lastMouseEvent = {
                    pageX: event.pageX,
                    pageY: event.pageY
                }
            }
        }
    }

    p.update = function () {
        //Calculating angle on requestAnimationFrame only for optimisation purposes
        if (this.lastMouseEvent !== undefined && this.active === true) {
            this.updateAngleToMouse(this.lastMouseEvent);
        }

        this.updateAngle();
        this.applySpeed();
        this.applyInertia();
        this.updateCSSRotate();

        window.requestAnimFrame(this.update);
    }

    p.updateCSSRotate = function () {
        if (Math.abs(this.lastAppliedAngle - this.angle) >= this.minimalAngleChange && this.transiting === false) {

            this.element.style[Propeller.cssPrefix + 'transform'] = 'rotate(' + this.angle + 'deg) ' + this.accelerationPostfix;
            var radians = this.angle * Math.PI / 180;

            this.lastAppliedAngle = this.angle;

            //Prevents new transition before old is completed
            this.blockTransition();

            if (this.onRotate !== undefined && typeof this.onRotate === 'function') {
                this.onRotate.bind(this)();
            }
        }
    }

    p.updateAngle = function () {
        if (this.step > 0) {
            this.angle = this.getAngleFromVirtual();
        } else {
            this.angle = this.virtualAngle;
        }
    }

    p.getAngleFromVirtual = function () {
        return Math.ceil(this.virtualAngle / this.step) * this.step;
    }

    p.differenceBetweenAngles = function (newAngle, oldAngle) {
        var a1 = newAngle * (Math.PI / 180);
        var a2 = oldAngle * (Math.PI / 180);
        var radians = Math.atan2(Math.sin(a1 - a2), Math.cos(a1 - a2));
        var degrees = radians * (180 / Math.PI);
        return Math.round(degrees * 100) / 100;
    }

    p.applySpeed = function () {
        if (this.inertia > 0 && this.speed !== 0 && this.active === false) {
            this.virtualAngle += this.speed;
        }
    }

    p.applyInertia = function () {
        if (this.inertia > 0) {
            if (Math.abs(this.speed) > this.minimalInertia) {
                this.speed = this.speed * this.inertia;
            } else {
                this.speed = 0;
            }
        }
    }

    p.updateAngleToMouse = function (event) {
        var xDiff = event.pageX - this.cx;
        var yDiff = event.pageY - this.cy;

        var mouseRadians = Math.atan2(xDiff, yDiff);
        var mouseDegrees = mouseRadians * (180 / Math.PI * -1) + 180;

        if (this.lastMouseAngle === undefined) {
            this.lastElementAngle = this.virtualAngle;
            this.lastMouseAngle = mouseDegrees;
        }

        //At this moment we have to use specific algorithm when CSS transition is enabled. Using same approach when transition is disabled lead to worse precision.
        //TODO Develop universal algorithm to support transitions and allow good precision at once
        if (this.stepTransitionTime !== defaults.stepTransitionTime) {
            this.speed = this.mouseDiff = this.differenceBetweenAngles(mouseDegrees, this.lastMouseAngle);
            this.virtualAngle = this.lastElementAngle + this.mouseDiff;
            this.lastElementAngle = this.virtualAngle;
            this.lastMouseAngle = mouseDegrees;
        } else {
            var oldAngle = this.virtualAngle;
            this.mouseDiff = mouseDegrees - this.lastMouseAngle;
            this.virtualAngle = this.lastElementAngle + this.mouseDiff;
            var newAngle = this.virtualAngle;
            this.speed = this.differenceBetweenAngles(newAngle, oldAngle);
        }
    }

    p.initCoordinates = function () {
        var elementOffset = this.getViewOffset();
        this.cx = elementOffset.x + (this.element.offsetWidth / 2);
        this.cy = elementOffset.y + (this.element.offsetHeight / 2);
    }

    p.initDrag = function () {
        this.speed = 0;
        this.lastMouseAngle = undefined;
        this.lastElementAngle = undefined;
        this.lastMouseEvent = undefined;
    }

    p.initOptions = function (options) {
        options = options || defaults;

        this.onRotate = options.onRotate || options.onrotate;

        this.step = options.step || defaults.step;
        this.stepTransitionTime = options.stepTransitionTime || defaults.stepTransitionTime;
        this.stepTransitionEasing = options.stepTransitionEasing || defaults.stepTransitionEasing;

        this.speed = options.speed || defaults.speed;
        this.inertia = options.inertia || defaults.inertia;
        this.minimalInertia = options.minimalInertia || defaults.minimalInertia;
        this.lastAppliedAngle = this.virtualAngle = this.angle = options.angle || defaults.angle;
        this.minimalAngleChange = this.step !== defaults.step ? this.step : defaults.minimalAngleChange;
    }

    p.initHardwareAcceleration = function () {
        this.accelerationPostfix = '';

        //Check for CSS3d support
        var el = document.createElement('p'),
            has3d,
            transforms = {
                'webkitTransform': '-webkit-transform',
                'OTransform': '-o-transform',
                'msTransform': '-ms-transform',
                'MozTransform': '-moz-transform',
                'transform': 'transform'
            };

        document.body.insertBefore(el, null);

        for (var t in transforms) {
            if (el.style[t] !== undefined) {
                el.style[t] = "translate3d(1px,1px,1px)";
                has3d = window.getComputedStyle(el).getPropertyValue(transforms[t]);
            }
        }

        document.body.removeChild(el);

        var supported = (has3d !== undefined && has3d.length > 0 && has3d !== "none");

        //If CSS3d is supported then ann translateZ hack to enable GPU acceleration on layer
        if (supported === true) {
            this.accelerationPostfix = 'translateZ(0)';
            this.element.style[Propeller.cssPrefix + 'transform'] = this.accelerationPostfix;

        }

    }

    p.initTransition = function () {
        if (this.stepTransitionTime !== defaults.stepTransitionTime) {
            var prop = 'all ' + this.stepTransitionTime + 'ms ' + this.stepTransitionEasing;
            this.element.style[Propeller.cssPrefix + 'transition'] = prop;
        }
    }

    p.blockTransition = function () {
        if (this.stepTransitionTime !== defaults.stepTransitionTime) {
            var self = this;
            setTimeout(function () {
                self.transiting = false;
            }, this.stepTransitionTime);
            this.transiting = true;
        }
    }

    //Calculating pageX, pageY for elements with offset parents
    p.getViewOffset = function (singleFrame) {
        var coords = { x: 0, y: 0 };
        if (this.element)
            this.addOffset(this.element, coords, this.element.ownerDocument.defaultView);

        return coords;
    }

    p.addOffset = function (node, coords, view) {
        var p = node.offsetParent;
        coords.x += node.offsetLeft - (p ? p.scrollLeft : 0);
        coords.y += node.offsetTop - (p ? p.scrollTop : 0);

        if (p) {
            if (p.nodeType == 1) {
                var parentStyle = view.getComputedStyle(p, '');
                if (parentStyle.position != 'static') {
                    coords.x += parseInt(parentStyle.borderLeftWidth);
                    coords.y += parseInt(parentStyle.borderTopWidth);

                    if (p.localName == 'TABLE') {
                        coords.x += parseInt(parentStyle.paddingLeft);
                        coords.y += parseInt(parentStyle.paddingTop);
                    }
                    else if (p.localName == 'BODY') {
                        var style = view.getComputedStyle(node, '');
                        coords.x += parseInt(style.marginLeft);
                        coords.y += parseInt(style.marginTop);
                    }
                }
                else if (p.localName == 'BODY') {
                    coords.x += parseInt(parentStyle.borderLeftWidth);
                    coords.y += parseInt(parentStyle.borderTopWidth);
                }

                var parent = node.parentNode;
                while (p != parent) {
                    coords.x -= parent.scrollLeft;
                    coords.y -= parent.scrollTop;
                    parent = parent.parentNode;
                }
                this.addOffset(p, coords, view);
            }
        }
        else {
            if (node.localName == 'BODY') {
                var style = view.getComputedStyle(node, '');
                coords.x += parseInt(style.borderLeftWidth);
                coords.y += parseInt(style.borderTopWidth);

                var htmlStyle = view.getComputedStyle(node.parentNode, '');
                coords.x -= parseInt(htmlStyle.paddingLeft);
                coords.y -= parseInt(htmlStyle.paddingTop);
            }

            if (node.scrollLeft)
                coords.x += node.scrollLeft;
            if (node.scrollTop)
                coords.y += node.scrollTop;

            var win = node.ownerDocument.defaultView;
            if (win && (win.frameElement))
                this.addOffset(win.frameElement, coords, win);
        }
    }

    p.returnFalse = function () {
        return false;
    }

    //Wrap to jQuery plugin
    if (w.$ !== undefined) {
        $.propeller = {};
        $.propeller.propellers = [];

        $.fn[jqPluginName] = function (options) {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + jqPluginName)) {
                    var propellerObj = new Propeller(this, options);
                    $.data(this, 'plugin_' + jqPluginName, propellerObj);
                    $.propeller.propellers.push(propellerObj);
                }
            });
        };
    }

    //Init CSS prefix
    //TODO CSS prefix initialization

    if (typeof(document.body.style.transform) != 'undefined') {
        Propeller.cssPrefix = '';
    } else if (typeof(document.body.style.mozTransform) != 'undefined') {
        Propeller.cssPrefix = '-moz-';
    } else if (typeof(document.body.style.webkitTransform) != 'undefined') {
        Propeller.cssPrefix = '-webkit-';
    } else if (typeof(document.body.style.msTransform) != 'undefined') {
        Propeller.cssPrefix = '-ms-';
    }

    w.Propeller = Propeller;
})(window);

window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {
            },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                    ? this
                    : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}