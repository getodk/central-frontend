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
# ODK Central Frontend

![Platform](https://img.shields.io/badge/platform-Vue.js-blue.svg)
[![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build status](https://circleci.com/gh/getodk/central-frontend.svg?style=shield)](https://circleci.com/gh/getodk/central-frontend)

ODK Central Frontend uses Vue.js to provide the frontend for [ODK Central](https://github.com/getodk/central). It is currently [under development](https://forum.getodk.org/t/whats-coming-in-central-over-the-next-few-years/19677).

## Setting up your development environment

First, install Node.js 12+.

Next, install dependencies by running `npm install`.

Install NGINX. Depending on your operating system and how you install NGINX, you may need to change the absolute paths in the development [`nginx.conf`](/nginx.conf).

You will also need to set up [ODK Central Backend](https://github.com/getodk/central-backend).

## Running in development

Follow these instructions to run ODK Central Frontend in development. For deploying to production, see the next section.

First, run ODK Central Backend. If you haven't already, you will need to create a user using an ODK Central Backend command line script. You will probably also want to promote that user to a sitewide administrator. See the [ODK Central Backend readme](https://github.com/getodk/central-backend) for more information.

Next, build ODK Central Frontend files for development by running `npm run dev`. The files will be outputted to `dist/`. As you update the source code, the files will be automatically rebuilt.

Finally, run NGINX by changing the working directory to the root directory of the repository, then typing the following:

```bash
nginx -c "$PWD/nginx.conf" -p "$PWD/dist/"
```

We specify `-p "$PWD/dist/"` so that relative paths in [`nginx.conf`](/nginx.conf) are relative to `dist/`.

NGINX effectively places ODK Central Frontend and ODK Central Backend at the same origin, avoiding cross-origin requests.

ODK Central Frontend will be available on port 8989.

Some ODK Central Frontend functionality requires HTTPS, for example, downloading files from ODK Central Backend. To access this functionality in development, one option is to use [`ngrok`](https://ngrok.com/download). By default, ODK Central Frontend is available on port 8989, so you can run `ngrok http 8989` to expose a temporary HTTPS URL that you can use. Some functionality additionally requires you to specify the HTTPS URL to ODK Central Backend, for example, getting a form in ODK Collect. To do so, set the `default.env.domain` property in [`config/default.json`](https://github.com/getodk/central-backend/blob/master/config/default.json) to the HTTPS URL, then restart the ODK Central Backend server if it is already running.

## Deploying to production

To build ODK Central Frontend files for production with minification, run `npm run build`. The files will be outputted to `dist/`. For more details on this command, see the [documentation for Vue CLI](https://cli.vuejs.org/).

Note that this repository's `nginx.conf` is for development only.

For more information on deploying to production, see the [ODK Central repository](https://github.com/getodk/central).
