import type { ReactiveScope } from '../scope.ts';
import type { SpecifiedState, StateSpec } from './createSpecifiedState.ts';
import { createSpecifiedState } from './createSpecifiedState.ts';
import type { EngineRepresentation } from './representations.ts';
import { declareEngineRepresentation } from './representations.ts';

export type EngineState<Spec extends StateSpec> = EngineRepresentation<SpecifiedState<Spec>>;

export const createEngineState = <Spec extends StateSpec>(
	scope: ReactiveScope,
	spec: Spec
): EngineState<Spec> => {
	return scope.runTask(() => {
		const state = createSpecifiedState(spec);

		return declareEngineRepresentation(state);
	});
};
