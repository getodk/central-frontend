import type { EffectFunction, Owner } from 'solid-js';
import { createEffect, createRoot } from 'solid-js';
import { createMutable } from 'solid-js/store';
import type { TestFormOptions } from '../client/init.ts';
import { getAssertedOwner, runInSolidScope } from '../client/solid-helpers.ts';
import type { ScenarioConstructorOptions } from '../jr/Scenario.ts';
import { Scenario } from '../jr/Scenario.ts';

export class ReactiveScenario extends Scenario {
	static override getTestFormOptions(): TestFormOptions {
		return super.getTestFormOptions({
			stateFactory: createMutable,
		});
	}

	private readonly testScopedOwner: Owner;

	constructor(options: ScenarioConstructorOptions) {
		let dispose: VoidFunction;

		const testScopedOwner = createRoot((disposeFn) => {
			dispose = disposeFn;

			return getAssertedOwner();
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
		runInSolidScope(this.testScopedOwner, () => {
			createEffect(fn);
		});
	}
}
