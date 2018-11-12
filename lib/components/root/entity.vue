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
  <div v-if="count != null" class="root-entity">
    <router-link :to="routeTo" class="root-entity-icons-container">
      <span :class="iconClass(0)"></span>
      <span v-if="icons.length > 1" :class="iconClass(1)"></span>
    </router-link>
    <div class="root-entity-count">
      <router-link :to="routeTo">
        {{ count.toLocaleString() }} <span class="icon-angle-right"></span>
      </router-link>
    </div>
    <div class="root-entity-name">
      <router-link :to="routeTo">{{ $pluralize(name, count) }}</router-link>
    </div>
    <div>
      <router-link :to="routeTo">
        <!-- The text in this slot does not change based on `count`, so it must
        support both the singular and plural cases. -->
        <slot></slot>
      </router-link>
    </div>
  </div>
</template>

<script>
import request from '../../mixins/request';

export default {
  mixins: [request()],
  props: {
    name: {
      type: String,
      required: true
    },
    dataFrom: {
      type: String,
      required: true
    },
    routeTo: {
      type: String,
      required: true
    },
    icons: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      requestId: null,
      count: null
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.count = null;
      this
        .get(this.dataFrom)
        .then(({ data }) => {
          this.count = data.length;
          this.$emit('fetched');
        })
        .catch(() => this.$emit('error'));
    },
    iconClass(index) {
      if (index >= this.icons.length) throw new Error('invalid index');
      return [`icon-${this.icons[index]}`];
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

.root-entity {
  padding-bottom: 20px;
  padding-top: 15px;

  a {
    color: unset;
    text-decoration: unset;
  }

  .root-entity-icons-container {
    float: left;

    span:first-child {
      font-size: 56px;
      margin-right: 0;
    }

    span:nth-child(2) {
      font-size: 20px;
      position: relative;
      right: 11px;
      top: 11px;
    }
  }

  div {
    margin-left: 80px;

    &.root-entity-count {
      font-size: 30px;
      line-height: 1;

      .icon-angle-right {
        color: $color-accent-primary;
        font-size: 20px;
        margin-right: 0;
        vertical-align: 2px;
      }
    }

    &.root-entity-name {
      font-size: 18px;
    }
  }
}
</style>
