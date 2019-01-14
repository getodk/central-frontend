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
  <div>
    <div class="row">
      <div class="col-xs-6">
        <page-section id="project-overview-about">
          <template slot="heading"><span>About Projects</span></template>
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
          <template slot="heading"><span>Right Now</span></template>
          <template slot="body">
            <loading :state="maybeFieldKeys.awaiting || maybeForms.awaiting"/>
            <div v-if="maybeFieldKeys.success && maybeForms.success">
              <div>
                <div class="project-overview-right-now-count">
                  {{ maybeFieldKeys.data.length }}
                </div>
                <div>
                  {{ $pluralize('App User', maybeFieldKeys.data.length) }} who
                  can use a data collection client to download and submit Form
                  data to this Project.
                </div>
              </div>
              <div>
                <div class="project-overview-right-now-count">
                  {{ maybeForms.data.length }}
                </div>
                <div>
                  {{ $pluralize('Form', maybeForms.data.length) }} which can be
                  downloaded and given as surveys on mobile clients.
                </div>
              </div>
            </div>
          </template>
        </page-section>
      </div>
    </div>
    <page-section>
      <template slot="heading">
        <span>Forms</span>
        <button id="project-overview-new-form-button" type="button"
          class="btn btn-primary" @click="showModal('newForm')">
          <span class="icon-plus-circle"></span>Create a new Form
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
#project-overview-about, #project-overview-right-now {
  margin-top: 10px;
}
</style>
