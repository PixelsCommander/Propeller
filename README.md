![Propeller.js](http://pixelscommander.com/polygon/propeller/logo.gif "JavaScript library to rotate HTML elements by mouse or touch gestures")

JavaScript library to rotate elements by mouse. Supports inertia and stepwise rotation. It is also compatible with touch devices.

[Lot of demos](http://pixelscommander.com/polygon/propeller/example/jquerygrid.html)

[Project page](http://pixelscommander.com/polygon/propeller/)

![Propeller.js](http://pixelscommander.com/polygon/propeller/example/demo.gif "JavaScript library to rotate HTML elements by mouse or touch gestures")

##Usage

####Available on NPM
    npm install Propeller

####Easy-to-use as jQuery plugin:
    $(nodeOrSelector).propeller(options);

####or zero-dependancy library 
    new Propeller(nodeOrSelector, options)

##Performance
Propeller uses requestAnimationFrame and GPU compositing for better performance.
    
##Options
- **angle** sets initial angle
- **inertia** is the most valueble option. It is a number between 0 and 1. 0 means no rotation after mouse was released. 1 means infinite rotation. For this demo we use inertia equals to 0.99.
- **speed** - initial speed of rotation. It also can be used as property in runtime.
- **minimalSpeed** - minimal speed of rotation. Works only if propeller have inertia between 0 and 1.
- **step** allows to set step in degrees for stepwise mode.
- **stepTransitionTime** enables CSS transition to move from step to step. This makes steps smooth and allows to use CSS transitions easing.
- **stepTransitionEasing** CSS easing mode for transition when in stepwise mode and stepTransitionTime is more than zero. [A bit more about easing functions](http://www.w3schools.com/cssref/css3_pr_transition-timing-function.asp)
- **onRotate** callback executed when rotated. You can easily get current angle as **this.angle** inside of callback function.
- **onStop** callback executed when stopped.
- **onDragStart** callback executed when start dragging.
- **onDragStop** callback executed when stop dragging.

##Methods
- **unbind** unbind listeners to make propeller inactive, this does not stop rotation
- **bind** bind listeners after they were unbinded
- **stop** stop rotation immidiately

##Public properties
- **angle** current propellers angle.
- **speed** current speed of rotation. Degrees per frame.

##License

MIT: http://mit-license.org/

Copyright 2014 Denis Radin aka [PixelsCommander](http://pixelscommander.com)
