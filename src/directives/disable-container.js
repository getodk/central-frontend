/*
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

import vTooltip from './tooltip';


const createOverlay = () => {
  const overlay = document.createElement('div');
  overlay.classList.add('disable-container-overlay');
  overlay.setAttribute('tabindex', '0'); // make it focusable with keyboard
  vTooltip.mounted(overlay, {
    modifiers: { 'aria-describedby': true },
    value: 'Bulk operation in progress' // TODO: translation
  });

  return overlay;
};

const setInertOnChildren = (container, inert) => {
  const { children } = container;
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (!child.classList.contains('disable-container-overlay')) {
      if (inert) {
        child.setAttribute('inert', '');
      } else {
        child.removeAttribute('inert');
      }
    }
  }
};

const enableContainer = (container) => {
  const overlay = container.querySelector('.disable-container-overlay');
  if (overlay) {
    vTooltip.beforeUnmount(overlay);
    overlay.remove();
  }
  setInertOnChildren(container, false);
};

const disableContainer = (container) => {
  // eslint-disable-next-line no-param-reassign
  container.style.position = 'relative';

  const hasOverlay = !container.querySelector('.disable-container-overlay');

  if (hasOverlay) {
    const overlay = createOverlay(container);
    container.appendChild(overlay);
  }
  setInertOnChildren(container, true);
};

export default {
  mounted(el, binding) {
    if (binding.value) {
      disableContainer(el);
    }
  },

  updated(el, binding) {
    if (binding.value) {
      disableContainer(el);
    } else {
      enableContainer(el);
    }
  },

  beforeUnmount(el) {
    enableContainer(el);
  }
};
