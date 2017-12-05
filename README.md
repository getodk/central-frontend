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

Install NGINX. Depending on how you install it, you may need to change the absolute paths in Super Adventure's [`nginx.conf`](/nginx.conf).

You will also need to set up [Jubilant Garbanzo](https://github.com/nafundi/jubilant-garbanzo).

## Serving files

First, run Jubilant Garbanzo.

Next, build Super Adventure files using one of the two following commands. The files will be outputted to `dist/`.

```bash
# Build for development with hot reload.
npm run dev

# Build for production with minification.
npm run build
```

For more information, see the [documentation for vueify](https://github.com/vuejs/vueify).

Finally, run NGINX by opening the command line, changing the working directory to the root directory of the repository, and typing the following:

```bash
nginx -c "$PWD/nginx.conf" -p "$PWD/"
```

We specify `-p "$PWD/"` so that relative paths in [`nginx.conf`](/nginx.conf) are relative to the root directory of the repository.

NGINX effectively places Super Adventure and Jubilant Garbanzo at the same origin, avoiding cross-origin requests.

Super Adventure will be available on port 8080.

## Testing

```bash
# run unit tests
npm test

# lint all *.js and *.vue files
npm run lint
```
