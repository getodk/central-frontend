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
  <modal id="project-archive" :state="state" :hideable="!awaitingResponse"
    backdrop @hide="$emit('hide')">
    <template slot="title">Archiving Project</template>
    <template slot="body">
      <div class="modal-introduction">
        <p>
          You are about to archive the Project
          “{{ project != null ? project.name : '' }}”. It will still be viewable
          and its data will remain accessible for download and over OData, but
          it will no longer be updatable, and it will be inaccessible to mobile
          clients like Collect.
        </p>
        <p>
          <strong>This action cannot be undone</strong>, but the ability to
          unarchive a Project is planned for a future release.
        </p>
        <p>Are you sure you wish to proceed?</p>
      </div>
      <div class="modal-actions">
        <button :disabled="awaitingResponse" type="button"
          class="btn btn-danger" @click="archive">
          Yes, I am sure <spinner :state="awaitingResponse"/>
        </button>
        <button :disabled="awaitingResponse" type="button" class="btn btn-link"
          @click="$emit('hide')">
          No, cancel
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import noop from '../../util/util';
import request from '../../mixins/request';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectArchive',
  mixins: [request()],
  props: {
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  computed: requestData(['project']),
  methods: {
    archive() {
      this.patch(`/projects/${this.project.id}`, { archived: true })
        .then(response => {
          this.$store.commit('setData', {
            key: 'project',
            // We do not simply specify response.data, because it does not
            // include extended metadata.
            value: {
              ...this.project,
              archived: true,
              updatedAt: response.data.updatedAt
            }
          });
          this.$emit('success');
        })
        .catch(noop);
    }
  }
};
</script>
