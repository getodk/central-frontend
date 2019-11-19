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

### HTTP Requests

We use axios to send requests. We set `Vue.prototype.$http` to `axios`, so components can use `this.$http` rather than importing `axios`. However, components rarely even need to access `this.$http` directly. Most of the time, to send a GET request, you can use the `request` module of the Frontend Vue store; to send a non-GET request, you can use the `request` mixin. The module and mixin both accept options and complete common tasks like error handling.

### Component Names

We specify a name for every component, which facilitates the use of the Vue devtools.

If no name is specified for a bottom-level route, it is given the same name as its component. See [`router.js`](/src/router.js) for details.

### Mixins

Each component may use one or more mixins. Each file in [`/src/mixins/`](/src/mixins/) exports a mixin factory for a single type of mixin. (We use factories so that the component can pass in options for the mixin.)

### Standard Actions

Certain actions are standardized across Frontend.

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
