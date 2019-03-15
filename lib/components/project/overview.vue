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
            <loading :state="maybeFieldKeys.awaiting || maybeForms.awaiting"/>
            <template v-if="maybeFieldKeys.success && maybeForms.success">
              <div>
                <router-link :to="`/projects/${projectId}/app-users`"
                  class="project-overview-right-now-icon-container">
                  <span class="icon-user-circle"></span>
                </router-link>
                <div class="project-overview-right-now-count">
                  <router-link :to="`/projects/${projectId}/app-users`">
                    {{ maybeFieldKeys.data.length }}
                    <span class="icon-angle-right"></span>
                  </router-link>
                </div>
                <div class="project-overview-right-now-description">
                  <router-link :to="`/projects/${projectId}/app-users`">
                    <strong>{{ $pluralize('App User', maybeFieldKeys.data.length) }}</strong>
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
                    {{ maybeForms.data.length }}
                    <span class="icon-angle-right"></span>
                  </a>
                </div>
                <div class="project-overview-right-now-description">
                  <a href="#" @click.prevent="scrollToForms">
                    <strong>{{ $pluralize('Form', maybeForms.data.length) }}</strong>
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
        <button id="project-overview-new-form-button" type="button"
          class="btn btn-primary" @click="showModal('newForm')">
          <span class="icon-plus-circle"></span>New
        </button>
      </template>
      <template slot="body">
        <loading :state="maybeForms.awaiting"/>
        <form-list v-if="maybeForms.success" :project-id="projectId"
          :forms="maybeForms.data"/>
      </template>
    </page-section>
    <form-new :project-id="projectId" :state="newForm.state"
      @hide="hideModal('newForm')" @success="afterCreate"/>
  </div>
</template>

<script>
import Form from '../../presenters/form';
import FormList from '../form/list.vue';
import FormNew from '../form/new.vue';
import MaybeData from '../../maybe-data';
import modal from '../../mixins/modal';
import request from '../../mixins/request';

export default {
  name: 'ProjectOverview',
  components: { FormList, FormNew },
  mixins: [modal('newForm'), request()],
  // Setting this in order to ignore attributes from ProjectShow that are
  // intended for other project components.
  inheritAttrs: false,
  props: {
    projectId: {
      type: String,
      required: true
    },
    maybeFieldKeys: {
      type: MaybeData,
      required: true
    }
  },
  data() {
    return {
      requestId: null,
      maybeForms: null,
      newForm: {
        state: false
      }
    };
  },
  watch: {
    projectId: 'fetchData'
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.maybeGet({
        maybeForms: {
          url: `/projects/${this.projectId}/forms`,
          extended: true,
          transform: (data) => data.map(form => new Form(form))
        }
      });
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

<style lang="sass">
@import '../../../assets/scss/variables';

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
