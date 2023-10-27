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
    backdrop @shown="afterShown" @hide="$emit('hide')">
    <template #title>{{ $t('title', props.entity) }}</template>
    <template #body>
      <div v-if="!success">
        <p>{{ $t('instructions[0]', props.entity) }}</p>
        <p>{{ $t('instructions[1]', { markAsResolved: $t('action.markAsResolved') }) }}</p>

        <!-- placeholder for summary table -->

        <router-link class="btn btn-default more-details" :to="entityPath(dataset.projectId, dataset.name, props.entity?.__id)"
          target="_blank">
          <span class="icon-external-link-square"></span>{{ $t('action.seeMoreDetails') }}
        </router-link>
        <button type="button" class="btn btn-default">
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
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

import useRoutes from '../../composables/routes';
import useRequest from '../../composables/request';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityResolve'
});

const props = defineProps({
  state: Boolean,
  entity: Object
});

const emit = defineEmits(['hide', 'success']);

const { t } = useI18n();
const { request, awaitingResponse } = useRequest();
const { dataset } = useRequestData();
const { entityPath } = useRoutes();

const success = ref(false);

const afterShown = () => {
  success.value = false;
};

const markAsResolve = () => {
  const { entity } = props;
  const url = apiPaths.entity(dataset.projectId, dataset.name, entity.__id, { resolve: true });

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
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-resolve {
  .btn {
    margin-right: 10px;
  }
  .success {
    font-size: 30px;
    color: $color-success;
    vertical-align: -7px;
    margin-right: 10px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Parallel updates to \"{label}\"",
    "instructions": [
      "Updates were made to \"{label}\" in parallel. This means changes may be in conflict with each other, as they were authored against older data than they were eventually applied to by Central.",
      "Review the updates, make any edits you need to, and if you are sure this Entity data is correct press \"{markAsResolved}\" to clear this warning message."
    ],
    "action": {
      "seeMoreDetails": "See more details",
      "editEntity": "Edit Entity",
      "markAsResolved": "Mark as resolved"
    },
    "successMessage": "The conflict warning has been cleared from the Entity.",
    "problem": {
      "409_15": "Data has been modified by another user. Please refresh to see the updated data."
    }
  }
}
</i18n>
