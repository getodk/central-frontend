<template>
  <div id="custom-properties-list">
    <page-section>
      <template #heading>
        <span>{{ $t('projectShow.tab.customProperties') }}</span>
        <button v-if="project.dataExists && project.permits('project.update')"
          id="custom-properties-list-new-button" type="button" class="btn btn-primary"
          @click="createModal.show()">
          <span class="icon-plus-circle"></span>{{ $t('new') }}
        </button>
      </template>
    </page-section>
    <div class="page-body-heading">
      <p>{{ $t('heading[0]') }}</p>
      <p>
        <span>{{ $t('heading[1]') }}</span>
        <sentence-separator/>
        <i18n-t keypath="moreInfo.clickHere.full">
          <template #clickHere>
            <doc-link to="TODO">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
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
      "Some helper intro text",
      "Custom Properties are custom fields that can be attached to project app users and public links to store additional metadata."
    ],
    "emptyTable": "No custom properties have been defined for this project.",
    // Shown after a custom property is successfully created.
    "created": "Custom property created successfully.",
    // This is the text of a button that is used to create a new Custom Property for users.
    // It is shown next to a heading whose text is "Custom Properties".
    "new": "New"
  }
}
</i18n>
