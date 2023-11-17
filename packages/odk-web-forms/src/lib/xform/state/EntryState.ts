import type { Accessor } from 'solid-js';
import { createEffect, createSignal, on } from 'solid-js';
import type { XFormDOM } from '../XFormDOM.ts';
import type { XFormDefinition } from '../XFormDefinition.ts';
import { XFormEntryBinding } from '../XFormEntryBinding.ts';
import type { AnyBodyElementDefinition } from '../body/BodyDefinition.ts';

export class EntryState {
	protected readonly bindings: Map<string, XFormEntryBinding>;

	readonly instanceDOM: XFormDOM;

	// Temp, just to be able to demo and visually inspect reactive output of the
	// full state of a submission.
	readonly serializedSubmission: Accessor<string>;

	constructor(readonly form: XFormDefinition) {
		const bindings = new Map<string, XFormEntryBinding>();
		const instanceDOM = form.xformDOM.createInstance();

		this.bindings = bindings;
		this.instanceDOM = instanceDOM;

		for (const [nodeset, bind] of form.model.binds) {
			bindings.set(nodeset, new XFormEntryBinding(form, instanceDOM, this, bind));
		}

		const bindingStateAccessors = Array.from(bindings.values()).map((binding) => {
			return binding.getValue;
		});
		const serializeSubmission = () => instanceDOM.primaryInstanceRoot.outerHTML;

		const [serializedSubmission, setSerializedSubmission] = createSignal(serializeSubmission());

		// TODO: granted the current submission serialization is kind of a quick
		// thrown together thing for demoing the complete reactivity behavior, but
		// this is as good a place to call out this concern as any...
		//
		// 1. It is my understanding that Solid effects should not be used for
		//    setting reactive state.
		// 2. It is also my understanding that `createComputed` is intended to fit
		//    this purpose.
		// 3. It is also my understanding that `on` with `{ defer: true }` is meant
		//    to defer its callback until the next *microtask* (which is to say, it
		//    is scheduled synchronously). This is in contrast with the similarly
		//    named `createDeferred`, which is meant to defer its callback until the
		//    browser is idle (`requestIdleCallback` or some polyfill approximation
		//    thereof).
		// 4. The idea here is not just to demonstrate submission state reactivity,
		//    but also to demonstrate efficient reactive computation. In this case,
		//    it makes no sense to schedule the serialization for intermediate
		//    states, which it would do by default for e.g. `calculate`s. The
		//    intended behavior is to defer serialization until all such
		//    computations have settled, serializing full submission state *once per
		//    value change and all of its dependent computations*.
		//
		// So, here's the rub: as far as I can tell, the only way to achieve this
		// intent with Solid's built-in primitives is with
		// `createEffect(on(accessors, stateSettingCallback, { defer: true }))`.
		// This is explicitly what you are not supposed to do. But it seems likely
		// it's exactly what we'll need to do for certain other computations which
		// have a similar expectation to defer until all other computations have
		// settled. This is called out here both because it's where the issue first
		// came up in this implementation (though I knew it was coming form prior
		// prototyping efforts), *and* because it's a fairly likely place to
		// encounter the discussion of the issue for frame of reference (as the
		// current entrypoint to reactive state in the first place).
		//
		// ... And this whole comment should probably go away, as even
		// `createEffect` has begun over-computing as more of the underlying
		// reactivity is built out.
		createEffect(
			on(bindingStateAccessors, () => {
				queueMicrotask(() => {
					console.log('Recomputing full submission state');
					setSerializedSubmission(serializeSubmission());
				});
			})
		);

		this.serializedSubmission = serializedSubmission;
	}

	getBinding(reference: string): XFormEntryBinding | null {
		return this.bindings.get(reference) ?? null;
	}

	getBodyElements(): readonly AnyBodyElementDefinition[] {
		// TODO: anticipating this will be reactive as we introduce N <> 1 repeats
		return this.form.body.elements;
	}

	toJSON() {
		return {};
	}
}
