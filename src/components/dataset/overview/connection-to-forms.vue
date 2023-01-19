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
  <summary-item id="connection-to-forms" icon="magic-wand">
    <template #heading>
      {{ propertiesByForm.length }}
    </template>
    <template #body>
      <p>{{ $t('formsCreateEntities') }}</p>
      <div class="div">
        <expandable-row v-for="(form) in propertiesByForm" :key="form.xmlFormId">
          <template #title>
            <router-link :to="publishedFormPath(projectId, form.xmlFormId)" :title="form.name">{{ form.name }}</router-link>
          </template>
          <template #caption>
            {{ $tcn('common.propertiesCount', totalProperties, { inform: $n(form.properties.length, 'default') }) }}
          </template>
          <template #details>
            <span v-for="(property, index) in form.properties" :key="property">
              {{ property }}<template v-if="index < form.properties.length - 1">{{
                $t('common.punctuations.comma')
              }}<sentence-separator/></template>
            </span>
          </template>
        </expandable-row>
      </div>
    </template>
  </summary-item>
</template>

<script>
import SummaryItem from '../../summary-item.vue';
import ExpandableRow from '../../expandable-row.vue';
import routes from '../../../mixins/routes';
import SentenceSeparator from '../../sentence-separator.vue';

export default {
  name: 'ConnectionToForms',
  components: {
    SentenceSeparator,
    SummaryItem,
    ExpandableRow
  },
  mixins: [routes()],
  props: {
    properties: {
      type: Object,
      required: true
    },
    projectId: {
      type: Number,
      required: true
    }
  },
  computed: {
    totalProperties() {
      return this.properties.length;
    },
    propertiesByForm() {
      const formMap = new Map();

      for (const p of this.properties) {
        for (const f of p.forms) {
          if (!formMap.has(f.xmlFormId)) {
            formMap.set(f.xmlFormId, {
              name: f.name,
              xmlFormId: f.xmlFormId,
              projectId: this.projectId,
              properties: []
            });
          }
          const form = formMap.get(f.xmlFormId);
          form.properties.push(p.name);
        }
      }

      return Array.from(formMap.values());
    }
  }
};
</script>

<style lang="scss">
#connection-to-forms{
  .expandable-row {
    border-bottom: 1px solid #ddd;
  }

  .expandable-row:last-child {
    border-bottom: none;
  }

  a {
    font-size: 16px;
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      // Number of form(s) is shown separately above this text
      "formsCreateEntities": "Form creates Entities in this Dataset | Forms create Entities in this Dataset"
    }
  }
  </i18n>
