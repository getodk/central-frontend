<template>
  <div>
    <a id="show-foo" href="#" @click.prevent="show($event, 'foo')">Shows "foo"</a>
    <a id="show-bar" href="#" @click.prevent="show($event, 'bar')">Shows "bar"</a>
    <a id="hide" href="#" @click.prevent>Hides the popover</a>

    <popover :target="popover.target" placement="left" @hide="hide">
      <p>{{ popover.text }}</p>
    </popover>
  </div>
</template>

<script>
import Popover from '../../../src/components/popover.vue';

export default {
  name: 'TestUtilPopoverLinks',
  components: { Popover },
  data() {
    return {
      popover: {
        target: null,
        text: ''
      }
    };
  },
  methods: {
    show(event, text) {
      this.popover.target = event.target;
      this.popover.text = text;
    },
    hide() {
      this.popover.target = null;
      this.popover.text = '';
    }
  }
};
</script>
