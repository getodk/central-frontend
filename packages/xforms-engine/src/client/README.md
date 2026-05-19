# @getodk/xforms-engine: Client interface

The modules in this directory define the explicit interface between:

- an ODK Web Forms client (typically, but not necessarily, providing a user interface), henceforth "client"; and,
- `@getodk/xforms-engine`; henceforth "the engine"

The interface is defined as TypeScript type definitions, with a work-in-progress effort to provide browsable documentation of the same.

## Purpose

The interface is designed to:

- Provide a means for clients to initiate an [ODK XForm](https://getodk.github.io/xforms-spec/)
- Convey the structure of the form as a tree, _roughly analogous_ in structure to its [primary instance](https://getodk.github.io/xforms-spec/#primary-instance) model
- Convey definitional aspects of for each of the form's nodes, from which clients may implement particular modes of presentation and user interaction
- Convey the current state, at any given time, of each node in that tree
- Provide explicit mechanisms for clients to manipulate pertinent aspects of that state
- Facilitate propagation of state updates to clients as and where they occur throughout that tree, by means of a client-provided generic state factory[^1]
- Facilitate loading any of a form's externally referenced resources, by means of a client-provided generic resource accessor[^2]

[^1]: This factory **may be** reactive, and for many clients that is the anticipated usage. But no assumptions are made by the engine about reactivity or any other implementation details beyond the factory's type definition.

[^2]: This accessor **may** access networked resources, and for many clients that is the anticipated usage. But no assumptions are made by the engine about the provenance of any resources it requests beyond the accessor's type definition.

### Non-goals

The interface is explicitly **not designed** to proscribe any particular mode of presentation or user interaction. Furthermore, it does not specify or mandate:

- Any particular reactive behavior, or implementation of reactivity generally
- Access to any network or other resource store per se, beyond the means to load and execute the engine itself in a compatible runtime environment

## Notes on interface contract and stability

> [!IMPORTANT]
> The interface in this directory represents the **complete contract** between a client and the engine. The engine _may_ expose an implementation which exceeds this explicit contract; clients are **strongly discouraged** from depending on details not exposed by the interface itself, as they are considered implementation details subject to change at any time.

The general design and approach to this interface has gone through several iterations. The types defined _within this directory_ are expected to be fairly stable, apart from additive changes to support coming feature work.

Any types referenced _outside this directory_ should be treated as at least moderately unstable; these types are generally concerned with static aspects of a parsed form (typically referenced as a `definition`). We **will** be revisiting and refining these types as early client work proceeds, and are quite likely to introduce more limited client-facing types much like those within this directory to take their place.
