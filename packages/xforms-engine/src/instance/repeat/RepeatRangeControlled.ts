import { createComputed, type Accessor } from 'solid-js';
import type { RepeatRangeNodeAppearances } from '../../client/repeat/BaseRepeatRangeNode.ts';
import type { RepeatRangeControlledNode } from '../../client/repeat/RepeatRangeControlledNode.ts';
import type { AncestorNodeValidationState, ErrorViolation } from '../../client/validation.ts';
import type { XFormsXPathNodeRange } from '../../integration/xpath/adapter/XFormsXPathNode.ts';
import type { StaticElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import { createComputedExpression } from '../../lib/reactivity/createComputedExpression.ts';
import { createAggregatedViolations } from '../../lib/reactivity/validation/createAggregatedViolations.ts';
import type { ControlledRepeatDefinition } from '../../parse/model/RepeatDefinition.ts';
import type { GeneralParentNode } from '../hierarchy.ts';
import type { EvaluationContext } from '../internal-api/EvaluationContext.ts';
import { BaseRepeatRange } from './BaseRepeatRange.ts';
import {
  Failure,
  type Result,
  type Success,
} from '../../integration/xpath/EngineXPathEvaluator.ts';

export class RepeatRangeControlled
  extends BaseRepeatRange<ControlledRepeatDefinition>
  implements RepeatRangeControlledNode, XFormsXPathNodeRange, EvaluationContext
{
  private readonly isInstanceCreation: boolean;

  // RepeatRangeControlledNode
  readonly nodeType = 'repeat-range:controlled';
  readonly appearances: RepeatRangeNodeAppearances;
  readonly validationState: AncestorNodeValidationState;
  readonly countResult: Accessor<Result<'number'>>;

  constructor(
    parent: GeneralParentNode,
    instanceNodes: readonly StaticElement[],
    definition: ControlledRepeatDefinition
  ) {
    super(parent, definition);

    this.isInstanceCreation = parent.rootDocument.initializationMode === 'create';
    this.appearances = definition.bodyElement.appearances;

    this.countResult = this.initChildrenState(definition, instanceNodes);

    this.validationState = createAggregatedViolations(this, this.instanceConfig);

    this.getViolation = () => {
      const res = this.countResult();
      if (res instanceof Failure) {
        return { message: res.error.message, condition: 'error' } as ErrorViolation;
      }
      return this.getBaseViolation() ?? this.validation.engineState.violation;
    };
  }

  private initChildrenState(
    definition: ControlledRepeatDefinition,
    instanceNodes: readonly StaticElement[]
  ): Accessor<Result<'number'>> {
    const { count, template } = definition;
    const savedNodes = definition.omitTemplate(instanceNodes);
    const initialCount = this.isInstanceCreation ? 0 : savedNodes.length;

    return this.scope.runTask(() => {
      const seededCount = this.applyCountChange(
        this.getChildren().length,
        initialCount,
        savedNodes,
        template
      );

      const computeCount = createComputedExpression(this, count, { defaultValue: 0 });
      createComputed((previousCount: number) => {
        const result = computeCount();
        if (!result.success) {
          return previousCount;
        }
        const value = (result as Success<'number'>).value;
        return this.applyCountChange(previousCount, value, savedNodes, template);
      }, seededCount);
      return computeCount;
    });
  }

  // Never delete repeat instances when `jr:count` decreases (avoids data loss).
  // Seeded on restore with the saved count so excess survives a lower re-evaluation.
  private applyCountChange(
    previousCount: number,
    rawCount: number,
    savedNodes: readonly StaticElement[],
    template: StaticElement
  ): number {
    const currentCount = Number.isFinite(rawCount) && rawCount < 0 ? 0 : rawCount;

    // NaN is treated as a no-op: retain it instead of causing a NaN delta that corrupts `previousCount` next tick.
    if (Number.isNaN(currentCount) || currentCount <= previousCount) {
      return previousCount;
    }

    const delta = currentCount - previousCount;
    const instanceNodes = this.resolveInstanceNodes(savedNodes, template, previousCount, delta);
    this.addChildren(instanceNodes);
    return currentCount;
  }

  private resolveInstanceNodes(
    savedNodes: readonly StaticElement[],
    template: StaticElement,
    offset: number,
    length: number
  ): StaticElement[] {
    const nodes: StaticElement[] = [];
    for (let index = 0; index < length; index++) {
      nodes.push(savedNodes[offset + index] ?? template);
    }
    return nodes;
  }
}
