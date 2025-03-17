import { createComputed } from 'solid-js';
import type { RepeatRangeNodeAppearances } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { RepeatRangeControlledNode } from '../../client/repeat/RepeatRangeControlledNode.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import type { XFormsXPathNodeRange } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type { ControlledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import { BaseRepeatRange } from './BaseRepeatRange.ts';

export class RepeatRangeControlled
	extends BaseRepeatRange<ControlledRepeatDefinition>
	implements RepeatRangeControlledNode, XFormsXPathNodeRange, EvaluationContext
{
	// RepeatRangeControlledNode
	readonly nodeType = 'repeat-range:controlled';
	readonly appearances: RepeatRangeNodeAppearances;
	readonly validationState: AncestorNodeValidationState;

	constructor(
		parent: GeneralParentNode,
		instanceNodes: readonly StaticElement[],
		definition: ControlledRepeatDefinition
	) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		this.initializeControlledChildrenState(definition, instanceNodes);

		this.validationState = createAggregatedViolations(this, this.instanceConfig);
	}

	private initializeControlledChildrenState(
		definition: ControlledRepeatDefinition,
		instanceNodes: readonly StaticElement[]
	): void {
		this.scope.runTask(() => {
			const { count, template } = definition;
			const repeatInstanceNodes = definition.omitTemplate(instanceNodes);
			const computeCount = createComputedExpression(this, count, {
				defaultValue: 0,
			});

			createComputed<number>((previousCount) => {
				let currentCount = computeCount();

				if (Number.isFinite(currentCount) && currentCount < 0) {
					currentCount = 0;
				}

				if (
					currentCount === previousCount ||
					// TODO: the intent of this check is to defer a count update when the
					// count expression produces a blank value. This "feels right" when
					// the count is directly controlled by the user (i.e. entering a
					// number in an input), but probably does not make sense in every
					// scenario! For instance, when a referenced node's relevance changes.
					Number.isNaN(currentCount)
				) {
					return previousCount;
				}

				if (currentCount > previousCount) {
					const delta = currentCount - previousCount;
					const inputNodes = Array(delta)
						.fill(null)
						.map((_, index) => {
							const instanceIndex = previousCount + index;

							return repeatInstanceNodes[instanceIndex] ?? template;
						});

					this.addChildren(previousCount - 1, inputNodes);
				} else {
					const delta = previousCount - currentCount;

					this.removeChildren(currentCount, delta);
				}

				return currentCount;
			}, 0);
		});
	}
}
