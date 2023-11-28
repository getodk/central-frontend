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
    backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title', entity) }}</template>
    <template #body>
      <div v-if="!success">
        <div class="modal-introduction">
          <p>{{ $t('instructions[0]', entity) }}</p>
          <p v-if="canUpdate">
            {{ $t('instructions[1]', { markAsResolved: $t('action.markAsResolved') }) }}
          </p>
        </div>

        <div v-show="tableShown" id="entity-resolve-table-container">
          <loading :state="entityVersions.awaitingResponse"/>
          <entity-conflict-table v-if="entityVersions.dataExists" ref="table"
            :uuid="entity.__id" :versions="entityVersions.data"
            link-target="_blank"/>
        </div>
        <div id="entity-resolve-table-toggle">
          <a href="#" role="button" @click.prevent="toggleTable">
            <template v-if="!tableShown">
              <span class="icon-angle-down"></span>
              <span>{{ $t('action.table.show') }}</span>
            </template>
            <template v-else>
              <span class="icon-angle-up"></span>
              <span>{{ $t('action.table.hide') }}</span>
            </template>
          </a>
        </div>

        <router-link class="btn btn-default more-details" :to="entityPath(projectId, datasetName, entity?.__id)"
          :class="{ disabled: awaitingResponse }" target="_blank">
          <span class="icon-external-link-square"></span>{{ $t('action.seeMoreDetails') }}
        </router-link>
        <template v-if="canUpdate">
          <button type="button" class="btn btn-default edit-entity" :aria-disabled="awaitingResponse" @click="$emit('hide', true)">
            <span class="icon-pencil"></span>{{ $t('action.editEntity') }}
          </button>
          <button type="button" class="btn btn-default mark-as-resolved" :aria-disabled="awaitingResponse" @click="markAsResolve">
            <span class="icon-check"></span>{{ $t('action.markAsResolved') }} <spinner :state="awaitingResponse"/>
          </button>
        </template>
      </div>
      <div v-else class="success-msg">
        <span class="icon-check-circle success"></span> {{ $t('successMessage') }}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-primary" :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import EntityConflictTable from './conflict-table.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useEntityVersions from '../../request-data/entity-versions';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';
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

// The component does not assume that this data will exist when the component is
// created.
const { project } = useRequestData();
const entityVersions = useEntityVersions();

const canUpdate = computed(() =>
  project.dataExists && project.permits('entity.update'));

// Conflict summary table
const projectId = inject('projectId');
const datasetName = inject('datasetName');
const alert = inject('alert');
const { t } = useI18n();
const requestEntityVersions = () => {
  entityVersions.request({
    url: apiPaths.entityVersions(projectId, datasetName, props.entity.__id, { relevantToConflict: true }),
    extended: true
  })
    .then(() => {
      if (entityVersions.length === 0) alert.danger(t('problem.409_15'));
    })
    .catch(noop);
};
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
  const url = apiPaths.entity(projectId, datasetName, entity.__id, { resolve: true, baseVersion: entity.__system.version });

  request.patch(
    url,
    null,
    {
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

// props.entity is changed after the user clicks the button in the table row,
// when the modal is shown. It is also changed after the user clicks the
// "Edit Entity" button in the modal, then uses EntityUpdate to update the
// entity. props.entity is changed to `null` when the modal is completely
// hidden (not just when switching to EntityUpdate).
watch(() => props.entity, (entity) => {
  if (entity != null) {
    requestEntityVersions();
  } else {
    entityVersions.reset();
    tableShown.value = false;
    success.value = false;
  }
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-resolve {
  .modal-dialog { margin-top: 15vh; }
  .modal-introduction { margin-bottom: 12px; }

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
  margin-bottom: 6px;
  margin-left: -$padding-modal-body;
  margin-right: -$padding-modal-body;
  // If the height of the modal content other than the table is no more than
  // 365px, this allows the table to push the modal to 75vh tall. After that,
  // the table container will scroll.
  max-height: max(calc(75vh - 365px), 175px);
  overflow-y: auto;
  padding-top: 3px;
}
#entity-resolve #entity-conflict-table {
  tbody tr { background-color: transparent; }
  th:first-child { padding-left: $padding-modal-body; }
}
#entity-resolve-table-toggle { margin-bottom: 15px; }
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
