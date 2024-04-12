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

We are actively porting JavaRosa's current suite of benchmarks and tests, intent
to port all which are applicable or can be made so. TODO: update this text again
before merge.

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
