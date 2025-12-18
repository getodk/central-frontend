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
      <span v-tooltip.text>{{ entity?.label }}</span>
    </template>
    <template #body>
      <loading :state="entityOData.awaitingResponse"/>
      <dl v-if="dataset.dataExists" v-show="entity != null">
        <div>
          <dt>{{ $t('header.createdBy') }}</dt>
          <dd v-tooltip.text>{{ entity?.__system?.creatorName }}</dd>
        </div>
        <div>
          <dt>{{ $t('header.createdAt') }}</dt>
          <dd>
            <date-time :iso="entity?.__system?.createdAt"/>
          </dd>
        </div>
        <div v-for="property of dataset.properties" :key="property.name">
          <dl-data :name="property.name" :value="entity?.[property.odataName]"/>
        </div>
      </dl>
    </template>
    <template #footer>
      <entity-actions v-if="entity != null" :entity="entity"
        :awaiting-response="awaitingResponse" @click="handleActions"/>
    </template>
  </map-popup>
</template>

<script setup>
import { computed, inject, reactive, useTemplateRef, watch, watchEffect } from 'vue';

import DateTime from '../date-time.vue';
import DlData from '../dl-data.vue';
import EntityActions from './actions.vue';
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
const emit = defineEmits(['hide', 'back', 'update', 'resolve', 'delete']);

const projectId = inject('projectId');
const datasetName = inject('datasetName');

const { i18n, redAlert } = inject('container');

const { dataset, createResource } = useRequestData();
const entityOData = createResource('entityOData', () => ({
  transformResponse: ({ data }) => reactive(data.value)
}));
watchEffect(() => {
  if (entityOData.dataExists && entityOData.length === 0) {
    redAlert.show(i18n.t('util.request.problem.404_1'));
    emit('hide');
  }
});

const fetchData = () => {
  const url = apiPaths.odataEntities(projectId, datasetName, {
    $filter: `__id eq '${props.uuid}'`
  });
  return entityOData.request({ url }).catch(() => { emit('hide'); });
};

const popup = useTemplateRef('popup');

watch(() => props.uuid, (uuid) => {
  if (uuid != null) {
    if (props.odata == null)
      fetchData();
    else
      entityOData.setFromResponse({ data: { value: [props.odata] } });
  } else {
    entityOData.reset();
    if (popup.value != null) popup.value.resetScroll();
  }
});

const entity = computed(() =>
  (entityOData.dataExists && entityOData.length !== 0 ? entityOData[0] : null));

const handleActions = (event) => {
  const action = event.target.closest('.btn');
  if (action == null) return;
  const { classList } = action;
  if (classList.contains('delete-button'))
    emit('delete', entity.value);
  else if (classList.contains('update-button'))
    emit('update', entity.value);
  else if (classList.contains('resolve-button'))
    emit('resolve', entity.value);
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-map-popup {
  @include icon-btn-group;
}
</style>
