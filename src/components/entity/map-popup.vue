<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <map-popup v-show="uuid != null" ref="popup" :back="odata != null"
    @hide="$emit('hide')" @back="$emit('back')">
    <template #title>
      <span v-tooltip.text>{{ entity.dataExists ? entity.label : '' }}</span>
    </template>
    <template #body>
      <loading :state="entity.awaitingResponse"/>
      <dl v-if="dataset.dataExists" v-show="entity.dataExists">
        <div>
          <dt>{{ $t('header.createdAt') }}</dt>
          <dd>
            <date-time :iso="entity.dataExists ? entity.createdAt : null"/>
          </dd>
        </div>
        <div v-for="property of dataset.properties" :key="property.name">
          <dl-data :name="property.name"
            :value="entity.dataExists ? entity[property.odataName] : null"/>
        </div>
      </dl>
    </template>
  </map-popup>
</template>

<script setup>
import { inject, reactive, useTemplateRef, watch } from 'vue';

import DateTime from '../date-time.vue';
import DlData from '../dl-data.vue';
import Loading from '../loading.vue';
import MapPopup from '../map/popup.vue';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityMapPopup'
});
const props = defineProps({
  uuid: String,
  odata: Object,
  awaitingResponse: Boolean
});
const emit = defineEmits(['hide', 'back']);

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const { dataset, createResource } = useRequestData();
const entity = createResource('entity', () => ({
  transformResponse: ({ data }) => reactive(data.value[0])
}));

const fetchData = () => {
  const url = apiPaths.odataEntities(projectId, datasetName, {
    $filter: `__id eq '${props.uuid}'`
  });
  return entity.request({ url }).catch(() => { emit('hide'); });
};

const popup = useTemplateRef('popup');

watch(() => props.uuid, (uuid) => {
  if (uuid != null) {
    if (props.odata == null)
      fetchData();
    else
      entity.setFromResponse({ data: { value: [props.odata] } });
  } else {
    entity.reset();
    if (popup.value != null) popup.value.resetScroll();
  }
});
</script>
