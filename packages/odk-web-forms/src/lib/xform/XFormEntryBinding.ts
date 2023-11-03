import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';
import type { XFormDOM } from './XFormDOM.ts';
import type { XFormDefinition } from './XFormDefinition.ts';
import type { XFormEntry } from './XFormEntry.ts';
import type { XFormModelBind } from './XFormModelBind.ts';

export class XFormEntryBinding {
	protected readonly xformDocument: XMLDocument;
	protected readonly model: Element;
	protected readonly primaryInstance: Element;
	protected readonly primaryInstanceRoot: Element;

	protected readonly getter: Accessor<string>;

	constructor(
		protected readonly form: XFormDefinition,
		protected readonly instanceDOM: XFormDOM,
		_states: XFormEntry,
		bind: XFormModelBind
	) {
		this.xformDocument = instanceDOM.xformDocument;
		this.model = instanceDOM.model;
		this.primaryInstance = instanceDOM.primaryInstance;
		this.primaryInstanceRoot = instanceDOM.primaryInstanceRoot;

		const { primaryInstanceEvaluator } = instanceDOM;
		const { calculate, nodeset } = bind;
		const { expression: calculateExpression } = calculate;
		const getter = createMemo(() => {
			if (calculateExpression != null) {
				return primaryInstanceEvaluator.evaluateString(calculateExpression);
			}

			return primaryInstanceEvaluator.evaluateString(nodeset);
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
