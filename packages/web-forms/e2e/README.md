# E2E tests for `@getodk/web-forms`

This directory contains end-to-end (E2E) tests for the `@getodk/web-forms` package, which powers form filling and submission editing of ODK forms in a web browser. These tests use [Playwright](https://playwright.dev/) to simulate user interactions and ensure the package works as expected in real-world scenarios.

Review the [best practices recommended by Playwright](https://playwright.dev/docs/best-practices#best-practices) before you start writing tests.

## Folder structure

The E2E tests are located in `packages/web-forms/e2e/`. Here's the structure and purpose of each directory:

```
e2e/
├── page-objects/     # Page Object Model structure for e2e tests, organizing UI abstractions into pages and reusable controls.
    ├── controls/     # Reusable controls such as form fields, UI elements, etc.
        ├── GeopointControl.ts    # Example of a reusable control for the geopoint question type.
    ├── pages/        # Full page representations.
        ├── FillFormPage.ts       # Example of a full page representation for a form.
├── test-cases/       # Test specification files.
    ├── build/        # Contains tests that validate the build process.
    ├── functional/   # Contains tests that validate the core functionality, run in headless mode.
        ├── geopoint.test.ts      # Example of a test file for the geopoint question type.
    ├── visual/       # Includes tests that perform visual comparisons with headless mode disabled.
```

## Key concepts

- **Page Objects**: Implements the [Page Object Model](https://playwright.dev/docs/pom) pattern to encapsulate UI interactions, enhancing test readability and maintainability.
- **Test Specification File**: Test files structured by feature (e.g., rendering, form submission), each holding a suite of tests targeting a specific application aspect. Use clear, descriptive names to highlight their purpose and ensure test coverage is easily identifiable.
- **Fixtures**: Reusable test data (e.g., sample XForms) to simulate real-world use cases. Find fixtures in the [common package](../../common/src/fixtures)

## Getting started

The tests run in the Playwright image (the same as in CI).

Run a suite for one browser (`chromium`, `firefox` or `webkit`), or all functional suites:

```bash
npm run test:e2e:functional:chromium -w=packages/web-forms
npm run test:e2e:visual:chromium -w=packages/web-forms
npm run test:e2e:functional:all -w=packages/web-forms
```

Anything after `--` is passed to `playwright test`:

```bash
npm run test:e2e:functional:chromium -w=packages/web-forms -- e2e/test-cases/functional/geopoint.test.ts
npm run test:e2e:visual:webkit -w=packages/web-forms -- -g "renders markdown" --update-snapshots
npm run test:e2e:functional:chromium -w=packages/web-forms -- --trace on
```

Reports and traces land in `test-results/` and `playwright-report/`; open them with `npx playwright show-report` from `packages/web-forms`. After a Playwright version bump, `docker image prune` removes the old image.

## Contributing

- Keep tests focused.
- Use page object methods in `pages-objects/` for UI actions.
- Add [fixtures](../../common/src/fixtures) for new scenarios instead of hardcoding data.
