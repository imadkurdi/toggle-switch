const tmpl = document.createElement("template");
tmpl.innerHTML = `
   <style>
      :host {
         --default-block-size: 14px;
         --default-bg-off-color: white;
         --default-bg-on-color: blue;
         --default-slider-off-color: black;
         --default-slider-on-color: white;
         --default-border-color: #ccc;

         /* I want block-size to never be less than 8px */
         --actual-block-size: calc(max(var(--block-size, var(--default-block-size)), 8px));
         --space: calc(min(0.25em, calc(var(--actual-block-size) / 4)));
         --slider-size: calc(var(--actual-block-size) - 2 * var(--space));

         display: inline-block;
         border-radius: var(--actual-block-size);
         cursor: pointer;
         contain: content;
      }

      #container {
         position: relative;
         block-size: var(--actual-block-size);
         inline-size: calc(2 * var(--actual-block-size));
         border-radius: var(--actual-block-size);
         background-color: var(--bg-off-color, var(--default-bg-off-color));
         border: 1px solid  var(--border-color, var(--default-border-color));
      }

      #slider {
         position: absolute;
         block-size: var(--slider-size);
         inline-size: var(--slider-size);
         inset-block-start: var(--space);
         inset-inline-start: var(--space);
         border-radius: 50%;
         background-color: var(--slider-off-color, var(--default-slider-off-color));
      }

      #container.on-state {
         background-color: var(--bg-on-color, var(--default-bg-on-color));
      }

      #container.on-state > #slider {
         inset-inline-start: unset;
         inset-inline-end: var(--space);
         background-color: var(--slider-on-color, var(--default-slider-on-color));
      }
   </style>

   <div id="container" part="container">
      <div id="slider" part="slider" tabindex="-1"></div>
   </div>
`;

class ToggleSwitch extends HTMLElement {
   #state = false;
   #container;
   #slider;

   static get observedAttributes() { return ['disabled']; }

   constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot?.appendChild(tmpl.content.cloneNode(true));
      this.#container = this.shadowRoot.querySelector("#container");
      this.#slider = this.shadowRoot.querySelector("#slider");
   }

   connectedCallback() {
      if (!this.hasAttribute('tabindex')) this.setAttribute('tabindex', '0');
      if (!this.hasAttribute('role')) this.setAttribute('role', 'switch');
      this.setAttribute("aria-checked", this.state);

      this.addEventListener('keyup', this.#onKeyUp);
      this.addEventListener('click', this.#onClick);
      // when slider is clicked, then space-bar is pressed => the component gets focused (not the slider)
      this.#slider.addEventListener("focus", evt => this.focus());
   }
   disconnectedCallback() {
      this.removeEventListener('click', this.#onClick);
      this.removeEventListener('keyup', this.#onKeyUp);
   }

   get state() {
      return this.#state;
   }
   set state(value) {
      value = !!value; // ensure it is of boolean type
      if (this.disabled || this.#state == value) return;

      this.#state = value;
      this.setAttribute("aria-checked", value);

      this.#container.className = this.#state ? "on-state" : "";
      this.dispatchEvent(new CustomEvent("toggle-switch-changed", { bubbles: true, composed: true, detail: this.#state }));
   }

   get disabled() {
      return this.hasAttribute("disabled");
   }
   set disabled(value) {
      const isDisabled = !!value;
      if (isDisabled) this.setAttribute("disabled", "");
      else this.removeAttribute("disabled");
   }

   attributeChangedCallback(name, oldValue, newValue) {
      if (name == "disabled") {
         const hasValue = newValue !== null;
         this.setAttribute('aria-disabled', hasValue);
         if (hasValue) { // disabled
            this.blur();
            this.style.cursor = "default";
            this.style.outline = "none";
            this.style.opacity = "0.5";
         }
         else {
            this.style.cursor = "pointer";
            this.style.outline = "";
            this.style.opacity = "";
         }
      }
   }

   #onClick() {
      if (this.disabled) return;
      this.state = !this.state;
   }

   #onKeyUp(evt) {
      if (this.disabled || evt.altKey) return;
      if (evt.code == "Space") this.state = !this.state;
   }

}

customElements.define("toggle-switch", ToggleSwitch);

export default ToggleSwitch;
