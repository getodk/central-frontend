# @getodk/forms

## 2026.3.0

### Minor Changes

- b4c54d2: Added the ability to enforce single submissions to public access links.
- 49e5961: Improved form loading times by fetching the project verbs from a more efficient server endpoint.
- 7bf7823: Added feature to prefill form fields using URL parameters
- 654afd3: Implemented last-saved virtual secondary instance feature

### Patch Changes

- 8b1caf2: Fixed a bug where a web form could be rendered without the necessary form data
- df4659c: Fixed a bug where a single submission form could be resubmitted by keyboard navigation.
- 0dd2ba1: Added hooks to import and export translations with transifex
- e8f02a0: Remove the Close button from the success dialog.
- 92133fb: Reduced bundle size for faster loading
- c0ff040: Improved loading of form attachments to better handle dynamic updates to the filename.

## 2026.2.2

### Patch Changes

- fe3347e: Fixed an uncaught promise rejection reading from localStorage

## 2026.2.1

### Patch Changes

- 1f33497: Stops Sentry from attaching trace headers to attachment requests.
- 238035c: Reduces sentry warnings for requests that don't respond

## 2026.2.0

### Minor Changes

- e620e5a: Separated web-forms and enketo into a new app
- 060ec41: Improved error messages for invalid URLs

### Patch Changes

- 45052e9: Display errors encountered while loading the forms app
- 13d411a: Pass Sentry DSN at runtime via client-config.json
- 18f994e: Added Sentry error reporting
- a76aeb8: Redirect to login page when auth issues for non-public form
- cbbfd27: Fixed attachment upload URL for draft form submissions
