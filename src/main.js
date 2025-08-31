const uniqueID = (() => {
    return String(Math.random()).slice(2);
})();

async function waitAnimationFrame() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(resolve);
    });
}

/**
 * @prop {HTMLElement} element
 * @prop {{ [key: string]: string }} properties
 */
function setCSSProperties(element, properties) {
    for (let key in properties) {
        element.style.setProperty(key, properties[key]);
    }
}

/**
 * @typedef RippleEffectOptions
 * @prop {string} [color] Default "currentColor"
 * @prop {number} [opacity] Default 0.12.
 * @prop {number} [duration] ripple effect animation duration in milliseconds. Default 400.
 * @prop {string} [easing] ripple effect animation timing function Default ease-in.
 * @prop {number} [exitdelay] ripple effect exit delay in milliseconds. Default 0.
 * @prop {boolean} [unbounded] If true, the ripple effect overflow will be visible. Default false,
 * @prop {boolean} [autoexit] If true, the ripple effect wouldn't exit until mouseup or touchend event. Default true.
 * @prop {boolean} [rounded] If true, the ripple effect boundary will become perfect circle.
 * @prop {boolean} [centered] If true, the ripple effect will always be triggered from center of target element instead of touched position.
 * @prop {boolean} [keydown] If true, the ripple effect will be triggered by keydown event. Default true
 * @prop {HTMLElement} [trigger] Set different trigger element, by default trigger element is same as target
 */

export default class RippleEffect {
    /** @type {(() => void)[]} */
    _destroy_tasks = [];

    /** @type {Document} **/
    document;

    /** @type {RippleEffectOptions} */
    options;

    /**
     * @param {HTMLElement} target
     * @param {?RippleEffectOptions=} [options]
     */
    constructor(target, options) {
        if (!(target instanceof HTMLElement)) {
            throw new TypeError("Argument 1 must be instanceof HTMLElement");
        }

        this.target = target;
        this.document = this.target.ownerDocument;
        this.options = {
            color: "currentColor",
            opacity: 0.12,
            duration: 400,
            unbounded: false,
            autoexit: true,
            trigger: target,
            exitdelay: 0,
            centered: false,
            rounded: false,
            easing: "ease-in",
            keydown: true,
            ...options,
        };

        this.wrapper = this.document.createElement("span");
        setCSSProperties(this.wrapper, {
            display: "block",
            position: "absolute",
            top: "0px",
            right: "0px",
            bottom: "0px",
            left: "0px",
            "border-radius": this.options.rounded ? "50%" : "inherit",
            color: this.options.color || "currentColor",
            overflow: this.options.unbounded ? "visible" : "hidden",
            "pointer-events": "none",
        });
        this.target.prepend(this.wrapper);

        this.wrapperHover = this.document.createElement("span");
        setCSSProperties(this.wrapperHover, {
            display: "block",
            position: "absolute",
            top: "0px",
            right: "0px",
            bottom: "0px",
            left: "0px",
            "background-color": "currentColor",
            opacity: "0",
            transition: `opacity ${this.options.duration / 2}ms ${this.options.easing} 0ms`,
        });
        this.wrapper.prepend(this.wrapperHover);

        let targetCSSPosition = getComputedStyle(this.target).getPropertyValue(
            "position",
        );
        if (
            targetCSSPosition != "relative" &&
            targetCSSPosition != "absolute"
        ) {
            this.target.style.position = "relative";
        }

        /**
         * @param {KeyboardEvent} event
         */
        const onKeyDown = (event) => {
            let pressing = true;
            let x, y;

            const rect = this.wrapper.getBoundingClientRect();

            x = rect.width / 2;
            y = rect.height / 2;

            if (this.options.autoexit) {
                /** @type {() => void} */
                let exit;

                this.trigger(x, y, (e) => {
                    exit = e;
                    !pressing && exit();
                });
                window.addEventListener(
                    "keyup",
                    () => {
                        pressing = false;
                        exit && exit();
                    },
                    { once: true },
                );
            } else {
                this.trigger(x, y);
            }
        };

        /**
         * @param {MouseEvent | TouchEvent} event
         */
        const onTouch = (event) => {
            const isMouseEvent = event instanceof MouseEvent;

            // prevent mouse event in touchscreen devices
            if (isMouseEvent && isTouchscreen) return;

            let pressing = true;
            let x, y;

            const rect = this.wrapper.getBoundingClientRect();

            if (this.options.centered) {
                x = rect.width / 2;
                y = rect.height / 2;
            } else if (isMouseEvent) {
                x = event.x - rect.x;
                y = event.y - rect.y;
            } else {
                x = event.targetTouches[0].clientX - rect.x;
                y = event.targetTouches[0].clientY - rect.y;
            }

            if (this.options.autoexit) {
                /** @type {() => void} */
                let exit;

                this.trigger(x, y, (e) => {
                    exit = e;
                    !pressing && exit();
                });
                window.addEventListener(
                    "mouseup",
                    () => {
                        !isTouchscreen && ((pressing = false), exit && exit());
                    },
                    { once: true },
                );
                window.addEventListener(
                    "touchend",
                    () => {
                        pressing = false;
                        exit && exit();
                    },
                    { once: true },
                );
            } else {
                this.trigger(x, y);
            }
        };

        const onHover = (event) => {
            if (event.type == "mouseenter") {
                this.wrapperHover.style.opacity = this.options.opacity + "";
            } else {
                this.wrapperHover.style.opacity = "0";
            }
        };

        const trigger = this.options.trigger ?? this.target;

        if (this.options.keydown) {
            trigger.addEventListener("keydown", onKeyDown);
        }

        trigger.addEventListener("mousedown", onTouch);
        trigger.addEventListener("touchstart", onTouch);

        trigger.addEventListener("mouseenter", onHover);
        trigger.addEventListener("mouseleave", onHover);

        this._destroy_tasks.push(() => {
            if (this.options.keydown) {
                trigger.removeEventListener("keydown", onKeyDown);
            }

            trigger.removeEventListener("mousedown", onTouch);
            trigger.removeEventListener("touchstart", onTouch);

            trigger.removeEventListener("mouseenter", onHover);
            trigger.removeEventListener("mouseleave", onHover);
        });
        this._destroy_tasks.push(() => {
            this.wrapper.remove();
        });
    }

    /**
     * Trigger a new ripple effect
     * @param {number} x
     * @param {number} y
     * @param {((exit: () => void) => void)} [exitFn] If exitFn is given, the created ripple effect will not exit even after enter animation is finished. You need to call the exit function passed to exitFn as a first argument.
     */
    async trigger(x, y, exitFn) {
        if (Number.isNaN(x))
            throw new TypeError("Argument 1 must be a valid number");
        if (Number.isNaN(y))
            throw new TypeError("Argument 2 must be a valid number");

        const rect = this.wrapper.getBoundingClientRect();
        const size =
            Math.hypot(
                Math.max(x, rect.width - x),
                Math.max(y, rect.height - y),
            ) * 2;

        const effect = this.document.createElement("span");
        setCSSProperties(effect, {
            display: "block",
            "background-color": "currentColor",
            position: "absolute",
            left: x + "px",
            top: y + "px",
            width: size + "px",
            height: size + "px",
            "border-radius": "50%",
            opacity: "0",
            transform: "translate(-50%, -50%) scale(0)",
            transition: `transform ${this.options.duration}ms ${this.options.easing} 0ms, opacity ${this.options.duration / 2}ms ${this.options.easing} 0ms`,
        });

        const exit = () => {
            effect.style.opacity = "0";

            setTimeout(() => {
                effect.remove();
            }, this.options.duration);
        };

        await waitAnimationFrame();
        this.wrapper.append(effect);

        await waitAnimationFrame();
        effect.style.opacity = this.options.opacity + "";
        effect.style.transform = "translate(-50%, -50%) scale(1)";

        window.setTimeout(() => {
            if (typeof exitFn === "function") {
                exitFn(exit);
            } else {
                exit();
            }
        }, this.options.duration + this.options.exitdelay);
    }

    destroy() {
        this._destroy_tasks.forEach((task) => task.call(this));
        delete this.target[`__${uniqueID}_RippleEffect`];
    }

    /**
     * @param {HTMLElement} target
     * @param {RippleEffectOptions} options
     * @return {RippleEffect}
     */
    static attachTo(target, options) {
        if (!(target[`__${uniqueID}_RippleEffect`] instanceof RippleEffect)) {
            return (target[`__${uniqueID}_RippleEffect`] = new RippleEffect(
                target,
                options,
            ));
        }
        return target[`__${uniqueID}_RippleEffect`];
    }
}

let isTouchscreen = false;

if (typeof window == "object") {
    Object.defineProperty(window, "RippleEffect", {
        value: RippleEffect,
        configurable: true,
        enumerable: false,
        writable: true,
    });
    window.addEventListener(
        "touchstart",
        () => {
            isTouchscreen = true;
        },
        { once: true },
    );
}
