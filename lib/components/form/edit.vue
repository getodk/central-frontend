<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="form-edit" class="panel panel-simple">
    <div class="panel-heading"><h1 class="panel-title">Form Stage</h1></div>
    <div class="panel-body">
      <form>
        <fieldset :disabled="awaitingResponse">
          <div class="radio">
            <label>
              <input :checked="state === 'open'" type="radio" value="open"
                @change="changeState('open')">
              <div>
                <strong>Open</strong>
                <span>
                  <spinner :state="awaitingResponse && state === 'open'"/>
                </span>
              </div>
              <div>
                This form is available to download onto mobile devices and
                accepts new submissions.
              </div>
            </label>
          </div>
          <div class="radio">
            <label>
              <input :checked="state === 'closing'" type="radio" value="closing"
                @change="changeState('closing')">
              <div>
                <strong>Closing</strong>
                <span>
                  <spinner :state="awaitingResponse && state === 'closing'"/>
                </span>
              </div>
              <div>
                This form accepts new submissions, but is <em>not available</em>
                to download onto mobile devices.
              </div>
            </label>
          </div>
          <div class="radio">
            <label>
              <input :checked="state === 'closed'" type="radio" value="closed"
                @change="changeState('closed')">
              <div>
                <strong>Closed</strong>
                <span>
                  <spinner :state="awaitingResponse && state === 'closed'"/>
                </span>
              </div>
              <div>
                This form is not available to download onto mobile devices, nor
                does it accept new submissions.
              </div>
            </label>
          </div>
        </fieldset>
      </form>
    </div>
  </div>
</template>

<script>
import alert from '../../mixins/alert';
import request from '../../mixins/request';

export default {
  name: 'FormEdit',
  mixins: [alert(), request()],
  props: {
    form: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      state: this.form.state
    };
  },
  watch: {
    alert() {
      this.$emit('alert', this.alert);
    }
  },
  methods: {
    changeState(newState) {
      this.state = newState;
      this
        .patch(`/forms/${this.form.xmlFormId}`, { state: this.state })
        .then(() => {
          this.alert = alert.success('Form settings saved!');
        })
        .catch(() => {});
    }
  }
};
</script>

<style lang="sass">
#form-edit .radio span {
  margin-left: 20px;
  position: relative;
}
</style>
