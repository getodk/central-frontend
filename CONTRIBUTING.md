<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
# Contributing to ODK Central Frontend

## Contributing Code

### Vue

We use Vue.js along with Vue Router and Vuex.

### jQuery

ODK Central Frontend uses jQuery in limited ways.

Wherever possible, we try to use Vue instead of jQuery. Vue will not always know about or respect the changes that jQuery makes, and using jQuery can add complexity to a component. It can also add complexity to testing: for example, we generally use avoriaz for testing, but if you use jQuery in a component, then in testing, you may need to use jQuery's `trigger()` method rather than avoriaz's `trigger()` method.

That said, there are a couple of occasions in which we reach for jQuery:

- We use some of Bootstrap's jQuery plugins.
- avoriaz does not allow you to mock events. However, jQuery does, so we sometimes use jQuery in order to facilitate testing.

One thing to keep in mind when using jQuery is that you will have to manually remove any jQuery listeners and data, perhaps when the component is destroyed.

If possible despite our use of Bootstrap, we may wish to remove jQuery from Frontend in the future. For that reason, if you have a choice between using jQuery and vanilla JavaScript, you should consider using the latter. Remember though that as with jQuery, Vue will not always know about or respect the changes that you make using vanilla JavaScript.

### Bootstrap

ODK Central Frontend uses Bootstrap 3. (However, we are considering [moving to Bootstrap 4](https://github.com/opendatakit/central-frontend/issues/142). Let us know if that is something you can help with!)

Frontend's [global styles](/src/assets/scss/app.scss) override some of Bootstrap's, as do the styles of Frontend components that correspond to a Bootstrap component (for example, `Modal`). However, we tend to stick pretty closely to Bootstrap, and you should be able to use most of Bootstrap's examples with only small changes. If you are creating a new component that is similar to an existing one, you may find it useful to base the new component off the existing one.

We use some, but not all, of Bootstrap's jQuery plugins. We try to limit our use of Bootstrap's plugins, because they use jQuery, and jQuery tends to add complexity to components and testing in the ways described above. For example, if you use a Bootstrap plugin, then in testing, you may need to use jQuery's `trigger()` method rather than avoriaz's.

### HTTP Requests

We use axios to send requests. We set `Vue.prototype.$http` to `axios`, so components can use `this.$http` rather than importing `axios`. However, components rarely even need to access `this.$http` directly. Most of the time, to send a GET request, you can use the `request` module of the Frontend Vuex store; to send a non-GET request, you can use the `request` mixin. The module and mixin both accept options and complete common tasks like error handling.

### Presenter Classes

Many ODK Central Backend resources have an associated presenter class in Frontend ([`/src/presenters`](/src/presenters)). This class extends the [base presenter class](/src/presenters/base.js). When you use the `request` module of the Vuex store to send a GET request, then if there is a presenter class associated with the response data, the store will automatically wrap the response data within a presenter object.

### Learning About a Component

To learn how a given component works, one of the best places to start is how the component communicates with its parent component:

- Does the component have props?
- Does it have slots?
- Does it emit events?

### Component Names

We specify a name for every component, which facilitates the use of the Vue devtools.

If no name is specified for a bottom-level route, it is given the same name as its component. See [`router.js`](/src/router.js) for details.

### Vue Mixins

Each component may use one or more mixins. Each file in [`/src/mixins/`](/src/mixins/) exports a mixin factory for a single type of mixin. (We use factories so that the component can pass in options for the mixin.)

### Router

We support a number of route meta fields, which we document in [`/src/router.js`](/src/router.js). The router contains a fair amount of logic, which is driven largely by the meta fields.

We also store router state in the Vuex store (see [`/src/store/modules/router.js`](/src/store/modules/router.js)). Some router-related utilities are defined in [`/src/util/router.js`](/src/util/router.js), and components can access router-related methods by using the `routes` mixin ([`/src/mixins/routes.js`](/src/mixins/routes.js)).

### Styles

ODK Central Frontend uses Sass.

Frontend implements a set of [global styles](/src/assets/scss/app.scss). Beyond that, we use Vue single file components, so you will find a component's styles in the same file as its HTML and JavaScript.

Frontend does not use Vue scoped CSS. Scoped CSS seems a little ✨magical✨, making it actually harder to reason about components.

Instead of scoped CSS, use `id` and `class` attributes to style components:

- To avoid conflicts, prefix the value of an `id` attribute with the component's name (in kebab case).
- Do the same for any `class` attribute. (The exception to this is if a class is always selected in combination with an id. For example, if a component named `ProjectOverview` uses a class for some links, the class can be `styled-link` instead of `project-overview-styled-link` if it is selected as `#project-overview .styled-link`.)
- If the root element of a component has an `id` or `class` attribute, its value should be the same as the component's name (in kebab case).

### Standard Actions

Certain actions are standardized across ODK Central Frontend.

#### Standard Button Things

If the user clicks a button that performs a server-side action, then during the request:

* The button should be disabled.
* A spinner should appear within the button.
* If the button is within a modal, then in most cases, the user should not be able to hide the modal.

Once the request completes:

* An alert should be shown indicating the result of the request. The alert should persist on-screen in the case that performing the button's operation also navigates to another page.

You can use `mockHttp().standardButton()` to test some of these things for a particular form.

#### Standard Form Things

* When a form is presented to the user, the first enabled field should be focused.
* Each field should have a label.
* For each field, the user should see a clear indication as to whether the field is required.
  * If a field is required, add an asterisk to its label and its placeholder.
* If the user submits a form with an invalid field, the user should be informed about the validation error.
  * If the user resubmits the form, and it is invalid for a different reason, the user should be informed about the new validation error.
