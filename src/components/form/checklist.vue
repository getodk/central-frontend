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
  <div v-if="dataExists" id="form-checklist">
    <checklist-step :stage="stepStage(0)">
      <template #title>{{ $t('steps[0].title') }}</template>
      <p>
        <strong>{{ $t('steps[0].body[0]') }}</strong>
        {{ $t('steps[0].body[1]') }}
        <doc-link to="central-forms/#updating-forms-to-a-new-version">
          {{ $t('clickForInfo') }}
        </doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(1)">
      <template #title>{{ $t('steps[1].title') }}</template>
      <p>
        {{ $tc('steps[1].body[0]', form.submissions) }}
        {{ $t('steps[1].body[1]') }}
        <template v-if="project.appUsers === 0">
          <strong>{{ $t('steps[1].body[2].none[0]') }}</strong>&nbsp;
          <i18n :path="$tPath('steps[1].body[2].none[1].full')">
            <template #appUsersTab>
              <router-link :to="projectPath('app-users')">{{ $t('steps[1].body[2].none[1].appUsersTab') }}</router-link>
            </template>
          </i18n>
        </template>
        <template v-else>
          <i18n
            :path="$tcPath('steps[1].body[2].any[0].full', formActors.length)">
            <template #countOfAppUsers>
              <router-link :to="projectPath('form-access')">
                <strong>{{ $tc('steps[1].body[2].any[0].countOfAppUsers', formActors.length) }}</strong>
              </router-link>
            </template>
            <template #addMore>
              <router-link :to="projectPath('app-users')">{{ $t('steps[1].body[2].any[0].addMore') }}</router-link>
            </template>
          </i18n>
        </template>
        &nbsp;
        <i18n :path="$tPath('steps[1].body[3].full')">
          <template #clickHere>
            <doc-link to="central-submissions/">{{ $t('steps[1].body[3].clickHere') }}</doc-link>
          </template>
        </i18n>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(2)">
      <template #title>{{ $t('steps[2].title') }}</template>
      <p>
        {{ $tc('steps[2].body[0]', form.submissions) }}
        <i18n :path="$tPath('steps[2].body[1].full')">
          <template #submissionsTab>
            <router-link :to="formPath('submissions')">{{ $t('steps[2].body[1].submissionsTab') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <doc-link to="central-submissions/">{{ $t('clickForInfo') }}</doc-link>
      </p>
    </checklist-step>
    <checklist-step :stage="stepStage(3)">
      <template #title>{{ $t('steps[3].title') }}</template>
      <p>
        <i18n :path="$tPath('steps[3].body[0].full')">
          <template #formAccessTab>
            <router-link :to="projectPath('form-access')">{{ $t('steps[3].body[0].formAccessTab') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <doc-link to="central-forms/#managing-form-lifecycle">
          {{ $t('clickForInfo') }}
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
