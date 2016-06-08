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
        minimalSpeed: 0.001,
        minimalAngleChange: 0.1,
        step: 0,
        stepTransitionTime: 0,
        stepTransitionEasing: 'linear',
        rotateParentInstantly: false,
        touchElement: null
    };

    var Propeller = function (element, options) {
        if (typeof element === 'string') {
            element = document.querySelectorAll(element);
        }

        if (element.length > 1) {
            return Propeller.createMany(element, options);
        } else if (element.length === 1) {
            element = element[0];
        }

        this.element = element;
        this.active = false;
        this.transiting = false;
        this.update = this.update.bind(this);

        this.initCSSPrefix();
        this.initAngleGetterSetter();
        this.initOptions(options);
        this.initHardwareAcceleration();
        this.initTransition();
        this.bindHandlers();
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

    p.initAngleGetterSetter = function () {
        getterSetter(this, 'angle', function () {
            return this._angle
        }, function (value) {
            this._angle = value;
            this.virtualAngle = value;
            this.updateCSS();
        });
    }

    p.bindHandlers = function () {
        this.onRotationStart = this.onRotationStart.bind(this);
        this.onRotationStop = this.onRotationStop.bind(this);
        this.onRotated = this.onRotated.bind(this);
    }

    p.addListeners = function () {
        this.listenersInstalled = true;

        if ('ontouchstart' in document.documentElement) {
            this.touchElement.addEventListener('touchstart', this.onRotationStart);
            this.touchElement.addEventListener('touchmove', this.onRotated);
            this.touchElement.addEventListener('touchend', this.onRotationStop);
            this.touchElement.addEventListener('touchcancel', this.onRotationStop);
            this.touchElement.addEventListener('dragstart', this.returnFalse);
        } else {
            this.touchElement.addEventListener('mousedown', this.onRotationStart);
            this.touchElement.addEventListener('mousemove', this.onRotated);
            this.touchElement.addEventListener('mouseup', this.onRotationStop);
            this.touchElement.addEventListener('mouseleave', this.onRotationStop);
            this.touchElement.addEventListener('dragstart', this.returnFalse);
        }

        this.touchElement.ondragstart = this.returnFalse;
    }

    p.removeListeners = function () {
        this.listenersInstalled = false;

        if ('ontouchstart' in document.documentElement) {
            this.touchElement.removeEventListener('touchstart', this.onRotationStart);
            this.touchElement.removeEventListener('touchmove', this.onRotated);
            this.touchElement.removeEventListener('touchend', this.onRotationStop);
            this.touchElement.removeEventListener('touchcancel', this.onRotationStop);
            this.touchElement.removeEventListener('dragstart', this.returnFalse);
        } else {
            this.touchElement.removeEventListener('mousedown', this.onRotationStart);
            this.touchElement.removeEventListener('mousemove', this.onRotated);
            this.touchElement.removeEventListener('mouseup', this.onRotationStop);
            this.touchElement.removeEventListener('mouseleave', this.onRotationStop);
            this.touchElement.removeEventListener('dragstart', this.returnFalse);
        }
    }

    p.bind = function () {
        if (this.listenersInstalled !== true) {
            this.addListeners();
        }
    }

    p.unbind = function () {
        if (this.listenersInstalled === true) {
            this.removeListeners();
            this.onRotationStop();
        }
    }

    p.stop = function () {
        this.speed = 0;
        this.onRotationStop();
    }

    p.onRotationStart = function (event) {
        //Initializes coordinates if object was moved
        this.initCoordinates();
        this.initDrag();
        this.active = true;

        //Execute onDragStart callback if stopped
        if (this.onDragStart !== undefined) {
            this.onDragStart();
        }

        if (this.rotateParentInstantly === false) {
            event.stopPropagation();
        }
    }

    p.onRotationStop = function () {
        //Execute onDragStop callback if stopped
        if (this.onDragStop !== undefined && this.active === true) {
            this.onDragStop();
        }

        this.active = false;
    }

    p.onRotated = function (event) {
        if (this.active === true) {
            event.stopPropagation();
            event.preventDefault();

            if (event.targetTouches !== undefined && event.targetTouches[0] !== undefined) {
                this.lastMouseEvent = {
                    pageX: event.targetTouches[0].pageX,
                    pageY: event.targetTouches[0].pageY
                }
            } else {
                this.lastMouseEvent = {
                    pageX: event.pageX || event.clientX,
                    pageY: event.pageY || event.clientY
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

        if (Math.abs(this.lastAppliedAngle - this._angle) >= this.minimalAngleChange && this.transiting === false) {
            this.updateCSS();

            //Prevents new transition before old is completed
            this.blockTransition();

            if (this.onRotate !== undefined && typeof this.onRotate === 'function') {
                this.onRotate.bind(this)();
            }

            this.lastAppliedAngle = this._angle;

        }

        window.requestAnimFrame(this.update);
    }

    p.updateAngle = function () {
        if (this.step > 0) {
            this._angle = this.getAngleFromVirtual();
        } else {
            this._angle = this.normalizeAngle(this.virtualAngle);
        }
    }

    p.getAngleFromVirtual = function () {
        return Math.ceil(this.virtualAngle / this.step) * this.step;
    }

    p.normalizeAngle = function (angle) {
        var result = angle;
        result = result % 360;
        if (result < 0) {
            result = 360 + result;
        }
        return result;
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
            if (Math.abs(this.speed) >= this.minimalSpeed) {
                this.speed = this.speed * this.inertia;

                //Execute onStop callback if stopped
                if (this.active === false && Math.abs(this.speed) < this.minimalSpeed) {
                    if (this.onStop !== undefined) {
                        this.onStop();
                    }
                }
            } else if (this.speed !== 0) {
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
        //TODO Develop universal algorithm to support transitions and provide high precision at once
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

        this.touchElement = document.querySelectorAll(options.touchElement)[0] || this.element;

        this.onRotate = options.onRotate || options.onrotate;
        this.onStop = options.onStop || options.onstop;
        this.onDragStop = options.onDragStop || options.ondragstop;
        this.onDragStart = options.onDragStart || options.ondragstart;

        this.step = options.step || defaults.step;
        this.stepTransitionTime = options.stepTransitionTime || defaults.stepTransitionTime;
        this.stepTransitionEasing = options.stepTransitionEasing || defaults.stepTransitionEasing;

        this.angle = options.angle || defaults.angle;
        this.speed = options.speed || defaults.speed;
        this.inertia = options.inertia || defaults.inertia;
        this.minimalSpeed = options.minimalSpeed || defaults.minimalSpeed;
        this.lastAppliedAngle = this.virtualAngle = this._angle = options.angle || defaults.angle;
        this.minimalAngleChange = this.step !== defaults.step ? this.step : defaults.minimalAngleChange;
        this.rotateParentInstantly = options.rotateParentInstantly || defaults.rotateParentInstantly;
    }

    p.initCSSPrefix = function () {
        if (Propeller.cssPrefix === undefined) {
            if (typeof(document.body.style.transform) != 'undefined') {
                Propeller.cssPrefix = '';
            } else if (typeof(document.body.style.mozTransform) != 'undefined') {
                Propeller.cssPrefix = '-moz-';
            } else if (typeof(document.body.style.webkitTransform) != 'undefined') {
                Propeller.cssPrefix = '-webkit-';
            } else if (typeof(document.body.style.msTransform) != 'undefined') {
                Propeller.cssPrefix = '-ms-';
            }
        }
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
            this.updateCSS();
        }
    }

    p.initTransition = function () {
        if (this.stepTransitionTime !== defaults.stepTransitionTime) {
            var prop = 'all ' + this.stepTransitionTime + 'ms ' + this.stepTransitionEasing;
            this.element.style[Propeller.cssPrefix + 'transition'] = prop;
        }
    }

    p.updateCSS = function () {
        this.element.style[Propeller.cssPrefix + 'transform'] = 'rotate(' + this._angle + 'deg) ' + this.accelerationPostfix;
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
        var coords = {x: 0, y: 0};

        if (Propeller.IEVersion !== false && Propeller.IEVersion < 9) {
            coords.x = this.element.offsetLeft;
            coords.y = this.element.offsetTop;
            return coords;
        }

        if (this.element)
            this.addOffset(this.element, coords, 'defaultView' in document ? document.defaultView : document.parentWindow);

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

                    if (p.localName.toLowerCase() == 'table') {
                        coords.x += parseInt(parentStyle.paddingLeft);
                        coords.y += parseInt(parentStyle.paddingTop);
                    }
                    else if (p.localName.toLowerCase() == 'body') {
                        var style = view.getComputedStyle(node, '');
                        coords.x += parseInt(style.marginLeft);
                        coords.y += parseInt(style.marginTop);
                    }
                }
                else if (p.localName.toLowerCase() == 'body') {
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
            if (node.localName.toLowerCase() == 'body') {
                var style = view.getComputedStyle(node, '');
                coords.x += parseInt(style.borderLeftWidth);
                coords.y += parseInt(style.borderTopWidth);

                var htmlStyle = view.getComputedStyle(node.parentNode, '');
                coords.x += parseInt(htmlStyle.paddingLeft);
                coords.y += parseInt(htmlStyle.paddingTop);
                coords.x += parseInt(htmlStyle.marginLeft);
                coords.y += parseInt(htmlStyle.marginTop);
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

    var nav = navigator.userAgent.toLowerCase();
    Propeller.IEVersion = (nav.indexOf('msie') != -1) ? parseInt(nav.split('msie')[1]) : false;
    Propeller.deg2radians = Math.PI * 2 / 360;

    w.Propeller = Propeller;
})(window);

//RequestAnimatedFrame polyfill
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
    };
})();

//Function.bind polyfill
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

//IE addEventListener polyfill
(function (win, doc) {
    if (win.addEventListener)return;		//No need to polyfill

    function docHijack(p) {
        var old = doc[p];
        doc[p] = function (v) {
            return addListen(old(v))
        }
    }

    function addEvent(on, fn, self) {
        return (self = this).attachEvent('on' + on, function (e) {
            var e = e || win.event;
            e.preventDefault = e.preventDefault || function () {
                e.returnValue = false
            }
            e.stopPropagation = e.stopPropagation || function () {
                e.cancelBubble = true
            }
            fn.call(self, e);
        });
    }

    function addListen(obj, i) {
        if (i = obj.length)while (i--)obj[i].addEventListener = addEvent;
        else obj.addEventListener = addEvent;
        return obj;
    }

    addListen([doc, win]);
    if ('Element' in win)win.Element.prototype.addEventListener = addEvent;			//IE8
    else {		//IE < 8
        doc.attachEvent('onreadystatechange', function () {
            addListen(doc.all)
        });		//Make sure we also init at domReady
        docHijack('getElementsByTagName');
        docHijack('getElementById');
        docHijack('createElement');
        addListen(doc.all);
    }

    if(typeof module === "object" && module.exports) {
        module.exports = Propeller;
    }
})(window, document);

//IE getComputedStyle polyfill
if (!window.getComputedStyle) {
    window.getComputedStyle = function (el, pseudo) {
        this.el = el;
        this.getPropertyValue = function (prop) {
            var re = /(\-([a-z]){1})/g;
            if (prop == 'float') prop = 'styleFloat';
            if (re.test(prop)) {
                prop = prop.replace(re, function () {
                    return arguments[2].toUpperCase();
                });
            }
            return el.currentStyle[prop] ? el.currentStyle[prop] : null;
        }
        return this;
    }
}

function getterSetter(variableParent, variableName, getterFunction, setterFunction) {
    if (Object.defineProperty) {
        Object.defineProperty(variableParent, variableName, {
            get: getterFunction,
            set: setterFunction
        });
    }
    else if (document.__defineGetter__) {
        variableParent.__defineGetter__(variableName, getterFunction);
        variableParent.__defineSetter__(variableName, setterFunction);
    }
}