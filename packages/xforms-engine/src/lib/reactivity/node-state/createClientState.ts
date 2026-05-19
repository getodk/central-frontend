import { getPropertyKeys } from '@getodk/common/lib/objects/structure.ts';
import type { ShallowMutable } from '@getodk/common/types/helpers.js';
import { createComputed, untrack } from 'solid-js';
import type { OpaqueReactiveObjectFactory } from '../../../index.ts';
import type { ReactiveScope } from '../scope.ts';
import type { EngineState } from './createEngineState.ts';
import type { SpecifiedState, StateSpec } from './createSpecifiedState.ts';
import type { InternalClientRepresentation } from './representations.ts';
import { declareInternalClientRepresentation } from './representations.ts';

const deriveInitialState = <Spec extends StateSpec>(
	scope: ReactiveScope,
	engineState: EngineState<Spec>
): ShallowMutable<SpecifiedState<Spec>> => {
	return scope.runTask(() => {
		return untrack(() => {
			return { ...engineState };
		});
	});
};

export type SpecifiedClientStateFactory<
	Factory extends OpaqueReactiveObjectFactory,
	Spec extends StateSpec,
> = ShallowMutable<SpecifiedState<Spec>> extends Parameters<Factory>[0] ? Factory : never;

export type ClientState<Spec extends StateSpec> = InternalClientRepresentation<
	SpecifiedState<Spec>
>;

export const createClientState = <
	Factory extends OpaqueReactiveObjectFactory,
	Spec extends StateSpec,
>(
	scope: ReactiveScope,
	engineState: EngineState<Spec>,
	clientStateFactory: SpecifiedClientStateFactory<Factory, Spec>
): ClientState<Spec> => {
	const initialState = deriveInitialState(scope, engineState);
	const clientState = clientStateFactory(initialState);

	scope.runTask(() => {
		getPropertyKeys(initialState).forEach((key) => {
			createComputed(() => {
				clientState[key] = engineState[key];
			});
		});
	});

	return declareInternalClientRepresentation(clientState);
};
