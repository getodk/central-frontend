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
  <div>
    <nav class="navbar navbar-default">
      <div class="container-fluid">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed"
            data-toggle="collapse" data-target=".navbar-collapse"
            aria-expanded="false">
            <span class="sr-only">{{ $t('action.toggle') }}</span>
            <span class="navbar-icon-bar"></span>
            <span class="navbar-icon-bar"></span>
            <span class="navbar-icon-bar"></span>
          </button>
          <!--<img src="/logo.png" alt="">-->
          <router-link to="/" class="navbar-brand"><img src="/logo-b.png" alt=""> ODK Central | ARCED</router-link>
        </div>
        <div class="collapse navbar-collapse">
          <navbar-links v-if="visiblyLoggedIn"/>
          <div class="navbar-right">
            <a v-show="showsAnalyticsNotice" id="navbar-analytics-notice"
              href="#" @click.prevent="analyticsIntroduction.show()">
              {{ $t('analyticsNotice') }}
            </a>
            <ul class="nav navbar-nav">
              <navbar-help-dropdown/>
              <navbar-locale-dropdown/>
              <navbar-actions/>
            </ul>
          </div>
        </div>
      </div>
    </nav>
    <analytics-introduction v-if="config.loaded && config.showsAnalytics"
      v-bind="analyticsIntroduction" @hide="analyticsIntroduction.hide()"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import NavbarActions from './navbar/actions.vue';
import NavbarHelpDropdown from './navbar/help-dropdown.vue';
import NavbarLinks from './navbar/links.vue';
import NavbarLocaleDropdown from './navbar/locale-dropdown.vue';

import useRoutes from '../composables/routes';
import { loadAsync } from '../util/load-async';
import { modalData } from '../util/reactivity';
import { useRequestData } from '../request-data';

export default {
  name: 'Navbar',
  components: {
    AnalyticsIntroduction: defineAsyncComponent(loadAsync('AnalyticsIntroduction')),
    NavbarActions,
    NavbarHelpDropdown,
    NavbarLinks,
    NavbarLocaleDropdown
  },
  inject: ['config', 'visiblyLoggedIn'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { currentUser, analyticsConfig } = useRequestData();
    const { canRoute } = useRoutes();
    return { currentUser, analyticsConfig, canRoute };
  },
  data() {
    return {
      analyticsIntroduction: modalData('AnalyticsIntroduction')
    };
  },
  computed: {
    showsAnalyticsNotice() {
      return this.config.loaded && this.config.showsAnalytics && this.visiblyLoggedIn &&
        this.canRoute('/system/analytics') && this.analyticsConfig.dataExists &&
        this.analyticsConfig.isEmpty() &&
        Date.now() - Date.parse(this.currentUser.createdAt) >= /* 14 days */ 1209600000;
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';

$border-height: 3px;

.navbar-default {
 /* background-color: $color-accent-primary; */
  background-color: #facb1e;
  border: none;
 // border-top: $border-height solid $color-accent-secondary;
 // box-shadow: 0 $border-height 0 #dedede;
  height: 42px + $border-height;
  margin-bottom: 0;
  min-height: auto;

  .navbar-brand {
    float: left;
    /*font-size: $font-size-btn;*/
    font-size: 16px !important; //new add
    font-weight: bold;
    height: auto;
    letter-spacing: -0.02em;
    line-height: 20px;
    padding: 14px 15px;

    &, &:hover, &:focus { color: #000000; }

    &:focus {
      background-color: transparent;
      text-decoration: none;
    }
  }

  .navbar-nav {
    //font-size: $font-size-btn;
    font-size: 16px !important;

    > li > a {
      &, &:hover, &:focus { color: #000000; }
    }
  }
}

#navbar-analytics-notice {
  @include text-link;
  background-color: #ffed88;
  border: 1px solid #e39941;
  float: left;
  font-size: 10px;
  margin-top: 6px;
  margin-right: 30px;
  padding: 1px 3px;

  &:hover, &:focus {
    background-color: #ffdc1c;
    border-color: #ffed88;
  }
}

// Navbar is not collapsed.
@media (min-width: 768px) {
  .navbar-default {
    border-radius: 0;
    margin-left: 50px !important; //new add
    .navbar-brand { margin-left: -12px; } //25px

    .navbar-nav {
      //margin-top: -1 * $border-height;
       margin-top: 4px;

      > li > a {
       /* border-top: transparent solid $border-height; */
       border-top: transparent solid 0px;
        padding: 5px 10px;
        transition: 0.25s border-top-color;

        &:hover {
          border-top-color: transparentize(#fff, 0.3);
          transition-duration: 0s;
        }

        &:focus {
          border-top-color: transparentize(#fff, 0.15);
          //box-shadow: 0 3px 0 transparentize(#000, 0.9);
          outline: none;
          transition-duration: 0s;
        }
      }

      .active > a, .open > a {
        box-shadow: 0 0 6px transparentize(#e51479, 0.7) inset;

        &, &:hover, &:focus {
          background-color: #181616;
         /* border-top-color: #fff; */
          color: #ffffff !important;
          border-radius: 5px;
        }
      }
    }
  }


  .navbar-right {
    // Counters the 15px padding of .navbar-collapse and the 15px padding of
    // .container-fluid. The Bootstrap default is -15px.
    margin-right: -22px;
    padding-top: 2px !important; //new add
  }

  #navbar-actions { margin-left: 10px;color: #000000; }
/////new/////
  #navbar-actions>a:focus { border-radius: 5px; background-color: #000000; }

  #navbar-actions>a:focus {
    color: #ffffff !important;
 }

////end//////
  /* The toggle button is hidden when the navbar is not collapsed. */
  #navbar-links{
    padding-top: 3px !important;
  }
  ///// new add
  #navbar-links #navbar-links-users {
        margin-left: 20px;
    }
}

// Navbar is collapsed.
@media (max-width: 767px) {
  .navbar-default {
    margin-left: 50px; //new add
    .navbar-toggle {
      padding: 15px 15px !important; //new add
      border: none;
      margin: -2px 5px;

      &:hover, &:focus { background-color: inherit; }

      .navbar-icon-bar { background-color: #000000; }
    }

    .navbar-collapse {
      /*background-color: $color-accent-secondary;*/
      background-color: #f7f7f7;
      border: none;
      position: relative;
      z-index: 99;
      margin-left: -72px !important; //new add
      top: -2px !important; //new add
    }

    .navbar-nav {
      margin-top: 0;

      .active > a, .open > a {
        //border-left: $border-height solid #fff;
        border-left: 0px solid #fff;
        padding-left: 15px - $border-height;

        &, &:hover, &:focus {
          //background-color: $color-accent-secondary;
          background-color:#e0e0e0 ; // new added
          color: #000000;
        }
      }

      .open .dropdown-menu > li > a {
        &, &:hover, &:focus { color: #000000; font-size: 14px;}
      }
    }
  }

  #navbar-analytics-notice { display: none; }
}


/***********logo add******************/

img { width: 46px !important; height: 46px !important; position: absolute !important; top: 0px !important; left: -50px !important;padding: 2px; }

.dropdown-menu {
    font-size: 14px !important;
    min-width: 150px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // Used by screen readers to describe the button used to show or hide the navigation bar on small screens ("hamburger menu").
      "toggle": "Toggle navigation"
    },
    "analyticsNotice": "Help improve Central!"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "toggle": "Přepnout navigaci"
    },
    "analyticsNotice": "Pomozte zlepšit Central!"
  },
  "de": {
    "action": {
      "toggle": "Navigation umschalten"
    },
    "analyticsNotice": "Hilf Central zu verbessern!"
  },
  "es": {
    "action": {
      "toggle": "Alternar la navegación"
    },
    "analyticsNotice": "Ayuda a mejorar Central"
  },
  "fr": {
    "action": {
      "toggle": "Basculer la navigation"
    },
    "analyticsNotice": "Aidez à améliorer Central !"
  },
  "id": {
    "action": {
      "toggle": "Navigasi Toggle"
    },
    "analyticsNotice": "Bantu Memperbaiki Central!"
  },
  "it": {
    "action": {
      "toggle": "Attiva/disattiva navigazione"
    },
    "analyticsNotice": "Aiuta a migliorare Central"
  },
  "ja": {
    "action": {
      "toggle": "ナビゲーションを有効化"
    },
    "analyticsNotice": "Centralの改善を支援！"
  },
  "pt": {
    "action": {
      "toggle": "Ocultar ou exibir a barra de navegação"
    },
    "analyticsNotice": "Ajude a melhorar o Central!"
  },
  "sw": {
    "action": {
      "toggle": "Geuza urambazaji"
    },
    "analyticsNotice": "Saidia kuboresha Central"
  },
  "zh-Hant": {
    "action": {
      "toggle": "切換導航鈕"
    },
    "analyticsNotice": "幫忙改善 Central!"
  }
}
</i18n>
