# @getodk/scenario (private package)

This package implements a client of
[`@getodk/xforms-engine`](../xforms-engine/), and a suite of tests against that
engine. These tests are either:

- Directly ported from [JavaRosa](https://github.com/getodk/javarosa)
- Derived from those ported tests, where some environment-specific adaptation is necessary/appropriate
- Expand on JavaRosa's existing coverage using the same general testing approach

The client's name is taken from JavaRosa's [`Scenario`](https://github.com/getodk/javarosa/blob/master/src/test/java/org/javarosa/core/test/Scenario.java). Its interface is designed to match that of JavaRosa's as well, to maximize compatibility as tests are ported updated.

## Status

Currently, very few of JavaRosa's tests have been ported. But our goal in setting up this package is to rapidly port all of the remaining tests that are appropriate for the ODK Web Forms engine.

## Usage and development

As with [`@getodk/common`](../common/), this internal package is not intended to
be built. Unlike that package, this one is also not intended to be used as a
dependency in other packages. Usage should consist entirely of running the test
suite. These tests will be run automatically in CI along with tests throughout
[ODK Web Forms monorepo](../../).

To run in development, run this command at the monorepo root:

```sh
yarn workspace @getodk/scenario test
```

Individual test environments, and their corresponding watch modes, also have separate commands which can be found in [`package.json`](./package.json).
