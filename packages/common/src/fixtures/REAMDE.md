# @getodk/common: fixtures

This directory includes:

- [`xforms.ts`](./xforms.ts): a shared representation of XForms fixtures, and common APIs for accessing them throughout the Web Forms monorepo

- all of the project's XForms fixtures (and any associated resources), for use in tests, development, demos, etc.

## Representation and APIs

The `XFormsFixture` representation abstracts common fixture metadata, and provides a standard `loadXML` method for asynchronous access to the fixture's XML content. This method is asynchronous so that downstream usage is non-blocking by default, and to prevent accidental inclusion of fixtures in production bundles.

The `XFormsFixture` representation is backed by a more general `XFormResource` abstract base class, which is also prepared to provide the same interface and access APIs for remote XForm resources. This is expected to be a suitable representation for operating on both project-local fixtures as well as XForms from an external source (such as those submitted by users for preview).

## Sub-directory structure

The fixtures are structured into a set of sub-directories. These sub-directories act as a means to categorize sets of forms, in part based on their expected usage and in general as a way of grouping forms with common themes.

Two of the sub-directories in particular serve an important purpose:

- [`test-javarosa`](./test-javarosa/): Fixtures in this directory have been copied directly from JavaRosa, and are referenced by tests in [@getodk/scenario](../../../scenario/) integration test suites. These fixtures and resources should not be modified, except when their counterparts are updated upstream in JavaRosa.

- [`test-scenario`](./test-scenario/): Fixtures in this directory are _derived from_ those in `test-javarosa`, with a naming convention appending `-alt` as a suffix to their base name. These fixtures are intended to have only minor modifications from their counterparts in the upstream `test-javarosa` directory. They should also not be modified, except to either reflect changes from JavaRosa upstream, or to demonstrate key behavioral differences in the tests referencing them.

- [`test-web-forms`](./test-web-forms/): Fixtures in this directory are used for testing UI/UX behavior, as implemented by the [@getodk/web-forms](../../../web-forms/) package. These fixtures are intended to make it easy to manually inspect and interact with the same fixtures used under test.

  **NOTE:** In the future, we may also consider ways to make UI access easier for test fixtures defined in tests inline, using the [XForms DSL](../test/fixtures/xform-dsl/README.md). In which case, we should consider inlining these fixtures as well.

- [`preview-service`](./preview-service/): Fixtures in this directory are used as real world Forms in the Web Form preview service. It contains XLSForms to be serve as downloadable resource from the service. XForms are generated using [pyxform](https://github.com/XLSForm/pyxform) / [xlsform-online](https://getodk.org/xlsform/) service and should not be manually modified. Note: XForm (xml) for WHO Verbal Autopsy is not placed in the `xform` subdirectory as it is already present in the [`smoketests`](./test-javarosa/resources//smoketests/)

All other sub-directories are intended to provide ad hoc categorization of the rest of the project's XForms fixtures. The fixtures they contain may be referenced for general purpose across the project's packages.

## Important note re: formatting

In typical dev setups, the project's current settings will typically cause automated formatting when saving files. This includes all of the project's XForms fixtures... **even those specifically called out above for limiting modification**. It is not presently possible to exclude specific sub-directories in some of the pertinent settings (specifically those in [VSCode settings](../../../../.vscode/settings.json)).

Care should be taken to avoid committing and/or merging automated formatting changes to fixtures copied from outside the Web Forms project. This will help us to accurately track changes to those fixtures if and as they occur.

## TODO: clearer separation between fixtures for dev/demo versus automated testing

The `@getodk/web-forms` package's test suites currently reference several fixtures from these ad hoc sub-directories, where the fixtures were originally intended only for dev demo purposes. There is some risk in this dual purpose, and we should seriously consider defining test-specific fixtures for the affected tests.
