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
    <td class="col-icon">
      <span v-if="showIcon" class="icon-database"></span>
    </td>
    <td class="dataset-name">
      <router-link :to="datasetPath(project.id, dataset.name)" v-tooltip.text>{{ dataset.name }}</router-link>
    </td>
    <td colspan="3"></td>
    <td class="last-entity">
      <span v-tooltip.no-aria="lastEntityTooltip">
        <template v-if="dataset.lastEntity != null">
          <router-link :to="datasetPath(project.id, dataset.name, 'entities')">
            <date-time-component :iso="dataset.lastEntity" relative="past" :tooltip="false"/>
            <span class="icon-clock-o"></span>
          </router-link>
        </template>
        <template v-else>{{ $t('entity.noEntity') }}</template>
      </span>
    </td>
    <td class="total-entities">
      <span v-tooltip.no-aria="$t('common.totalEntities')">
        <router-link :to="datasetPath(project.id, dataset.name, 'entities')">
          <span>{{ $n(dataset.entities, 'default') }}</span>
          <span class="icon-asterisk"></span>
        </router-link>
      </span>
    </td>
  </tr>
</template>

<script setup>
import { computed } from 'vue';
import { DateTime } from 'luxon';
import { useI18n } from 'vue-i18n';

import DateTimeComponent from '../date-time.vue';

import useRoutes from '../../composables/routes';
import { formatDateTime } from '../../util/date-time';

const props = defineProps({
  dataset: {
    type: Object,
    required: true
  },
  project: {
    type: Object,
    required: true
  },
  showIcon: {
    type: Boolean,
    required: true
  }
});

const { datasetPath } = useRoutes();

const { t } = useI18n();

const lastEntityTooltip = computed(() => {
  const { lastEntity } = props.dataset;
  const header = t('header.lastEntity');
  if (lastEntity == null) return header;
  const formatted = formatDateTime(DateTime.fromISO(lastEntity));
  return `${header}\n${formatted}`;
});

</script>



<style lang="scss">
@import '../../assets/scss/mixins';

.project-dataset-row {
  td {
    font-size: 16px;
    padding: 4px 0px 4px 6px;
    color: #333;

    a {
      @include text-link;
    }
  }

  .total-entities {
    text-align: right;
    padding-right: 10px;
    width: 80px;
  }

  .last-entity {
    text-align: right;
    width: 170px;
  }

  [class*='icon'] {
    margin-left: 5px;
    color: #888;
  }
}
</style>
