<template>
  <div></div>
</template>

<script>
import request from '../../../src/mixins/request';

export default {
  name: 'TestUtilRequest',
  mixins: [request()],
  data() {
    return {
      awaitingResponse: false
    };
  }
};
</script>
