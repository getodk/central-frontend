/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
Use the v-tooltip directive to add a tooltip to an element. The tooltip will be
shown when the user hovers over the element or focuses it.

There are a few ways to specify the text of a tooltip. In many cases, the text
will be copied from some place where it already exists in the DOM. You can
choose one of the following:

v-tooltip.text
v-tooltip.aria-describedby="someValue"
v-tooltip.aria-label
v-tooltip.sr-only
v-tooltip.no-aria="someValue"

If the text of an element may overflow and be truncated, specify v-tooltip.text.
This will show a tooltip with the text of the element, but only if the text is
truncated. The text must be inside an element that sets the text-overflow CSS
property or the -webkit-line-clamp property: either the element with the tooltip
or (more likely) an ancestor element.

If an element is disabled, it will often have a tooltip that explains why. In
this case, we will also make the explanation available to screen readers using
the aria-describedby attribute. Specify v-tooltip.aria-describedby="someValue".
Doing so will render the tooltip immediately and link to it using
aria-describedby, but will keep it hidden until hover or focus.

Some buttons and links only show an icon. In those cases, we provide text to
screen readers using the aria-label attribute. To also show that text in a
tooltip, specify v-tooltip.aria-label. Here, the text is passed to the
aria-label attribute, not directly to v-tooltip. For example:

  <button :aria-label="someValue" v-tooltip.aria-label ...>

This is different from v-tooltip.aria-describedby, to which the text is passed
directly. We do it that way with v-tooltip.aria-describedby because the
aria-describedby attribute is not independently available in the DOM: the
attribute can only link to the tooltip once the tooltip has been rendered.

Some icons and other static elements are associated with additional text.
Because aria-describedby and aria-label don't work as well with static elements,
we usually place the additional text in its own element. That element will have
the sr-only HTML class, which will hide the text off-screen while making it
available to screen readers. To show the text of the .sr-only element as a
tooltip on the first element (for example, on an icon), specify
v-tooltip.sr-only. When the user hovers over or focuses the first element, the
text of the .sr-only element will be shown in a tooltip.

In rare cases, it may be that a particular tooltip does not work within any of
the patterns above. For example, some text may be shown in a tooltip over a
static element, then also made available on a nearby interactive element using
an aria-describedby attribute. In cases like that, specify
v-tooltip.no-aria="someValue". Doing so will pass the text to v-tooltip without
connecting the text to an attribute or element available to screen readers.
v-tooltip.no-aria should only be needed in rare cases and is intended as an
escape hatch.

If a value is passed directly to v-tooltip, using either
v-tooltip.aria-describedby or v-tooltip.no-aria, it will be ignored if it is
`null` or `undefined`: a tooltip will not be shown.

In testing, use .should.textTooltip() to test v-tooltip.text. Use
.should.tooltip() to test other uses of v-tooltip. In both cases, the assertion
is asynchronous, so you must use `await`. For example:

  await component.should.have.tooltip('Some text');
*/

import { computePosition, detectOverflow, flip, inline, offset } from '@floating-ui/dom';

import { noop } from '../util/util';

const types = ['text', 'aria-describedby', 'aria-label', 'sr-only', 'no-aria'];
const placements = ['top', 'right', 'bottom', 'left'];
const tooltips = new Map();
let id = 1;

// This Floating UI middleware is needed to horizontally center a v-tooltip.text
// tooltip above or below its anchor element.
const detectTextOverflow = {
  name: 'detectTextOverflow',
  fn: async (middlewareArgs) => {
    const { placement } = middlewareArgs;
    if (!(placement === 'top' || placement === 'bottom')) return {};
    const overflow = await detectOverflow(middlewareArgs, {
      elementContext: 'reference'
    });
    return {
      // Accounting for both overflow.right and overflow.left with the thought
      // that we will likely support RTL text in the future.
      x: middlewareArgs.x -
        (overflow.right > 0 ? overflow.right / 2 : 0) +
        (overflow.left > 0 ? overflow.left / 2 : 0)
    };
  }
};

const show = (event) => {
  const tooltip = tooltips.get(event.target);
  if (!tooltip.shown) tooltip.show();
};
const hide = (event) => {
  const tooltip = tooltips.get(event.target);
  if (tooltip.shown) tooltip.hide();
};

class Tooltip {
  static maybeCreate(anchor, { modifiers, value }) {
    const type = types.find(name => modifiers[name] === true);
    if (type == null) {
      // eslint-disable-next-line no-console
      console.error('invalid tooltip', anchor);
      return null;
    }

    const tooltip = new Tooltip(anchor, type, value);
    /*
    For v-tooltip.text, we check whether the text is more than 5 characters
    rather than checking whether tooltip.text() != null because the element that
    sets text-overflow or -webkit-line-clamp might not be visible yet. In that
    case, clientWidth === 0 on that element, so tooltip.text() == null even if
    the text will be truncated once the element is visible. Rather than trying
    to watch the visibility of the element, we add event listeners if the text
    is more than 5 characters. If/when an event listener is triggered for show,
    we will evaluate then whether the text is truncated and show the tooltip if
    so. Presumably the text won't ever be truncated if it is 5 characters or
    fewer. We check textContent here rather than innerText to avoid triggering a
    reflow.

    For v-tooltip.sr-only, we always add event listeners because we can't easily
    hook into the lifecycle of the .sr-only element. If/when an event listener
    is triggered for show, we will evaluate then whether there is an .sr-only
    element and whether it has text and show the tooltip if so.

    For other tooltip types, we can know right away whether a tooltip should be
    shown: we just need to check tooltip.text().
    */
    if (type === 'text'
      ? anchor.textContent.length > 5
      : type === 'sr-only' || tooltip.text() != null) {
      tooltip.addEventListeners();
      if (type === 'aria-describedby') tooltip.render();
      tooltips.set(anchor, tooltip);
      return tooltip;
    }

    return null;
  }

  constructor(anchor, type, value) {
    this.anchor = anchor;
    // I tried subclassing based on `type`, but it didn't end up working well:
    // `type` is used in a wide variety of ways.
    this.type = type;
    this.value = value;
    this.element = null;
    this.shown = false;
  }

  _text() {
    if (this.type === 'text') {
      let closestBlock = this.anchor;
      // clientWidth === 0 if the element is inline.
      while (closestBlock.clientWidth === 0) {
        closestBlock = closestBlock.parentNode;
        // The `null` case is possible in testing, because many components are
        // not attached to the document, in which case clientWidth is also 0.
        // The document.body case shouldn't happen, but it seems like a good
        // safeguard.
        if (closestBlock == null || closestBlock === document.body) return null;
      }
      // Check whether the text is truncated.
      if (closestBlock.scrollWidth > closestBlock.clientWidth ||
        (closestBlock.scrollHeight > closestBlock.clientHeight &&
        getComputedStyle(closestBlock)['-webkit-line-clamp'] !== 'none'))
        return this.anchor.innerText;
      return null;
    }
    if (this.type === 'aria-label')
      return this.anchor.getAttribute('aria-label');
    if (this.type === 'sr-only') {
      for (let sibling = this.anchor.nextElementSibling; sibling != null;
        sibling = sibling.nextElementSibling) {
        if (sibling.classList.contains('sr-only')) return sibling.innerText;
      }
      return null;
    }
    return this.value != null ? this.value.toString() : null;
  }

  // Computes and returns the text to show for the tooltip.
  text() {
    const text = this._text();
    if (text == null) return null;
    const trim = text.trim();
    return trim !== '' ? trim : null;
  }

  addEventListeners() {
    this.anchor.addEventListener('mouseenter', show);
    this.anchor.addEventListener('mouseleave', hide);
    this.anchor.addEventListener('focus', show);
    this.anchor.addEventListener('blur', hide);
  }

  removeEventListeners() {
    this.anchor.removeEventListener('mouseenter', show);
    this.anchor.removeEventListener('mouseleave', hide);
    this.anchor.removeEventListener('focus', show);
    this.anchor.removeEventListener('blur', hide);
  }

  // Inserts the tooltip into the DOM.
  render() {
    const template = document.createElement('template');
    template.innerHTML = '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>';
    // eslint-disable-next-line prefer-destructuring
    this.element = template.content.children[0];
    this.element.id = `tooltip${id}`;
    id += 1;
    this.element.querySelector('.tooltip-inner').textContent = this.text();
    // #tooltips will exist in production, but it won't exist in all tests.
    const parent = document.getElementById('tooltips') ?? document.body;
    parent.append(this.element);
    if (this.type === 'aria-describedby')
      this.anchor.setAttribute('aria-describedby', this.element.id);
  }

  position() {
    return computePosition(this.anchor, this.element, {
      placement: 'top',
      middleware: [
        offset(9),
        this.type === 'text' ? detectTextOverflow : inline(),
        flip({ fallbackPlacements: ['bottom', 'left', 'right'] })
      ]
    })
      .then(({ x, y, placement, strategy }) => {
        const { style } = this.element;
        style.top = `${y}px`;
        style.left = `${x}px`;
        this.element.classList.remove(...placements);
        this.element.classList.add(placement);
        style.position = strategy;
      });
  }

  // Shows the tooltip if there is text to show, rendering the tooltip if it
  // isn't rendered already.
  show() {
    if (this.element == null) {
      if (this.text() == null) return;
      this.render();
    }

    this.position()
      .then(() => { this.element.classList.add('in'); })
      .catch(noop);
    this.shown = true;
  }

  // Removes the tooltip from the DOM.
  remove() {
    this.element.remove();
    this.element = null;
    if (this.type === 'aria-describedby')
      this.anchor.removeAttribute('aria-describedby');
    this.shown = false;
  }

  // Hides the tooltip, possibly removing it altogether.
  hide() {
    if (this.type !== 'aria-describedby') {
      this.remove();
    } else {
      const { classList, style } = this.element;
      classList.remove('in', ...placements);
      style.top = '';
      style.left = '';
      style.position = '';
      this.shown = false;
    }
  }

  destroy() {
    if (this.element != null) this.remove();
    this.removeEventListeners();
    tooltips.delete(this.anchor);
  }

  // Updates the Tooltip object and the DOM to reflect updates to the anchor
  // element. Doing so may entail patching or removing the tooltip element, as
  // well as patching the anchor element.
  update(value) {
    // Store the value for v-tooltip.aria-describedby and v-tooltip.no-aria. If
    // the tooltip is rendered, the value will be used immediately. Otherwise,
    // it will be used later if/when the tooltip is rendered.
    this.value = value;

    if (this.element != null) {
      const text = this.text();
      if (text != null) {
        this.element.querySelector('.tooltip-inner').textContent = text;
        if (this.shown) this.position().catch(noop);
      } else if (this.type === 'sr-only') {
        this.remove();
      } else {
        this.destroy();
      }
    }
  }
}

export default {
  mounted: Tooltip.maybeCreate,
  updated: (anchor, binding) => {
    const tooltip = tooltips.get(anchor);
    if (tooltip != null)
      tooltip.update(binding.value);
    else
      Tooltip.maybeCreate(anchor, binding);
  },
  beforeUnmount: (anchor) => {
    const tooltip = tooltips.get(anchor);
    if (tooltip != null) tooltip.destroy();
  }
};
