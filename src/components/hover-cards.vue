<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <popover ref="popoverRef"
    :target="placement != null ? hoverCard.anchor : null" :placement="placement"
    @hide="hoverCard.hide()">
    <component v-if="component != null" :is="component"/>
  </popover>
</template>

<script setup>
// This component is what reacts to changes to the hoverCard object. When
// hoverCard.show() is called, this component will send one or more requests,
// then render a popover.

import { inject, nextTick, ref, shallowRef, watch } from 'vue';

import HoverCardDataset from './hover-card/dataset.vue';
import HoverCardEntity from './hover-card/entity.vue';
import Popover from './popover.vue';

import useHoverCardResources from '../request-data/hover-card';
import { apiPaths } from '../util/request';

/*
To add a new type of hover card:

  - Create a component for the hover card.
  - Specify the requests to send for the hover card. If you need to use a new
    resource, add it to useHoverCardResources().
  - Check whether the hover card should be used in AuditRow.
*/
const types = {
  dataset: {
    component: HoverCardDataset,
    requests: ({ projectId, name }) => ({
      dataset: { url: apiPaths.dataset(projectId, name), extended: true }
    })
  },
  entity: {
    component: HoverCardEntity,
    requests: ({ projectId, dataset, uuid }) => ({
      dataset: { url: apiPaths.dataset(projectId, dataset) },
      entity: { url: apiPaths.entity(projectId, dataset, uuid) }
    })
  }
};

const resources = useHoverCardResources();
const resetResources = () => {
  for (const resource of Object.values(resources)) resource.reset();
};

const hoverCard = inject('hoverCard');
const component = shallowRef(null);
const placement = ref(undefined);

const popoverRef = ref(null);
const positionPopover = () => {
  const rightOfAnchor = hoverCard.anchor.getBoundingClientRect().right;

  const el = popoverRef.value.$el;
  el.style.display = 'block';
  const popoverWidth = el.children[0].getBoundingClientRect().width;
  el.style.display = '';

  // Subtracting 50 in order to provide some buffer.
  const overflowsRight = rightOfAnchor + popoverWidth >
    document.documentElement.clientWidth - 50;
  placement.value = overflowsRight ? 'left' : 'right';
};
const show = () => {
  const metadata = types[hoverCard.type];
  if (metadata == null)
    throw new Error(`unknown type of hover card: '${hoverCard.type}'`);
  const requests = Object.entries(metadata.requests(hoverCard.data))
    .map(([resourceName, config]) => {
      const resource = resources[resourceName];
      if (resource == null)
        throw new Error(`unknown resource: '${resourceName}'`);
      return resource.request({ ...config, alert: false });
    });
  Promise.all(requests)
    .then(() => {
      component.value = metadata.component;
      // Wait a tick in order to render the component. We need to measure the
      // component's width before deciding where to place it.
      return nextTick();
    })
    .then(positionPopover)
    // If some but not all requests succeeded, we want to avoid holding onto the
    // resources there were successful.
    .catch(resetResources);
};
const hide = () => {
  resetResources();
  component.value = null;
  placement.value = undefined;
};
watch(() => hoverCard.state, (state) => {
  if (state)
    show();
  else
    hide();
});
</script>
