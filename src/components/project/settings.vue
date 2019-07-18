<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="project != null" id="project-settings">
    <div class="row">
      <div class="col-xs-8">
        <project-edit/>
      </div>
      <div class="col-xs-4">
        <div class="panel panel-simple">
          <div class="panel-heading">
            <h1 class="panel-title">Encryption</h1>
          </div>
          <div class="panel-body">
            <template v-if="project.keyId == null">
              <p>
                Submission data encryption is not enabled for this Project.
                <doc-link to="central-encryption/">Learn more</doc-link>.
              </p>
              <p>
                <button id="enable-encryption-button" type="button"
                  class="btn btn-primary"
                  @click="showModal('enableEncryption')">
                  Enable encryption
                </button>
              </p>
            </template>
            <template v-else>
              <p>
                Submission data encryption is <strong>enabled</strong> for this
                Project.
                <doc-link to="central-encryption/">Learn more</doc-link>.
              </p>
              <p>
                In this version of ODK Central, you may not disable encryption
                once it is turned on.
              </p>
            </template>
          </div>
        </div>
        <div class="panel panel-simple-danger">
          <div class="panel-heading">
            <h1 class="panel-title">Danger Zone</h1>
          </div>
          <div class="panel-body">
            <p>
              <button id="project-settings-archive-button" type="button"
                class="btn btn-danger" @click="showModal('archive')">
                Archive this Project
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    <project-enable-encryption v-bind="enableEncryption"
      @hide="hideModal('enableEncryption')" @success="afterEnableEncryption"/>
    <project-archive v-bind="archive" @hide="hideModal('archive')"
      @success="afterArchive"/>
  </div>
</template>

<script>
import ProjectArchive from './archive.vue';
import ProjectEdit from './edit.vue';
import ProjectEnableEncryption from './enable-encryption.vue';
import conditionalRoute from '../../mixins/conditional-route';
import modal from '../../mixins/modal';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectSettings',
  components: { ProjectArchive, ProjectEdit, ProjectEnableEncryption },
  mixins: [
    conditionalRoute({ project: (project) => !project.archived }),
    modal()
  ],
  data() {
    return {
      enableEncryption: {
        state: false
      },
      archive: {
        state: false
      }
    };
  },
  computed: requestData(['project']),
  methods: {
    afterEnableEncryption() {
      this.hideModal('enableEncryption');
      this.$store.commit('setData', {
        key: 'project',
        // Frontend does not use project.keyId other than to check whether it is
        // null. Instead of sending another request for the project, we simply
        // set keyId to a value that is not null.
        value: { ...this.project, keyId: -1 }
      });
    },
    afterArchive() {
      this.$router.push(`/projects/${this.project.id}`, () => {
        this.$alert().success(`The Project "${this.project.name}" was archived.`);
      });
    }
  }
};
</script>

<style lang="scss">
#project-settings .panel-simple-danger p {
  margin-bottom: 15px;
  margin-top: 10px;
}
</style>
