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
import HoverCardForm from './hover-card/form.vue';
import HoverCardSubmission from './hover-card/submission.vue';
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
  form: {
    component: HoverCardForm,
    requests: ({ projectId, xmlFormId }) => ({
      form: { url: apiPaths.form(projectId, xmlFormId), extended: true }
    })
  },
  submission: {
    component: HoverCardSubmission,
    requests: ({ projectId, xmlFormId, instanceId }) => ({
      form: { url: apiPaths.form(projectId, xmlFormId) },
      submission: {
        url: apiPaths.odataSubmission(projectId, xmlFormId, instanceId, {
          $select: '__id,__system,meta'
        })
      }
    })
  },
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
  const componentElement = popoverRef.value.$el.children[0];
  const componentWidth = componentElement.getBoundingClientRect().width;
  // Subtracting 50 in order to provide some buffer.
  const overflowsRight = rightOfAnchor + componentWidth >
    document.documentElement.clientWidth - 50;
  placement.value = overflowsRight ? 'left' : 'right';
};
const show = () => {
  const typeConfig = types[hoverCard.type];
  if (typeConfig == null)
    throw new Error(`unknown type of hover card: '${hoverCard.type}'`);
  const requests = Object.entries(typeConfig.requests(hoverCard.data))
    .map(([resourceName, requestConfig]) => {
      const resource = resources[resourceName];
      if (resource == null)
        throw new Error(`unknown resource: '${resourceName}'`);
      return resource.request({ ...requestConfig, alert: false });
    });
  Promise.all(requests)
    .then(() => {
      component.value = typeConfig.component;
      // Wait a tick in order to render the component. We need to measure the
      // component's width before deciding where to place it.
      return nextTick().then(positionPopover);
    })
    // If some but not all requests succeeded, we want to avoid holding onto the
    // resources that were successful.
    .catch(resetResources);
};
const hide = () => {
  resetResources();
  component.value = null;
  placement.value = undefined;
};
watch(() => hoverCard.anchor, (anchor) => {
  /* If hoverCard.state is `true`, then there are two possibilities. It could be
  that hoverCard.state has changed from `false` to `true`. Or it could be that
  it was `true` already, but hoverCard.anchor has changed. (That would be pretty
  unusual, but it could happen if preventHide is set to `true` in
  useHoverCard().) But most importantly, if hoverCard.state is `true`, then we
  need to hide the current hover card before we show a new one. */
  if (hoverCard.state) hide();
  if (anchor != null) show();
});
</script>
