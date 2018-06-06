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
  <div class="jumbotron">
    <h1>Page Not Found</h1>
    <p>The page you requested can’t be found. Press your browser’s Back button
    to go back, or click the button below to return to the list of forms:</p>
    <p>
      <router-link to="/forms" class="btn btn-primary btn-lg" role="button">
        Return to forms
      </router-link>
    </p>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
};
</script>
