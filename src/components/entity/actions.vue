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
  <div class="btn-group">
    <button v-if="project.verbs.has('entity.delete')" type="button"
      class="delete-button btn btn-default" :aria-label="$t('action.delete')"
      v-tooltip.aria-label>
      <span class="icon-trash"></span><spinner :state="awaitingResponse"/>
    </button>
    <button v-if="project.verbs.has('entity.update')" type="button"
      class="update-button btn btn-default" :aria-label="updateLabel"
      v-tooltip.aria-label>
      <span class="icon-pencil"></span>
    </button>
    <button v-if="entity.__system.conflict" type="button"
      class="resolve-button btn btn-danger"
      :aria-label="$t('action.reviewParallelUpdates')" v-tooltip.aria-label>
      <span class="icon-random"></span>
    </button>
    <router-link v-slot="{ href }"
      :to="entityPath(project.id, datasetName, entity.__id)" custom>
      <a class="more-button btn btn-default" :href="href" target="_blank">
        <span>{{ $t('action.more') }}</span>
        <span class="icon-angle-right"></span>
      </a>
    </router-link>
  </div>
</template>

<script setup>
// This component is tested via the tests of EntityMetadataRow.

import { computed, inject } from 'vue';

import Spinner from '../spinner.vue';

import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityActions'
});
const props = defineProps({
  entity: {
    type: Object,
    required: true
  },
  awaitingResponse: Boolean
});

const datasetName = inject('datasetName');

const { i18n } = inject('container');
// The component assumes that this data will exist when the component is
// created.
const { project } = useRequestData();

const updateLabel = computed(() => i18n.t('submission.action.edit', {
  count: i18n.n(props.entity.__system.updates, 'default')
}));

const { entityPath } = useRoutes();
</script>
