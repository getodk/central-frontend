<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="project-overview">
    <loading :state="initiallyLoading"/>
    <template v-if="dataExists">
      <div v-if="rendersTopRow" class="row">
        <div class="col-xs-6">
          <project-overview-about/>
        </div>
        <div class="col-xs-6">
          <project-overview-right-now @scroll-to-forms="scrollToForms"/>
        </div>
      </div>
      <page-section id="project-overview-forms">
        <template #heading>
          <span>Forms</span>
          <button v-if="project.permits('form.create')"
            id="project-overview-new-form-button" type="button"
            class="btn btn-primary" @click="showModal('newForm')">
            <span class="icon-plus-circle"></span>New
          </button>
        </template>
        <template #body>
          <form-list v-if="forms != null"/>
        </template>
      </page-section>
    </template>
    <form-new v-bind="newForm" @hide="hideModal('newForm')"
      @success="afterCreate"/>
  </div>
</template>

<script>
import FormList from '../form/list.vue';
import FormNew from '../form/new.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ProjectOverviewAbout from './overview/about.vue';
import ProjectOverviewRightNow from './overview/right-now.vue';
import canRoute from '../../mixins/can-route';
import modal from '../../mixins/modal';
import validateData from '../../mixins/validate-data';
import { requestData } from '../../store/modules/request';

const REQUEST_KEYS = ['project', 'forms'];

export default {
  name: 'ProjectOverview',
  components: {
    FormList,
    FormNew,
    Loading,
    PageSection,
    ProjectOverviewAbout,
    ProjectOverviewRightNow
  },
  mixins: [canRoute(), modal(), validateData()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      newForm: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(REQUEST_KEYS),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(REQUEST_KEYS);
    },
    dataExists() {
      return this.$store.getters.dataExists(REQUEST_KEYS);
    },
    rendersTopRow() {
      // The text of ProjectOverviewAbout implies that the user can form.create.
      if (!this.project.permits('form.create')) return false;
      // ProjectOverviewRightNow links to FieldKeyList.
      return this.canRoute(`/projects/${this.projectId}/app-users`);
    }
  },
  watch: {
    projectId() {
      this.$emit('fetch-forms');
    }
  },
  created() {
    this.$emit('fetch-forms', false);
  },
  methods: {
    scrollToForms() {
      const scrollTop = Math.round($('#project-overview-forms').offset().top);
      $('html, body').animate({ scrollTop });
    },
    afterCreate(form) {
      const path = `/projects/${form.projectId}/forms/${form.encodedId()}`;
      this.$router.push(path, () => {
        this.$alert().success(`The Form "${form.nameOrId()}" was created successfully.`);
      });
    }
  }
};
</script>

<style lang="scss">
#project-overview .row, #project-overview-forms {
  margin-top: 10px;
}
</style>
