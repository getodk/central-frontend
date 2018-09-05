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
  <div id="form-overview">
    <loading :state="awaitingResponse"/>
    <div v-if="fieldKeyCount !== null" class="panel panel-simple">
      <div class="panel-heading"><h1 class="panel-title">Checklist</h1></div>
      <div class="panel-body">
        <form-overview-step :stage="stepStage(0)">
          <template slot="title">Create and upload form</template>
          <p>
            <strong>Great work!</strong> Your form design has been loaded
            successfully. It is ready to accept submissions. You will have to
            start over with a new form if you wish to make changes to the form
            questions.
            <doc-link to="central-forms/#uploading-a-form-to-odk-central">
              Click here to find out more.
            </doc-link>
          </p>
        </form-overview-step>
        <!-- Using v-show rather than v-if so that the number of steps is
        consistent, which makes testing easier. -->
        <form-overview-step v-show="attachments.length !== 0"
          :stage="stepStage(1)">
          <template slot="title">Upload form media files</template>
          <p>
            Your form design references files that we need in order to present
            your form. You can upload these for distribution under the
            <router-link :to="formPath('media-files')">Media Files</router-link>
            tab. If you change your mind or make a replace, you can always
            replace the files.
            <doc-link to="central-forms/#forms-with-attachments">
              Click here to find out more.
            </doc-link>
          </p>
        </form-overview-step>
        <form-overview-step :stage="stepStage(2)">
          <template slot="title">Download form on survey clients and submit data</template>
          <p>
            <template v-if="form.submissions === 0">
              Nobody has submitted any data to this form yet.
            </template>
            <template v-else>
              A total of {{ form.submissions.toLocaleString() }}
              {{ $pluralize('submission', form.submissions) }}
              {{ $pluralize('has', form.submissions) }} been sent to this
              server.
            </template>
            App Users will be able to see this form on their mobile device to
            download and fill out.
            <template v-if="fieldKeyCount === 0">
              <strong>You do not have any App Users on this server yet, so
              nobody will be able to use this form.</strong> You can create them
              on the <router-link to="/users/field-keys">App Users tab of the
              Users settings</router-link>.
            </template>
            <template v-else>
              Right now, you have
              <router-link to="/users/field-keys">
                <strong>{{ fieldKeyCount.toLocaleString() }} App Users</strong>
              </router-link>
              on this server, but you can always add more.
            </template>
            <doc-link to="central-submissions/">
              Click here to find out more.
            </doc-link>
          </p>
        </form-overview-step>
        <form-overview-step :stage="stepStage(3)">
          <template slot="title">Evaluate and analyze submitted data</template>
          <p>
            <template v-if="form.submissions === 0">
              Once there is data for this form, you can export or synchronize it
              to monitor and analyze the data for quality and results.
            </template>
            <template v-else>
              You can export or synchronize the
              {{ form.submissions.toLocaleString() }}
              {{ $pluralize('submission', form.submissions) }} on
              this form to monitor and analyze them for quality and results.
            </template>
            You can do this with the Download and Analyze buttons on the
            <router-link :to="formPath('submissions')">Submissions tab</router-link>.
            <doc-link to="central-submissions/">
              Click here to find out more.
            </doc-link>
          </p>
        </form-overview-step>
        <form-overview-step :stage="stepStage(4)" last>
          <template slot="title">Manage form retirement</template>
          <p>
            As you come to the end of your data collection project, you can use
            the Form Lifecycle controls on
            <router-link :to="formPath('settings')">
              this form’s Settings tab
            </router-link>
            to control whether, for example, App Users will be able to see or
            create new submissions to this form.
            <doc-link to="central-forms/#managing-form-lifecycle">
              Click here to find out more.
            </doc-link>
          </p>
        </form-overview-step>
      </div>
    </div>
  </div>
</template>

<script>
import FormOverviewStep from './overview-step.vue';
import request from '../../mixins/request';

export default {
  name: 'FormOverview',
  components: { FormOverviewStep },
  mixins: [request()],
  props: {
    form: {
      type: Object,
      required: true
    },
    attachments: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      requestId: null,
      fieldKeyCount: null
    };
  },
  computed: {
    // Returns true if all form attachments exist and false if not. Returns true
    // if there are no form attachments.
    allAttachmentsExist() {
      return this.attachments.every(attachment => attachment.exists);
    },
    // Indicates whether each step is complete.
    stepCompletion() {
      return [
        true,
        this.allAttachmentsExist,
        this.form.submissions !== 0,
        false,
        this.form.state !== 'open'
      ];
    },
    currentStep() {
      return this.stepCompletion.findIndex(isComplete => !isComplete);
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.fieldKeyCount = null;
      this
        .get('/field-keys')
        .then(({ data }) => {
          this.fieldKeyCount = data.length;
        })
        .catch(() => {});
    },
    stepStage(step) {
      if (step === this.currentStep) return 'current';
      if (this.stepCompletion[step]) return 'complete';
      return 'later';
    },
    formPath(suffix) {
      return `/forms/${this.form.xmlFormId}/${suffix}`;
    }
  }
};
</script>
