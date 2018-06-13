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
# ODK Central Frontend

![Platform](https://img.shields.io/badge/platform-Vue.js-blue.svg)
[![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build status](https://circleci.com/gh/opendatakit/central-frontend.svg?style=shield)](https://circleci.com/gh/opendatakit/central-frontend)

ODK Central Frontend uses Vue.js to provide the frontend for [ODK Central](https://github.com/opendatakit/central). It is currently under development.

## Setting up your development environment

Install npm, then install Node package dependencies with `npm install`.

Install NGINX. Depending on your OS and how you install NGINX, you may need to change the absolute paths in ODK Central Frontend's [`nginx.conf`](/nginx.conf).

You will also need to set up [ODK Central Backend](https://github.com/opendatakit/central-backend).

## Running in development

Follow these instructions to run ODK Central Frontend in development. For deploying to production, see the next section.

First, run ODK Central Backend.

Next, build ODK Central Frontend files for development by running `npm run dev`. The files will be outputted to `dist/`, and hot reload will be available. For more details on this command, see the [documentation for vueify](https://github.com/vuejs/vueify).

Finally, run NGINX by changing the working directory to the root directory of the repository, then typing the following:

```bash
nginx -c "$PWD/nginx.conf" -p "$PWD/"
```

We specify `-p "$PWD/"` so that relative paths in [`nginx.conf`](/nginx.conf) are relative to the root directory of the repository.

NGINX effectively places ODK Central Frontend and ODK Central Backend at the same origin, avoiding cross-origin requests.

ODK Central Frontend will be available on port 8989.

## Deploying to production

To build ODK Central Frontend files for production with minification, run `npm run build`. The files will be outputted to `dist/`. For more details on this command, see the [documentation for vueify](https://github.com/vuejs/vueify).

For more information on deploying to production, see the [ODK Central repository](https://github.com/opendatakit/central).

## Testing

To run unit tests, type `npm test`.

For linting, type `npm run lint`. We use [ESLint](https://eslint.org/) with [rules](/.eslintrc.json) based on the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript).
