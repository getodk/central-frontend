Based on [JavaRosa's XForm DSL](https://github.com/getodk/javarosa/blob/059321160e6f8dbb3e81d9add61d68dd35b13cc8/src/test/java/org/javarosa/core/util/XFormsElement.java). The API and interface follows the original closely, so JavaRosa's tests and especially its fixtures might be easily reusable. Notable differences:

- Java's variadic parameter semantics seem to differ: in JavaScript/TypeScript they must be explicitly spread at the call site. This affects the DSL implementation, but should hopefully not cause any meaningful differences at call sites.
- Java's class member semantics differ: in JavaScript/TypeScript they _must_ be called with `this.`. Again, this should not be meaningfully different at call sites.
- Some (all?) static class methods are implemented as module-local functions and exported as such. Those corresponding to the DSL interface are exported from `index.ts`, and those used as shared internal construction implementation details are in `shared.ts`.
- As much as possible is marked `readonly` or equivalent. This has been the convention throughout the `web-forms` project. As much as it's verbose, it helps to call out exceptions where mutation is an expected part of a given interface.
- JavaScript/TypeScript does not have any notion of classes as interface members. These are implemented class-per-file.
- Some helper types are added to simplify aspects of the DSL's flexible method signatures.
- TypeScript has an accommodation for functions/methods with multiple signatures, but they are type-only overloads. There is no mechanism for implementation overloads. As such, while the signatures should be equivalent, there is more complexity (and risk of subtle bugs) in the implementations of these overloads. In at least some cases, these type overloads are also defined as `interface`s with multiple call signatures, which is a particular oddity of TypeScript's syntax.

Besides clarifying all of the above **for this DSL**, this may serve as a glimpse into complications should we seek to manually share more between the code bases.
