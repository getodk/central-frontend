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

/*
This file exports a single function, createHoverCard(), which returns an object
that manages reactive state for the hover card. There is only ever a single
hover card shown at a time.

This hover card object is how the useHoverCard() composable communicates with
the HoverCards component. The object is included in the `container` object, but
most components will not use it directly. Most components should use the
useHoverCard() composable instead.
*/

import { readonly, shallowReactive } from 'vue';

class HoverCardData {
  #state;
  #readonlyState;

  constructor() {
    this.#state = shallowReactive({ anchor: null, type: null, data: null });
    this.#readonlyState = readonly(this.#state);
  }

  // Returns `true` if a hover card is shown or is in the process of being
  // shown; returns `false` otherwise.
  get state() { return this.#state.anchor != null; }

  // The HTMLElement that the hover card is shown next to
  get anchor() { return this.#state.anchor; }
  // The type of hover card. Different resources (e.g., a form, an entity) have
  // different hover cards.
  get type() { return this.#state.type; }
  // Additional data to pass to the hover card. Different types of hover cards
  // expect different data. For example, the hover card for a dataset expects a
  // projectId and name.
  get data() { return this.#readonlyState.data; }

  #set(anchor, type, data) {
    Object.assign(this.#state, { anchor, type, data });
  }

  show(anchor, type, data = null) { this.#set(anchor, type, data); }
  hide() { this.#set(null, null, null); }
}

export default () => new HoverCardData();
