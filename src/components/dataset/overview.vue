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
  <div v-if="dataset.dataExists" id="dataset-overview">
    <page-section id="dataset-overview-form-connections">
      <template #heading>
        <span>{{ $t('connectionsToForms') }}</span>
      </template>
      <template #body>
        <div class="row">
          <div class="col-md-6 creation-forms">
            <summary-item icon="magic-wand">
              <template #heading>
                {{ propertiesByForm.length }}
              </template>
              <template #body>
                <p>{{ $t('formsCreateEntities') }}</p>
                <table class="table">
                  <tbody>
                    <expandable-row v-for="(form) in propertiesByForm" :key="form.name">
                      <template #title>
                        <router-link :to="formPath(project.id, form.xmlFormId)">{{ form.name }}</router-link>
                      </template>
                      <template #caption>
                        {{ $tcn('properties', totalProperties, { inform: $n(form.properties.length, 'default') }) }}
                      </template>
                      <template #details>
                        <span v-for="(property, index) in form.properties" :key="property">
                          {{ property }}<template v-if="index < form.properties.length - 1">{{ $t('common.punctuations.comma') }}<sentence-separator/></template>
                        </span>
                      </template>
                    </expandable-row>
                  </tbody>
                </table>
              </template>
            </summary-item>
          </div>
          <div class="col-md-6 linked-forms">
            <summary-item icon="link">
              <template #heading>
                {{ dataset.linkedForms.length }}
              </template>
              <template #body>
                <p>{{ $tc('formsConsumeData', dataset.linkedForms.length) }}</p>
                <table class="table">
                  <tbody>
                    <tr v-for="(form) in dataset.linkedForms" :key="form">
                      <td>
                        <router-link :to="formPath(project.id, form.xmlFormId)">{{ form.name }}</router-link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </summary-item>
          </div>
        </div>
      </template>
    </page-section>
    <page-section id="dataset-overview-properties">
      <template #heading>
        <span>{{ $t('datasetProperties') }}</span>
      </template>
      <template #body>
        <table id="dataset-table" class="table">
        <thead>
          <tr>
            <th>{{ $t('header.name') }}</th>
            <th>{{ $t('header.updatedBy') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="(property) in dataset.properties" :key="property.name">
            <tr>
              <!-- we have to show property name even if there is no associated form -->
              <td :rowspan="property.forms.length || 1">
                {{ property.name }}
              </td>
              <td>
                <router-link v-if="property.forms.length > 0" :to="formPath(project.id, property.forms[0].xmlFormId)">{{ property.forms[0].name }}</router-link>
              </td>
            </tr>
            <template v-for="(form, index) in property.forms" :key="form">
              <tr v-if="index > 0">
                <td>
                  <router-link :to="formPath(project.id, form.xmlFormId)">{{ form.name }}</router-link>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
      </template>
    </page-section>
  </div>
</template>

<script>
import PageSection from '../page/section.vue';
import SummaryItem from '../summary-item.vue';
import SentenceSeparator from '../sentence-separator.vue';


import routes from '../../mixins/routes';

import { useRequestData } from '../../request-data';
import ExpandableRow from '../expandable-row.vue';

export default {
  name: 'DatasetOverview',
  components: {
    PageSection,
    SummaryItem,
    SentenceSeparator,
    ExpandableRow
  },
  mixins: [routes()],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { project, dataset, resourceStates } = useRequestData();
    const { dataExists } = resourceStates([project, dataset]);
    return { project, dataset, dataExists };
  },
  computed: {
    totalProperties() {
      return this.dataset.properties.length;
    },
    propertiesByForm() {
      const formMap = new Map();

      for (const p of this.dataset.properties) {
        for (const f of p.forms) {
          if (!formMap.has(f.xmlFormId)) {
            formMap.set(f.xmlFormId, {
              name: f.name,
              xmlFormId: f.xmlFormId,
              projectId: this.project.id,
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
#dataset-overview {
  .table > tbody > tr:first-child > td {
    border-top: none;
  }

  a {
    font-size: 16px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "formsCreateEntities": "Form creates Entities in this Dataset | Forms create Entities in this Dataset",
    "formsConsumeData": "Form consumes data from this Dataset | Forms consume data from this Dataset",
    "connectionsToForms": "Connections to Forms",
    "properties": "{inform} of {count} property | {inform} of {count} properties",
    "datasetProperties" : "Dataset Properties"
  }
}
</i18n>
