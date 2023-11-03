import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { XFormBindStateMap } from './XFormBindStateMap.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormModelBind } from './XFormModelBind.ts';

export class XFormBindState {
	protected readonly getter: Accessor<string>;

	constructor(
		protected readonly form: XFormDefinition,
		_states: XFormBindStateMap,
		bind: XFormModelBind
	) {
		const { calculate, nodeset } = bind;
		const { expression: calculateExpression } = calculate;
		const getter = createMemo(() => {
			if (calculateExpression != null) {
				return form.model.primaryInstanceEvaluator.evaluateString(calculateExpression);
			}

			return form.model.primaryInstanceEvaluator.evaluateString(nodeset);
		});

		this.getter = getter;
	}

	getValue(): string {
		return this.getter();
	}

	toJSON() {
		return {};
	}
}
