# Ripple Effect

Create ripple animation when user click the element.

[Demo](https://nureon22.github.io/ripple-effect/)

## Installation

```sh
npm install @nureon22/ripple-effect
```

## Using CDN without installing

### Using HTML script tag

```html
<script src="https://cdn.jsdelivr.net/npm/@nureon22/ripple-effect/dist/main.js"></script>
```

### Using ESModule

```javascript
import RippleEffect from "https://cdn.jsdelivr.net/npm/@nureon22/ripple-effect/dist/main.esm.js";
```

### Without CDN

Copy files from [dist](https://cdn.jsdelivr.net/npm/@nureon22/ripple-effect/dist/) directory to your project.

## Usage

```javascript
RippleEffect.attachTo(targetElement, options);
```

**Note** TargetElement's CSS position must be relative or absolute.

## Supported Options

color - string\
Default "currentColor"

opacity - number\
Default 0.12.

duration - number\
Ripple effect animation duration in milliseconds. Default 400.

unbounded - boolean\
If true, the ripple effect overflow will be visible. Default false.

autoexit - boolean\
If true, the ripple effect wouldn't exit until mouseup or touchend event. Default true.

