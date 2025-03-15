import type { RepeatRangeNodeAppearances } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { RepeatRangeUncontrolledNode } from '../../client/repeat/RepeatRangeUncontrolledNode.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import type { XFormsXPathNodeRange } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type { UncontrolledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { Root } from '../Root.ts';
import { BaseRepeatRange } from './BaseRepeatRange.ts';
import { RepeatInstance } from './RepeatInstance.ts';

export class RepeatRangeUncontrolled
	extends BaseRepeatRange<UncontrolledRepeatDefinition>
	implements RepeatRangeUncontrolledNode, XFormsXPathNodeRange, EvaluationContext
{
	// RepeatRangeUncontrolledNode
	readonly nodeType = 'repeat-range:uncontrolled';
	readonly appearances: RepeatRangeNodeAppearances;
	readonly validationState: AncestorNodeValidationState;

	constructor(
		parent: GeneralParentNode,
		instanceNodes: readonly StaticElement[],
		definition: UncontrolledRepeatDefinition
	) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;
		this.addChildren(-1, definition.omitTemplate(instanceNodes));
		this.validationState = createAggregatedViolations(this, this.instanceConfig);
	}

	// RepeatRangeUncontrolledNode
	addInstances(afterIndex = this.getLastIndex(), count = 1): Root {
		const definitions = Array(count).fill(this.definition.template);

		this.addChildren(afterIndex, definitions);

		return this.root;
	}

	/**
	 * Removes the {@link RepeatInstance}s corresponding to the specified range of
	 * indexes, and then removes those repeat instances from the repeat range's
	 * own children state in that order:
	 *
	 * 1. Identify the set of {@link RepeatInstance}s to be removed.
	 *
	 * 2. For each {@link RepeatInstance} pending removal, perform that node's
	 *    removal logic. @see {@link RepeatInstance.remove} for more detail.
	 *
	 * 3. Finalize update to the repeat range's own {@link childrenState},
	 *    omitting those {@link RepeatInstance}s which were removed.
	 *
	 * This ordering ensures a consistent representation of state is established
	 * prior to any downstream reactive updates, and ensures that removed nodes'
	 * reactivity is cleaned up.
	 */
	removeInstances(startIndex: number, count = 1): Root {
		this.removeChildren(startIndex, count);

		return this.root;
	}
}
