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
    <div class="row">
      <div class="col-xs-6">
        <page-section id="project-overview-about">
          <template #heading>
            <span>About Projects</span>
          </template>
          <template #body>
            <p>
              Any Forms you create in this Project will only be visible on data
              collection devices to the App Users who are a part of this
              Project.
            </p>
            <p>
              Future releases of ODK Central will add more Project-centric
              features, including improvements to Form states and workflow,
              device state updates, Collect settings management, and more
              granular permissioning.
            </p>
            <p>
              For more information, please see
              <doc-link to="central-projects/">this help article</doc-link>, and
              if you have any feedback please visit
              <a href="https://forum.opendatakit.org/t/16857" target="_blank">this forum thread</a>.
            </p>
          </template>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section id="project-overview-right-now">
          <template #heading>
            <span>Right Now</span>
          </template>
          <template #body>
            <loading :state="$store.getters.initiallyLoading(['project', 'forms'])"/>
            <template v-if="project != null && forms != null">
              <summary-item :route-to="`/projects/${projectId}/app-users`"
                icon="user-circle">
                <template #heading>
                  {{ project.appUsers }} <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <strong>{{ $pluralize('App User', project.appUsers) }}</strong>
                  who can use a data collection client to download and submit
                  Form data to this Project.
                </template>
              </summary-item>
              <summary-item clickable icon="file-text" @click="scrollToForms">
                <template #heading>
                  {{ forms.length }} <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <strong>{{ $pluralize('Form', forms.length) }}</strong> which
                  can be downloaded and given as surveys on mobile clients.
                </template>
              </summary-item>
            </template>
          </template>
        </page-section>
      </div>
    </div>
    <page-section id="project-overview-forms">
      <template #heading>
        <span>Forms</span>
        <button v-if="project != null && !project.archived"
          id="project-overview-new-form-button" type="button"
          class="btn btn-primary" @click="showModal('newForm')">
          <span class="icon-plus-circle"></span>New
        </button>
      </template>
      <template #body>
        <loading :state="$store.getters.initiallyLoading(['forms'])"/>
        <form-list v-if="forms != null" :project-id="projectId"/>
      </template>
    </page-section>
    <form-new :project-id="projectId" :state="newForm.state"
      @hide="hideModal('newForm')" @success="afterCreate"/>
  </div>
</template>

<script>
import FormList from '../form/list.vue';
import FormNew from '../form/new.vue';
import SummaryItem from '../summary-item.vue';
import modal from '../../mixins/modal';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectOverview',
  components: { FormList, FormNew, SummaryItem },
  mixins: [modal()],
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
  computed: requestData(['project', 'forms']),
  watch: {
    projectId() {
      this.$emit('fetch-forms');
    }
  },
  created() {
    // If the user navigates from this tab to another tab, then back to this
    // tab, we do not send a new request.
    if (this.forms == null && !this.$store.getters.loading('forms'))
      this.$emit('fetch-forms');
  },
  methods: {
    scrollToForms() {
      const scrollTop = Math.round($('#project-overview-forms').offset().top);
      $('html, body').animate({ scrollTop });
    },
    afterCreate(form) {
      const path = `/projects/${this.projectId}/forms/${form.encodedId()}`;
      this.$router.push(path, () => {
        this.$alert().success(`The Form “${form.nameOrId()}” was created successfully.`);
      });
    }
  }
};
</script>

<style lang="scss">
#project-overview {
  margin-top: 10px;
}

#project-overview-right-now .icon-file-text {
  // .icon-file-text is a little more narrow than .icon-user-circle, so we use
  // this to center it.
  margin-left: 4px;
  margin-right: 4px;
}

#project-overview-forms {
  margin-top: 10px;
}
</style>
