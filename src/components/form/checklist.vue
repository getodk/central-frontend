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
  <div v-if="dataExists" id="form-checklist">
    <checklist-step :stage="stepStage(0)">
      <template #title>Publish your first Draft version</template>
      <p>
        <strong>Great work!</strong> You have published your Form. It is ready
        to accept Submissions. If you want to make changes to the Form or its
        Media Files, you can make a new Draft.
        <doc-link to="central-forms/#updating-forms-to-a-new-version">
          Click here to find out more.
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(1)">
      <template #title>Download Form on survey clients and submit data</template>
      <p>
        <template v-if="form.submissions === 0">
          Nobody has submitted any data to this Form yet.
        </template>
        <template v-else-if="form.submissions === 1">
          A total of 1 Submission has been sent to this server.
        </template>
        <template v-else>
          A total of {{ form.submissions.toLocaleString() }} Submissions have
          been sent to this server.
        </template>
        App Users will be able to see this Form on their mobile device to
        download and fill out.
        <template v-if="project.appUsers === 0">
          <strong>You have not created any App Users for this Project yet, so
          nobody will be able to use this Form.</strong> You can create them on
          the
          <router-link :to="projectPath('app-users')">
            <!-- eslint-disable-next-line vue/multiline-html-element-content-newline -->
            App Users tab of the Project page</router-link>.
        </template>
        <template v-else>
          Right now,
          <strong>
            <router-link :to="projectPath('form-access')">
              <!-- eslint-disable-next-line vue/multiline-html-element-content-newline -->
              {{ $pluralize('App User', formActors.length, true) }}</router-link>
          </strong>
          in this Project {{ $pluralize('has', formActors.length) }} access to
          this Form, but you can always
          <router-link :to="projectPath('app-users')">add more</router-link>.
        </template>
        For more information about this,
        <doc-link to="central-submissions/">click here</doc-link>.
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(2)">
      <template #title>Evaluate and analyze submitted data</template>
      <p>
        <template v-if="form.submissions === 0">
          Once there is data for this Form, you can export or synchronize it to
          monitor and analyze the data for quality and results.
        </template>
        <template v-else>
          You can export or synchronize the
          {{ $pluralize('Submission', form.submissions, true) }} on this Form to
          monitor and analyze them for quality and results.
        </template>
        You can do this with the Download and Analyze buttons on the
        <router-link :to="formPath('submissions')">Submissions tab</router-link>.
        <doc-link to="central-submissions/">
          Click here to find out more.
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(3)">
      <template #title>Manage Form retirement</template>
      <p>
        As you come to the end of your data collection, you can use the Form
        State controls on the
        <router-link :to="projectPath('form-access')">
          <!-- eslint-disable-next-line vue/multiline-html-element-content-newline -->
          Form Access tab of the Project page</router-link>
        to control whether, for example, App Users will be able to see or create
        new Submissions to this Form.
        <doc-link to="central-forms/#managing-form-lifecycle">
          Click here to find out more.
        </doc-link>
      </p>
    </checklist-step>
  </div>
</template>

<script>
import ChecklistStep from '../checklist-step.vue';
import DocLink from '../doc-link.vue';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

// The component does not assume that this data will exist when the component is
// created.
const requestKeys = ['project', 'form', 'formActors'];

export default {
  name: 'FormChecklist',
  components: { ChecklistStep, DocLink },
  mixins: [routes()],
  computed: {
    ...requestData(requestKeys),
    dataExists() {
      return this.$store.getters.dataExists(requestKeys);
    },
    // Indicates whether each step is complete.
    stepCompletion() {
      return [
        true,
        this.form.submissions !== 0,
        false,
        this.form.state !== 'open'
      ];
    }
  },
  methods: {
    stepStage(step) {
      if (this.stepCompletion[step]) return 'complete';
      const current = this.stepCompletion.findIndex(isComplete => !isComplete);
      return step === current ? 'current' : 'later';
    }
  }
};
</script>
