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
      <button type="button" class="btn btn-primary"
        :class="{ 'uncommitted-change': changeCount !== 0 }"
        :disabled="saveDisabled" @click="save">
        <span class="icon-floppy-o"></span>Save
      </button>
      <p>
        Here you can set Form States, which control whether Forms are available
        for download and open for submission. You can also separately control
        which App Users may see each Form at all. For more information,
        <doc-link to="central-projects/#managing-form-workflow">click here</doc-link>.
      </p>
    </div>

    <loading :state="initiallyLoading"/>
    <project-form-workflow-table v-if="dataExists"
      :changes-by-form="changesByForm" @update:state="updateState"
      @update:access="updateAccess" @show-states="showModal('states')"/>

    <project-form-workflow-states v-bind="states" @hide="hideModal('states')"/>
  </div>
</template>

<script>
import ProjectFormWorkflowStates from './form-workflow/states.vue';
import ProjectFormWorkflowTable from './form-workflow/table.vue';
import modal from '../../mixins/modal';
import request from '../../mixins/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

const REQUEST_KEYS = ['roles', 'project', 'forms', 'fieldKeys', 'formAssignments'];

export default {
  name: 'ProjectFormWorkflow',
  components: { ProjectFormWorkflowStates, ProjectFormWorkflowTable },
  mixins: [modal(), request()],
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
      // The Form States modal
      states: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(REQUEST_KEYS),
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
    // Returns an object that maps each form's xmlFormId to an "access object"
    // for the form. The access object indicates whether each app user has an
    // assignment to the form. It has a property for every app user, even those
    // without an assignment to the form.
    accessByForm() {
      const byFieldKey = {};
      for (const fieldKey of this.fieldKeys)
        byFieldKey[fieldKey.id] = false;

      const byForm = Object.create(null);
      for (const form of this.forms)
        byForm[form.xmlFormId] = { ...byFieldKey };

      for (const assignment of this.formAssignments) {
        const forForm = byForm[assignment.xmlFormId];
        // Skip any assignment whose form is not in this.forms or whose app user
        // is not in this.fieldKeys.
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
          const { xmlFormId } = form;
          const roleId = this.roles['app-user'].id;
          for (const fieldKey of this.fieldKeys) {
            if (changes.current.access[fieldKey.id])
              assignments.push({ actorId: fieldKey.id, xmlFormId, roleId });
          }

          return {
            xmlFormId,
            name: form.name,
            state: changes.current.state,
            // If there is an assignment on Backend whose app user is not in
            // this.fieldKeys, then Backend will delete the assignment.
            assignments
          };
        })
      };
    }
  },
  watch: {
    projectId() {
      this.fetchData();
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
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.$emit('fetch-forms', false);
      this.$emit('fetch-field-keys', false);
      this.$store.dispatch('get', [
        {
          key: 'roles',
          url: '/roles',
          resend: false
        },
        {
          key: 'formAssignments',
          url: `/projects/${this.projectId}/assignments/forms/app-user`,
          resend: false
        }
      ]).catch(noop);
    },
    initChangesByForm() {
      // Using Object.create(null) in case there is a form whose xmlFormId is
      // '__proto__'.
      this.changesByForm = Object.create(null);
      for (const form of this.forms) {
        const access = this.accessByForm[form.xmlFormId];
        this.$set(this.changesByForm, form.xmlFormId, {
          previous: {
            state: form.state,
            access
          },
          current: {
            state: form.state,
            access: { ...access }
          }
        });
      }
    },
    checkForUnsavedChanges() {
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
        this.checkForUnsavedChanges();
      }
    },
    updateAccess(form, fieldKey, accessible) {
      const changes = this.changesByForm[form.xmlFormId];
      const changedBeforeUpdate = changes.current.access[fieldKey.id] !==
        changes.previous.access[fieldKey.id];
      changes.current.access[fieldKey.id] = accessible;
      const changedAfterUpdate = accessible !== changes.previous.access[fieldKey.id];
      if (changedAfterUpdate !== changedBeforeUpdate) {
        this.changeCount += changedAfterUpdate ? 1 : -1;
        this.checkForUnsavedChanges();
      }
    },
    updateRequestData() {
      let assignmentsChanged = false;
      for (let i = 0; i < this.forms.length; i += 1) {
        const form = this.forms[i];
        const changes = this.changesByForm[form.xmlFormId];

        // Update this.forms if the form's state has changed.
        if (changes.current.state !== changes.previous.state) {
          this.$store.commit('setDataProp', {
            key: 'forms',
            prop: i,
            value: form.with({
              state: changes.current.state,
              // This may differ slightly from the value of updatedAt on the
              // server.
              updatedAt: new Date().toISOString()
            })
          });
        }

        // Check whether the form's assignments have changed.
        if (!assignmentsChanged) {
          for (const fieldKey of this.fieldKeys) {
            if (changes.current.access[fieldKey.id] !==
              changes.previous.access[fieldKey.id]) {
              assignmentsChanged = true;
              break;
            }
          }
        }
      }

      if (assignmentsChanged) {
        const assignments = [];
        const roleId = this.roles['app-user'].id;
        for (const form of this.forms) {
          const { xmlFormId } = form;
          const changes = this.changesByForm[xmlFormId];
          for (const fieldKey of this.fieldKeys) {
            if (changes.current.access[fieldKey.id])
              assignments.push({ actorId: fieldKey.id, xmlFormId, roleId });
          }
        }
        this.$store.commit('setData', {
          key: 'formAssignments',
          value: assignments
        });
      }
    },
    save() {
      if (this.roles['app-user'] == null) {
        this.$alert().danger('Information is missing about the App User role.');
        return;
      }

      this.put(`/projects/${this.projectId}`, this.projectToSave)
        .then(() => {
          this.$alert().success('Your changes have been saved!');
          this.updateRequestData();
          this.$store.commit('setUnsavedChanges', false);
          this.initChangesByForm();
          this.changeCount = 0;
        })
        .catch(noop);
    }
  }
};
</script>
