# @getodk/scenario: `jr` subdirectory

This subdirectory contains source code derived directly from [JavaRosa](https://github.com/getodk/javarosa), in support of porting its test suites. This code should either be ported directly from extant code in JavaRosa, or be concerned with providing interfaces consistent with such extant JavaRosa code.

In some cases, aspects of this JavaRosa-derived code may be extended to specifically accommodate scope expansions, as agreed among the ODK web forms team. These extensions are largely intended to ensure that the ported test logic is correct, and to make it easier to reason with the tests after the fact. A prominent example:

- Supplying an _expected_ node-set reference to `Scenario`'s traversal methods, providing additional clarity while **reading** tests
- Automatically _asserting_ that such expected node-set references match the actual nodes encountered for each traversal performed, providing additional checked assurance that both the ported `Scenario` logic and the ported test logic are consistent with their JavaRosa counterparts

Other source code in the `scenario` package, such as code concerned with integrating such JavaRosa-derived code with web forms platform-specific concerns, should reside outside this subdirectory, i.e. in other subdirectories of [`src`](..).

All **test code** derived from JavaRosa should similarly reside outside this subdirectory, i.e. in [`test`](../../test) or any of its own subdirectories.
