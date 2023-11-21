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
  <div class="entity-diff-head">
    <div v-if="entityVersion.conflict === 'hard'">
      <span class="icon-warning"></span>
      <p>
        <strong>{{ $t('common.conflict') }}&nbsp;</strong>
        <span>{{ $t('introduction', { version: entityVersion.version - 1, baseVersion: entityVersion.baseVersion }) }}</span>
        <sentence-separator/>
        <span>{{ $t('hardConflict.description') }}</span>
      </p>
    </div>
    <div v-else>
      <span class="icon-info-circle"></span>
      <p>
        <strong>{{ $t('softConflict.title') }}&nbsp;</strong>
        <span>{{ $t('introduction', { version: entityVersion.version - 1, baseVersion: entityVersion.baseVersion }) }}</span>
        <sentence-separator/>
        <span>{{ $t('softConflict.description') }}</span>
      </p>
    </div>
    <ul class="nav nav-tabs">
      <li v-for="[diff, version] of tabs" :key="diff"
        :class="{ active: modelValue === diff }" role="presentation">
        <a href="#" role="button" @click.prevent="change(diff)">
          {{ $t(`tab.${diff}`) }}
          <span class="updating">
            {{ $t('tab.updating', { version: $t('common.versionShort', { version }) }) }}
          </span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { inject } from 'vue';

import SentenceSeparator from '../../sentence-separator.vue';

defineOptions({
  name: 'EntityDiffHead'
});
const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
});
const emit = defineEmits(['update:modelValue']);

const entityVersion = inject('entityVersion');
const tabs = [
  ['baseDiff', entityVersion.baseVersion],
  ['serverDiff', entityVersion.version - 1]
];

const change = (value) => {
  if (value !== props.modelValue) emit('update:modelValue', value);
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

.entity-diff-head {
  .entity-diff.hard-conflict & { background-color: $color-danger; }
  .entity-diff.soft-conflict & { background-color: $color-warning-dark; }

  > div {
    color: #fff;
    display: flex;
  }

  p {
    line-height: 1.2;
    margin-bottom: 18px;
    margin-left: $margin-right-icon;
    max-width: none;
  }

  .icon-warning, .icon-info-circle { font-size: 16px; }
  strong { margin-right: 4px; }

  li {
    margin-bottom: 0;
    margin-right: 3px;

    a { font-weight: 600; }
    a, &.active a {
      &, &:hover, &:focus {
        border-bottom: none;
        border-top-left-radius: 3px;
        border-top-right-radius: 3px;
        color: #fff;
        padding-bottom: 5px;
        padding-top: 6px;
      }
    }
    &.active a {
      &, &:hover, &:focus { background-color: $background-color-feed-entry; }
    }
  }
  .entity-diff.hard-conflict & {
    li.active a { color: $color-danger; }
    .entity-feed-entry:hover & li:not(.active) a {
      background-color: $color-danger-lighter;
    }
  }
  .entity-diff.soft-conflict & {
    li.active a { color: $color-warning-dark; }
    .entity-feed-entry:hover & li:not(.active) a {
      background-color: $color-warning;
    }
  }

  .updating { margin-left: 2px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    // {version} and {baseVersion} are version numbers.
    "introduction": "This Submission update was applied to version {version} of this Entity, but it was created based on version {baseVersion}.",
    "hardConflict": {
      "description": "Other updates had already written to the same properties."
    },
    "softConflict": {
      // An update to an Entity that was made at the same time as another update
      "title": "Parallel Update",
      "description": "No parallel update before this one touched the same properties."
    },
    "tab": {
      // A comparison between two versions of an Entity, from the point of view
      // of the data collector (the author)
      "baseDiff": "Author’s View",
      // A comparison between two versions of an Entity, from the point of view
      // of the Central server
      "serverDiff": "Central’s View",
      // This text is shown for an update to an Entity. {version} is a short
      // version identifier, for example, "v3". It is the version that the
      // update was applied to.
      "updating": "(updating {version})"
    }
  }
}
</i18n>
