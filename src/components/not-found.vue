<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="row">
    <div class="col-xs-12 col-sm-offset-3 col-sm-6">
      <div class="panel panel-default panel-main">
        <div class="panel-heading">
          <h1 class="panel-title">{{ $t('title') }}</h1>
        </div>
        <div class="panel-body">
          <p>{{ $t('body') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound'
};
</script>

<i18n lang="json5">
{
  "en": {
    "title": "Page Not Found",
    "body": "The page you requested could not be found."
  }
}
</i18n>
