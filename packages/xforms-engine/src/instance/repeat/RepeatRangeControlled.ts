import { createComputed } from 'solid-js';
import type { RepeatRangeNodeAppearances } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { RepeatRangeControlledNode } from '../../client/repeat/RepeatRangeControlledNode.ts';
import type { AncestorNodeValidationState } from '../../client/validation.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type { ControlledRepeatRangeDefinition } from '../../model/RepeatRangeDefinition.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import type { SubscribableDependency } from '../internal-api/SubscribableDependency.ts';
import { BaseRepeatRange } from './BaseRepeatRange.ts';
import type { RepeatDefinition } from './RepeatInstance.ts';

export class RepeatRangeControlled
	extends BaseRepeatRange<ControlledRepeatRangeDefinition>
	implements RepeatRangeControlledNode, EvaluationContext, SubscribableDependency
{
	// RepeatRangeControlledNode
	readonly nodeType = 'repeat-range:controlled';

	readonly appearances: RepeatRangeNodeAppearances;

	readonly validationState: AncestorNodeValidationState;

	constructor(parent: GeneralParentNode, definition: ControlledRepeatRangeDefinition) {
		super(parent, definition);

		this.appearances = definition.bodyElement.appearances;

		this.initializeControlledChildrenState(definition);

		this.validationState = createAggregatedViolations(this, {
			clientStateFactory: this.engineConfig.stateFactory,
		});
	}

	private initializeControlledChildrenState(definition: ControlledRepeatRangeDefinition): void {
		this.scope.runTask(() => {
			const { count, instances, template } = definition;
			const computeCount = createComputedExpression(this, count);

			createComputed<number>((previousCount) => {
				let currentCount = computeCount();

				if (Number.isFinite(currentCount) && currentCount < 0) {
					currentCount = 0;
				}

				if (Number.isNaN(currentCount) || currentCount === previousCount) {
					return previousCount;
				}

				if (currentCount > previousCount) {
					const delta = currentCount - previousCount;
					const definitions = Array<RepeatDefinition>(delta)
						.fill(template)
						.map((baseDefinition, index) => {
							const instanceIndex = previousCount + index;

							return instances[instanceIndex] ?? baseDefinition;
						});

					this.addChildren(previousCount - 1, definitions);
				} else {
					const delta = previousCount - currentCount;

					this.removeChildren(currentCount, delta);
				}

				return currentCount;
			}, 0);
		});
	}
}
