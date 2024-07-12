import { getPropertyKeys } from '@getodk/common/lib/objects/structure.ts';
import type { OpaqueReactiveObjectFactory } from '../../../index.ts';
import type { ReactiveScope } from '../scope.ts';
import type { ClientState, SpecifiedClientStateFactory } from './createClientState.ts';
import { createClientState } from './createClientState.ts';
import type { CurrentState } from './createCurrentState.ts';
import { createCurrentState } from './createCurrentState.ts';
import type { EngineState } from './createEngineState.ts';
import { createEngineState } from './createEngineState.ts';
import type { MutablePropertySpec, SpecifiedState, StateSpec } from './createSpecifiedState.ts';
import { isComputedPropertySpec, isMutablePropertySpec } from './createSpecifiedState.ts';

// prettier-ignore
type MutableKeyOf<Spec extends StateSpec> = {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[K in string & keyof Spec]: Spec[K] extends MutablePropertySpec<any>
		? K
		: never;
}[string & keyof Spec];

type SetEnginePropertyState<Spec extends StateSpec> = <K extends MutableKeyOf<Spec>>(
	key: K,
	newValue: SpecifiedState<Spec>[K]
) => SpecifiedState<Spec>[K];

export interface SharedNodeState<Spec extends StateSpec> {
	readonly spec: Spec;
	readonly engineState: EngineState<Spec>;
	readonly clientState: ClientState<Spec>;
	readonly currentState: CurrentState<Spec>;
	readonly setProperty: SetEnginePropertyState<Spec>;
}

export interface SharedNodeStateOptions<
	Factory extends OpaqueReactiveObjectFactory,
	Spec extends StateSpec,
> {
	readonly clientStateFactory: SpecifiedClientStateFactory<Factory, Spec>;
}

export const createSharedNodeState = <
	Factory extends OpaqueReactiveObjectFactory,
	Spec extends StateSpec,
>(
	scope: ReactiveScope,
	spec: Spec,
	options: SharedNodeStateOptions<Factory, Spec>
): SharedNodeState<Spec> => {
	const engineState = createEngineState(scope, spec);
	const clientState = createClientState(scope, engineState, options.clientStateFactory);
	const currentState = createCurrentState(scope, clientState);

	const specKeys = getPropertyKeys(spec);
	const mutableKeys = specKeys.filter((key) => {
		return isMutablePropertySpec(spec[key]);
	});
	const computedKeys = specKeys.filter((key) => {
		return isComputedPropertySpec(spec[key]);
	});

	const setProperty: SetEnginePropertyState<Spec> = (key, value) => {
		if (!mutableKeys.includes(key)) {
			const specType = computedKeys.includes(key) ? 'computed' : 'static';
			throw new TypeError(`Cannot write to '${key}': property is ${specType}`);
		}

		return scope.runTask(() => {
			return (engineState[key] = value);
		});
	};

	return {
		spec,
		engineState,
		clientState,
		currentState,
		setProperty,
	};
};
