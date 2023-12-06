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
  <div id="entity-conflict-summary" class="panel panel-hazard">
    <div class="panel-heading">
      <span class="icon-exclamation-circle"></span>
      <div>
        <h1 class="panel-title">{{ $t('title') }}</h1>
        <p>
          {{ $t('subtitle[0]') }}
          <br>
          {{ $t('subtitle[1]') }}
        </p>
      </div>
    </div>
    <div class="panel-body">
      <entity-conflict-table :uuid="entity.uuid"
        :versions="relevantToConflict"/>
      <div v-if="project.permits('entity.update')" class="panel-footer">
        <span class="icon-arrow-circle-right"></span>
        <p>
          {{ $t('footer[0]') }}
          <br>
          {{ $t('footer[1]') }}
        </p>
        <button type="button" class="btn btn-default" @click="showConfirmation">
          <span class="icon-random"></span>{{ $t('markAsResolved') }}
        </button>
      </div>
    </div>
  </div>
  <confirmation v-bind="confirm" @hide="hideConfirm" @success="markAsResolved">
    <template #body>
      <p>
        {{ $t('confirmation.body') }}
      </p>
    </template>
  </confirmation>
</template>

<script setup>
import { ref, inject, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Confirmation from '../confirmation.vue';
import EntityConflictTable from './conflict-table.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

const { request, awaitingResponse } = useRequest();
const { t } = useI18n();
// The component assumes that this data will exist when the component is
// created.
const { project, entity, entityVersions } = useRequestData();
const { alert } = inject('container');

defineOptions({
  name: 'EntityConflictSummary'
});
const emit = defineEmits(['resolve']);

const relevantToConflict = computed(() =>
  entityVersions.filter(version => version.relevantToConflict));

const confirmModalState = ref(false);
const confirm = computed(() => ({
  state: confirmModalState.value,
  title: t('confirmation.title'),
  yesText: t('confirmation.confirm'),
  noText: t('action.noCancel'),
  awaitingResponse: awaitingResponse.value
}));
const showConfirmation = () => {
  confirmModalState.value = true;
};
const hideConfirm = () => {
  confirmModalState.value = false;
};

const datasetName = inject('datasetName');
const markAsResolved = () => {
  const url = apiPaths.entity(project.id, datasetName, entity.uuid, {
    resolve: true,
    baseVersion: entity.currentVersion.version
  });
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
    .then(({ data }) => {
      hideConfirm();
      alert.success(t('conflictResolved'));
      entity.patch(() => {
        entity.conflict = data.conflict;
        entity.updatedAt = data.updatedAt;
      });
      emit('resolve');
    })
    .catch(noop);
};
</script>

<style lang="scss" scoped>
  .panel { margin-bottom: 35px; }

  .panel-heading {
    display: flex;
    padding: 15px;

    span {
      width: 30px;
      font-size: 20px;
    }

    div {
      flex: auto;
      h1 {
        margin-bottom: 2px;
        font-size: 19px;
      }
      p {
        margin-bottom: 0;
        line-height: 16px;
      }
    }

  }

  .panel-body { padding-top: 0; }

  #entity-conflict-table {
    margin-left: -15px;
    margin-right: -15px;
    &:last-child { margin-bottom: -15px; }

    // Align the leftmost text of the first column with the icon in the
    // .panel-heading.
    :deep(th:first-child) { padding-left: 15px; }
  }

  .panel-footer {
    display: flex;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;

    > span {
      width: 30px;
      font-size: 20px;
      align-self: center;
      color: #9F9F9F
    }

    p {
      flex: auto;
      margin: 0;
      max-width: unset;
      line-height: 16px;
    }

    button {
      height: 34px;
      align-self: center;
      overflow: visible;
    }
  }
</style>

<i18n lang="json5">
  {
    "en": {
      "title": "Data updates in parallel",
      "subtitle": [
        "One or more updates have been made based on data that may have been out of date.",
        "Please review this summary of the parallel updates."
      ],
      "footer": [
        "If any values need to be adjusted, you can edit the Entity data directly.",
        "If everything looks okay, click “Mark as resolved” to dismiss this warning."
      ],
      // @transifexKey component.EntityResolve.action.markAsResolved
      "markAsResolved": "Mark as resolved",
      "confirmation":{
        "title": "Is this Entity okay?",
        "body": "After you have reviewed the possibly conflicting updates and made any updates you need to, you can click on Confirm below to clear the parallel update warning.",
        "confirm": "Confirm"
      },
      "problem": {
        // @transifexKey component.EntityUpdate.problem.409_15
        "409_15": "Data has been modified by another user. Please refresh to see the updated data."
      },
      "conflictResolved": "Conflict warning resolved."
    }
  }
</i18n>
