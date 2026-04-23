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
  <page-section id="entity-activity">
    <template #heading>
      <span>{{ $t('common.activity') }}</span>
      <button v-if="project.dataExists && project.permits('entity.delete')"
        id="entity-activity-delete-button" type="button" class="btn btn-default"
        @click="$emit('delete')">
        <span class="icon-trash"></span>{{ $t('action.delete') }}
      </button>
    </template>
    <template #body>
      <loading :state="initiallyLoading"/>
      <template v-if="dataExists">
        <entity-conflict-summary v-if="entity.conflict != null"
          @resolve="$emit('resolve')"/>
        <div v-for="(group, i) of feed" :key="feed.length - i"
          class="feed-entry-group" v-bind="scrollData(group[0])">
          <entity-feed-entry v-for="(data, j) of group" :key="j" v-bind="data"
            @branch-data="$emit('branch-data', $event)"/>
        </div>
      </template>
    </template>
  </page-section>
</template>

<script setup>
import { computed, nextTick, ref, watch, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

import EntityConflictSummary from './conflict-summary.vue';
import EntityFeedEntry from './feed-entry.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';

import { useRequestData } from '../../request-data';
import { useScrollBehavior } from '../../scroll-behavior';

defineOptions({
  name: 'EntityActivity'
});
defineEmits(['delete', 'resolve', 'branch-data']);

// The component does not assume that this data will exist when the component is
// created.
const { project, dataset, entity, audits, entityVersions, resourceStates } = useRequestData();
const { initiallyLoading, dataExists } = resourceStates([project, dataset, entity, audits, entityVersions]);

// feed.value is an array of feed entry groups, each of which is an array of
// feed entries.
const feed = computed(() => {
  const groups = [];
  let versionIndex = entityVersions.length - 1;
  for (const audit of audits) {
    const { action } = audit;
    if (action === 'entity.update.version') {
      const { submission } = audit.details.source;
      const entityVersion = entityVersions[versionIndex];
      versionIndex -= 1;
      groups.push([{ entry: audit, submission, entityVersion }]);
    } else if (action === 'entity.create' || action === 'entity.bulk.create') {
      const group = [{ entry: audit, entityVersion: entityVersions[0] }];
      const { details } = audit;
      // this will insert a feed entry for the submission approval event
      if (details.source?.event?.action === 'submission.update')
        group.push({ entry: details.source.event });
      // this will insert a feed entry for the submission creation
      if (details.source?.submission != null) {
        group.push({
          entry: { action: 'submission.create', loggedAt: details.source.submission.createdAt },
          submission: details.source.submission
        });
      }
      groups.push(group);
    } else {
      groups.push([{ entry: audit }]);
    }
  }
  return groups;
});

// scrollTarget.value is the version number of the entity version that the page
// should scroll to.
const scrollTarget = ref(null);
const route = useRoute();
watchEffect(() => {
  const match = route.hash.match(/^#v(\d+)$/);
  scrollTarget.value = match != null ? Number.parseInt(match[1], 10) : null;
});
watch(() => audits.awaitingResponse, (awaitingResponse) => {
  // If the user takes an action that causes the feed to be refreshed, then
  // don't scroll to or highlight any feed entry.
  if (awaitingResponse) scrollTarget.value = null;
});
const scrollData = (entryData) => {
  const version = entryData.entityVersion?.version;
  return version == null
    ? {}
    : {
      'data-version': version,
      class: version === scrollTarget.value ? 'scroll-target' : null
    };
};
const scrollTo = useScrollBehavior();
watchEffect(() => {
  if (scrollTarget.value != null && dataExists.value) {
    nextTick(() => {
      scrollTo(`#entity-activity [data-version="${scrollTarget.value}"]`);
    });
  }
});
</script>

<style lang="scss">
@use 'sass:color';
@import '../../assets/scss/variables';

#entity-activity {
  margin-bottom: 35px;

  // Add space for the left/right borders of a .scroll-target.
  $scroll-target-border-width: 16px;
  padding-left: $scroll-target-border-width;
  // In more narrow viewports, 16px felt like too much padding on the right. We
  // can let the right border of the .scroll-target overflow a little into the
  // right page gutter.
  padding-right: #{$scroll-target-border-width - 7px};

  .scroll-target {
    border: $scroll-target-border-width solid #{color.change($color-action-foreground, $alpha: 0.35)};
    border-radius: 9px;
    margin-left: -$scroll-target-border-width;
    margin-right: -$scroll-target-border-width;

    .feed-entry { box-shadow: none; }
  }
}

#entity-activity-delete-button .icon-trash { color: $color-danger; }
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "delete": "Delete Entity"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "action": {
      "delete": "Objekt löschen"
    }
  },
  "es": {
    "action": {
      "delete": "Borrar entidad"
    }
  },
  "fr": {
    "action": {
      "delete": "Supprimer l'entité"
    }
  },
  "it": {
    "action": {
      "delete": "Elimina Entità"
    }
  },
  "pt": {
    "action": {
      "delete": "Excluir Entidade"
    }
  },
  "zh": {
    "action": {
      "delete": "删除实体"
    }
  },
  "zh-Hant": {
    "action": {
      "delete": "刪除實體"
    }
  }
}
</i18n>
