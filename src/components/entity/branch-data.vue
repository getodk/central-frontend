<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="entity-branch-data" :state="state" hideable size="large" backdrop
    @hide="$emit('hide')" @click="updateHighlight">
    <template #title>Offline Branch Data</template>
    <template #body>
      <table class="table">
        <thead>
          <tr>
            <th>
              <div>
                <span>Version</span>
                <button type="button" class="btn btn-link" @click="reverseOrder">
                  <span v-if="asc" class="icon-angle-down"></span>
                  <span v-else class="icon-angle-up"></span>
                </button>
              </div>
            </th>
            <th>Server base version</th>
            <th>Branch ID</th>
            <th>Trunk version</th>
            <th>Branch base version</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody v-if="entityVersions.dataExists">
          <tr v-for="version of sorted" :key="version.version"
            :class="{ highlight: highlighted.has(version.version) }"
            :data-version="version.version">
            <td>v{{ version.version }}</td>
            <td>
              <a v-if="version.baseVersion != null" href="#">
                v{{ version.baseVersion }}
              </a>
            </td>
            <td>
              <template v-if="version.branch != null">
                <a href="#">{{ version.branch.id }}</a>
                <span v-if="version.branchId == null" class="icon-info-circle" v-tooltip.no-aria="'This branch ID was inferred.'"></span>
              </template>
            </td>
            <td>
              <a v-if="version.trunkVersion != null" href="#">
                v{{ version.trunkVersion }}
              </a>
            </td>
            <td>
              <template v-if="version.branchBaseVersion != null">
                v{{ version.branchBaseVersion }}
              </template>
            </td>
            <td>
              <button type="button" class="btn btn-default" @click="view">
                <span class="icon-eye"></span>View in feed
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import Modal from '../modal.vue';

import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityBranchData'
});
const props = defineProps({
  state: Boolean,
  // The version number of the version to initially highlight
  highlight: Number
});
const emit = defineEmits(['hide']);

const { entityVersions } = useRequestData();

// The version numbers of the versions to highlight
const highlighted = reactive(new Set());
const state = computed(() => props.state);
watch(state, (newState) => {
  if (newState)
    highlighted.add(props.highlight);
  else
    highlighted.clear();
});
const updateHighlight = (event) => {
  const { target } = event;
  // We never need to update `highlighted` after a button click, and in some
  // cases, we actively don't want to do so.
  if (target.closest('button') != null) return;
  highlighted.clear();
  if (target.tagName === 'A') {
    event.preventDefault();
    const text = target.textContent.trim();
    if (text.startsWith('v')) {
      highlighted.add(Number.parseInt(text.replace('v', ''), 10));
    } else {
      for (const version of entityVersions) {
        if (version.branch?.id === text) highlighted.add(version.version);
      }
    }
  } else {
    const tr = event.target.closest('tr');
    if (tr != null) highlighted.add(Number.parseInt(tr.dataset.version, 10));
  }
};

const asc = ref(true);
const sorted = computed(() =>
  (asc.value ? entityVersions.data : entityVersions.toReversed()));
const reverseOrder = () => { asc.value = !asc.value; };
watch(state, (newState) => { if (!newState) asc.value = true; });

const router = useRouter();
const view = (event) => {
  emit('hide');
  const { version } = event.target.closest('tr').dataset;
  nextTick(() => { router.push(`#v${version}`).catch(noop); });
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-branch-data {
  .modal-body { padding: 0; }
  .modal-actions { margin: 0; }

  table {
    margin-bottom: 0;
    table-layout: fixed;
  }
  th:nth-child(3) { width: 312px; }
  td { vertical-align: middle; }

  th:first-child {
    div {
      align-items: flex-end;
      display: flex;
    }
    .btn-link {
      @include text-link;
      top: 4px;
    }
    [class^="icon-"] { margin-right: 0; }
  }

  .icon-info-circle { margin-left: $margin-right-icon; }
}
</style>
