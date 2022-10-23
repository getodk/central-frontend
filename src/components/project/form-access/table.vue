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
  <div id="project-form-access-table" class="clearfix">
    <table class="table table-frozen"
      :class="{ 'no-field-keys': fieldKeys.withToken.length === 0 }">
      <thead>
        <tr>
          <th>{{ $t('header.form') }}</th>
          <th>
            <span>{{ $t('header.state') }}</span>
            <button type="button" class="btn btn-link"
              @click="$emit('show-states')">
              <span class="icon-question-circle"></span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody v-if="forms.length !== 0">
        <project-form-access-row v-for="form of forms" :key="form.xmlFormId"
          :form="form" :changes="changesByForm[form.xmlFormId]" frozen
          @update:state="updateState"/>
      </tbody>
    </table>
    <div v-if="fieldKeys.withToken.length !== 0" class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th><div>{{ $t('resource.appUsers') }}</div></th>
            <th v-for="fieldKey of fieldKeys.withToken" :key="fieldKey.id"
              :title="fieldKey.displayName">
              <div>{{ fieldKey.displayName }}</div>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody v-if="forms.length !== 0">
          <project-form-access-row v-for="form of forms" :key="form.xmlFormId"
            :form="form" :changes="changesByForm[form.xmlFormId]"
            @update:field-key-access="updateFieldKeyAccess"/>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import ProjectFormAccessRow from './row.vue';

import { useRequestData } from '../../../request-data';

export default {
  name: 'ProjectFormAccessTable',
  components: { ProjectFormAccessRow },
  props: {
    changesByForm: {
      type: Object,
      required: true
    }
  },
  emits: ['show-states', 'update:state', 'update:fieldKeyAccess'],
  setup() {
    const { forms, fieldKeys } = useRequestData();
    return { forms, fieldKeys };
  },
  methods: {
    updateState(form, state) {
      this.$emit('update:state', form, state);
    },
    updateFieldKeyAccess(form, fieldKey, accessible) {
      this.$emit('update:fieldKeyAccess', form, fieldKey, accessible);
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#project-form-access-table {
  // Space above the tables
  .table-frozen {
    margin-top: 70px;

    &.no-field-keys {
      margin-top: 0;
    }
  }
  .table-container {
    // Using padding rather than margin so that the rotated column header text
    // does not overflow the container, which would cause the text to be hidden.
    padding-top: 70px;
  }

  .table {
    th {
      height: 33px;
    }

    td {
      height: 51px;
      vertical-align: middle;
    }
  }

  .table-frozen {
    $form-name-width: 250px;
    $state-width: 200px;

    table-layout: fixed;
    width: $form-name-width + $state-width;

    th {
      &:first-child {
        width: $form-name-width;
      }

      &:nth-child(2) {
        width: $state-width;

        > span:first-child { margin-right: 5px; }
        .btn-link { padding: 0; }
        .icon-question-circle { margin-right: 0; }
      }
    }
  }

  .table-container .table {
    width: auto;

    thead {
      background-color: transparent;
    }

    th {
      position: relative;

      // The rotated column header text
      div {
        bottom: 2px;
        left: 30px;
        position: absolute;
        transform: rotate(-45deg);
        transform-origin: center left;
        width: 120px;

        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      // The background behind the text
      &::before {
        bottom: 0;
        content: '';
        height: 102px;
        // This seems to need to be height divided by 2.
        left: 51px;
        position: absolute;
        transform: skewX(-45deg);
        transform-origin: center left;
      }
      &, &::before {
        min-width: 42px;
        width: 42px;
      }
      &:first-child {
        &, &::before {
          background-color: $color-table-heading-background;
        }

        &::before {
          border-left: 1px solid #eee;
        }
      }
      &:nth-child(2n + 3)::before {
        background-color: #eee;
      }
      &:last-child::before {
        display: none;
      }

      &:last-child {
        min-width: 102px;
        width: 102px;
      }
    }

    td:nth-child(2n + 3) {
      background-color: #eee;
    }
    td:last-child {
      background-color: transparent;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "header": {
      "form": "Form",
      "state": "State"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "header": {
      "form": "Formulář",
      "state": "Stav"
    }
  },
  "de": {
    "header": {
      "form": "Formular",
      "state": "Status"
    }
  },
  "es": {
    "header": {
      "form": "Formulario",
      "state": "Estado"
    }
  },
  "fr": {
    "header": {
      "form": "Formulaire",
      "state": "État"
    }
  },
  "id": {
    "header": {
      "form": "Formulir",
      "state": "Status"
    }
  },
  "it": {
    "header": {
      "form": "Formulario",
      "state": "Stato"
    }
  },
  "ja": {
    "header": {
      "form": "フォーム",
      "state": "状態"
    }
  },
  "sw": {
    "header": {
      "form": "fomu",
      "state": "hali"
    }
  }
}
</i18n>
