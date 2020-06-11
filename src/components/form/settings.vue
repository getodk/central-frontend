<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-if="form != null" id="form-settings">
    <div class="row">
      <div class="col-xs-6">
        <div class="panel panel-simple">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('state.title') }}</h1>
          </div>
          <div class="panel-body">
            <i18n tag="p" path="state.body.full">
              <template #formAccessSettings>
                <router-link :to="projectPath('form-access')">{{ $t('state.body.formAccessSettings') }}</router-link>
              </template>
            </i18n>
          </div>
        </div>
      </div>
      <div class="col-xs-6">
        <div class="panel panel-simple-danger">
          <div class="panel-heading">
            <h1 class="panel-title">{{ $t('common.dangerZone') }}</h1>
          </div>
          <div class="panel-body">
            <p>
              <button type="button" class="btn btn-danger"
                @click="showModal('deleteForm')">
                {{ $t('action.delete') }}&hellip;
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
    <form-delete v-bind="deleteForm" @hide="hideModal('deleteForm')"
      @success="afterDelete"/>
  </div>
</template>

<script>
import FormDelete from './delete.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { requestData } from '../../store/modules/request';

export default {
  name: 'FormSettings',
  components: { FormDelete },
  mixins: [modal(), routes(), validateData()],
  data() {
    return {
      deleteForm: {
        state: false
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['form']),
  methods: {
    afterDelete(form) {
      this.$router.push(this.projectPath(), () => {
        this.$alert().success(this.$t('alert.delete', {
          name: form.nameOrId()
        }));
      });
    }
  }
};
</script>

<style lang="scss">
#form-settings .panel-simple-danger .panel-body p {
  margin-bottom: 15px;
  margin-top: 10px;
  text-align: center;
}
</style>

<i18n lang="json5">
{
  "en": {
    "state": {
      // This is a title shown above a section of the page.
      "title": "Form State",
      "body": {
        "full": "To set this Form’s state, please visit the Project {formAccessSettings}.",
        "formAccessSettings": "Form Access settings"
      }
    },
    "action": {
      "delete": "Delete this Form"
    },
    "alert": {
      "delete": "The Form “{name}” was deleted."
    }
  }
}
</i18n>
