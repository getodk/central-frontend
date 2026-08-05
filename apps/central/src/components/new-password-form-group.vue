<template>
  <form-group v-model="model" type="password" required
    :has-error="hasError || tooShort" autocomplete="new-password">
    <template #after>
      <password-strength v-if="strengthMeter" :score="passwordStrength"/>
    </template>
  </form-group>
</template>

<script>
import FormGroup from '../../form-group.vue';
import PasswordStrength from '../../password-strength.vue';

export default {
  name: 'NewPaswordFormGroup',
  components: { FormGroup, PasswordStrength },
  inject: ['alert', 'config'],
  setup() {
  },
  data() {
    return {
      tooShort: false,
    };
  },
  methods: {
    validate() {
      // TODO why not trigger this while typing?
      this.tooShort = false;
      this.mismatch = false;

      this.passwordStrength = (() => {
        const { length } = this.model;
        if (length === 0) return 0;
        if (length < 8) return 1;
        if (length < 10) return 2;
        if (length < 12) return 3;
        if (length < 14) return 4;
        return 5;
      })();

      if (this.model.length < 10) {
        // TODO allow for passphraseTooShort as well (or just use a more generic message, like "too short")
        this.alert.danger(this.$t('alert.passwordTooShort'));
        this.tooShort = true;
        return false;
      }

      return true;
    },
  }
};
</script>
