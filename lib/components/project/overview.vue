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
    <page-section>
      <template slot="heading">
        <span>Forms</span>
        <button id="project-overview-new-form-button" type="button"
          class="btn btn-primary" @click="showModal('newForm')">
          <span class="icon-plus-circle"></span>New
        </button>
      </template>
      <template slot="body">
        <form-list/>
      </template>
    </page-section>
    <form-new v-bind="newForm" @hide="hideModal('newForm')"
      @success="afterCreate"/>
  </div>
</template>

<script>
import FormList from '../form/list.vue';
import FormNew from '../form/new.vue';
import modal from '../../mixins/modal';

export default {
  name: 'ProjectOverview',
  components: { FormList, FormNew },
  mixins: [modal('newForm')],
  props: {
    projectId: {
      type: Number,
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
  methods: {
    afterCreate(form) {
      // Wait for the modal to hide.
      this.$nextTick(() => {
        this.$router.push(`/forms/${form.encodedId()}`, () => {
          this.$alert().success(`The form “${form.nameOrId()}” was created successfully.`);
        });
      });
    }
  }
};
</script>
