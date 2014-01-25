/*
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

        options = options || defaults;

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

        this.step = options.step || defaults.step;
        this.stepTransitionTime = options.stepTransitionTime || defaults.stepTransitionTime;
        this.stepTransitionEasing = options.stepTransitionEasing || defaults.stepTransitionEasing;

        this.speed = options.speed || defaults.speed;
        this.inertia = options.inertia || defaults.inertia;
        this.minimalInertia = options.minimalInertia || defaults.minimalInertia;
        this.lastAppliedAngle = this.virtualAngle = this.angle = options.angle || defaults.angle;
        this.minimalAngleChange = this.step !== defaults.step ? this.step : defaults.minimalAngleChange;



        this.initHardwareAcceleration();
        this.initTransition();
        this.addListeners();
        this.update();

        /*setInterval((function () {
            console.log('Angle: ' + this.angle + ', speed: ' + this.speed);
        }).bind(this), 500);*/
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
        this.element.addEventListener('mousedown', this.onRotationStart.bind(this));
        this.element.addEventListener('mousemove', this.onRotate.bind(this));
        this.element.addEventListener('mouseup', this.onRotationStop.bind(this));
        this.element.addEventListener('mouseleave', this.onRotationStop.bind(this));
        this.element.addEventListener('dragstart', this.returnFalse);
        this.element.ondragstart = this.returnFalse;
    }

    p.returnFalse = function () {
        return false;
    }

    p.onRotationStart = function (event) {
        //Initializes coordinates if object was moved
        this.initCoordinates();
        this.active = true;
    }

    p.onRotationStop = function () {
        //this.lastAppliedAngle = this.virtualAngle = this.angle;
        this.active = false;
    }

    p.onRotate = function (event) {
        if (this.active === true) {
            var oldAngle = this.angleDiff;

            this.updateAngleToMouse(event);

            if (this.active === true) {
                var newAngle = this.angleDiff;
                this.speed = this.differenceBetweenAngles(newAngle, oldAngle);//oldAngle - newAngle;
                //console.log('newAngle: ' + newAngle + ', oldAngle:' + oldAngle + ', speed: ' + this.speed);
            }
        }
    }

    p.update = function () {
        this.updateAngle();
        this.applySpeed();
        this.applyInertia();
        this.updateCSSRotate();

        window.requestAnimFrame(this.update);
    }

    p.updateCSSRotate = function () {
        if (Math.abs(this.lastAppliedAngle - this.angle) >= this.minimalAngleChange && this.transiting === false) {
            if (this.step > 0) {
                console.log('Transiting from: ' + this.lastAppliedAngle + ' to ' + this.angle + '. Diff was: ' + this.angleDiff);
            }
            this.element.style[Propeller.cssPrefix + 'transform'] = 'rotate(' + this.angle + 'deg) translateZ(0)';
            this.lastAppliedAngle = this.angle;
            //Prevent new transition before old is completed
            this.blockTransition();
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
        //Нужно получать актуальный дифф и на него изменять
        return Math.ceil(this.virtualAngle / this.step) * this.step;
    }

    p.fixNewAngle = function (newAngle, oldAngle) {
        var aR;
        var nR = newAngle;
        rot = oldAngle || 0; // if rot undefined or 0, make 0, else rot
        aR = rot % 360;
        if ( aR < 0 ) { aR += 360; }
        if ( aR < 180 && (nR >= (aR + 180)) ) { rot -= 360; }
        if ( aR >= 180 && (nR < (aR - 180)) ) { rot += 360; }
        rot += (nR - aR);

        return rot;
    }

    p.differenceBetweenAngles = function (newAngle, oldAngle) {
        var aR;
        var nR = newAngle;
        rot = oldAngle || 0; // if rot undefined or 0, make 0, else rot
        aR = rot % 360;
        if ( aR < 0 ) { aR += 360; }
        if ( aR < 180 && (nR >= (aR + 180)) ) { rot -= 360; }
        if ( aR >= 180 && (nR < (aR - 180)) ) { rot += 360; }
        return nR - aR;
    }

    p.applySpeed = function () {
        if (this.inertia > 0 && this.speed !== 0 && this.active === false) {
            this.virtualAngle += this.speed;
        }
    }

    p.applyInertia = function () {
        if (this.inertia > 0) {
            if (Math.abs(this.speed) > 0.001) {
                this.speed = this.speed * this.inertia;
            } else {
                this.speed = 0;
            }
        }
    }

    p.updateAngleToMouse = function (event) {
        var xDiff = event.pageX - this.cx;
        var yDiff = event.pageY - this.cy;
        var radians = Math.atan2(xDiff, yDiff);
        this.mouseDegrees = radians * (180 / Math.PI * -1) + 180;


        if (this.lastMouseAngle === undefined) {
            this.lastElementAngle = this.virtualAngle;
            this.lastMouseAngle = this.mouseDegrees;
        }

        //Здесь нужно не простое умножение / деление, а кратчайшее расстояние между
        this.angleDiff = this.differenceBetweenAngles(this.mouseDegrees, this.lastMouseAngle)//degrees - this.lastMouseAngle;

        if (this.angleDiff < 0) {
            this.angleDiff = 360 + this.angleDiff;
        }

        //this.oldAngleDiff = this.angleDiff || 0;
        //this.angleDiff = this.differenceBetweenAngles(degrees, this.lastMouseAngle);
        //var newAngleDiff = this.differenceBetweenAngles(this.angleDiff, this.oldAngleDiff);

        //console.log('degrees: ' + degrees + ', lastMouseAngle: ' + this.lastMouseAngle + 'this.angleDiff: ' + this.angleDiff);

        //console.log('this.oldAngleDiff: ' + this.oldAngleDiff + ', this.angleDiff: ' + this.angleDiff + ', newAngleDiff: ' + newAngleDiff + ' , ');

        var newAngle = this.lastElementAngle + this.angleDiff;

        this.virtualAngle = newAngle;//this.virtualAngle + newAngleDiff;//this.fixNewAngle(newAngle, this.virtualAngle);
    }

    p.initCoordinates = function () {
        this.speed = 0;

        var elementOffset = this.getViewOffset();

        this.cx = elementOffset.x + (this.element.offsetWidth / 2);
        this.cy = elementOffset.y + (this.element.offsetHeight / 2);
        this.lastMouseAngle = undefined;
        this.lastElementAngle = undefined;
    }

    p.initHardwareAcceleration = function () {
        this.element.style[Propeller.cssPrefix + 'transform'] = 'translateZ(0)';
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
    Propeller.cssPrefix = '-webkit-';

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