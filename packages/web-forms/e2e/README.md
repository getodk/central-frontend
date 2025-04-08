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
├── test-cases/            # Test specification files.
        ├── geopoint.test.ts      # Example of a test file for the geopoint question type.
```

## Key concepts

- **Page Objects**: Implements the [Page Object Model](https://playwright.dev/docs/pom) pattern to encapsulate UI interactions, enhancing test readability and maintainability.
- **Test Specification File**: Test files structured by feature (e.g., rendering, form submission), each holding a suite of tests targeting a specific application aspect. Use clear, descriptive names to highlight their purpose and ensure test coverage is easily identifiable.
- **Fixtures**: Reusable test data (e.g., sample XForms) to simulate real-world use cases. Find fixtures in the [common package](../../common/src/fixtures)

## Getting started

1. **Build the project**
   In the root folder run:

   ```bash
   yarn build
   ```

2. **Run tests**
   Execute all E2E tests:

   ```bash
    yarn workspace @getodk/web-forms test:e2e
   ```

   Or run specific tests:

   ```bash
   yarn workspace @getodk/web-forms test:e2e <filepath, e.g. e2e/test-cases/geopoint.test.ts>
   ```

## Contributing

- Keep tests focused.
- Use page object methods in `pages-objects/` for UI actions.
- Add [fixtures](../../common/src/fixtures) for new scenarios instead of hardcoding data.
