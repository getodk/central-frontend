<template>
  <div id="custom-properties-list">
    <page-section>
      <template #heading>
        <span>{{ $t('projectShow.tab.customProperties') }}</span>
        <button v-if="project.dataExists && project.permits('project.update')"
          id="custom-properties-list-new-button" type="button" class="btn btn-primary"
          @click="createModal.show()">
          <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
        </button>
      </template>
    </page-section>
    <div class="page-body-heading">
      <p>
        <span>{{ $t('heading[0]') }}</span>
        <sentence-separator/>
        <i18n-t keypath="moreInfo.clickHere.full">
          <template #clickHere>
            <doc-link to="central-projects#managing-custom-properties">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
          </template>
        </i18n-t>
      </p>
    </div>
    <table id="custom-properties-table" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.name') }}</th>
        </tr>
      </thead>
      <tbody v-if="actorProperties.dataExists">
        <tr v-for="property of actorProperties" :key="property.name">
          <td>{{ property.name }}</td>
        </tr>
      </tbody>
    </table>
    <p v-if="actorProperties.dataExists && actorProperties.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>
    <loading :state="actorProperties.initiallyLoading"/>
    <custom-properties-new v-bind="createModal"
      @hide="createModal.hide()" @success="afterCreate"/>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { useI18n } from 'vue-i18n';

import CustomPropertiesNew from './new.vue';
import DocLink from '../../doc-link.vue';
import Loading from '../../loading.vue';
import PageSection from '../../page/section.vue';
import SentenceSeparator from '../../sentence-separator.vue';

import { modalData } from '../../../util/reactivity';
import { useRequestData } from '../../../request-data';

defineOptions({
  name: 'CustomPropertyList'
});

defineProps({
  projectId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['fetch-actor-properties']);

const alert = inject('alert');
const { t } = useI18n();

const { project, actorProperties } = useRequestData();

const createModal = modalData();

emit('fetch-actor-properties');

const afterCreate = (name) => {
  createModal.hide();
  actorProperties.push({ name });
  alert.success(t('created'));
};
</script>

<i18n lang="json5">
{
  "en": {
    "heading": [
      // A brief introduction to Custom Properties shown for the current project
      "Control which Entities each App User or Public Link can access. Define Custom Properties here, assign values to App Users or Public Links, and use Entity List filters to show relevant Entities."
    ],
    "emptyTable": "No custom properties have been defined for this project.",
    // Shown after a custom property is successfully created.
    "created": "Custom property created successfully.",
    "action": {
      "create": "New"
    }
  }
}
</i18n>
