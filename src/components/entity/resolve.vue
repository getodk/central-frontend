<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="entity-resolve" :state="state" :hideable="!awaitingResponse" large
    backdrop @hide="hide">
    <template #title>{{ $t('title', props.entity) }}</template>
    <template #body>
      <div v-if="!success">
        <p>{{ $t('instructions[0]', props.entity) }}</p>
        <p>{{ $t('instructions[1]', { markAsResolved: $t('action.markAsResolved') }) }}</p>

        <div v-show="tableShown" id="entity-resolve-table-container">
          <loading :state="entityVersions.awaitingResponse"/>
          <entity-conflict-table v-if="entityVersions.dataExists" ref="table"
            :uuid="entity.__id" :versions="entityVersions.data"
            link-target="_blank"/>
        </div>
        <div id="entity-resolve-table-toggle">
          <button type="button" class="btn btn-link" @click="toggleTable">
            <template v-if="!tableShown">
              <span class="icon-angle-down"></span>
              <span>{{ $t('action.table.show') }}</span>
            </template>
            <template v-else>
              <span class="icon-angle-up"></span>
              <span>{{ $t('action.table.hide') }}</span>
            </template>
          </button>
        </div>

        <router-link class="btn btn-default more-details" :to="entityPath(projectId, datasetName, props.entity?.__id)"
          :aria-disabled="awaitingResponse" target="_blank">
          <span class="icon-external-link-square"></span>{{ $t('action.seeMoreDetails') }}
        </router-link>
        <button type="button" class="btn btn-default edit-entity" :aria-disabled="awaitingResponse" @click="hide(true)">
          <span class="icon-pencil"></span>{{ $t('action.editEntity') }}
        </button>
        <button type="button" class="btn btn-default mark-as-resolved" :aria-disabled="awaitingResponse" @click="markAsResolve">
          <span class="icon-check"></span>{{ $t('action.markAsResolved') }} <spinner :state="awaitingResponse"/>
        </button>
      </div>
      <div v-else class="success-msg">
        <span class="icon-check-circle success"></span> {{ $t('successMessage') }}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-primary" :aria-disabled="awaitingResponse" @click="hide">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { inject, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import EntityConflictTable from './conflict-table.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useEntityVersions from '../../request-data/entity-versions';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

defineOptions({
  name: 'EntityResolve'
});
const props = defineProps({
  state: Boolean,
  entity: Object
});
const emit = defineEmits(['hide', 'success']);

// Conflict summary table
const entityVersions = useEntityVersions();
const projectId = inject('projectId');
const datasetName = inject('datasetName');
const alert = inject('alert');
const { t } = useI18n();
watch(() => props.entity, (entity) => {
  if (entity != null) {
    entityVersions.request({
      url: apiPaths.entityVersions(projectId, datasetName, entity.__id, { relevantToConflict: true }),
      extended: true
    })
      .then(() => {
        if (entityVersions.length === 0) alert.danger(t('problem.409_15'));
      })
      .catch(noop);
  } else {
    entityVersions.reset();
  }
});
const tableShown = ref(false);
const table = ref(null);
const toggleTable = () => {
  tableShown.value = !tableShown.value;
  if (tableShown.value) nextTick(() => { table.value.resize(); });
};

const { entityPath } = useRoutes();

// "Mark as resolved" button
const { request, awaitingResponse } = useRequest();
const success = ref(false);
const markAsResolve = () => {
  const { entity } = props;
  const url = apiPaths.entity(projectId, datasetName, entity.__id, { resolve: true });

  request.patch(
    url,
    null,
    {
      headers: { 'If-Match': `"${entity.__system.version}"` },
      problemToAlert: ({ code }) => {
        if (code === 409.15) return t('problem.409_15');
        return null;
      }
    }
  )
    .then(response => {
      // It is the responsibility of the parent component to patch the entity.
      emit('success', response.data);
      success.value = true;
    })
    .catch(noop);
};

const hide = (showUpdate = false) => {
  emit('hide', showUpdate);
  if (!showUpdate) {
    tableShown.value = false;
    success.value = false;
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-resolve {
  .btn + .btn {
    margin-left: 10px;
  }
  .success {
    font-size: 30px;
    color: $color-success;
    vertical-align: -7px;
    margin-right: 10px;
  }
}

#entity-resolve-table-container {
  margin-left: -$padding-modal-body;
  margin-right: -$padding-modal-body;
  max-height: 300px;
  overflow-y: auto;
  padding-bottom: 6px;
  padding-top: 5px;

  .loading { margin-left: $padding-modal-body; }
}
#entity-resolve-table-toggle {
  margin-bottom: 15px;

  .btn-link {
    font-size: inherit;
    padding: 0;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Parallel updates to “{label}”",
    "instructions": [
      "Updates were made to “{label}” in parallel. This means changes may be in conflict with each other, as they were authored against older data than they were eventually applied to by Central.",
      "Review the updates, make any edits you need to, and if you are sure this Entity data is correct press “Mark as resolved” to clear this warning message."
    ],
    "action": {
      "table": {
        "show": "Show summary table",
        "hide": "Hide summary table"
      },
      "seeMoreDetails": "See more details",
      "editEntity": "Edit Entity",
      "markAsResolved": "Mark as resolved"
    },
    "successMessage": "The conflict warning has been cleared from the Entity.",
    "problem": {
      // @transifexKey component.EntityUpdate.problem.409_15
      "409_15": "Data has been modified by another user. Please refresh to see the updated data."
    }
  }
}
</i18n>
