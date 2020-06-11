<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-list">
    <page-section>
      <template #heading>
        <span>{{ $t('title') }}</span>
        <button v-if="project != null && project.permits('form.create')"
          id="form-list-create-button" type="button" class="btn btn-primary"
          @click="showModal('newForm')">
          <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
        </button>
      </template>
      <template #body>
        <form-table/>
        <loading :state="$store.getters.initiallyLoading(['forms'])"/>
        <p v-if="forms != null && forms.length === 0"
          class="empty-table-message">
          {{ $t('emptyTable') }}
        </p>
      </template>
    </page-section>
    <form-new v-bind="newForm" @hide="hideModal('newForm')"
      @success="afterCreate"/>
  </div>
</template>

<script>
import FormNew from './new.vue';
import FormTable from './table.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormList',
  components: { FormTable, FormNew, Loading, PageSection },
  mixins: [modal(), routes()],
  data() {
    return {
      newForm: {
        state: false
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['project', 'forms']),
  methods: {
    afterCreate(form) {
      const path = this.formPath(form.projectId, form.xmlFormId, 'draft');
      this.$router.push(path, () => {
        this.$alert().success(this.$t('alert.create', {
          name: form.nameOrId()
        }));
      });
    }
  }
};
</script>

<style>
#form-list {
  margin-top: 10px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "title": "Forms",
    "action": {
      "create": "New"
    },
    "emptyTable": "There are no Forms to show.",
    "alert": {
      "create": "Your new Form “{name}” has been created as a Draft. Take a look at the checklist below, and when you feel it’s ready, you can publish the Form for use."
    }
  }
}
</i18n>
