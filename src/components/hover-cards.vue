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
  <popover
    :target="component != null ? hoverCard.anchor : null" placement="right"
    @hide="hoverCard.hide()">
    <component v-if="component != null" :is="component"/>
  </popover>
</template>

<script setup>
// This component is what reacts to changes to the hoverCard object. When
// hoverCard.show() is called, this component will send one or more requests,
// then render a popover.

import { inject, shallowRef, watch } from 'vue';

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
      // This is set after all requests have succeeded and is used to
      // determine whether the popover should be shown.
      component.value = typeConfig.component;
    })
    // If some but not all requests succeeded, we want to avoid holding onto the
    // resources that were successful.
    .catch(resetResources);
};
const hide = () => {
  resetResources();
  component.value = null;
};
watch(() => hoverCard.anchor, (newAnchor, oldAnchor) => {
  // Note the possibility that oldAnchor != null && newAnchor != null. That
  // would be pretty unusual, but it could happen if preventHide is set to
  // `true` in useHoverCard(). In that case, we need to hide the current hover
  // card before we show the new one.
  if (oldAnchor != null) hide();
  if (newAnchor != null) show();
});
</script>
