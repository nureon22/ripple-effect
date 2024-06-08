# Ripple Effect

Create ripple animation when user click the element.


## Installation
I didn't maintain npm package

Just copy 'src/main.js' file to your project.

[Preview how it look](assets/preview.webm)


## Usage

This will create new RippleEffect instance, I recommend to use attachTo function as below

```javascript
const RippleEffect = window["__RippleEffect"];
new RippleEffect(element, options);
```

or

This will not create new RippleEffect instance if element is already attached to

```javascript
const RippleEffect = window["__RippleEffect"];
RippleEffect.attachTo(element, options);
```


## Supported Options

color - string\
Default "currentColor"

opacity - number\
Default 0.12.

duration - number\
ripple effect animation duration in milliseconds. Default 400.

unbounded - boolean\
If true, the ripple effect overflow will be visible. Default false.

autoexit - boolean\
If true, the ripple effect will exits without waiting for user's mouseup or touchend event. Default 
 true