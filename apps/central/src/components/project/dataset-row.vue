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
  <tr class="project-dataset-row">
    <td class="dataset-name">
      <dataset-link :project-id="project.id" :name="dataset.name"
        v-tooltip.text/>
    </td>
    <td class="conflicts-count">
      <span v-tooltip.no-aria="$t('common.conflicts')">
        <router-link :to="datasetPath(project.id, dataset.name, 'entities?conflict=true')">
          <span class="tag tag-danger">
            <span class="icon-warning"></span>
            {{ $n(dataset.conflicts) }}
          </span>
        </router-link>
      </span>
    </td>
    <td class="last-entity">
      <span v-tooltip.no-aria="$t('header.lastEntity')">
        <template v-if="dataset.lastEntity != null">
          <router-link :to="datasetPath(project.id, dataset.name, 'entities')">
            <span class="icon-clock-o"></span>
            <date-time-component :iso="dataset.lastEntity" :tooltip="false"/>
          </router-link>
        </template>
        <template v-else>{{ $t('entity.noEntity') }}</template>
      </span>
    </td>
    <td class="total-entities">
      <span v-tooltip.no-aria="$t('common.totalEntities')">
        <router-link :to="datasetPath(project.id, dataset.name, 'entities')">
          <span class="icon-star"></span>
          <span>{{ $n(dataset.entities, 'default') }}</span>
        </router-link>
      </span>
    </td>
  </tr>
</template>

<script setup>
import DatasetLink from '../dataset/link.vue';
import DateTimeComponent from '../date-time.vue';

import useRoutes from '../../composables/routes';

defineProps({
  dataset: {
    type: Object,
    required: true
  },
  project: {
    type: Object,
    required: true
  }
});

const { datasetPath } = useRoutes();

</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.project-dataset-row {
  td {
    padding: 4px 0px 4px 6px;
    color: $color-text-secondary;

    &.dataset-name a {
      color: $color-action-foreground;
    }

    a {
      @include text-link;
      display: inline-block;
    }
  }

  .conflicts-count, .total-entities {
    padding-right: 10px;
    width: 120px;
  }

  .last-entity {
    width: 170px;
    [class*='icon'] {
      margin-left: 0;
    }
  }

  [class*='icon'] {
    margin-left: 5px;
    color: $color-text-muted;
  }
}
</style>
