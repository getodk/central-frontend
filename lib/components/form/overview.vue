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
        <div class="form-overview-step">
          <p class="text-success">
            <span class="icon-check-circle"></span>Create and upload form
          </p>
          <p>
            <strong>Great work!</strong> Your form design has been loaded
            successfully. It is ready to accept submissions. You will have to
            start over with a new form if you wish to make changes to the form
            questions.
          </p>
        </div>
        <hr>
        <div class="form-overview-step">
          <p :class="textSuccess(form.submissions !== 0)">
            <span :class="textMuted(form.submissions === 0)"
              class="icon-check-circle">
            </span>Download form on survey clients and submit data
          </p>
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
          </p>
        </div>
        <hr>
        <div class="form-overview-step">
          <p :class="textMuted(form.submissions === 0)">
            <span class="icon-check-circle text-muted"></span>Evaluate and
            analyze submitted data
          </p>
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
          </p>
        </div>
        <hr>
        <div class="form-overview-step">
          <p :class="textSuccessElseMuted(form.state !== 'open')">
            <span class="icon-check-circle"></span>Manage form retirement
          </p>
          <p>
            As you come to the end of your data collection project, you can use
            the Form Lifecycle controls on
            <router-link :to="formPath('settings')">
              this form’s Settings tab
            </router-link>
            to control whether, for example, App Users will be able to see or
            create new submissions to this form.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import request from '../../mixins/request';

export default {
  name: 'FormOverview',
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
    textSuccess(state) {
      return { 'text-success': state };
    },
    textMuted(state) {
      return { 'text-muted': state };
    },
    textSuccessElseMuted(isSuccess) {
      return { 'text-success': isSuccess, 'text-muted': !isSuccess };
    },
    formPath(suffix) {
      return `/forms/${this.form.xmlFormId}/${suffix}`;
    }
  }
};
</script>

<style lang="sass">
.form-overview-step {
  p {
    margin-left: 21px;
    line-height: 17px;
    max-width: 565px;

    &:first-child {
      font-weight: bold;
      margin-left: 0;
      margin-bottom: 5px;

      .icon-check-circle {
        display: inline-block;
        font-size: 17px;
        vertical-align: -2px;
        width: 21px;
      }
    }
  }
}
</style>
