<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <user-edit :id="currentUser.id.toString()"/>
</template>

<script>
import UserEdit from '../user/edit.vue';
import { requestData } from '../../store/modules/request';

export default {
  name: 'AccountEdit',
  components: { UserEdit },
  // The component assumes that this data will exist when the component is
  // created.
  computed: requestData(['currentUser'])
};
</script>
