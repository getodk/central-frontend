<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
# Super Adventure

[![License](https://img.shields.io/badge/license-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Super Adventure uses Vue.js to provide the front end for [Jubilant Garbanzo](https://github.com/nafundi/jubilant-garbanzo), an [Open Data Kit](https://opendatakit.org/) server based on Node.js. Super Adventure is currently under development.

## Setting up your development environment

Install npm, then install Node package dependencies with `npm install`.

Install NGINX. Depending on your OS and how you install NGINX, you may need to change the absolute paths in Super Adventure's [`nginx.conf`](/nginx.conf).

You will also need to set up [Jubilant Garbanzo](https://github.com/nafundi/jubilant-garbanzo).

## Running in development

Follow these instructions to run Super Adventure in development. For deploying to production, see the next section.

First, run Jubilant Garbanzo.

Next, build Super Adventure files for development by running `npm run dev`. The files will be outputted to `dist/`, and hot reload will be available. For more details on this command, see the [documentation for vueify](https://github.com/vuejs/vueify).

Finally, run NGINX by opening the command line, changing the working directory to the root directory of the repository, and typing the following:

```bash
nginx -c "$PWD/nginx.conf" -p "$PWD/"
```

We specify `-p "$PWD/"` so that relative paths in [`nginx.conf`](/nginx.conf) are relative to the root directory of the repository.

NGINX effectively places Super Adventure and Jubilant Garbanzo at the same origin, avoiding cross-origin requests.

Super Adventure will be available on port 8080.

## Deploying to production

To build Super Adventure files for production with minification, run `npm run build`. The files will be outputted to `dist/`. For more details on this command, see the [documentation for vueify](https://github.com/vuejs/vueify).

For more information on deploying to production, see [effective-spork](https://github.com/nafundi/effective-spork).

## Testing

```bash
# run unit tests
npm test

# lint all *.js and *.vue files
npm run lint
```
