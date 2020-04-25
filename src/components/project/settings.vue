<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="project-settings">
    <div v-if="project != null" class="row">
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
                <button id="project-settings-enable-encryption-button"
                  type="button" class="btn btn-primary"
                  @click="showModal('enableEncryption')">
                  Enable encryption&hellip;
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
            <template v-if="!project.archived">
              <p>
                <button id="project-settings-archive-button" type="button"
                  class="btn btn-danger" @click="showModal('archive')">
                  Archive this Project&hellip;
                </button>
              </p>
            </template>
            <template v-else>
              <p>This Project has been archived.</p>
              <p>
                In this version of ODK Central, you may not unarchive a Project.
                However, the ability to unarchive a Project is planned for a
                future release.
              </p>
            </template>
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
import DocLink from '../doc-link.vue';
import ProjectArchive from './archive.vue';
import ProjectEdit from './edit.vue';
import ProjectEnableEncryption from './enable-encryption.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectSettings',
  components: { DocLink, ProjectArchive, ProjectEdit, ProjectEnableEncryption },
  mixins: [modal(), routes(), validateData()],
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
      this.$emit('fetch-project');
    },
    afterArchive() {
      this.$router.push(this.projectPath(), () => {
        this.$alert().success(`The Project "${this.project.name}" was archived.`);
      });
    }
  }
};
</script>

<style lang="scss">
#project-settings .panel-simple-danger p {
  margin-bottom: 5px;
}
</style>
