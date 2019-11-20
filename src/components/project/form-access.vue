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
  <div>
    <div class="heading-with-button">
      <button id="project-form-access-save-button" type="button"
        class="btn btn-primary"
        :class="{ 'uncommitted-change': changeCount !== 0 }"
        :disabled="saveDisabled" @click="save">
        <span class="icon-floppy-o"></span>Save
        <spinner :state="awaitingResponse"/>
      </button>
      <p>
        Here you can set Form States, which control whether Forms are available
        for download and open for submission. You can also separately control
        which App Users may see each Form at all. For more information,
        <doc-link to="central-projects/#managing-form-access">click here</doc-link>.
      </p>
    </div>

    <loading :state="initiallyLoading"/>
    <template v-if="dataExists">
      <project-form-access-table :changes-by-form="changesByForm"
        @update:state="updateState"
        @update:field-key-access="updateFieldKeyAccess"
        @show-states="showModal('statesModal')"/>
      <p v-if="forms.length === 0" class="empty-table-message">
        There are no Forms to show.
      </p>
    </template>

    <project-form-access-states v-bind="statesModal"
      @hide="hideModal('statesModal')"/>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import DocLink from '../doc-link.vue';
import ProjectFormAccessStates from './form-access/states.vue';
import ProjectFormAccessTable from './form-access/table.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';
import validateData from '../../mixins/validate-data';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

const REQUEST_KEYS = ['roles', 'project', 'forms', 'fieldKeys', 'formAssignments'];

export default {
  name: 'ProjectFormAccess',
  components: { DocLink, ProjectFormAccessStates, ProjectFormAccessTable },
  mixins: [modal(), request(), validateData()],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      awaitingResponse: false,
      changesByForm: null,
      changeCount: 0,
      statesModal: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(REQUEST_KEYS),
    ...mapGetters(['fieldKeysWithToken']),
    initiallyLoading() {
      return this.$store.getters.initiallyLoading(REQUEST_KEYS);
    },
    dataExists() {
      return this.$store.getters.dataExists(REQUEST_KEYS);
    },
    saveDisabled() {
      return !this.dataExists || this.changeCount === 0 ||
        this.awaitingResponse;
    },
    // Returns an object that maps each form's xmlFormId to a "field key access
    // object" for the form. The object indicates whether each app user has an
    // assignment to the form. It has a property for every app user with a
    // token, even those without an assignment to the form.
    fieldKeyAccessByForm() {
      const byFieldKey = {};
      for (const fieldKey of this.fieldKeysWithToken)
        byFieldKey[fieldKey.id] = false;

      const byForm = Object.create(null);
      for (const form of this.forms)
        byForm[form.xmlFormId] = { ...byFieldKey };

      for (const assignment of this.formAssignments) {
        const forForm = byForm[assignment.xmlFormId];
        // Skip any assignment whose form is not in this.forms or whose app user
        // is not in this.fieldKeysWithToken.
        if (forForm != null && forForm[assignment.actorId] != null)
          forForm[assignment.actorId] = true;
      }

      return byForm;
    },
    // This may need to change whenever we add a property to the Project or Form
    // class in Backend.
    projectToSave() {
      return {
        name: this.project.name,
        archived: this.project.archived,
        // If there is a form on Backend that is not in this.forms, then at
        // least right now, Backend will return a Problem response. In the
        // future, Backend may delete the form.
        forms: this.forms.map(form => {
          const changes = this.changesByForm[form.xmlFormId];

          const assignments = [];
          const roleId = this.roles.find(role => role.system === 'app-user').id;
          for (const fieldKey of this.fieldKeysWithToken) {
            if (changes.current.fieldKeyAccess[fieldKey.id])
              assignments.push({ actorId: fieldKey.id, roleId });
          }

          return {
            xmlFormId: form.xmlFormId,
            name: form.name,
            state: changes.current.state,
            // If there is an assignment on Backend whose app user is not in
            // this.fieldKeysWithToken, then Backend will delete the assignment.
            assignments
          };
        })
      };
    }
  },
  watch: {
    projectId() {
      this.fetchData(false);
      this.changesByForm = null;
      this.changeCount = 0;
    },
    dataExists: {
      handler(dataExists) {
        if (dataExists) this.initChangesByForm();
      },
      immediate: true
    }
  },
  created() {
    this.fetchData(false);
  },
  methods: {
    fetchData(resend) {
      this.$emit('fetch-forms', resend);
      this.$emit('fetch-field-keys', resend);
      this.$store.dispatch('get', [
        {
          key: 'roles',
          url: '/roles',
          resend: false
        },
        {
          key: 'formAssignments',
          url: `/projects/${this.projectId}/assignments/forms/app-user`,
          resend
        }
      ]).catch(noop);
    },
    // initChangesByForm() initializes this.changesByForm. Contrary to what its
    // name may suggest, this.changesByForm does not store only changes. Rather,
    // it stores two snapshots for each form: one from before the user made any
    // changes, and one that includes any changes. Each snapshot includes the
    // form's state, as well as app user access to the form.
    initChangesByForm() {
      // Using Object.create(null) in case there is a form whose xmlFormId is
      // '__proto__'.
      this.changesByForm = Object.create(null);
      for (const form of this.forms) {
        const fieldKeyAccess = this.fieldKeyAccessByForm[form.xmlFormId];
        this.$set(this.changesByForm, form.xmlFormId, {
          previous: {
            state: form.state,
            fieldKeyAccess
          },
          current: {
            state: form.state,
            fieldKeyAccess: { ...fieldKeyAccess }
          }
        });
      }
    },
    setUnsavedChanges() {
      if (this.changeCount === 0) {
        if (this.$store.state.router.unsavedChanges)
          this.$store.commit('setUnsavedChanges', false);
      } else if (!this.$store.state.router.unsavedChanges) {
        this.$store.commit('setUnsavedChanges', true);
      }
    },
    updateState(form, state) {
      const changes = this.changesByForm[form.xmlFormId];
      const changedBeforeUpdate = changes.current.state !== changes.previous.state;
      changes.current.state = state;
      const changedAfterUpdate = changes.current.state !== changes.previous.state;
      if (changedAfterUpdate !== changedBeforeUpdate) {
        this.changeCount += changedAfterUpdate ? 1 : -1;
        this.setUnsavedChanges();
      }
    },
    updateFieldKeyAccess(form, fieldKey, accessible) {
      const changes = this.changesByForm[form.xmlFormId];
      const changedBeforeUpdate = changes.current.fieldKeyAccess[fieldKey.id] !==
        changes.previous.fieldKeyAccess[fieldKey.id];
      changes.current.fieldKeyAccess[fieldKey.id] = accessible;
      const changedAfterUpdate = accessible !==
        changes.previous.fieldKeyAccess[fieldKey.id];
      if (changedAfterUpdate !== changedBeforeUpdate) {
        this.changeCount += changedAfterUpdate ? 1 : -1;
        this.setUnsavedChanges();
      }
    },
    save() {
      this.put(`/projects/${this.projectId}`, this.projectToSave)
        .then(() => {
          this.fetchData(true);
          this.$alert().success('Your changes have been saved!');
          this.$store.commit('setUnsavedChanges', false);
          this.changesByForm = null;
          this.changeCount = 0;
        })
        .catch(noop);
    }
  }
};
</script>
