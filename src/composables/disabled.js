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
We disable elements in a few different ways:

  - For <button> elements, we use the attribute aria-disabled="true". This
    allows buttons to be the target of mouse and focus events, enabling us to
    add tooltips to buttons. It also means that disabled buttons will continue
    to be focusable. Neither of those would be the case if we used the
    `disabled` attribute. For more context, see this article:
    https://css-tricks.com/making-disabled-buttons-more-inclusive/
  - For similar reasons, we use aria-disabled="true" for .form-control elements,
    including <select> elements and most <input> elements.
  - For checkboxes specifically, we use the `disabled` attribute rather than
    aria-disabled. That's because it's not trivial to style checkboxes so that
    an aria-disabled checkbox looks like a checkbox with a `disabled` attribute.
    In particular, it doesn't seem easy to style the checkbox border: in Chrome
    and Firefox, the border is a different color if the checkbox has a
    `disabled` attribute. The border also changes color on hover if the checkbox
    doesn't have a `disabled` attribute, even if has an aria-disabled attribute.
    There seem to be CSS options to style the border that are more complicated,
    which we could investigate at some point. However, we actually don't add
    tooltips to <input type="checkbox"> elements, but rather to their parent
    <label> element. That means that even as we use the `disabled` attribute
    with checkboxes, we can still add tooltips to them. However, disabled
    checkboxes won't be focusable.
  - The other element for which we use the `disabled` attribute rather than
    aria-disabled is <fieldset>. We don't add tooltips to <fieldset> elements as
    a whole, and it's not clear that it would be better to allow nested form
    controls to be focusable and interactive before the <fieldset> is enabled.
  - For <a> elements, we use the `disabled` class. (It appears that
    aria-disabled is not recommended for <a> elements with an `href` attribute,
    and <a> elements also do not support the `disabled` attribute.) An <a>
    element that is a child of a .disabled element (for example, a disabled tab)
    will also be disabled.

Among these, the only elements that the browser natively disables are those with
a `disabled` attribute. This composable can be used to effectively disable
elements with aria-disabled="true" and links with the `disabled` class. For
certain events on these elements, the composable will prevent the default
behavior and stop the propagation of the event.
*/

import { onMounted, onUnmounted } from 'vue';

const preventAndStop = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

const preventDisabledClick = (event) => {
  const { target } = event;
  const disabled = target.closest('button[aria-disabled="true"], a.disabled, .disabled > a');
  if (disabled != null) preventAndStop(event);
};

const preventDisabledInput = (event) => {
  if (event.target.tagName === 'INPUT' &&
    event.target.getAttribute('aria-disabled') === 'true')
    preventAndStop(event);
};

// Prevents the menu of a <select> element from being shown if the element has
// aria-disabled="true". event.type will be either 'mousedown' or 'keydown'.
const preventDisabledSelect = (event) => {
  if (event.target.tagName === 'SELECT' &&
    event.target.getAttribute('aria-disabled') === 'true' &&
    (event.type === 'mousedown' ||
    event.key === ' ' || event.key === 'ArrowDown' || event.key === 'ArrowUp'))
    preventAndStop(event);
};

export default () => {
  onMounted(() => {
    document.body.addEventListener('click', preventDisabledClick, true);
    document.body.addEventListener('beforeinput', preventDisabledInput, true);
    document.body.addEventListener('mousedown', preventDisabledSelect, true);
    document.body.addEventListener('keydown', preventDisabledSelect, true);
  });
  onUnmounted(() => {
    document.body.removeEventListener('click', preventDisabledClick, true);
    document.body.removeEventListener('beforeinput', preventDisabledInput, true);
    document.body.removeEventListener('mousedown', preventDisabledSelect, true);
    document.body.removeEventListener('keydown', preventDisabledSelect, true);
  });
};
