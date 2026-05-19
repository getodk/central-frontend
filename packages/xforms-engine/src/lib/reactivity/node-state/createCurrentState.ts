import type { ReactiveScope } from '../scope.ts';
import type { ClientState } from './createClientState.ts';
import type { SpecifiedState, StateSpec } from './createSpecifiedState.ts';
import type { ReadonlyClientRepresentation } from './representations.ts';
import { declareReadonlyClientRepresentation } from './representations.ts';

export type CurrentState<Spec extends StateSpec> = ReadonlyClientRepresentation<
	SpecifiedState<Spec>
>;

export const createCurrentState = <Spec extends StateSpec>(
	scope: ReactiveScope,
	clientState: ClientState<Spec>
): CurrentState<Spec> => {
	return scope.runTask(() => {
		const currentStateProxy = new Proxy<Readonly<SpecifiedState<Spec>>>(clientState, {
			get: (_, key) => {
				return clientState[key as keyof SpecifiedState<Spec>];
			},
			set: () => {
				throw new TypeError('Cannot write directly to client-facing currentState');
			},
		});

		return declareReadonlyClientRepresentation(currentStateProxy);
	});
};
