/**
 * @codefactory web_component
 * componentName: Button
 * tagName: app-button
 * props: []
 * signals: []
 */

export class Button extends HTMLElement {
  static get observedAttributes() { return []; }
}
customElements.define('app-button', Button);
