import { createComputed } from 'solid-js';
import type { LoadFormWarnings } from '../../client/form/LoadFormResult.ts';
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

// prettier-ignore
type RepeatCountControlType =
	| 'REPEAT_COUNT_CONTROL_DYNAMIC'
	| 'REPEAT_COUNT_CONTROL_FIXED';

export class RepeatRangeControlled
	extends BaseRepeatRange<ControlledRepeatDefinition>
	implements RepeatRangeControlledNode, XFormsXPathNodeRange, EvaluationContext
{
	private readonly isInstanceCreation: boolean;
	private readonly countControlType: RepeatCountControlType;

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

		this.isInstanceCreation = parent.rootDocument.initializationMode === 'create';
		this.appearances = definition.bodyElement.appearances;

		if (definition.count.isConstantExpression()) {
			this.countControlType = 'REPEAT_COUNT_CONTROL_FIXED';
		} else {
			this.countControlType = 'REPEAT_COUNT_CONTROL_DYNAMIC';
		}

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

			createComputed((previousCountComputation: number | null = null): number => {
				const previousCount = previousCountComputation ?? 0;

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

				this.warnDroppedInstanceNodes(repeatInstanceNodes, previousCountComputation, currentCount);

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
			});
		});
	}

	/**
	 * Note: we do not warn about dropping "excess" repeat instances...
	 *
	 * - ... after the instance is fully loaded: dropping repeat instances after
	 *   that point is an expected behavior of _dynamically-controlled repeats_
	 *   (i.e. those defined with `jr:count`), and it does not occur for
	 *   _fixed-controlled repeats_ (i.e. defined with `jr:noAddRemove`);
	 *
	 * - ... for dynamic (`jr:count`) repeats _in newly created form instances_, i.e. instances whose input instance
	 *   nodes are derived from the _form definition_: those form-defined repeat
	 *   instances are not "dropped", instead they're retained in memory to be
	 *   added as count is recomputed to a larger value.
	 *
	 * @todo ^ it is pretty likely that retain-in-memory behavior also applies to
	 * instance state which has been serialized and restored as well! In this way,
	 * it's possible we're not really "dropping" those nodes, only deferring their
	 * restoration. Is this what we want?
	 *
	 * @todo Design and produce {@link LoadFormWarnings | warnings} as values!
	 */
	private warnDroppedInstanceNodes(
		repeatInstanceNodes: readonly StaticElement[],
		previousCountComputation: number | null,
		initialCount: number
	): void {
		// See this method's JSDoc notes for reasoning!
		if (this.isInstanceCreation) {
			return;
		}

		// See this method's JSDoc notes for reasoning!
		const isInstanceLoad = previousCountComputation == null;

		if (isInstanceLoad && this.countControlType === 'REPEAT_COUNT_CONTROL_DYNAMIC') {
			return;
		}

		const droppedCount = repeatInstanceNodes.length - initialCount;

		if (droppedCount > 0) {
			// eslint-disable-next-line no-console
			console.warn(
				`Dropped ${droppedCount} repeat instances for repeat range ${this.contextReference()}`
			);
		}
	}
}
