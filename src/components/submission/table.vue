<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <table id="submission-table-metadata" class="table table-frozen">
      <thead>
        <tr>
          <th><!-- Row number --></th>
          <th v-if="!draft">{{ $t('header.submitterName') }}</th>
          <th>{{ $t('header.submissionDate') }}</th>
          <th v-if="!draft">{{ $t('header.stateAndActions') }}</th>
        </tr>
      </thead>
      <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events -->
      <tbody ref="metadataBody"
        :class="`submission-table-actions-trigger-${actionsTrigger}`"
        @mousemove="setActionsTrigger('hover')"
        @focusin="setActionsTrigger('focus')" @click="review">
        <template v-if="odata.dataExists">
          <submission-metadata-row v-for="(submission, index) in odata.value"
            :key="submission.__id" :project-id="projectId"
            :xml-form-id="xmlFormId" :draft="draft" :submission="submission"
            :row-number="odata.originalCount - index" :can-update="canUpdate"
            :data-index="index"/>
        </template>
      </tbody>
    </table>
    <div class="table-container">
      <table id="submission-table-data" class="table">
        <thead>
          <tr v-if="fields != null">
            <!-- Adding a title attribute in case the column header is so long
            that it is truncated. -->
            <th v-for="field of fields" :key="field.path" :title="field.header">
              {{ field.header }}
            </th>
            <th>{{ $t('header.instanceId') }}</th>
          </tr>
        </thead>
        <!-- eslint-disable-next-line vuejs-accessibility/mouse-events-have-key-events -->
        <tbody @mousemove="setActionsTrigger('hover')"
          @mouseover="toggleHoverClass" @mouseleave="removeHoverClass">
          <template v-if="odata.dataExists && fields != null">
            <submission-data-row v-for="(submission, index) in odata.value"
              :key="submission.__id" :project-id="projectId"
              :xml-form-id="xmlFormId" :draft="draft" :submission="submission"
              :fields="fields" :data-index="index"/>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import SubmissionDataRow from './data-row.vue';
import SubmissionMetadataRow from './metadata-row.vue';

import { useRequestData } from '../../request-data';

// We may render many rows, so this component makes use of event delegation and
// other optimizations.

export default {
  name: 'SubmissionTable',
  components: { SubmissionDataRow, SubmissionMetadataRow },
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    draft: Boolean,
    fields: Array
  },
  emits: ['review'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, odata } = useRequestData();
    return { project, odata };
  },
  data() {
    return {
      /*
      Actions are shown for a row if the cursor is over the row or if one of the
      actions is focused. However, it is possible for the cursor to be over one
      row while an action is focused in a different row. In that case, we show
      the actions for one of the two rows depending on the type of the most
      recent event.

      I tried other approaches before landing on this one. However, sequences of
      events like the following were a challenge:

        - Click the More button for a row.
        - Next, press tab to focus the Review button in the next row.
        - Actions are shown for the next row and are no longer shown beneath the
          cursor. However, that will trigger a mouseover event, which depending
          on the approach may cause actions to be shown beneath the cursor
          again.
      */
      actionsTrigger: 'hover',
      dataHover: null
    };
  },
  computed: {
    canUpdate() {
      return this.project.dataExists && this.project.permits('submission.update');
    }
  },
  watch: {
    /*
    We remove the data-hover class after the submissions are refreshed, with the
    following cases in mind:

      - There may be fewer submissions after the refresh than before. In that
        case, it is possible that this.odata.value.length <= this.dataHover.
      - A submission may be in a different row after the refresh. For example,
        if the user hovers over the first row, and after the refresh, that
        submission is in the second row, then the second row will incorrectly
        have the data-hover class.

    In some cases, it would be ideal not to remove the class or to add the class
    to the row for a different submission. That logic is not in place right now.
    */
    'odata.data': 'removeHoverClass'
  },
  methods: {
    setActionsTrigger(trigger) {
      this.actionsTrigger = trigger;
    },
    toggleHoverClass(event) {
      const dataRow = event.target.closest('tr');
      const index = Number.parseInt(dataRow.dataset.index, 10);
      if (index === this.dataHover) return;
      const { metadataBody } = this.$refs;
      if (this.dataHover != null)
        metadataBody.querySelector('.data-hover').classList.remove('data-hover');
      const metadataRow = metadataBody.querySelector(`tr:nth-child(${index + 1})`);
      // The SubmissionMetadataRow element does not have a class binding, so I
      // think we can add this class without Vue removing it.
      metadataRow.classList.add('data-hover');
      this.dataHover = index;
    },
    removeHoverClass() {
      if (this.dataHover != null) {
        const tr = this.$refs.metadataBody.querySelector('.data-hover');
        tr.classList.remove('data-hover');
        this.dataHover = null;
      }
    },
    review(event) {
      if (!this.canUpdate) return;
      const tr = event.target.closest('tr');
      if (tr.querySelector('.review-button').contains(event.target))
        this.$emit('review', this.odata.value[tr.dataset.index]);
    },
    // Using a method instead of a prop in case the same submission is updated
    // twice in a row.
    afterReview(index) {
      const { metadataBody } = this.$refs;
      const tr = metadataBody.querySelector(`tr:nth-child(${index + 1})`);
      tr.classList.add('updated');
      setTimeout(() => {
        tr.classList.remove('updated');
      });
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-table-metadata {
  box-shadow: 3px 0 0 rgba(0, 0, 0, 0.04);
  position: relative;
  // Adding z-index so that the background color of the other table's thead does
  // not overlay the box shadow.
  z-index: 1;

  th:last-child { border-right: $border-bottom-table-heading; }
  td:last-child { border-right: $border-top-table-data; }
}

#submission-table-data {
  width: auto;

  th, td {
    @include text-overflow-ellipsis;
    max-width: 250px;
    &:last-child { max-width: 325px; }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      "stateAndActions": "State and actions"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "header": {
      "stateAndActions": "Stav a akce"
    }
  },
  "de": {
    "header": {
      "stateAndActions": "Status und Aktionen"
    }
  },
  "es": {
    "header": {
      "stateAndActions": "Estado y acciones"
    }
  },
  "fr": {
    "header": {
      "stateAndActions": "État et actions"
    }
  },
  "id": {
    "header": {
      "stateAndActions": "Status dan tindakan"
    }
  },
  "it": {
    "header": {
      "stateAndActions": "Stato e azioni"
    }
  },
  "ja": {
    "header": {
      "stateAndActions": "レビュー・ステータスと操作"
    }
  },
  "sw": {
    "header": {
      "stateAndActions": "Hali na vitendo"
    }
  }
}
</i18n>
