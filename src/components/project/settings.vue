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
  <div id="project-settings">
    <div class="row">
      <div class="col-xs-8">
        <project-edit v-if="project != null"/>
      </div>
      <div class="col-xs-4">
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
    <project-archive :state="archive.state" @hide="hideModal('archive')"
      @success="afterArchive"/>
  </div>
</template>

<script>
import ProjectArchive from './archive.vue';
import ProjectEdit from './edit.vue';
import conditionalRoute from '../../mixins/conditional-route';
import modal from '../../mixins/modal';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectSettings',
  components: { ProjectArchive, ProjectEdit },
  mixins: [
    conditionalRoute({ project: (project) => !project.archived }),
    modal()
  ],
  data() {
    return {
      archive: {
        state: false
      }
    };
  },
  computed: requestData(['project']),
  methods: {
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
  text-align: center;
}
</style>
