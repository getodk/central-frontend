import { JAVAROSA_NAMESPACE_URI } from '@getodk/common/constants/xmlns.ts';
import { getPropertyKeys } from '@getodk/common/lib/objects/structure.ts';
import { UnknownPreloadAttributeValueNotice } from '../../error/UnknownPreloadAttributeValueNotice.ts';
import type { BindElement } from './BindElement.ts';

const preloadParametersByType = {
	uid: [null],
	date: ['today'],
	timestamp: ['start', 'end'],
	property: ['deviceid', 'email', 'username', 'phonenumber'],
} as const;

const preloadParameterTypes = getPropertyKeys(preloadParametersByType);

type PreloadParametersByType = typeof preloadParametersByType;

type PreloadType = keyof PreloadParametersByType;

type AssertPreloadType = (type: string) => asserts type is PreloadType;

const assertPreloadType: AssertPreloadType = (type) => {
	if (!preloadParameterTypes.includes(type as PreloadType)) {
		throw new UnknownPreloadAttributeValueNotice('jr:preload', preloadParameterTypes, type);
	}
};

const getPreloadType = (bindElement: BindElement): PreloadType | null => {
	const type = bindElement.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'preload');

	if (type == null) {
		return null;
	}

	assertPreloadType(type);

	return type;
};

type PreloadParameter<Type extends PreloadType> = PreloadParametersByType[Type][number];

type AssertPreloadParameter = <Type extends PreloadType>(
	type: Type,
	parameter: string | null
) => asserts parameter is PreloadParameter<Type>;

const assertPreloadParameter: AssertPreloadParameter = <Type extends PreloadType>(
	type: Type,
	parameter: string | null
) => {
	const parameters: ReadonlyArray<PreloadParameter<Type>> = preloadParametersByType[type];

	if (!parameters.includes(parameter as PreloadParameter<Type>)) {
		throw new UnknownPreloadAttributeValueNotice('jr:preloadParams', parameters, parameter);
	}
};

const getPreloadParameter = <Type extends PreloadType>(
	bindElement: BindElement,
	type: Type
): PreloadParameter<Type> => {
	const parameter = bindElement.getAttributeNS(JAVAROSA_NAMESPACE_URI, 'preloadParams');

	assertPreloadParameter(type, parameter);

	return parameter;
};

interface PreloadInput<Type extends PreloadType> {
	readonly type: Type;
	readonly parameter: PreloadParameter<Type>;
}

type AnyPreloadInput = {
	[Type in PreloadType]: PreloadInput<Type>;
}[PreloadType];

const getPreloadInput = (bindElement: BindElement): AnyPreloadInput | null => {
	const type = getPreloadType(bindElement);

	if (type == null) {
		return null;
	}

	type Type = typeof type;

	const parameter: PreloadParameter<Type> = getPreloadParameter(bindElement, type);

	return {
		type,
		parameter,
	} satisfies PreloadInput<Type> as AnyPreloadInput;
};

/**
 * Parsed representation of
 * {@link https://getodk.github.io/xforms-spec/#preload-attributes | Preload Attributes}.
 * If specified on a
 * {@link https://getodk.github.io/xforms-spec/#bindings | binding}, this will
 * be parsed to define:
 *
 * - {@link type}, a `jr:preload`
 * - {@link parameter}, an associated `jr:preloadParams` value
 *
 * @todo It would probably make sense for the _definition_ to also convey:
 *
 * 1. Which {@link https://getodk.github.io/xforms-spec/#events | event} the
 *    preload is semantically associated with (noting that the spec may be a tad
 *    overzealous about this association).
 *
 * 2. The constant XPath expression (or other computation?) expressed by the
 *    combined {@link type} and {@link parameter}.
 */
export class BindPreloadDefinition<Type extends PreloadType> implements PreloadInput<Type> {
	static from(bindElement: BindElement): AnyBindPreloadDefinition | null {
		const input = getPreloadInput(bindElement);

		if (input == null) {
			return null;
		}

		return new this(input) satisfies BindPreloadDefinition<PreloadType> as AnyBindPreloadDefinition;
	}

	readonly type: Type;
	readonly parameter: PreloadParameter<Type>;

	private constructor(input: PreloadInput<Type>) {
		this.type = input.type;
		this.parameter = input.parameter;
	}
}

// prettier-ignore
export type AnyBindPreloadDefinition =
	// eslint-disable-next-line @typescript-eslint/sort-type-constituents
	| BindPreloadDefinition<'uid'>
	| BindPreloadDefinition<'timestamp'>
	| BindPreloadDefinition<'property'>;
