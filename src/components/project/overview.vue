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
          <span slot="heading">About Projects</span>
          <template slot="body">
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
          <span slot="heading">Right Now</span>
          <template slot="body">
            <loading :state="$store.getters.initiallyLoading(['project', 'forms'])"/>
            <template v-if="project != null && forms != null">
              <div>
                <router-link :to="`/projects/${projectId}/app-users`"
                  class="project-overview-right-now-icon-container">
                  <span class="icon-user-circle"></span>
                </router-link>
                <div class="project-overview-right-now-count">
                  <router-link :to="`/projects/${projectId}/app-users`">
                    {{ project.appUsers }}
                    <span class="icon-angle-right"></span>
                  </router-link>
                </div>
                <div class="project-overview-right-now-description">
                  <router-link :to="`/projects/${projectId}/app-users`">
                    <strong>{{ $pluralize('App User', project.appUsers) }}</strong>
                    who can use a data collection client to download and submit
                    Form data to this Project.
                  </router-link>
                </div>
              </div>
              <div>
                <a href="#" class="project-overview-right-now-icon-container"
                  @click.prevent="scrollToForms">
                  <span class="icon-file-text"></span>
                </a>
                <div class="project-overview-right-now-count">
                  <a href="#" @click.prevent="scrollToForms">
                    {{ forms.length }} <span class="icon-angle-right"></span>
                  </a>
                </div>
                <div class="project-overview-right-now-description">
                  <a href="#" @click.prevent="scrollToForms">
                    <strong>{{ $pluralize('Form', forms.length) }}</strong>
                    which can be downloaded and given as surveys on mobile
                    clients.
                  </a>
                </div>
              </div>
            </template>
          </template>
        </page-section>
      </div>
    </div>
    <page-section id="project-overview-forms">
      <template slot="heading">
        <span>Forms</span>
        <button v-if="project != null && !project.archived"
          id="project-overview-new-form-button" type="button"
          class="btn btn-primary" @click="showModal('newForm')">
          <span class="icon-plus-circle"></span>New
        </button>
      </template>
      <template slot="body">
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
import modal from '../../mixins/modal';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectOverview',
  components: { FormList, FormNew },
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
    projectId: 'fetchData'
  },
  created() {
    // If the user navigates from this tab to another tab, then back to this
    // tab, we do not send a new request.
    if (this.forms == null && !this.$store.getters.loading('forms'))
      this.fetchData();
  },
  methods: {
    fetchData() {
      // Note that we do not keep this.project.forms and this.forms.length in
      // sync.
      this.$store.dispatch('get', [{
        key: 'forms',
        url: `/projects/${this.projectId}/forms`,
        extended: true
      }]).catch(() => {});
    },
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
@import '../../assets/scss/variables';

#project-overview {
  margin-top: 10px;
}

#project-overview-right-now .page-section-body {
  a {
    color: inherit;
    text-decoration: none;
  }

  .project-overview-right-now-icon-container {
    float: left;
    position: relative;

    span {
      color: #555;
      font-size: 56px;
      margin-right: 0;
    }

    .icon-file-text {
      // .icon-file-text is a little more narrow than .icon-user-circle, so we
      // use this to center it.
      left: 4px;
      position: relative;
    }
  }

  .project-overview-right-now-count, .project-overview-right-now-description {
    margin-left: 75px;
  }

  .project-overview-right-now-count {
    font-size: 30px;
    line-height: 1;
    margin-bottom: 3px;

    .icon-angle-right {
      color: $color-accent-primary;
      font-size: 20px;
      margin-right: 0;
      vertical-align: 2px;
    }
  }

  .project-overview-right-now-description {
    color: #666;
    margin-bottom: 30px;

    strong {
      color: $color-text;
      font-weight: normal;
    }
  }
}

#project-overview-forms {
  margin-top: 10px;
}
</style>
