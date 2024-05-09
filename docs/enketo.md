# Running Enketo for development

Enketo provides a web-based form submission UI, which is used in ODK Central for previewing forms, collecting new Submissions through Public Access Links, and editing Submissions. It is not strictly required for running ODK Central Frontend, but there are an increasing number of new features (including editing Submissions) that make use of Enketo. The following configuration is only for a development environment. The production ODK Central stack already includes Enketo with no additional configuration.

Enketo runs as a Node.js server and caches intermediate representations of forms in Redis. ODK Central Backend stores information for managing and launching Enketo forms from ODK Central Frontend, so all three must be configured together.

### Get Enketo Express and dependencies

Clone [enketo](https://github.com/enketo/enketo), which is the monorepo containing the `enketo-express` service.

Read the [Development setup and local usage](https://github.com/enketo/enketo?tab=readme-ov-file#development-setup-and-local-usage) section, specifically:
- Get Node 18 or 20 (should be installed to run ODK Central Frontend and Backend already).
- Get Yarn.
- possibly get Volta.
* Install and run Redis. Enketo will expect Redis on the default port of `6379`.
* Install and build Enketo with `yarn install` and `yarn build`.

### Configure Enketo
Create a `config` directory in the project root and add a config file at `config/config.json`. A minimal config/config.json` for Enketo looks like:

```
{
    "port": "8005",
    "linked form and data server": {
        "server url": "localhost:8989",
        "api key": "enketorules",
        "authentication": {
            "allow insecure transport": "true"
        }
    },
    "base path": "-",
    "query parameter to pass to submission": "st",
    "redis": {
        "cache": {
            "port": "6379"
        }
    }
}
```

ODK Central Backend is already configured to connect with Enketo. The following should already be present in `config/default.json`.

```
    "enketo": {
      "url": "http://localhost:8005/-",
      "apiKey": "enketorules"
    },
```

ODK Central Frontend is also already configured for Enketo as well. The following lines should already be in [`main.nginx.conf`](../main.nginx.conf) to create a reverse proxy to Enketo.

```
    location /- {
      proxy_pass http://localhost:8005/-;
      proxy_redirect off;
      proxy_set_header Host $host;
    }
```

### Run the Enketo Express service

Run the following from the Enketo project root (from the [Enketo Documentation](https://github.com/enketo/enketo?tab=readme-ov-file#running-development-tasks)):

```
yarn workspace enketo-express start
```


The final set of services running should look something like this:

- ODK Central Frontend (via Nginx) on port `8989`
- ODK Central Backend on port `8383`
	-  Postgres running on its default port
-  Enketo server on port `8005`
	- Redis running on its default port




### Notes on error messages

* Upon editing a Form Submission, especially if it is a form that existed before you set up Enketo, you may see this error `{"message":"The form you tried to access is not ready for web use yet. Please wait some time and try again.","code":409.11}` . This happens when the form has not yet been configured by the backend to work with Enketo and does not yet have an `enketoId` . One way to force Central Backend to create an `enketoId` is to create a Draft From the existing Form Definition and republish the Form.


