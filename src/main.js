const uniqueID = (() => {
    return String(Math.random()).slice(2);
})();

let isTouchscreen = false;

window.addEventListener("touchstart", () => { isTouchscreen = true; }, { once: true });


async function waitAnimationFrame() {
    return new Promise((resolve) => {
        window.requestAnimationFrame(resolve);
    });
}

/**
 * @typedef RippleEffectOptions
 * @prop {string} [color] Default "currentColor"
 * @prop {number} [opacity] Default 0.12.
 * @prop {number} [duration] ripple effect animation duration in milliseconds. Default 400.
 * @prop {boolean} [unbounded] If true, the ripple effect overflow will be visible. Default false,
 * @prop {boolean} [autoexit] If true, the ripple effect wouldn't exit until mouseup or touchend event. Default true.
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
     * @param {RippleEffectOptions} [options]
     */
    constructor(target, options) {
        if (!(target instanceof HTMLElement)) {
            throw new TypeError("Argument 1 must be instanceof HTMLElement");
        }

        this.target = target;
        this.document = this.target.ownerDocument;
        this.options = { color: "currentColor", opacity: 0.12, duration: 400, unbounded: false, autoexit: true, ...options };

        this.wrapper = this.document.createElement("span");
        this.wrapper.style.display = "block";
        this.wrapper.style.position = "absolute";
        this.wrapper.style.left = "0px";
        this.wrapper.style.top = "0px";
        this.wrapper.style.width = "100%";
        this.wrapper.style.height = "100%";
        this.wrapper.style.borderRadius = "inherit";
        this.wrapper.style.overflow = this.options.unbounded ? "visible" : "hidden";
        this.wrapper.style.pointerEvents = "none";
        this.target.prepend(this.wrapper);

        let targetCSSPosition = getComputedStyle(this.target).getPropertyValue("position");
        if (targetCSSPosition != "relative" && targetCSSPosition != "absolute") {
            this.target.style.position = "relative";
        }

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

            if (isMouseEvent) {
                x = event.x - rect.x;
                y = event.y - rect.y;
            } else {
                x = event.targetTouches[0].clientX - rect.x;
                y = event.targetTouches[0].clientY - rect.y;
            }

            let size = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2;

            if (this.options.autoexit) {
                /** @type {() => void} */
                let exit;

                this.trigger(x, y, size, (e) => { exit = e; !pressing && exit(); });
                window.addEventListener("mouseup", () => { !isTouchscreen && (pressing = false, exit && exit()); }, { once: true });
                window.addEventListener("touchend", () => { pressing = false; exit && exit(); }, { once: true });
            } else {
                this.trigger(x, y, size);
            }
        };

        this.target.addEventListener("mousedown", onTouch);
        this.target.addEventListener("touchstart", onTouch);

        this._destroy_tasks.push(() => {
            this.target.removeEventListener("mousedown", onTouch);
            this.target.removeEventListener("touchstart", onTouch);
        });
        this._destroy_tasks.push(() => {
            this.wrapper.remove();
        });
    }

    /**
     * Trigger a new ripple effect
     * @param {number} x
     * @param {number} y
     * @param {number} size
     * @param {((exit: () => void) => void)} [exitFn] If exitFn is given, the created ripple effect will not exit even after enter animation is finished. You need to call the exit function passed to exitFn as a first argument.
     */
    async trigger(x, y, size, exitFn) {
        if (Number.isNaN(x)) throw new TypeError("Argument 1 must be a valid number");
        if (Number.isNaN(y)) throw new TypeError("Argument 2 must be a valid number");
        if (Number.isNaN(size)) throw new TypeError("Argument 3 must be a valid number");

        const effect = this.document.createElement("span");
        effect.style.display = "block";
        effect.style.position = "absolute";
        effect.style.left = x + "px";
        effect.style.top = y + "px";
        effect.style.width = size + "px";
        effect.style.height = size + "px";
        effect.style.borderRadius = "50%";
        effect.style.backgroundColor = this.options.color;
        effect.style.opacity = "0";
        effect.style.transform = "translate(-50%, -50%) scale(0)";
        effect.style.transition = `transform ${this.options.duration}ms ease 0ms, opacity ${this.options.duration / 2}ms linear 0ms`;

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
        }, this.options.duration);
    }

    destroy() {
        this._destroy_tasks.forEach(task => task.call(this));
        delete this.target[`__${uniqueID}_RippleEffect`];
    }

    /**
     * @param {HTMLElement} target
     * @param {RippleEffectOptions} options
     * @return {RippleEffect}
     */
    static attachTo(target, options) {
        if (!(target[`__${uniqueID}_RippleEffect`] instanceof RippleEffect)) {
            return target[`__${uniqueID}_RippleEffect`] = new RippleEffect(target, options);
        }
        return target[`__${uniqueID}_RippleEffect`];
    }
}

if (typeof window == "object") {
    Object.defineProperty(window, "RippleEffect", { value: RippleEffect, configurable: true, enumerable: false, writable: true });
}

