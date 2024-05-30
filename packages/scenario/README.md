# @getodk/scenario (private package)

This package implements a client of
[`@getodk/xforms-engine`](../xforms-engine/), and a suite of tests and
benchmarks against that engine. These tests/benchmarks are either:

- Directly ported from [JavaRosa](https://github.com/getodk/javarosa)
- Derived from those, where some environment-specific adaptation is necessary/appropriate
- Expand on JavaRosa's existing coverage using the same general testing and/or benchmarking approach

The client's name is taken from JavaRosa's
[`Scenario`](https://github.com/getodk/javarosa/blob/master/src/test/java/org/javarosa/core/test/Scenario.java).
Its interface is designed to match that of JavaRosa's as well, to maximize
compatibility as tests and benchmarks are ported and maintained.

## Status

All of JavaRosa's tests as of [https://github.com/getodk/javarosa/commit/5ae68946c47419b83e7d28290132d846e457eea6](`5ae6894`) have been:

1. Ported in full…

   - … with only minor syntax changes.

   - … with minor changes, with a best effort to match their apparent intent, reducing their reliance on apparent JavaRosa internals.

   - … with companion and/or alternate tests, either demonstrating the nature of current known failures; adding supplemental context; or exercising meaningful test cases against a different abstraction level (e.g. apparent unit tests adapted to be `Scenario`-based integration tests).

2. Explicitly marked as `todo`, where some tests or suites were considered pertinent but there is some other prerequisite work necessary to complete porting them.

3. Explicitly marked `skip`, where some noteworthy tests were deemed either impertinent or of unclear future pertinence.

4. Skipped with reasoning discussed in [pull request notes](https://github.com/getodk/web-forms/pull/110). Many of these tests are concerned with JavaRosa internals, and porting them wouldn't have clear benefit to the Web Forms project. Some others _may exercise pertinent functionality_, but would likely require further analysis and consideration around the appropriate testing approach.

With better tooling and automation, it would be nice to be able to show a running tally of pass/fail/todo counts over time. But that would take some investment and time we'd prefer to spend working towards 100% passing. As such, for now we'll note the starting status at the time the bulk of tests were ported:

- Pass: 120
- Fail: 193
- TODO: 28

## Usage and development

As with [`@getodk/common`](../common/), this internal package is not intended to
be built. Unlike that package, this one is also not intended to be used as a
dependency in other packages. Usage should consist entirely of running the test
and benchmark suites. These suites will be run automatically in CI along with
other automated checks throughout the [ODK Web Forms monorepo](../../).

To run in development, run this command at the monorepo root:

```sh
yarn workspace @getodk/scenario benchmark
yarn workspace @getodk/scenario test
```

Individual target environments, and their corresponding watch modes, also have separate commands which can be found in [`package.json`](./package.json).
