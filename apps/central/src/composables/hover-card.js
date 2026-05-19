/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

// useHoverCard() listens for mouse events on an element. If the user hovers
// over the element for sufficiently long, a hover card will be shown next to
// the element.

import { inject, onBeforeUnmount } from 'vue';

import useEventListener from './event-listener';
import { watchSync } from '../util/reactivity';

// Set this to `true` to prevent the hover card from being hidden on mouseleave.
// That can be useful during local development, e.g., when iterating on styles.
const preventHide = false;

export default (anchorRef, type, data) => {
  const hoverCard = inject('hoverCard');
  let timeoutId;
  useEventListener(anchorRef, 'mouseenter', () => {
    timeoutId = setTimeout(
      () => {
        hoverCard.show(anchorRef.value, type, data());
        timeoutId = null;
      },
      350
    );
  });
  const hide = (anchor = anchorRef.value) => {
    if (hoverCard.anchor === anchor) hoverCard.hide();

    if (timeoutId != null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  useEventListener(anchorRef, 'mouseleave', () => {
    if (!preventHide) hide();
  });
  // Hide the hover card if the anchor is removed or replaced.
  watchSync(anchorRef, (_, oldAnchor) => { hide(oldAnchor); });
  onBeforeUnmount(hide);
};
