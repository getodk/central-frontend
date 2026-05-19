import { UnreachableError } from '@getodk/common/lib/error/UnreachableError.ts';
import type {
	ComputedPropertySpec,
	MutablePropertySpec,
	StatePropertySpec,
	StaticPropertySpec,
} from './createSpecifiedState.ts';
import {
	isComputedPropertySpec,
	isMutablePropertySpec,
	isStaticPropertySpec,
} from './createSpecifiedState.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SpecifiedPropertyDescriptor<T = any> extends TypedPropertyDescriptor<T> {
	readonly configurable: true;
	readonly enumerable: true;
}

interface MutableDescriptor<T> extends SpecifiedPropertyDescriptor<T> {
	readonly get: () => T;
	readonly set: (newValue: T) => void;
	readonly writable?: never;
	readonly value?: never;
}

const mutableDesciptor = <T>(propertySpec: MutablePropertySpec<T>): MutableDescriptor<T> => {
	const [get, set] = propertySpec;

	return {
		configurable: true,
		enumerable: true,
		get,
		set,
	};
};

interface ComputedDescriptor<T> extends SpecifiedPropertyDescriptor<T> {
	readonly get: () => T;
	readonly set?: never;
	readonly writable?: never;
	readonly value?: never;
}

const computedDescriptor = <T>(propertySpec: ComputedPropertySpec<T>): ComputedDescriptor<T> => {
	return {
		configurable: true,
		enumerable: true,
		get: propertySpec,
	};
};

interface StaticDescriptor<T> extends SpecifiedPropertyDescriptor<T> {
	readonly get?: never;
	readonly set?: never;
	readonly writable: false;
	readonly value: T;
}

const staticDescriptor = <T>(propertySpec: StaticPropertySpec<T>): StaticDescriptor<T> => {
	return {
		configurable: true,
		enumerable: true,
		writable: false,
		value: propertySpec,
	};
};

export const createSpecifiedPropertyDescriptor = <T>(
	propertySpec: StatePropertySpec<T>
): SpecifiedPropertyDescriptor<T> => {
	if (isMutablePropertySpec(propertySpec)) {
		return mutableDesciptor(propertySpec);
	}

	if (isComputedPropertySpec(propertySpec)) {
		return computedDescriptor(propertySpec);
	}

	if (isStaticPropertySpec(propertySpec)) {
		return staticDescriptor(propertySpec);
	}

	throw new UnreachableError(propertySpec);
};
