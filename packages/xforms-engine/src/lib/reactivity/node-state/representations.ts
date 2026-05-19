import type { ShallowMutable } from '@getodk/common/types/helpers.js';

const ENGINE_REPRESENTATION = Symbol('ENGINE_REPRESENTATION');
type ENGINE_REPRESENTATION = typeof ENGINE_REPRESENTATION;

const INTERNAL_CLIENT_REPRESENTATION = Symbol('INTERNAL_CLIENT_REPRESENTATION');
type INTERNAL_CLIENT_REPRESENTATION = typeof INTERNAL_CLIENT_REPRESENTATION;

const READONLY_CLIENT_REPRESENTATION = Symbol('READONLY_CLIENT_REPRESENTATION');
type READONLY_CLIENT_REPRESENTATION = typeof READONLY_CLIENT_REPRESENTATION;

// prettier-ignore
type RepresentationType =
	| ENGINE_REPRESENTATION
	| INTERNAL_CLIENT_REPRESENTATION
	| READONLY_CLIENT_REPRESENTATION;

// prettier-ignore
type TypedRepresentation<Type extends RepresentationType, T> =
	& T
	& { readonly [K in RepresentationType]?: K extends Type ? K : never };

// prettier-ignore
export type EngineRepresentation<T extends object> = TypedRepresentation<
	ENGINE_REPRESENTATION,
	ShallowMutable<T>
>;

export const declareEngineRepresentation = <T extends object>(
	stateObject: T
): EngineRepresentation<T> => {
	return stateObject as EngineRepresentation<T>;
};

// prettier-ignore
export type InternalClientRepresentation<T extends object> = TypedRepresentation<
	INTERNAL_CLIENT_REPRESENTATION,
	ShallowMutable<T>
>;

export const declareInternalClientRepresentation = <T extends object>(
	stateObject: T
): InternalClientRepresentation<T> => {
	return stateObject as InternalClientRepresentation<T>;
};

// prettier-ignore
export type ReadonlyClientRepresentation<T> = TypedRepresentation<
	READONLY_CLIENT_REPRESENTATION,
	T
>;

/**
 * Provides a static type mechanism to reduce the chance of mistakenly assigning
 * one state representation to another (e.g. `engineState = clientState` or
 * `doSomethingWithCurrentState(engineState)`). Each representation is either
 * fully or partially assignable to the other, but this bit of indirection should
 * prevent that (unless one of the types is widened to {@link T}).
 */
export const declareReadonlyClientRepresentation = <T extends object>(
	stateObject: Readonly<T>
): ReadonlyClientRepresentation<T> => {
	return stateObject as ReadonlyClientRepresentation<T>;
};
