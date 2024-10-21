import type { EffectFunction, Owner } from 'solid-js';
import { createEffect, createRoot, getOwner, runWithOwner } from 'solid-js';
import { createMutable } from 'solid-js/store';
import { assert } from 'vitest';
import type { InitializeTestFormOptions } from '../client/init.ts';
import { Scenario, type ScenarioConstructorOptions } from '../jr/Scenario.ts';

export class ReactiveScenario extends Scenario {
	static override get initializeTestFormOptions(): InitializeTestFormOptions {
		return {
			stateFactory: createMutable,
		};
	}

	private readonly testScopedOwner: Owner;

	constructor(options: ScenarioConstructorOptions) {
		let dispose: VoidFunction;

		const testScopedOwner = createRoot((disposeFn) => {
			dispose = disposeFn;

			const owner = getOwner();

			assert(owner);

			return owner;
		});

		super({
			...options,
			dispose: () => {
				dispose();
				options.dispose();
			},
		});

		this.testScopedOwner = testScopedOwner;
	}

	createEffect<Next>(fn: EffectFunction<NoInfer<Next> | undefined, Next>): void {
		runWithOwner(this.testScopedOwner, () => {
			createEffect(fn);
		});
	}
}
