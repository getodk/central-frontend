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
  <map-popup v-show="uuid != null" id="entity-map-popup" ref="popup"
    :back="odata != null" @hide="$emit('hide')" @back="$emit('back')">
    <template #title>
      <span v-tooltip.text>
        {{ entity.dataExists ? entity.currentVersion.label : '' }}
      </span>
    </template>
    <template #body>
      <loading :state="entity.awaitingResponse"/>
      <dl v-if="dataset.dataExists" v-show="entity.dataExists">
        <div>
          <dt>{{ $t('header.createdBy') }}</dt>
          <dd v-tooltip.text>
            {{ entity.dataExists ? entity.creator.displayName : '' }}
          </dd>
        </div>
        <div>
          <dt>{{ $t('header.createdAt') }}</dt>
          <dd>
            <date-time :iso="entity.dataExists ? entity.createdAt : null"/>
          </dd>
        </div>
        <div v-for="property of dataset.properties" :key="property.name">
          <dl-data :name="property.name"
            :value="propertyData[property.odataName]"/>
        </div>
      </dl>
    </template>
    <template #footer>
      <entity-actions v-if="entity.dataExists" :uuid="entity.uuid"
        :version="entity.currentVersion.version" :conflict="entity.conflict"
        :awaiting-response="awaitingResponse" @click="handleActions"/>
    </template>
  </map-popup>
</template>

<script setup>
import { computed, inject, reactive, useTemplateRef, watch } from 'vue';

import DateTime from '../date-time.vue';
import DlData from '../dl-data.vue';
import EntityActions from './actions.vue';
import Loading from '../loading.vue';
import MapPopup from '../map/popup.vue';

import { apiPaths } from '../../util/request';
import { odataEntityToRest } from '../../util/odata';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityMapPopup'
});
const props = defineProps({
  uuid: String,
  odata: Object,
  awaitingResponse: Boolean
});
const emit = defineEmits(['hide', 'back', 'update', 'resolve', 'delete']);

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const { dataset, createResource } = useRequestData();
const entity = createResource('entity', () => ({
  transformResponse: ({ data }) => reactive(data)
}));

const fetchData = () => {
  const url = apiPaths.entity(projectId, datasetName, props.uuid);
  return entity.request({ url, extended: true }).catch(() => { emit('hide'); });
};

const popup = useTemplateRef('popup');

watch(() => props.uuid, (uuid) => {
  if (uuid != null) {
    if (props.odata == null) {
      fetchData();
    } else {
      entity.setFromResponse({
        data: odataEntityToRest(props.odata, dataset.properties)
      });
    }
  } else {
    entity.reset();
    if (popup.value != null) popup.value.resetScroll();
  }
});

const propertyData = computed(() =>
  (entity.dataExists ? entity.currentVersion.data : Object.create(null)));

const handleActions = (event) => {
  const action = event.target.closest('.btn');
  if (action == null) return;
  const { classList } = action;
  if (classList.contains('delete-button'))
    emit('delete', entity.data);
  else if (classList.contains('update-button'))
    emit('update', entity.data);
  else if (classList.contains('resolve-button'))
    emit('resolve', entity.data);
};
const updateEntity = (updatedEntity) => {
  // Preserve extended metadata before overwriting entity.data.
  const { creator } = entity;
  entity.setFromResponse({ data: updatedEntity });
  entity.creator = creator;
};
defineExpose({ updateEntity });
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-map-popup {
  @include icon-btn-group;
}
</style>
