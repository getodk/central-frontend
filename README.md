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

ODK Central is the [ODK](https://getodk.org/) server. It manages user accounts and permissions, stores form definitions, and allows data collection clients like ODK Collect to connect to it for form download and submission upload. ODK Central Frontend provides the frontend for ODK Central using Vue.js.

This repository contains the code for the frontend of ODK Central. The [`central-backend`](https://github.com/getodk/central-backend) repository contains the code for the backend API server. The [`central`](https://github.com/getodk/central) repository contains the Docker code for building and running a production Central stack. You can find release notes in the `central` repository.

**The `master` branch of this repository reflects ongoing development for the next version of ODK Central.** It may or may not be in sync with the `master` branch of the `central-backend` repository. For the latest stable version, see the [release tags](https://github.com/getodk/central-frontend/releases).

You can learn more about ODK Central by visiting the [docs](https://docs.getodk.org/central-intro/).

## Contributing

We need your help to make ODK Central Frontend as useful as possible! Please see the [Contribution Guide](/CONTRIBUTING.md) for detailed information on discussion forums, project policies, code guidelines, and an overview of the software architecture.

## Setting up your development environment

Follow these steps to set up your development environment:

- Install Node.js 20.
- Install dependencies by running `npm install`.
- Install NGINX.
- Set up [ODK Central Backend](https://github.com/getodk/central-backend).
  - You will need to create a user using an ODK Central Backend command line script.
  - You will probably also want to promote that user to a sitewide administrator.

## Running in development

Follow these instructions to run ODK Central Frontend in development. For deploying to production, see the next section.

First, run ODK Central Backend.

Next, run ODK Central Frontend in development by running `npm run dev`. This will start a Vite dev server. ODK Central Frontend will be available on port 8989. `npm run dev` will also start NGINX, which will forward requests to ODK Central Backend.

ODK Central Frontend communicates with ODK Central Backend in part using a session cookie. The cookie is `Secure`, but will be sent over HTTP on localhost. ODK Central Frontend also interacts with data collection clients and with services:

- To upload an XLSForm, run [pyxform-http](https://github.com/getodk/pyxform-http). ODK Central Frontend communicates with pyxform-http through ODK Central Backend.
- You can use ODK Collect to scan an app user QR code, download a form, and submit data. One option to do so is to use [`ngrok`](https://ngrok.com/download). ODK Central Frontend is available on port 8989, so you can run `ngrok http 8989` to expose a temporary HTTPS URL that you can use. Within ODK Central Backend, you will also need to set the `default.env.domain` property in [`config/default.json`](https://github.com/getodk/central-backend/blob/master/config/default.json) to the HTTPS URL, then restart ODK Central Backend if it is already running.
- Enketo is a web form engine used to show form previews and allow for web-based data entry. Please see our [instructions](/docs/enketo.md) for optionally setting up an Enketo server for use in _development_ (it is already included in the production ODK Central stack).

### Running without HMR

If you run `npm run dev`, open ODK Central Frontend in a browser, then update the source code, the page will refresh automatically to reflect the new code. This is called hot module replacement (HMR). To develop without HMR, run `npm run dev:build`. Instead of running a Vite dev server, this builds ODK Central Frontend for development. It outputs files to `dist/`, which NGINX will serve on port 8686. (There will be nothing on port 8989.) If you update the source, the files will be rebuilt automatically, but the page will not be refreshed: you can choose when to refresh the page. Note that `npm run dev:build` is much slower than `npm run dev`.

## Deploying to production

To build ODK Central Frontend files for production with minification, run `npm run build`. The files will be outputted to `dist/`.

Note that this repository's `main.nginx.conf` is for development only.

For more information on deploying to production, see the [`central`](https://github.com/getodk/central) repository.
