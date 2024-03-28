import { getPropertyKeys } from '@odk-web-forms/common/lib/objects/structure.ts';
import type { ShallowMutable } from '@odk-web-forms/common/types/helpers.js';
import { createComputed, untrack } from 'solid-js';
import { createMutable } from 'solid-js/store';
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

export type SpecifiedClientStateFactory<Spec extends StateSpec> = (
	input: ShallowMutable<SpecifiedState<Spec>>
) => ShallowMutable<SpecifiedState<Spec>>;

export type ClientState<Spec extends StateSpec> = InternalClientRepresentation<
	SpecifiedState<Spec>
>;

export const createClientState = <Spec extends StateSpec>(
	scope: ReactiveScope,
	engineState: EngineState<Spec>,
	clientStateFactory: SpecifiedClientStateFactory<Spec>
): ClientState<Spec> => {
	// Special case: if we **know** the client is Solid, we also know that the
	// engine state is already reactive for the client. In which case, we can
	// skip the client mutable state wrapper and just rely on the fact that the
	// client-facing `currentState` will still be wrapped in a read-only proxy.
	if (clientStateFactory === createMutable) {
		return declareInternalClientRepresentation<ShallowMutable<SpecifiedState<Spec>>>(engineState);
	}

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
