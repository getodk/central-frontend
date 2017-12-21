<template>
  <p v-show="show" class="text-center text-muted">Loading…</p>
</template>

<script>
export default {
  name: 'Loading',
  props: {
    // true if the app is loading data and false if not
    state: Boolean
  },
  data() {
    return {
      // `show` is `true` if the loading message is shown and `false` if not.
      // It lags behind `state` by a short interval so that the loading message
      // does not flicker if the server responds immediately.
      show: false
    };
  },
  watch: {
    state: 'toggleMessage'
  },
  mounted() {
    this.toggleMessage();
  },
  methods: {
    toggleMessage() {
      if (this.state === true) {
        setTimeout(() => {
          if (this.state === true) this.show = true;
        }, 250);
      } else {
        this.show = false;
      }
    }
  }
};
</script>
